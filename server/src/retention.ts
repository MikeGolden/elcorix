import type { Queryable } from "./db/pool.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * GDPR data-retention cleanup: the privacy policy promises that contact
 * messages and booking requests are deleted after at most 12 months, so
 * enforce it. Runs once at startup and then daily; the retention window
 * is configurable via RETENTION_MONTHS.
 */
export async function cleanupExpiredRecords(
  db: Queryable,
  months: number,
): Promise<{ contacts: number; bookings: number }> {
  const contacts = await db.query(
    `DELETE FROM contact_messages
     WHERE created_at < now() - make_interval(months => $1)`,
    [months],
  );
  const bookings = await db.query(
    `DELETE FROM booking_requests
     WHERE created_at < now() - make_interval(months => $1)`,
    [months],
  );
  return { contacts: contacts.rowCount ?? 0, bookings: bookings.rowCount ?? 0 };
}

export function startRetentionCleanup(db: Queryable): () => void {
  const months = Number(process.env.RETENTION_MONTHS ?? 12);
  if (!Number.isInteger(months) || months <= 0) {
    console.warn(`Invalid RETENTION_MONTHS "${process.env.RETENTION_MONTHS}", cleanup disabled`);
    return () => {};
  }

  const run = () => {
    cleanupExpiredRecords(db, months)
      .then(({ contacts, bookings }) => {
        if (contacts > 0 || bookings > 0) {
          console.log(
            `Retention cleanup: deleted ${contacts} contact message(s), ${bookings} booking request(s) older than ${months} months`,
          );
        }
      })
      .catch((err) => console.error("Retention cleanup failed:", err));
  };

  run();
  const timer = setInterval(run, DAY_MS);
  timer.unref();
  return () => clearInterval(timer);
}
