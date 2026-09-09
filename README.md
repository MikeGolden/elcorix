# elcorix

Landing page and booking API for **elcorix**, a laser hair-removal studio in
Kempten (Allgäu), Germany.

The front end is built to the elcorix Figma file
(`figma.com/design/L3SYAnqXeHiD81Ny4cdVmF/elcorix`) — see
[DESIGN_PROPOSAL.md](./DESIGN_PROPOSAL.md) for the design system it derives
from that file (palette, type scale, section inventory, known deviations).

## Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS v4     |
| Backend   | Node.js, Express, TypeScript                    |
| Database  | PostgreSQL (`pg`)                               |
| Booking   | Altegio embedded booking widget (calendar)      |
| Unit tests| Vitest, React Testing Library, Supertest        |
| E2E tests | Playwright                                      |

## Structure

```
.
├── client/          # React + TS + Tailwind SPA
│   └── src/
│       ├── pages/       # Home, Prices, Gallery, Booking, Contact, Privacy,
│       │                #   Imprint, Terms (AGB), Mission (Leitbild), 404
│       ├── sections/    # The one-page landing sections from the Figma
│       ├── components/  # Header, Footer, AltegioWidget, ConsultationForm,
│       │                #   PriceTables, MapEmbed, …
│       ├── seo/         # route table, shared title/canonical rules, the
│       │                #   build-time <head> and usePageMeta
│       └── test/        # Vitest unit tests
├── server/          # Express + TS API
│   └── src/
│       ├── routes/      # /api/contact, /api/bookings
│       ├── db/          # pg pool, schema.sql, migrate script
│       ├── mailer.ts    # optional SMTP notifications
│       ├── telegram.ts  # optional Telegram bot notifications
│       ├── retention.ts # daily GDPR data-retention cleanup
│       └── test/        # Vitest + Supertest unit tests
├── e2e/             # Playwright end-to-end tests (dev server, API mocked)
├── e2e-docker/      # Playwright smoke tests against the composed stack
└── playwright.config.ts
```

## Getting started

Prerequisites: Node.js ≥ 20, PostgreSQL ≥ 14.

```bash
npm install

# configure environment
cp .env.example .env        # set DATABASE_URL and ALTEGIO_COMPANY_ID

# create the database and apply schema
createdb kosmetic   # the database name is unchanged
npm run db:migrate

# run frontend (http://localhost:5173) and API (http://localhost:3001)
npm run dev
```

The Vite dev server proxies `/api/*` to the Express server.

## Run with Docker

The whole stack (Postgres, API, nginx-served client) is containerized:

```bash
cp .env.example .env      # set ALTEGIO_COMPANY_ID, POSTGRES_PASSWORD, WEB_PORT
docker compose up -d --build
open http://localhost:8080
```

**TLS in production:** add the Caddy overlay — it terminates HTTPS with
automatic Let's Encrypt certificates, redirects HTTP→HTTPS and www→apex,
and sets HSTS (set `SITE_DOMAIN` and `ACME_EMAIL` in `.env`):

```bash
docker compose -f docker-compose.yml -f docker-compose.tls.yml up -d --build
```

**Backups:** the `db-backup` service writes a nightly `pg_dump` into
`./backups/` and keeps `BACKUP_KEEP_DAYS` (default 14) days of dumps.
Copy that folder off the host regularly — a Docker volume is not a backup.

**Publishing images:** `.github/workflows/deploy.yml` builds and pushes
both images to GHCR on every push to `main`.

- **client** — multi-stage build ([client/Dockerfile](client/Dockerfile)):
  Vite production build (the Altegio company id is inlined via the
  `VITE_ALTEGIO_COMPANY_ID` build arg), served by nginx with the SPA
  fallback, gzip, immutable asset caching and the security headers from
  [SECURITY.md](SECURITY.md) (CSP, `frame-ancestors 'none'`, …) already in
  place ([docker/nginx.conf](docker/nginx.conf)).
- **server** — multi-stage build ([server/Dockerfile](server/Dockerfile)),
  production dependencies only, runs as the non-root `node` user, applies
  the idempotent schema migration on start. Port 3001 is not published:
  nginx proxies `/api/*` same-origin, and `TRUST_PROXY_HOPS=1` makes rate
  limiting see the real client IP.
- **db** — `postgres:16-alpine` with a named volume (`db-data`) and a
  healthcheck; the server waits for it to be healthy.

Both Dockerfiles use the repo root as build context because the npm
workspaces share one `package-lock.json`. Data persists across
`docker compose down`; use `docker compose down -v` to also drop the
database volume.

## Internationalization

