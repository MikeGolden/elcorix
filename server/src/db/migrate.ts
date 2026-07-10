import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import "dotenv/config";
import { pool } from "./pool.js";

const here = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = readFileSync(join(here, "schema.sql"), "utf8");
  await pool.query(sql);
  console.log("✅ Database schema applied");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
