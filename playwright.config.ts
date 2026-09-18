import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
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
  webServer: [
    {
      command: "npm run dev -w client",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    // The same app built with a Umami website id — only e2e/analytics.spec.ts
    // uses it (test.use({ baseURL: ANALYTICS_BASE_URL })). The tracker
    // script itself is stubbed there, no Umami server is needed.
    {
      command: "npm run dev -w client -- --port 5174 --strictPort",
      url: "http://localhost:5174",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        VITE_UMAMI_WEBSITE_ID: "3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b",
        VITE_CACHE_DIR: "node_modules/.vite-analytics",
      },
    },
  ],
});
