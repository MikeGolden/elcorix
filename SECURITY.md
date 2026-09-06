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
      the click-to-load OpenStreetMap embed. If you enable the optional
      analytics (`VITE_ANALYTICS_*`), add the script's origin to
      `script-src` and `connect-src`.
- [ ] `X-Frame-Options: DENY` / `frame-ancestors 'none'` on the client site —
      the site itself must not be embeddable (clickjacking).
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] Set `TRUST_PROXY_HOPS` if the API sits behind a reverse proxy.
- [ ] Set `CORS_ALLOWED_ORIGINS` only if the client is on a different origin.
- [ ] Postgres: dedicated user with least privilege (INSERT/SELECT on the two
      tables only), TLS to the database. Nightly `pg_dump` backups are
      automated by the `db-backup` compose service — copy `./backups/` off
      the host regularly.
- [ ] Personal data (contact messages, booking requests) falls under GDPR:
      the privacy policy documents the processing, retention is enforced
      automatically (`RETENTION_MONTHS`), delete on request via SQL.
- [ ] SMTP credentials (`SMTP_*`) live in `.env` on the server only — never
      commit them; notifications degrade gracefully without them.

## Reporting a vulnerability

Report suspected vulnerabilities privately to the site owner
(see contact details in the repository); do not open a public issue.
