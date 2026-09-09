import { test, expect } from "@playwright/test";
import { de, en } from "./paths";

/**
 * What a crawler sees before any JavaScript runs.
 *
 * `request.get` fetches the raw document — no browser, no bundle — which is
 * exactly the position every social scraper is in (WhatsApp, Instagram,
 * Facebook, LinkedIn and Telegram all read the HTML and stop there).
 *
 * The React build needed a build-time prerender step to have anything to
 * show here, and could only ever prerender one language. A rendered page
 * has the right head for the URL, in the URL's own language, for free —
 * and the body too.
 */
test.describe("Static SEO head", () => {
  test("the raw HTML carries title, description and canonical", async ({ request }) => {
    const html = await (await request.get(de.home)).text();

    expect(html).toContain("<title>elcorix — Dauerhafte Laser-Haarentfernung in Kempten</title>");
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('content="de_DE"');
    // Exactly one of each — a second <title> would be a duplicated tag.
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
  });

  test("a deep route gets its own head, not the home page's", async ({ request }) => {
    const html = await (await request.get(de.prices)).text();
    expect(html).toContain("<title>Preisliste — elcorix</title>");
    expect(html).toContain("/prices/");
  });

  test("the English page carries the English head", async ({ request }) => {
    const html = await (await request.get(en.prices)).text();
    expect(html).toContain("<title>Price list — elcorix</title>");
    expect(html).toContain('content="en_GB"');
  });

  test("the LocalBusiness JSON-LD is in the document", async ({ request }) => {
    const html = await (await request.get(de.home)).text();
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match, "no JSON-LD in the served HTML").not.toBeNull();

    const data = JSON.parse(match![1]);
    expect(data["@type"]).toBe("BeautySalon");
    expect(data.address.addressLocality).toBe("Kempten (Allgäu)");
    expect(data.openingHoursSpecification).toHaveLength(1);
    expect(data.potentialAction.target).toMatch(/alteg\.io$/);
  });

  test("WordPress does not announce its version", async ({ request }) => {
    const response = await request.get(de.home);
    const html = await response.text();
    expect(html).not.toContain('name="generator"');
  });

  test("the security headers from the nginx build are still set", async ({ request }) => {
    const response = await request.get(de.home);
    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toContain("https://*.alteg.io");
  });

  test("the sitemap lists the real pages", async ({ request }) => {
    const index = await (await request.get("/wp-sitemap.xml")).text();
    expect(index).toContain("wp-sitemap-posts-page");
  });

  test("the health endpoint answers", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  test("the booking link endpoint still answers on its old path", async ({ request }) => {
    const response = await request.get("/api/bookings/link");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.url).toMatch(/^https:\/\/n\d+\.alteg\.io$/);
  });
});
