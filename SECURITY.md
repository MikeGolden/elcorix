# Security

Security posture and deployment checklist for elcorix, with specific
guidance for the Altegio calendar and payments integration.

## What is enforced in code

**API (Express)**

- **Security headers** via [helmet](https://helmetjs.github.io/) on every
  response (`X-Content-Type-Options: nosniff`, `X-Frame-Options`, HSTS, etc.);
  `X-Powered-By` disabled.
- **CORS disabled by default.** The client is expected to be served from the
  same origin (or the Vite dev proxy). To allow specific cross-origin
  callers, set `CORS_ALLOWED_ORIGINS` (comma-separated exact origins) —
  never `*`.
- **Rate limiting** on write endpoints (`POST /api/contact`,
  `POST /api/bookings`): 30 requests per IP per 15 minutes by default,
  JSON 429 beyond that. When deploying behind a reverse proxy, set
  `TRUST_PROXY_HOPS` to the number of proxy hops so the real client IP is
  used; leave it unset otherwise, or `X-Forwarded-For` spoofing could evade
  the limit.
- **Request body hardening**: 16 kB JSON body limit, per-field length limits
  (name ≤ 200, e-mail ≤ 320, message ≤ 5000, phone ≤ 50, service ≤ 200),
  malformed JSON answered with a generic JSON 400 — no HTML error pages, no
  stack traces in responses.
- **Spam honeypot** on both write endpoints: a hidden `website` field that
  humans never see; filled-in submissions get a fake success response and
  are neither stored nor forwarded.
- **Request logging** (morgan, combined format; healthcheck polling is
  excluded) and a **DB-checked healthcheck** (`/api/health` returns 503
  `degraded` when Postgres does not answer).
- **Graceful shutdown** on SIGTERM/SIGINT: stop accepting connections,
  drain in-flight requests, close the pool (8 s hard limit).
- **GDPR retention job**: contact messages and booking requests are deleted
  after `RETENTION_MONTHS` (default 12), daily.
- **SQL injection**: all queries use parameterized statements (`pg`
  placeholders); no string-built SQL anywhere.
- **Altegio company id sanitization** (server *and* client): the id is
  interpolated into `https://n<id>.alteg.io`, so only `^\d{1,12}$` is
  accepted; anything else falls back to the placeholder. A misconfigured or
  attacker-influenced env value can never redirect visitors to another host.

**Client (React)**

- No `dangerouslySetInnerHTML`, no `eval`, no direct DOM injection; all
  rendering goes through React's escaping.
- External links use `rel="noreferrer"`; the Altegio iframe sets an explicit
  `referrerPolicy="strict-origin-when-cross-origin"` and grants only the
  `payment` permission.

**Secrets & repository hygiene**

- `.env` / `.env.local` are gitignored; `.env.example` contains placeholders
  only. Git history has been checked — no secrets were ever committed.
- `ALTEGIO_API_TOKEN` is server-side only. Never expose it via a `VITE_`
  variable: everything prefixed `VITE_` is embedded into the public JS bundle.

## Ongoing checks (CI)

`.github/workflows/ci.yml` runs on every push and pull request:

- typecheck, unit tests (including the security test suite in
  `server/src/test/security.test.ts`), build, Playwright e2e;
- `npm audit --omit=dev --audit-level=high` — **fails the build** on
  high/critical vulnerabilities in production dependencies;
- a full informational audit of all dependencies.

`.github/dependabot.yml` opens weekly PRs for npm and GitHub Actions
updates so patched versions land promptly.

Run locally at any time: `npm audit` and `npm test`.

## Payments & Altegio: keep card data out of scope

Payments must stay on Altegio's hosted pages (the embedded
`https://n<companyId>.alteg.io` flow or the fallback link). Under this model
card data goes directly from the visitor's browser to Altegio's PCI-DSS
environment and **never touches this codebase or server**. Preserve that:

- Never build custom forms that collect card numbers, and never proxy or log
  Altegio payment requests through the Express API.
