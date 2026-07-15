CREATE TABLE IF NOT EXISTS contact_messages (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Local log of booking requests forwarded to / initiated via Altegio.
CREATE TABLE IF NOT EXISTS booking_requests (
  id                 SERIAL PRIMARY KEY,
  altegio_company_id TEXT NOT NULL,
  service            TEXT,
  customer_name      TEXT NOT NULL,
  customer_phone     TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Databases created before the NOT NULL constraints existed: the API has
-- always required both fields, so backfill and tighten (idempotent).
UPDATE booking_requests SET customer_name = '' WHERE customer_name IS NULL;
UPDATE booking_requests SET customer_phone = '' WHERE customer_phone IS NULL;
ALTER TABLE booking_requests ALTER COLUMN customer_name SET NOT NULL;
ALTER TABLE booking_requests ALTER COLUMN customer_phone SET NOT NULL;

-- Retention cleanup (see server/src/retention.ts) deletes by age daily.
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON contact_messages (created_at);
CREATE INDEX IF NOT EXISTS booking_requests_created_at_idx
  ON booking_requests (created_at);