The client is fully translated with [react-i18next](https://react.i18next.com/)
into **English (en)**, **German (de)**, **Ukrainian (uk)** and **Russian (ru)**.

### Language URLs

Every page lives under a language segment — `/de/prices`, `/en/prices`,
`/uk/prices`, `/ru/prices` — so each translation has its own address that can
be linked, shared, cached and indexed, and they can declare each other as
hreflang alternates. `client/src/i18n/routing.ts` owns that mapping (React-, i18next-
and DOM-free, so the router, the meta tags, the prerender plugin and the
sitemap all derive their URLs from it).

- **The URL decides the language.** `LanguageLayout` in `App.tsx` calls
  `changeLanguage` for whichever segment the router matched, so a shared
  `/uk/prices` link opens in Ukrainian whatever the visitor picked before.
- **Anything unprefixed redirects.** `/`, an old `/prices` link and a locale
  the site does not have (`/fr/prices`) all redirect — path, query and hash
  intact — to `localStorage` (`i18nextLng`) → browser language → **German**.
  The redirect uses `replace`, so it never lands in the back-button history.
- **Links go through `LocalizedLink`**, not `Link`: a bare `<Link to="/prices">`
  would drop the segment and bounce the visitor through the redirect. Anchor
  links use `useAnchorHref()`, which returns `#prices` on the home page and
  `/de#prices` elsewhere.
- `<html lang>` follows the active language; the choice is still persisted to
  `localStorage`, but only to pick the target for the next unprefixed visit.
- Missing keys fall back to **English**.
- Translations live in `client/src/i18n/locales/<lng>/common.json`; the i18n
  instance is initialized in `client/src/i18n/index.ts` (imported first in
  `main.tsx`). Translation keys are type-checked: `client/src/i18n/i18next.d.ts`
  augments i18next with the English resource shape, so a typo in a `t()` key is
  a compile error.
- The header's `LanguageSwitcher` (accessible listbox dropdown, keyboard
  navigable) uses small inline SVG icons from `client/src/components/flags/`.
  Russian is the one option without a flag: it is offered as a language, not a
  country, and a good part of the clientele that reads it is Ukrainian — so it
  gets the neutral lettered `BadgeRU` chip instead.

**Adding a key:** add it to `en/common.json` first (it is the type source and
the fallback), then mirror it in `de`, `uk` and `ru`. A unit test
(`src/test/translations.test.ts`) fails if the key sets ever diverge.

**Adding a language:** create `client/src/i18n/locales/<lng>/common.json` with
the full key set, register it in `resources` in `client/src/i18n/index.ts` and
in `supportedLanguages` in `client/src/i18n/routing.ts` (that one list gives it
a URL segment, a route tree, a prerendered shell per route, hreflang alternates
and sitemap entries), add its `og:locale` to `client/src/seo/meta.ts`, add an
entry (label + icon component) to `LanguageSwitcher`, and extend the
completeness test. If the language has a server-side auto-reply, add it to
`SUPPORTED_LANGS` and the `confirmation` map in `server/src/routes/contact.ts`
too — that list is separate from the client's on purpose, so an untranslated
auto-reply falls back to German rather than shipping half-translated.

Business data that must not be translated (name, address, phone, e-mail,
Instagram) stays in `client/src/config.ts`.

## Altegio integration

The booking page embeds the Altegio-hosted booking flow (services, staff,
calendar, confirmation) at `https://n<companyId>.alteg.io`.

1. In Altegio: Settings → Online booking → copy your booking link / company id.
2. Set `ALTEGIO_COMPANY_ID` in `.env` (server) and `VITE_ALTEGIO_COMPANY_ID`
   for the client build.

The API also exposes `GET /api/bookings/link` (canonical booking URL) and
`POST /api/bookings` (logs booking requests to Postgres for staff follow-up).

## API

| Method | Path                | Description                                        |
| ------ | ------------------- | -------------------------------------------------- |
| GET    | `/api/health`       | Liveness + DB readiness (503 `degraded` if DB down)|
| POST   | `/api/contact`      | Store a contact-form message (+ e-mail notify)     |
| GET    | `/api/bookings/link`| Altegio booking URL for the company                |
| POST   | `/api/bookings`     | Store a call-back/booking request (+ e-mail/Telegram)|

Both POST endpoints carry a hidden **honeypot** field (`website`): submissions
that fill it get a fake success response and are stored nowhere.

## E-mail notifications

Set `SMTP_HOST`, `MAIL_FROM` and `MAIL_TO` (plus `SMTP_USER`/`SMTP_PASS` if
the relay needs auth — see `.env.example`) and the API will e-mail staff on
every contact message and booking request, and send the customer a localized
confirmation of receipt. Without SMTP config everything is still stored in
Postgres; only the notifications are skipped (a warning is logged in
production).

## Telegram notifications

