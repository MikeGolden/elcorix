import dotenv from "dotenv";

// Load environment before any module reads process.env (import this first).
// .env.local (gitignored developer overrides) wins over .env; paths are
// relative to cwd, which is server/ under `npm run dev -w server` and the
// repo root when scripts run from there.
dotenv.config({ path: [".env.local", "../.env.local", ".env", "../.env"] });
