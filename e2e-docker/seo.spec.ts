import { test, expect } from "@playwright/test";

/**
 * The prerendered route shells, served by the real nginx.
 *
 * This is the only place the whole chain is exercised: the Vite plugin
 * writes dist/<route>/index.html, and nginx picks it up through
 * `try_files $uri $uri/index.html /index.html`. Without it a link to
 * /prices shared on WhatsApp previews as the home page.
 */
const routes = [
  { path: "/prices", title: "Preisliste — elcorix" },
  { path: "/contact", title: "Kontakt — elcorix" },
  { path: "/booking", title: "Termin vereinbaren — elcorix" },
  { path: "/imprint", title: "Impressum — elcorix" },
];

test.describe("Prerendered route shells", () => {
  for (const route of routes) {
    test(`${route.path} serves its own head without JavaScript`, async ({ request }) => {
      const response = await request.get(route.path);
      expect(response.status()).toBe(200);

      const html = await response.text();
      expect(html).toContain(`<title>${route.title}</title>`);
      expect(html).toContain(
        `<link rel="canonical" href="https://elcorix.com${route.path}" />`,
      );
      expect(html).toContain(`content="https://elcorix.com${route.path}"`);
      expect(html.match(/<title>/g)).toHaveLength(1);
      expect(html).toContain('type="application/ld+json"');
    });
  }

  test("the home page keeps its own head", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain("<title>elcorix — Dauerhafte Laser-Haarentfernung in Kempten</title>");
    expect(html).toContain('<link rel="canonical" href="https://elcorix.com/" />');
  });

  test("unknown URLs still fall back to the SPA document", async ({ request }) => {
    const response = await request.get("/definitely-not-a-page");
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('<div id="root">');
  });

  test("HTML is never cached, hashed assets are", async ({ request }) => {
    // A cached shell would pin the browser to a bundle the deploy deleted.
    const shell = await request.get("/prices");
    expect(shell.headers()["cache-control"]).toContain("no-cache");

    const html = await shell.text();
    const asset = html.match(/\/assets\/[^"]+\.js/)?.[0];
    expect(asset).toBeTruthy();
    const script = await request.get(asset!);
    expect(script.headers()["cache-control"]).toContain("max-age=31536000");
  });

  test("the shells keep the security headers", async ({ request }) => {
    const headers = (await request.get("/prices")).headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  });
});
