# Cloudflare Pages deployment

`deploy/cloudflare/` is the folder to upload. It is generated — rebuild it with
`./deploy/build.sh` after any change to the site; everything hand-written lives
in `deploy/worker/_worker.js`.

## What it contains

| Path | What it is |
| --- | --- |
| `index.html`, `de/`, `en/`, `uk/`, `ru/` | the built SPA plus the 32 prerendered route shells (4 languages × 8 routes) |
| `assets/` | hashed JS/CSS/fonts — safe to cache forever |
| `images/`, `logo.svg`, `favicon.svg`, `apple-touch-icon.png`, `robots.txt`, `sitemap.xml` | static files |
| `_worker.js` | the API and the routing/header rules (see below) |

Built with `VITE_ENABLE_ALTEGIO=false`, so the booking section, `/booking`
route and the Altegio embed are not in the bundle. Rebuild with
`VITE_ENABLE_ALTEGIO=true ./deploy/build.sh` to bring them back.

## What replaced the Express server

The Node/Postgres API in `server/` cannot run on Pages — no Postgres, no SMTP.
`_worker.js` reimplements the two endpoints the site actually calls, with the
same validation (phone rule, honeypot, date rule, length caps), and delivers
both straight to the studio's **Telegram** chat:

- `POST /api/contact` — contact form
- `POST /api/bookings` — consultation form
- `GET /api/bookings/link` — canonical Altegio URL
- `GET /api/health` — reports whether Telegram is configured

**Nothing is stored.** Telegram is the only copy, so a failed send returns 502
and the visitor sees the form's error state instead of a false "thank you".
That also means no e-mail auto-reply and no `RETENTION_MONTHS` cleanup — the
privacy policy text should match what this deployment actually does.

## Deploy

Use Wrangler. Dashboard drag-and-drop works for the static files, but the
project runs in Pages "advanced mode" via `_worker.js`, so use one command
either way:

```bash
npx wrangler pages project create elcorix       # first time only
npx wrangler pages deploy deploy/cloudflare --project-name elcorix
```

Then set the variables under **Workers & Pages → elcorix → Settings →
Variables and secrets** (Production *and* Preview):

| Name | Type | Value |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Secret | the @BotFather token from `.env.local` |
| `TELEGRAM_CHAT_ID` | Secret | the studio chat id (negative for groups) |
| `ALTEGIO_COMPANY_ID` | Text | digits only; optional, defaults to `000000` |

Never commit the token or paste it into this folder — it is a password, and
anyone holding it can post as the studio and read the chat.

## When the forms send nothing

Work through it in this order — each step rules out one cause.

**1. Does the deployment see the variables at all?**

```bash
curl https://<project>.pages.dev/api/health
```

`telegram.token` and `telegram.chatId` each read `set`, `missing` or
`malformed`. Anything other than two `set`s and the problem is on the
Cloudflare side, not Telegram's.

> **The trap:** on Pages, a variable reaches a deployment only if it was saved
> **before** that deployment was created. Adding secrets to an existing project
> changes nothing until you redeploy. After saving them, run
> `npx wrangler pages deploy deploy/cloudflare --project-name elcorix` again (or
> hit *Retry deployment* in the dashboard) and re-check `/api/health`.
>
> The second trap is the environment selector: secrets saved only under
> **Preview** are invisible to the production `*.pages.dev` URL and to the
> custom domain. Set both.

**2. Do the variables work?**

```bash
curl 'https://<project>.pages.dev/api/health?probe=telegram'
```

This asks Telegram directly — `getMe` for the token, `getChat` for the chat —
and reports Telegram's own wording. Neither form of the endpoint ever prints
the token.

| `probe.error` | What it means |
| --- | --- |
| `Unauthorized` at `getMe` | wrong or revoked token — make a new one with @BotFather |
| `chat not found` at `getChat` | the id is wrong, or **nobody has ever written in that chat** — a bot cannot open a conversation, so someone must post in the group (or press *Start*) first |
| `bot was kicked…` / `not a member` | re-add the bot to the group |
| `Forbidden` | the bot was blocked, or it is a channel and the bot is not an admin |

**3. Still nothing?** `npx wrangler pages deployment tail --project-name elcorix`
streams the worker's `console.error` lines, which quote Telegram's reason for
every failed send.

**Is it Cloudflare or the credentials?** `./deploy/check-telegram.sh` runs the
same three calls locally against `.env.local` (it needs a machine with internet
— the sandboxed VM has none) and posts a real test message. If that works and
`/api/health` does not, the credentials are fine and the Pages configuration is
the problem.

### The chat id in `.env.local`

It is `-5453380295` — a **basic group** id, not a supergroup (`-100…`). Telegram
changes a group's id when it is upgraded to a supergroup, which happens on its
own when the group gains members, gets a public link, or has its history made
visible. When that happens every send fails with `chat not found` while nothing
in the site changes. If the probe says `chat not found`, post a message in the
group and re-read the id from
`https://api.telegram.org/bot<TOKEN>/getUpdates`.

## After the domain is attached

`client/src/business.ts` hardcodes `siteUrl: "https://elcorix.de"`, so every
canonical URL, `hreflang` and the sitemap point there regardless of where this
is deployed. On a `*.pages.dev` URL that is a deliberate mismatch (it keeps
preview deployments out of the index); once the real domain is attached to the
project it is correct as-is. If the site ever lives on a different host, change
that constant and rebuild.

## Tests

`node deploy/worker/worker.test.mjs` runs 25 checks against `_worker.js` with a
stub `ASSETS` binding pointing at the built folder and a stubbed Telegram API:
the prerendered shells per language, the SPA fallback, the cache and security
headers, both forms' validation, the honeypot, HTML escaping of visitor input,
and that a Telegram failure becomes a 502 rather than a silent success. Run it
after every change to the worker; it needs `deploy/cloudflare/` to exist. The
checks cover the health endpoint's four states (missing / malformed / set /
live probe) too, so a regression there is caught before it costs a deploy.

## Not included

- Postgres, the migrations and the retention job (`server/`)
- SMTP notifications and the localized auto-reply
- Rate limiting — the Express server rate-limits by IP; Workers need a KV or
  Durable Object binding for that, so the only spam defences here are the
  honeypot and the length caps. Cloudflare's own Bot Fight Mode / a Turnstile
  widget on the two forms is the natural next step if it gets abused.
