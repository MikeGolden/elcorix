import { defineConfig, devices } from "@playwright/test";

// CI images (and sandboxes) that ship their own Chromium can point
// Playwright at it instead of downloading one.
const chromiumPath = process.env.PW_CHROMIUM_PATH
  ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
  : {};

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
        ...chromiumPath,
      },
    },
    // Most visitors arrive from Instagram on a phone. The phone layout (menu
    // drawer, stacked forms, swipe gallery) gets the specs that walk
    // through the page, plus the accessibility sweep. Pixel 7 rather than
    // an iPhone profile because only Chromium is installed in CI and the
    // sandboxes; the viewport and touch emulation are what matter here.
    {
      name: "mobile",
      testMatch: /(landing|contact|pages|gallery|a11y)\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        ...chromiumPath,
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
