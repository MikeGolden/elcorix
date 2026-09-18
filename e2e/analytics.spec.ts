import { test, expect, type Page } from "@playwright/test";

/**
 * Umami analytics (client/src/analytics.ts). The default dev server is
 * built without a website id; the second one in playwright.config.ts has
 * one. The real tracker never loads: /u/p.js is answered with a stub that
 * records what the site asks it to track.
 */
const ANALYTICS_BASE_URL = "http://localhost:5174";

const STUB_TRACKER = `
  window.__umamiCalls = [];
  window.umami = {
    track: (name, data) => { window.__umamiCalls.push([name, data ?? null]); },
  };
`;

declare global {
  interface Window {
    __umamiCalls?: [string, Record<string, unknown> | null][];
  }
}

function collectAnalyticsRequests(page: Page): string[] {
  const hits: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/u/")) hits.push(request.url());
  });
  return hits;
}

test.describe("analytics off (build without a website id)", () => {
  test("loads no tracker, sends nothing, and the policy has no Umami section", async ({
    page,
  }) => {
    const hits = collectAnalyticsRequests(page);
    await page.goto("/de");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('script[src="/u/p.js"]')).toHaveCount(0);

    await page.goto("/de/datenschutz");
    await expect(page.getByRole("heading", { name: "11. OpenStreetMap" })).toBeVisible();
    await expect(page.getByText(/Umami/)).toHaveCount(0);
    expect(hits).toEqual([]);
  });
});

test.describe("analytics on", () => {
  test.use({ baseURL: ANALYTICS_BASE_URL });

  test.beforeEach(async ({ page, context }) => {
    await page.route("**/u/p.js", (route) =>
      route.fulfill({ contentType: "application/javascript", body: STUB_TRACKER }),
    );
    // WhatsApp and Instagram open in a new tab — keep those offline.
    await context.route(/wa\.me|instagram\.com/, (route) => route.abort());
  });

  test("loads the first-party tracker with its privacy settings", async ({ page }) => {
    await page.goto("/en");
    const script = page.locator('script[src="/u/p.js"]');
    await expect(script).toHaveCount(1);
    await expect(script).toHaveAttribute("data-website-id", "3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b");
    await expect(script).toHaveAttribute("data-do-not-track", "true");
    await expect(script).toHaveAttribute("data-exclude-hash", "true");
    // No third-party script anywhere on the page.
    const foreign = await page
      .locator("script[src]")
      .evaluateAll((els) =>
        els
          .map((el) => new URL((el as HTMLScriptElement).src).origin)
          .filter((origin) => origin !== location.origin),
      );
    expect(foreign).toEqual([]);
  });

  test("reports WhatsApp and Instagram taps with where they were", async ({ page }) => {
    await page.goto("/en/contact");
    await page.waitForFunction(() => Array.isArray(window.__umamiCalls));
    const contact = page.locator("#contact");

    await contact.locator('a[href^="https://wa.me/"]').click();
    await contact.locator('a[href*="instagram.com"]').click();

    await expect
      .poll(() => page.evaluate(() => window.__umamiCalls))
      .toEqual([
        ["whatsapp-click", { placement: "contact" }],
        ["instagram-click", { placement: "contact" }],
      ]);
  });

  test("describes Umami in the privacy policy", async ({ page }) => {
    await page.goto("/de/datenschutz");
    await expect(
      page.getByRole("heading", { name: "11. Reichweitenmessung mit Umami" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "12. OpenStreetMap" })).toBeVisible();
  });

  test("a browser sending Global Privacy Control gets no tracker", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "globalPrivacyControl", {
        get: () => true,
      });
    });
    const hits = collectAnalyticsRequests(page);
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('script[src="/u/p.js"]')).toHaveCount(0);
    expect(hits).toEqual([]);
  });
});