- If you later call the Altegio partner API server-side (with
  `ALTEGIO_API_TOKEN`), restrict it to non-payment resources (services,
  staff, availability) or use their tokenized endpoints; keep the token out
  of client bundles and logs.
- Treat `POST /api/bookings` as a lead log only — it stores names/phones for
  staff follow-up, no payment or card fields. Do not add any.

## Production deployment checklist

The API sets its own headers, but the static client is served by your web
server/CDN — configure it there:

- [ ] Serve everything over **HTTPS** with redirect from HTTP; enable HSTS.
      The provided Caddy overlay (`docker-compose.tls.yml` +
      `docker/Caddyfile`) does all three automatically.
- [ ] Client `Content-Security-Policy` — already set by
      [docker/nginx.conf](docker/nginx.conf); `frame-src` allows Altegio and
      the click-to-load OpenStreetMap embed. The Umami tracker is served
      same-origin under `/u/`, so it needs no CSP change.
- [ ] Umami (profile `analytics`): change the default `admin`/`umami` login
      on `stats.<domain>` immediately and enable two-factor login
      (`UMAMI_2FA_KEY`). `umami-db-init` revokes the PUBLIC `CONNECT` grant
      on the `kosmetic` database. If you add a least-privilege app role
      later, grant it `CONNECT` explicitly.
- [ ] `X-Frame-Options: DENY` / `frame-ancestors 'none'` on the client site —
      the site itself must not be embeddable (clickjacking).
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] Set `TRUST_PROXY_HOPS` if the API sits behind a reverse proxy.
- [ ] Set `CORS_ALLOWED_ORIGINS` only if the client is on a different origin.
- [ ] Postgres: dedicated user with least privilege (INSERT/SELECT on the two
      tables only), TLS to the database. Nightly `pg_dump` backups are
      automated by the `db-backup` compose service; the `offsite-backup`
      service copies them off the host (see "Off-site backups" below).
- [ ] Personal data (contact messages, booking requests) falls under GDPR:
      the privacy policy documents the processing, retention is enforced
      automatically (`RETENTION_MONTHS`), delete on request via SQL.
- [ ] SMTP credentials (`SMTP_*`) live in `.env` on the server only — never
      commit them; notifications degrade gracefully without them.
- [ ] `TELEGRAM_BOT_TOKEN` likewise lives in `.env` only. A leaked token lets
      anyone post as the studio's bot and read the chat via `getUpdates` —
      revoke it with `/revoke` in @BotFather if it is ever exposed. Customer
      names and phone numbers are sent to Telegram's servers, so the chat
      belongs in the privacy policy's list of recipients.

## Server hardening (Hetzner)

Production runs on a Hetzner server with Docker and the Caddy overlay. Only
Caddy publishes ports; Postgres, the API and nginx are reachable only on the
internal compose network.

### Firewall: Hetzner Cloud Firewall, not UFW

Docker writes its own iptables rules for published ports, and those skip
UFW's rules: a UFW `deny 443` does not stop traffic to Caddy. Filter in the
**Hetzner Cloud Firewall** instead. It sits in front of the VM, so Docker
cannot get around it. Inbound rules (they apply to IPv4 and IPv6):

| Protocol / port | Source | Purpose |
|---|---|---|
| TCP 22 | your IP only, or none (see SSH) | SSH |
| TCP 80 | any | ACME HTTP challenge, redirect to HTTPS |
| TCP 443 | any | HTTPS |
| UDP 443 | any | HTTP/3 (published by `docker-compose.tls.yml`) |
| ICMP | any | ping, path-MTU discovery |

Everything else inbound is dropped; outbound stays open. On a dedicated
(Robot) server the firewall is stateless: also allow TCP 32768–65535 with
the ACK flag, or return traffic breaks.

Always start with the TLS overlay. Without it the nginx container publishes
`WEB_PORT` (8080) on every interface.

Check from outside the server:

