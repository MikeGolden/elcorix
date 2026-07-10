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
  customer_name      TEXT,
  customer_phone     TEXT,
  status             TEXT NOT NULL DEFAULT 'pending',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
