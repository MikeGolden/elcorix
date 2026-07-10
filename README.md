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

## Contact details

Business name, address, phone, e-mail and Instagram are configured in
`client/src/config.ts` — currently placeholders, replace with real values.
