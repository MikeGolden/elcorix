import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/kosmetic";

/**
 * Every timeout here is set on purpose: node-postgres defaults them all to
 * "wait forever", so a Postgres that is reachable but wedged would leave
 * requests hanging with no response at all — including /api/health, which
 * would then never report `degraded` and the container healthcheck would
 * simply time out instead of failing over.
 */
export const pool = new pg.Pool({
  connectionString,
  /** Two forms plus the healthcheck; the API is not query-heavy. */
  max: Number(process.env.PGPOOL_MAX ?? 10),
  /** Give up waiting for a free or new connection instead of hanging. */
  connectionTimeoutMillis: 5_000,
  /** Fail the request rather than holding a socket on a stuck server. */
  statement_timeout: 10_000,
  query_timeout: 10_000,
  /** Release idle connections so a restarted database is picked up. */
  idleTimeoutMillis: 30_000,
});

// A backend error on an *idle* pooled client is emitted on the pool, not on
// any request. Without a listener Node treats it as an unhandled 'error'
// event and kills the process.
pool.on("error", (err) => {
  console.error("Idle database client error:", err);
});

export type Queryable = Pick<pg.Pool, "query">;
