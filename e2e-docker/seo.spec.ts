import { test, expect } from "@playwright/test";

/**
 * The prerendered route shells, served by the real nginx.
 *
 * This is the only place the whole chain is exercised: the Vite plugin
 * writes dist/<lang>/<route>/index.html, and nginx picks it up through
 * `try_files $uri $uri/index.html /index.html`. Without it a link to
 * /de/prices shared on WhatsApp previews as the home page.
 */
const routes = [
  { path: "/de/prices", title: "Preisliste — elcorix" },
  { path: "/de/contact", title: "Kontakt — elcorix" },
  { path: "/en/prices", title: "Price list — elcorix" },
  // /uk/booking used to be here. The Altegio booking route is behind an off
  // feature flag (client/src/features.ts), so no shell is written for it —
  // put it back alongside the flag.
  { path: "/uk/gallery", title: "Наші роботи — elcorix" },
  { path: "/ru/gallery", title: "Наши работы — elcorix" },
  { path: "/de/imprint", title: "Impressum — elcorix" },
];

test.describe("Prerendered route shells", () => {
  for (const route of routes) {
    test(`${route.path} serves its own head without JavaScript`, async ({ request }) => {
      const response = await request.get(route.path);
      expect(response.status()).toBe(200);

      const html = await response.text();
      expect(html).toContain(`<title>${route.title}</title>`);
      expect(html).toContain(
        `<link rel="canonical" href="https://elcorix.de${route.path}" />`,
      );
      expect(html).toContain(`content="https://elcorix.de${route.path}"`);
      expect(html.match(/<title>/g)).toHaveLength(1);
      expect(html).toContain('type="application/ld+json"');

      // Each shell declares the whole language cluster.
      for (const language of ["en", "de", "uk", "ru"]) {
        const alternate = route.path.replace(/^\/[a-z]{2}/, `/${language}`);
        expect(html).toContain(
          `<link rel="alternate" hreflang="${language}" href="https://elcorix.de${alternate}" />`,
        );
      }
    });
  }

  test("each language home page keeps its own head", async ({ request }) => {
    const german = await (await request.get("/de")).text();
    expect(german).toContain("<title>elcorix — Dauerhafte Laser-Haarentfernung in Kempten</title>");
    expect(german).toContain('<link rel="canonical" href="https://elcorix.de/de" />');
    expect(german).toContain('<html lang="de"');

    const english = await (await request.get("/en")).text();
    expect(english).toContain('<link rel="canonical" href="https://elcorix.de/en" />');
    expect(english).toContain('<html lang="en"');
  });

  test("the unprefixed document points crawlers at the German page", async ({ request }) => {
    // nginx falls back to dist/index.html for "/" and for anything unknown;
    // the router then redirects the visitor to their own language.
    const html = await (await request.get("/")).text();
    expect(html).toContain('<link rel="canonical" href="https://elcorix.de/de" />');
  });

  test("the generated sitemap is served and lists every language", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    // 14 public routes (Altegio is flagged off) × 4 languages.
    expect(xml.match(/<loc>/g)).toHaveLength(56);
    expect(xml).toContain("<loc>https://elcorix.de/uk/prices</loc>");
    expect(xml).toContain("<loc>https://elcorix.de/ru/prices</loc>");
    expect(xml).toContain('hreflang="x-default"');
  });

  test("unknown URLs still fall back to the SPA document", async ({ request }) => {
    const response = await request.get("/definitely-not-a-page");
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('<div id="root">');
  });

  test("HTML is never cached, hashed assets are", async ({ request }) => {
    // A cached shell would pin the browser to a bundle the deploy deleted.
    const shell = await request.get("/de/prices");
    expect(shell.headers()["cache-control"]).toContain("no-cache");

    const html = await shell.text();
    const asset = html.match(/\/assets\/[^"]+\.js/)?.[0];
    expect(asset).toBeTruthy();
    const script = await request.get(asset!);
    expect(script.headers()["cache-control"]).toContain("max-age=31536000");
  });

  test("the shells keep the security headers", async ({ request }) => {
    const headers = (await request.get("/de/prices")).headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  });
});
