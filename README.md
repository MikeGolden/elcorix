# Kosmetic Füssen

Landing page and booking API for a cosmetic procedures cabinet in Füssen, Germany.

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
│       ├── pages/       # Home (who we are / what we do), Booking, Contact
│       ├── components/  # Header, Footer, AltegioWidget
│       └── test/        # Vitest unit tests
├── server/          # Express + TS API
│   └── src/
│       ├── routes/      # /api/contact, /api/bookings
│       ├── db/          # pg pool, schema.sql, migrate script
│       └── test/        # Vitest + Supertest unit tests
├── e2e/             # Playwright end-to-end tests
└── playwright.config.ts
```

## Getting started

Prerequisites: Node.js ≥ 20, PostgreSQL ≥ 14.

```bash
npm install

# configure environment
cp .env.example .env        # set DATABASE_URL and ALTEGIO_COMPANY_ID

# create the database and apply schema
createdb kosmetic
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
into **English (en)**, **German (de)** and **Ukrainian (uk)**.

- Detection order: `localStorage` (`i18nextLng`) → browser language → **German**
  (the business default). The user's choice is persisted to `localStorage`, and
  `<html lang>` is kept in sync on every change.
- Missing keys fall back to **English**.
- Translations live in `client/src/i18n/locales/<lng>/common.json`; the i18n
  instance is initialized in `client/src/i18n/index.ts` (imported first in
  `main.tsx`). Translation keys are type-checked: `client/src/i18n/i18next.d.ts`
  augments i18next with the English resource shape, so a typo in a `t()` key is
  a compile error.
- The header's `LanguageSwitcher` (accessible listbox dropdown, keyboard
  navigable) uses small inline SVG flags from `client/src/components/flags/`.

**Adding a key:** add it to `en/common.json` first (it is the type source and
the fallback), then mirror it in `de` and `uk`. A unit test
(`src/test/translations.test.ts`) fails if the key sets ever diverge.

**Adding a language:** create `client/src/i18n/locales/<lng>/common.json` with
the full key set, register it in `resources` and `supportedLanguages` in
`client/src/i18n/index.ts`, add an entry (label + flag component) to
`LanguageSwitcher`, and extend the completeness test.

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

| Method | Path                | Description                          |
| ------ | ------------------- | ------------------------------------ |
| GET    | `/api/health`       | Liveness check                       |
| POST   | `/api/contact`      | Store a contact-form message         |
| GET    | `/api/bookings/link`| Altegio booking URL for the company  |
| POST   | `/api/bookings`     | Log a booking request                |

## Testing

```bash
npm test              # unit tests (client + server, DB is mocked)
npm run test:e2e      # Playwright e2e (starts the Vite dev server itself)
npx playwright install chromium   # one-time browser download for e2e
npm run typecheck     # TypeScript across both workspaces
```

## Build

```bash
npm run build         # client → client/dist, server → server/dist
npm run start -w server
```

## GDPR / privacy

- **Cookie consent banner** (all three languages) on first visit; “Accept
  all” and “Only necessary” have equal prominence, the decision is stored in
  `localStorage` (`cookie-consent`, with timestamp as the consent record) and
  can be changed any time via “Cookie settings” in the footer.
- **The Altegio embed is consent-gated** (two-click pattern): the iframe —
  which sets third-party cookies — only loads after opt-in, either via the
  banner or the placeholder on the booking page. A no-cookie fallback link
  (new tab) is always available.
- **Contact form** requires a privacy-policy checkbox before submitting.
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

## Contact details

Business name, address, phone, e-mail and Instagram are configured in
`client/src/config.ts` — currently placeholders, replace with real values.