Consultation requests can also land in a Telegram chat, so staff see them on
their phone without waiting for e-mail. It runs alongside the SMTP
notification — both, either or neither can be configured. The bot only ever
*sends*: no webhook, no polling process, no bot command to secure.

Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (see `.env.example`) and
restart the API. A malformed or half-finished configuration disables the
channel with a warning in the log rather than failing silently.

**[TELEGRAM.md](TELEGRAM.md)** has the full walkthrough: creating the bot
with @BotFather, finding the chat id, wiring it into dev and Docker,
verifying it, a troubleshooting table and the security/GDPR notes.

## Data retention (GDPR)

A daily job deletes stored contact messages and booking requests older than
`RETENTION_MONTHS` (default 12) — matching the promise in the privacy
policy. See `server/src/retention.ts`.

## Testing

```bash
npm test                  # unit tests (client + server, DB is mocked)
npm run test:e2e          # Playwright e2e (starts the Vite dev server itself)
npm run test:e2e:docker   # smoke tests against the composed Docker stack
                          # (run `docker compose up -d --build` first)
npx playwright install chromium   # one-time browser download for e2e
npm run typecheck         # TypeScript across both workspaces
```

## Build

```bash
npm run build         # client → client/dist, server → server/dist
npm run start -w server
```

## GDPR / privacy

- **Cookie consent banner** (every language) on first visit; “Accept
  all” and “Only necessary” have equal prominence, the decision is stored in
  `localStorage` (`cookie-consent`, with timestamp as the consent record) and
  can be changed any time via “Cookie settings” in the footer.
- **The Altegio embed is consent-gated** (two-click pattern): the iframe —
  which sets third-party cookies — only loads after opt-in, either via the
  banner or the placeholder on the booking page. A no-cookie fallback link
  (new tab) and a cookie-free **call-back request form** are always available.
- **The OpenStreetMap embed** on the contact page is click-to-load: nothing
  third-party loads until the visitor explicitly asks for the map.
- **Contact form** requires a privacy-policy checkbox before submitting.
- **Stored requests are auto-deleted** after `RETENTION_MONTHS` (default 12).
- **Legal pages**: `/privacy` (privacy policy, GDPR Art. 13 information) and
  `/imprint` (German Impressum, §5 DDG), linked from the footer. Replace the
  `owner` and `vatId` placeholders in `client/src/config.ts` and have the
  privacy text reviewed before going live.
- The site itself sets no tracking cookies; `localStorage` holds only the
  language preference and the consent decision (both functional, exempt from
  consent).

## Security

See [SECURITY.md](SECURITY.md) for the full posture: helmet headers,
origin-restricted CORS, rate limiting, body/field limits, Altegio company-id
sanitization, CI vulnerability gates (`npm audit` on every push) and the
production deployment checklist (CSP, HTTPS, proxy settings). Payments stay
on Altegio's hosted pages — card data never touches this codebase.

## SEO

The site is a client-rendered SPA, so the `<head>` is written twice: once at
build time for crawlers, and again at runtime for the visitor's language.

- **Build time** — `client/vite/seoPrerender.ts` injects a marked block into
  `index.html` (title, description, canonical, Open Graph, and the
  `schema.org/BeautySalon` JSON-LD) and writes one shell per route into
  `dist/`: `dist/prices/index.html`, `dist/contact/index.html`, … nginx
  serves them with `try_files $uri $uri/index.html /index.html`. Without
  this, everything that does not run JavaScript — every social scraper —
  saw the home page's head whatever URL it asked for. The shells are
  German; only the head is prerendered, the body is still React's.
- **Runtime** — `client/src/seo/usePageMeta.ts` rewrites those same tags in
  the visitor's language on navigation. The title and canonical rules are
  shared with the build step (`client/src/seo/meta.ts`) so the two cannot
  disagree.
- `client/src/seo/routes.ts` is the route table the prerender and the tests
  read; `src/test/staticMeta.test.ts` fails if it and `public/sitemap.xml`
  drift apart.
- `robots.txt`, `sitemap.xml`, SVG favicon and apple-touch-icon in
  `client/public/` — keep the origin there in sync with `siteUrl` in
  `client/src/config.ts`.
- No hreflang alternates on purpose: all three languages share one URL
  (language is a client-side preference, not a URL segment). This also means
  the prerendered head can only be one language, and German is the market.

## Analytics (optional)

Set `VITE_ANALYTICS_SRC` and `VITE_ANALYTICS_DOMAIN` at build time to inject
a privacy-friendly, cookie-free analytics script (self-hosted Plausible or
Umami — no consent banner needed). Remember to allow the script origin in
the CSP (`docker/nginx.conf`).

## Contact details

Business name, address, phone, e-mail, Instagram, WhatsApp, coordinates and
opening hours are configured in `client/src/config.ts` — currently
placeholders, replace with real values. The prices in
`client/src/pricing.ts` and the testimonials in the translation files are
placeholders too.
