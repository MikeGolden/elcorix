import { defineConfig } from "@playwright/test";

// Lighthouse audits of the production build — see lighthouse/lighthouse.spec.ts.
// Needs `npm run build -w client` first. One worker: Lighthouse's CPU
// throttling is calibrated for a quiet machine, and parallel runs would skew
// each other's timings.
export default defineConfig({
  testDir: "./lighthouse",
  // Runs every audit before the first test; the specs only read the results.
  globalSetup: "./lighthouse/global-setup.ts",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  // Only the assertions run under this timeout; the audits happen in
  // global setup, which has none.
  timeout: 30_000,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: "http://localhost:4173",
  },
  webServer: {
    command: "node lighthouse/serve-dist.mjs",
    url: "http://localhost:4173/de",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