```sh
nmap -Pn -p- <server-ip>          # expect 80, 443 (and 22 if kept open)
nmap -Pn -sU -p 443 <server-ip>
```

and on it: `sudo ss -tulpn` (what listens on `0.0.0.0` / `[::]`).

### SSH

- Keys only, in `/etc/ssh/sshd_config`: `PasswordAuthentication no`,
  `KbdInteractiveAuthentication no`, `PermitRootLogin no`. Work from a
  sudo user.
- Preferred: SSH over Tailscale or WireGuard and remove TCP 22 from the
  Cloud Firewall. The Hetzner web console is the fallback when the tunnel
  is down.
- If 22 stays public: fail2ban to cut log noise. The keys are what protect
  the server.

### Host and images

- `unattended-upgrades` with automatic reboot at night.
- Images only pick up security fixes on rebuild. About monthly:
  `docker compose -f docker-compose.yml -f docker-compose.tls.yml pull`
  and `... up -d --build`.
- `.env` holds the database, SMTP and Telegram secrets: `chmod 600 .env`.
- Set a real `POSTGRES_PASSWORD`. Changing it in `.env` does **not**
  change it on an existing database volume. Change it in Postgres first
  (`docker compose exec db psql -U kosmetic -c "ALTER USER kosmetic
  PASSWORD '...'"`), then in `.env`, then restart.
- Every container runs with `no-new-privileges`; Caddy additionally drops
  all capabilities except `NET_BIND_SERVICE`.
- Hetzner's outbound block on ports 25 and 465 (new accounts) does not
  affect the default `SMTP_PORT=587`.

### Off-site backups

`./backups` sits on the same disk as the database. Two layers:

1. **Hetzner server backups** (Cloud Console → server → Backups, about
   +20% of the server price, 7 daily images). Covers the whole machine.
2. **`offsite-backup` service**: restic copies the dumps, encrypted on the
   server, to a Hetzner Storage Box and keeps `OFFSITE_KEEP` (default 14
   days, matching `BACKUP_KEEP_DAYS`) of snapshots.

One-time setup on the server, in the repo folder (replace `uXXXXXX` with
the Storage Box user; enable "SSH support" for the box in the Hetzner
console first):

```sh
mkdir -p docker/restic-ssh && cd docker/restic-ssh
ssh-keygen -t ed25519 -N '' -f id_ed25519 -C elcorix-restic
cat id_ed25519.pub | ssh -p 23 uXXXXXX@uXXXXXX.your-storagebox.de install-ssh-key
ssh-keyscan -p 23 uXXXXXX.your-storagebox.de > known_hosts
cat > config <<'CFG'
Host storagebox
  HostName uXXXXXX.your-storagebox.de
  User uXXXXXX
  Port 23
  IdentityFile /root/.ssh/id_ed25519
  StrictHostKeyChecking yes
CFG
cd ../..
```

In `.env`: `RESTIC_REPOSITORY=sftp:storagebox:elcorix-restic` and a long
random `RESTIC_PASSWORD` (`openssl rand -base64 32`). **Store that password
outside the server too**: without it the backups cannot be decrypted.
Then start with the profile:

```sh
docker compose -f docker-compose.yml -f docker-compose.tls.yml --profile offsite up -d
docker compose logs -f offsite-backup    # first run starts after 10 minutes
```

Test a restore once:

```sh
docker compose --profile offsite run --rm --entrypoint sh offsite-backup -c \
  'cp /ssh/* /root/.ssh/ && chmod 600 /root/.ssh/* && restic snapshots && restic restore latest --target /tmp/r && ls -R /tmp/r'
```

and load a dump into a scratch database with `pg_restore`.

### Monitoring

An external uptime check (e.g. UptimeRobot) on
`https://elcorix.de/api/health`: it returns 503 when Postgres is down and
also catches an expired certificate.

## Reporting a vulnerability

Report suspected vulnerabilities privately to the site owner
(see contact details in the repository); do not open a public issue.
