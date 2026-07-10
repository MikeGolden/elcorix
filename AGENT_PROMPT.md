# Suggested prompt for a coding agent

Use this prompt when asking a coding agent (Claude Code, etc.) to build or
extend this project from scratch:

---

Build a production-quality website for "Kosmetic Füssen", a cosmetic
procedures cabinet in Füssen, Germany.

**Stack (non-negotiable):** React 18 + TypeScript + Vite for the frontend,
Tailwind CSS for styling, Node.js + Express + TypeScript for the API,
PostgreSQL for persistence. npm workspaces monorepo: `client/`, `server/`,
`e2e/`.

**Pages/sections:**
1. Home — hero with CTA, "Who we are" (team/philosophy), "What we do"
   (grid of 6 services).
2. Book a procedure — embed the Altegio online-booking calendar
   (`https://n<ALTEGIO_COMPANY_ID>.alteg.io`) in an iframe with a
   fallback link; company id must come from env config.
3. Contact — clickable tel:, mailto: and Instagram links, opening hours,
   and a contact form that POSTs to `/api/contact`.

**Backend:** Express app factory that accepts a `pg` pool (dependency
injection so tests can mock the DB). Routes: `GET /api/health`,
`POST /api/contact` (validate name/email/message, insert into
`contact_messages`), `GET /api/bookings/link`, `POST /api/bookings`
(log into `booking_requests`). Provide `schema.sql` and a migrate script.
Config via `.env` (`DATABASE_URL`, `PORT`, `ALTEGIO_COMPANY_ID`).

**Testing (required):**
- Unit: Vitest + React Testing Library for pages/components (routing,
  Altegio iframe src, contact form success/error paths with mocked fetch);
  Vitest + Supertest for every API route including validation and DB-error
  cases (mock the pool — no live DB in unit tests).
- E2E: Playwright specs for navigation, booking widget presence, contact
  links, and form submission with the API route mocked via `page.route`.

**Quality bar:** strict TypeScript everywhere, accessible markup (labels,
roles, aria), responsive layout, no hardcoded business data in components
(centralize in `config.ts`), git repo initialized with a meaningful first
commit, README with setup/run/test instructions.

**Definition of done:** `npm install && npm run typecheck && npm test`
passes and `npm run build` succeeds; `npm run test:e2e` passes after
`npx playwright install chromium`.

---
