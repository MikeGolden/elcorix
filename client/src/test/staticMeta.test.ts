import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import de from "../i18n/locales/de/common.json";
import en from "../i18n/locales/en/common.json";
import uk from "../i18n/locales/uk/common.json";
import { staticBusiness } from "../business";
import { canonicalUrl, composeTitle, ogLocaleFor } from "../seo/meta";
import { siteRoutes } from "../seo/routes";
import {
  injectSeoBlock,
  replaceSeoBlock,
  routeHead,
  seoBlock,
} from "../seo/staticHead";

const BOOKING_URL = "https://n123456.alteg.io";

function jsonLdFrom(html: string): Record<string, unknown> {
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  if (!match) throw new Error("no JSON-LD script in the block");
  return JSON.parse(match[1]);
}

describe("route table", () => {
  const sitemap = readFileSync(resolve(process.cwd(), "public/sitemap.xml"), "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  it("declares the same URLs as public/sitemap.xml", () => {
    // The sitemap is hand-written; this is what stops it drifting from the
    // routes that actually get a prerendered shell.
    expect([...sitemapUrls].sort()).toEqual(
      siteRoutes.map((route) => canonicalUrl(route.path)).sort(),
    );
  });

  it("declares the same changefreq as the sitemap", () => {
    const freqs = [...sitemap.matchAll(/<changefreq>([^<]+)<\/changefreq>/g)].map((m) => m[1]);
    expect(freqs).toEqual(siteRoutes.map((route) => route.changefreq));
  });

  it.each([
    ["de", de],
    ["en", en],
    ["uk", uk],
  ] as const)("has a %s title and description for every route", (_language, resources) => {
    for (const route of siteRoutes) {
      const meta = resources.meta[route.metaKey];
      expect(meta?.title.trim(), route.path).toBeTruthy();
      expect(meta?.description.trim(), route.path).toBeTruthy();
    }
  });
});

describe("shared title and canonical rules", () => {
  it("puts the brand first on the landing page and last everywhere else", () => {
    expect(composeTitle("/", "Preisliste")).toBe("elcorix — Preisliste");
    expect(composeTitle("/prices", "Preisliste")).toBe("Preisliste — elcorix");
  });

  it("builds absolute canonicals against the configured origin", () => {
    expect(canonicalUrl("/")).toBe("https://elcorix.com/");
    expect(canonicalUrl("/prices")).toBe("https://elcorix.com/prices");
  });

  it("emits Open Graph locales as language_TERRITORY", () => {
    // A bare "de" is silently ignored by the scrapers that read og:locale.
    expect(ogLocaleFor("de")).toBe("de_DE");
    expect(ogLocaleFor("en")).toBe("en_GB");
    expect(ogLocaleFor("uk")).toBe("uk_UA");
    expect(ogLocaleFor("en-GB")).toBe("en_GB");
    expect(ogLocaleFor(undefined)).toBe("de_DE");
  });
});

describe("static head blocks", () => {
  const home = siteRoutes[0];
  const prices = siteRoutes.find((route) => route.path === "/prices")!;

  it("carries the route's own German title, description and canonical", () => {
    const block = seoBlock(prices, BOOKING_URL);
    const head = routeHead(prices);

    expect(head.title).toBe(`${de.meta.prices.title} — elcorix`);
    expect(block).toContain(`<title>${head.title}</title>`);
    expect(block).toContain(`content="${de.meta.prices.description}"`);
    expect(block).toContain('<link rel="canonical" href="https://elcorix.com/prices" />');
    expect(block).toContain('content="https://elcorix.com/prices"');
    expect(block).toContain('content="de_DE"');
  });

  it("escapes quotes so a translation can never break out of an attribute", () => {
    const block = seoBlock({ ...prices, metaKey: "prices" }, BOOKING_URL);
    const attributes = [...block.matchAll(/content="([^"]*)"/g)].map((m) => m[1]);
    expect(attributes.length).toBeGreaterThan(0);
    for (const value of attributes) expect(value).not.toContain('"');
  });

  it("embeds LocalBusiness JSON-LD that parses and cannot close its own tag", () => {
    const block = seoBlock(home, BOOKING_URL);
    expect(block).not.toContain("</script></script>");

    const data = jsonLdFrom(block);
    expect(data["@type"]).toBe("BeautySalon");
    expect(data.name).toBe(staticBusiness.name);
    expect(data.telephone).toBe(staticBusiness.phone);
    expect(data.address).toMatchObject({
      streetAddress: "Bodmanstraße 14",
      postalCode: "87435",
      addressLocality: "Kempten (Allgäu)",
      addressCountry: "DE",
    });
    expect(data.potentialAction).toMatchObject({ target: BOOKING_URL });
    expect((data.openingHoursSpecification as unknown[]).length).toBe(
      staticBusiness.openingHours.length,
    );
  });

  it("never emits a raw < inside the JSON-LD", () => {
    const escaped = seoBlock(home, "https://n1.alteg.io</script><script>alert(1)</script>");
    const script = escaped.slice(escaped.indexOf('application/ld+json">') + 21);
    expect(script.slice(0, script.indexOf("</script>"))).not.toContain("<");
  });
});

describe("injecting the block into index.html", () => {
  const document = "<!doctype html>\n<html>\n  <head>\n    <meta charset=\"UTF-8\" />\n  </head>\n  <body></body>\n</html>\n";

  it("adds exactly one block, inside the head", () => {
    const injected = injectSeoBlock(document, seoBlock(siteRoutes[0], BOOKING_URL));
    expect(injected.match(/<title>/g)).toHaveLength(1);
    expect(injected.indexOf("<title>")).toBeLessThan(injected.indexOf("</head>"));
  });

  it("swaps one route's block for another without touching the rest", () => {
    const home = injectSeoBlock(document, seoBlock(siteRoutes[0], BOOKING_URL));
    const prices = replaceSeoBlock(
      home,
      seoBlock(siteRoutes.find((route) => route.path === "/prices")!, BOOKING_URL),
    );

    expect(prices.match(/<title>/g)).toHaveLength(1);
    expect(prices).toContain('href="https://elcorix.com/prices"');
    expect(prices).not.toContain('href="https://elcorix.com/"');
    expect(prices).toContain('<meta charset="UTF-8" />');
    expect(prices).toContain("<body></body>");
  });

  it("refuses documents it cannot place the block in", () => {
    expect(() => injectSeoBlock("<html></html>", "x")).toThrow(/<\/head>/);
    expect(() => replaceSeoBlock(document, "x")).toThrow(/no SEO block/);
  });
});
