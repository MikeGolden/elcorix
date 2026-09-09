# Telegram notifications — setup and integration

Every consultation request from the form on the landing page (`POST
/api/bookings`) is posted into a Telegram chat, so whoever is on the phone
that day sees it immediately instead of waiting for e-mail.

The channel is optional and independent of e-mail: with no Telegram
configuration the request is still stored in Postgres and still e-mailed.
Configure one, the other, both, or neither.

**The bot only sends.** The API calls Telegram's `sendMessage` and that is
all. There is no webhook, no polling process, no bot command, and therefore
no new public endpoint to secure and nothing extra to keep running.

---

## Part 1 — Create the bot (5 minutes, in Telegram)

### 1. Talk to BotFather

Open Telegram and search for **@BotFather** (the account with the blue
verified check). Start a chat and send:

```
/newbot
```

It asks two things:

| BotFather asks | You answer | Notes |
| --- | --- | --- |
| *"Alright, a new bot. How are we going to call it?"* | `elcorix Anfragen` | The display name shown in the chat. Any characters, changeable later. |
| *"Good. Now let's choose a username for your bot."* | `elcorix_anfragen_bot` | Must be unique across all of Telegram and **must end in `bot`**. Not changeable later. |

BotFather replies with:

```
Done! Congratulations on your new bot. ...
Use this token to access the HTTP API:
123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
Keep your token secure and store it safely, it can be used by anyone to
control your bot.
```

That token is `TELEGRAM_BOT_TOKEN`. Treat it exactly like a password —
see *Security* at the bottom.

### 2. Decide where the messages should land

**Option A — a group (recommended).** Staff can be added and removed
without anyone touching the server config, and everyone sees the same
history.

1. In Telegram: **New Group** → add yourself and the staff who should see
   requests → name it e.g. *elcorix Anfragen*.
2. Open the group → group name → **Add members** → search for your bot's
   username (`elcorix_anfragen_bot`) → add it.
3. **Send one message in the group** (anything, e.g. `hallo`). This step is
   not optional — see step 3.

**Option B — a direct chat with one person.** Open the bot by its username
and press **Start**. Only that one person gets notified, and if they later
block the bot, notifications stop silently apart from a log line.

> A Telegram bot can never open a conversation on its own. Someone has to
> write to it (or add it to a group where someone writes) first. Skip this
> and every send fails with `chat not found`.

### 3. Find the chat id

Open this URL in a browser, with your token pasted in place of `<TOKEN>`:

```
https://api.telegram.org/bot<TOKEN>/getUpdates
```

Note the URL shape: `bot` immediately followed by the token, no slash
between them.

You get JSON like:

```json
{"ok":true,"result":[{"update_id":1,"message":{
  "chat":{"id":-1001234567890,"title":"elcorix Anfragen","type":"supergroup"},
  "text":"hallo"}}]}
```

`result[].message.chat.id` is `TELEGRAM_CHAT_ID` — here `-1001234567890`.

- **Group ids are negative.** The minus sign is part of the id; keep it.
- `"result":[]` (empty) means nobody has written to the bot yet, or the
  message is older than 24 hours. Send a fresh message in the group and
  reload.
- If the bot is in a group and still sees nothing, BotFather's privacy mode
  is hiding normal group messages from it. Either mention the bot by
  username in your test message, or send BotFather `/setprivacy` → pick the
  bot → **Disable**, then post again. Privacy mode does not affect sending;
  you can turn it back on afterwards.

---

## Part 2 — Wire it into the app

### Local development

Put both values in `.env.local` at the repo root (gitignored):

```dotenv
TELEGRAM_BOT_TOKEN=123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
TELEGRAM_CHAT_ID=-1001234567890
```

Restart the API (`npm run dev -w server`) — the variables are read once at
startup.

### Docker Compose deployment

The same two variables go into `.env` next to `docker-compose.yml`;
`docker-compose.yml` already forwards them to the `server` service. Then:

```bash
docker compose up -d --build server
```

### What the server does with them

Both variables must be present **and** well-formed or the channel stays off:

- `TELEGRAM_BOT_TOKEN` must look like `<digits>:<secret>`.
- `TELEGRAM_CHAT_ID` must be a number (optionally negative) or an
  `@publicchannelname`.

Anything else — one of the two missing, a stray quote, a pasted URL instead
of an id — disables Telegram notifications and logs a warning at startup:

