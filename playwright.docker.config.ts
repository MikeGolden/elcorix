import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests against the composed Docker stack (no mocks, no dev server).
 * Bring the stack up first: `docker compose up -d --build`, then
 * `npm run test:e2e:docker`. BASE_URL overrides the default nginx port.
 */
export default defineConfig({
  testDir: "./e2e-docker",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:8080",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
