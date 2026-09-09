import { defineConfig, devices } from "@playwright/test";

/**
 * The e2e suite runs against a real WordPress, not a dev server: the whole
 * point of the port is that the pages are rendered on the server, so there
 * is nothing meaningful to test without one.
 *
 *   docker compose up -d --build
 *   docker compose run --rm wpcli wp eval-file wp-content/elcorix-tools/seed.php
 *   npm run test:e2e
 *
 * Point E2E_BASE_URL somewhere else to run the same suite against staging.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // CI images (and sandboxes) that ship their own Chromium can point
        // Playwright at it instead of downloading one.
        ...(process.env.PW_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
          : {}),
      },
    },
  ],
});
