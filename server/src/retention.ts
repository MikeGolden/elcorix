import type { Queryable } from "./db/pool.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The ceiling the privacy policy states. Raise it only together with the policy. */
export const MAX_RETENTION_MONTHS = 6;

/**
 * GDPR data-retention cleanup: the privacy policy (Stand 17.09.2026, § 6)
 * promises that form requests are deleted at the latest six months after
 * they were dealt with, so enforce it. Counting from creation is stricter
 * than "after completion" and needs no status tracking. Runs once at
 * startup and then daily; RETENTION_MONTHS may shorten the window but never
 * extend it past MAX_RETENTION_MONTHS.
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
  const configured = Number(process.env.RETENTION_MONTHS ?? MAX_RETENTION_MONTHS);
  if (!Number.isInteger(configured) || configured <= 0) {
    console.warn(`Invalid RETENTION_MONTHS "${process.env.RETENTION_MONTHS}", cleanup disabled`);
    return () => {};
  }
  // An old .env with RETENTION_MONTHS=12 must not quietly break the policy.
  const months = Math.min(configured, MAX_RETENTION_MONTHS);
  if (months < configured) {
    console.warn(
      `RETENTION_MONTHS=${configured} exceeds the ${MAX_RETENTION_MONTHS} months the privacy policy allows — using ${MAX_RETENTION_MONTHS}`,
    );
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
