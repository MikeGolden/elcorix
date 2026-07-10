import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/kosmetic";

export const pool = new pg.Pool({ connectionString });

export type Queryable = Pick<pg.Pool, "query">;
