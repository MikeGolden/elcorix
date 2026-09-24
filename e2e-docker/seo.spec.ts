import { test, expect } from "@playwright/test";

/**
 * What the server actually hands a client that does not run JavaScript,
 * exercised against real nginx.
 *
 * This is the only place the whole chain is checked end to end: the Vite
 * plugin writes dist/<lang>/<slug>/index.html and dist/_redirects.map,
 * scripts/prerender.mjs renders the body into each shell, and nginx
 * resolves the URL through `try_files`, the redirect map and the 404
 * document. Three separate regressions live here — a shared link
 * previewing as the home page, an empty body for every crawler that does
 * not render, and a soft 200 for every unknown URL.
 */
const routes = [
  { path: "/de/preise", title: "Preise Laser-Haarentfernung Kempten — elcorix", text: "Leistungen für Frauen" },
  { path: "/de/kontakt", title: "Kontakt und Anfahrt – Laserstudio Kempten — elcorix", text: "Bodmanstraße" },
  { path: "/en/prices", title: "Laser hair removal prices in Kempten — elcorix", text: "Services for women" },
  // /uk/booking used to be here. The Altegio booking route is behind an off
  // feature flag (client/src/features.ts), so no shell is written for it —
  // put it back alongside the flag.
  { path: "/uk/галерея", title: "Наші роботи – лазерна епіляція в Кемптені — elcorix", text: "Наші роботи" },
  { path: "/ru/галерея", title: "Наши работы – лазерная эпиляция в Кемптене — elcorix", text: "Наши работы" },
  { path: "/de/impressum", title: "Impressum — elcorix", text: "Impressum" },
];

/** The percent-encoded form a browser actually requests. */
const encode = (path: string) => path.split("/").map(encodeURIComponent).join("/");

test.describe("Prerendered documents", () => {
  for (const route of routes) {
    test(`${route.path} serves its own head and body without JavaScript`, async ({
      request,
    }) => {
      const response = await request.get(encode(route.path));
      expect(response.status()).toBe(200);

      const html = await response.text();
      const canonical = `https://elcorix.de${encode(route.path)}`;
      expect(html).toContain(`<title>${route.title}</title>`);
      expect(html).toContain(`<link rel="canonical" href="${canonical}" />`);
      expect(html).toContain(`content="${canonical}"`);
      expect(html.match(/<title>/g)).toHaveLength(1);
      expect(html).toContain('type="application/ld+json"');

      // The body is in the document, not assembled by a bundle later.
      expect(html).not.toContain('<div id="root"></div>');
      expect(html).toContain("<h1");
      expect(html).toContain(route.text);

      // Each shell declares the whole language cluster, each at its own slug.
      for (const language of ["en", "de", "uk", "ru"]) {
        expect(html).toContain(`<link rel="alternate" hreflang="${language}" href="https://elcorix.de/${language}/`);
      }
    });
  }

  test("each language home page keeps its own head and its own words", async ({ request }) => {
    const german = await (await request.get("/de")).text();
    expect(german).toContain("<title>elcorix — Dauerhafte Laser-Haarentfernung in Kempten</title>");
    expect(german).toContain('<link rel="canonical" href="https://elcorix.de/de" />');
    expect(german).toContain('<html lang="de"');
    expect(german).toContain("Dauerhafte Laser-Haarentfernung");

    const english = await (await request.get("/en")).text();
    expect(english).toContain('<link rel="canonical" href="https://elcorix.de/en" />');
    expect(english).toContain('<html lang="en"');
    expect(english).toContain("Permanent laser hair removal");
  });

  test("the unprefixed root is a whole page, not a redirect stub", async ({ request }) => {
    // The URL every inbound link starts from. It carries the German home
    // page and canonicalises to /de; the visitor's own language is applied
    // by the router after mount.
    const html = await (await request.get("/")).text();
    expect(html).toContain('<link rel="canonical" href="https://elcorix.de/de" />');
    expect(html).toContain("Dauerhafte Laser-Haarentfernung");
    expect(html).not.toContain('<div id="root"></div>');
  });

  test("the generated sitemap is served and lists every language's slug", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    // 14 public routes (Altegio is flagged off) × 4 languages.
    expect(xml.match(/<loc>/g)).toHaveLength(56);
    expect(xml).toContain("<loc>https://elcorix.de/de/preise</loc>");
    expect(xml).toContain(`<loc>https://elcorix.de${encode("/uk/ціни")}</loc>`);
    expect(xml).toContain(`<loc>https://elcorix.de${encode("/ru/цены")}</loc>`);
    expect(xml).toContain('hreflang="x-default"');
  });
});

test.describe("Unknown URLs", () => {
  test("answer 404, not a 200 copy of the home page", async ({ request }) => {
    const response = await request.get("/definitely-not-a-page");
    expect(response.status()).toBe(404);
    const html = await response.text();
    expect(html).toContain('<meta name="robots" content="noindex, follow" />');
    expect(html).not.toContain('rel="canonical"');
    // Still the app, so a visitor who lands here gets the real 404 page.
    expect(html).toContain("Seite nicht gefunden");
  });

  test("404 inside a language segment too", async ({ request }) => {
    expect((await request.get("/de/no-such-page")).status()).toBe(404);
    expect((await request.get("/uk/no-such-page")).status()).toBe(404);
  });

  test("a missing asset gets nginx's own 404, not the whole app document", async ({ request }) => {
    // `error_page` is scoped to the SPA location, so a hashed asset that
    // is gone answers in a few hundred bytes instead of a full page.
    const response = await request.get("/assets/does-not-exist.js");
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('id="root"');
  });
});

test.describe("Legacy URLs", () => {
  const moved = [
    { from: "/de/prices", to: "/de/preise" },
    { from: "/de/terms", to: "/de/agb" },
    { from: "/uk/prices", to: encode("/uk/ціни") },
    { from: "/ru/package-terms", to: encode("/ru/условия-пакетов") },
    { from: "/de/privacy", to: "/de/datenschutz" },
    { from: "/en/datenschutz", to: "/en/privacy" },
    // From before the language segments existed at all.
    { from: "/prices", to: "/de/preise" },
    { from: "/imprint", to: "/de/impressum" },
  ];

  for (const { from, to } of moved) {
    test(`${from} moved permanently to ${to}`, async ({ request }) => {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status()).toBe(301);
      expect(response.headers()["location"]).toBe(to);
    });
  }

  test("keeps the query string across the redirect", async ({ request }) => {
    const response = await request.get("/de/prices?utm_source=instagram", { maxRedirects: 0 });
    expect(response.headers()["location"]).toBe("/de/preise?utm_source=instagram");
  });

  test("the redirect map itself is not served", async ({ request }) => {
    expect((await request.get("/_redirects.map")).status()).toBe(404);
  });
});

test.describe("Headers", () => {
  test("HTML is never cached, hashed assets are", async ({ request }) => {
    // A cached shell would pin the browser to a bundle the deploy deleted.
    const shell = await request.get("/de/preise");
    expect(shell.headers()["cache-control"]).toContain("no-cache");

    const html = await shell.text();
    const asset = html.match(/\/assets\/[^"]+\.js/)?.[0];
    expect(asset).toBeTruthy();
    const script = await request.get(asset!);
    expect(script.headers()["cache-control"]).toContain("max-age=31536000");
  });

  test("the shells keep the security headers", async ({ request }) => {
    const headers = (await request.get("/de/preise")).headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  });
});
