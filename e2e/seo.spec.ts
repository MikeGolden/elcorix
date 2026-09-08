import { test, expect } from "@playwright/test";

/**
 * What a crawler sees before any JavaScript runs.
 *
 * `request.get` fetches the raw document — no browser, no bundle, no
 * `usePageMeta` — which is exactly the position every social scraper is in
 * (WhatsApp, Instagram, Facebook, LinkedIn, Telegram all read the HTML and
 * stop there). The dev server only ever serves the home block, because the
 * per-route shells are written at build time; e2e-docker/seo.spec.ts covers
 * those against nginx.
 */
test.describe("Static SEO head (dev server)", () => {
  test("the raw HTML already carries title, description and canonical", async ({
    request,
  }) => {
    const html = await (await request.get("/")).text();

    expect(html).toContain("<title>elcorix — Dauerhafte Laser-Haarentfernung in Kempten</title>");
    expect(html).toContain('<link rel="canonical" href="https://elcorix.com/" />');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('content="de_DE"');
    // Exactly one of each — a second <title> would be a duplicated tag.
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
  });

  test("the LocalBusiness JSON-LD is in the document, not injected later", async ({
    request,
  }) => {
    const html = await (await request.get("/")).text();
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match, "no JSON-LD in the served HTML").not.toBeNull();

    const data = JSON.parse(match![1]);
    expect(data["@type"]).toBe("BeautySalon");
    expect(data.address.addressLocality).toBe("Kempten (Allgäu)");
    expect(data.openingHoursSpecification).toHaveLength(2);
  });

  test("the app reuses those tags instead of appending its own", async ({ page }) => {
    await page.goto("/");
    // Playwright's default locale is en-US, so the app switches the head to
    // English on mount — the static German tags are the crawler's copy.
    const ogLocale = page.locator('meta[property="og:locale"]');
    await expect(ogLocale).toHaveAttribute("content", "en_GB");
    await expect(page).toHaveTitle(/Permanent laser hair removal/);

    await page.getByTestId("language-switcher").click();
    await page.getByRole("option", { name: "Deutsch" }).click();
    await expect(ogLocale).toHaveAttribute("content", "de_DE");
    await expect(page).toHaveTitle(/Dauerhafte Laser-Haarentfernung/);

    // One of each: usePageMeta must rewrite the prerendered tags, never
    // append a second set beside them.
    await expect(page.locator("title")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  });
});