```
Telegram notifications disabled: TELEGRAM_CHAT_ID "https://t.me/…" is neither a numeric id nor an @channelname
```

The token itself is never written to the log.

The server needs outbound HTTPS to `api.telegram.org`. On a locked-down
host, allow it explicitly.

---

## Part 3 — Verify

### Test the credentials directly, before involving the app

```bash
curl -s "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"-1001234567890","text":"test"}'
```

`{"ok":true,...}` and a message in the chat means the token and chat id are
correct, and anything left is configuration on our side.

### Test through the API

With the server running:

```bash
curl -s localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Test","customerPhone":"+49123456789","preferredAt":"2030-01-02 10:30"}'
```

Then submit the real form at `/de#consultation` once.

### What arrives

```
New consultation request

Name: Anna Beispiel
Phone: +49 155 625 14 872
Service: —
Preferred: 2030-01-02 10:30
Marketing opt-in: no
Request #42

Please call back and enter the appointment in Altegio.
```

`Request #42` is the row id in `booking_requests`, so a message can be tied
back to the database record.

---

## Troubleshooting

The website never breaks because Telegram does: the request is stored and
answered first, the notification is sent afterwards and its failures only
reach the server log. So when messages don't arrive, the log is where the
reason is (`docker compose logs -f server`).

| Symptom | Cause | Fix |
| --- | --- | --- |
| Startup warning `…TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are both required` | Only one of the two is set | Set both, restart |
| Log: `HTTP 400 — …"chat not found"` | Nobody ever wrote to the bot, or wrong id | Post in the group, re-read `getUpdates` |
| Log: `HTTP 401 — …"Unauthorized"` | Wrong or revoked token | Copy it again from BotFather |
| Log: `HTTP 403 — …"bot was blocked by the user"` | Direct chat, recipient blocked the bot | Unblock, or switch to a group |
| Log: `HTTP 403 — …"bot is not a member of the group chat"` | Bot removed from the group | Add it back |
| Log: `HTTP 429` | Rate limit (~20 messages/minute to one group) | Only realistic under spam; the honeypot already drops bot submissions |
| Nothing in the log at all, no message | Channel disabled (no config), or the form request never reached the server | Check the startup warning; check the browser network tab |
| `TimeoutError` after 10s | Host cannot reach `api.telegram.org` | Allow outbound HTTPS to it |

---

## Security

- The bot token is a credential. It lives in `.env` / `.env.local` on the
  server only, never in git, never in a screenshot. Anyone holding it can
  post as the studio's bot **and read the chat's recent messages** through
  `getUpdates`.
- If it leaks: BotFather → `/revoke` → pick the bot → paste the new token
  into `.env` → restart. The old one dies immediately.
- The token appears in the request URL, so it must never be logged. The
  code keeps it out of every warning and error message, and two unit tests
  in `server/src/test/telegram.test.ts` guard that.
- Names and phone numbers visitors type into the form are escaped before
  sending (`parse_mode: HTML`), so nothing a visitor writes can forge
  markup in the chat.
- Keep the group private and invite-link-free. Every member sees every
  customer's name and phone number.
- **GDPR:** those names and phone numbers reach Telegram's servers outside
  the EU. The privacy policy says so (`privacy.sections.booking` in
  `client/src/i18n/locales/{de,en,uk}/common.json`). If Telegram is ever
  switched off for good, that sentence has to go with it — a privacy policy
  that doesn't match the code is the real risk.

---

## Changing it

Everything lives in `server/src/telegram.ts`.

- **Wording or language of the message:** `formatBookingRequest`. It is
  currently English, matching the e-mail notifications.
- **Which fields are included:** same function, plus the call site at the
  end of `server/src/routes/bookings.ts`.
- **Also notify on the contact form:** `contactRouter` in
  `server/src/routes/contact.ts` receives the notifier the same way
  `bookingsRouter` does (`app.ts` passes it), then call
  `notifyInBackground` after the response, outside the insert's
  `try/catch` — that ordering is deliberate: a failed database write must
  notify nobody, and nothing after `res.json()` may throw.
- **Tests:** `server/src/test/telegram.test.ts` (the notifier) and the
  Telegram cases in `server/src/test/app.test.ts` (the route). They use an
  injected `fetch`, so they never touch the network.
