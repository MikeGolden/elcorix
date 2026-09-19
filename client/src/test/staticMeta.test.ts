import de from "../i18n/locales/de/common.json";
import en from "../i18n/locales/en/common.json";
import uk from "../i18n/locales/uk/common.json";
import ru from "../i18n/locales/ru/common.json";
import { staticBusiness } from "../business";
import { supportedLanguages } from "../i18n/routing";
import {
  alternateLinks,
  canonicalUrl,
  composeTitle,
  ogAlternateLocales,
  ogLocaleFor,
} from "../seo/meta";
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
  it.each([
    ["de", de],
    ["en", en],
    ["uk", uk],
    ["ru", ru],
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

  it("builds absolute canonicals with the language segment", () => {
    expect(canonicalUrl("de", "/")).toBe("https://elcorix.de/de");
    expect(canonicalUrl("de", "/prices")).toBe("https://elcorix.de/de/prices");
    expect(canonicalUrl("uk", "/prices")).toBe("https://elcorix.de/uk/prices");
  });

  it("declares every language plus x-default as hreflang alternates", () => {
    // A page's alternates include the page itself — that is what tells
    // Google the URLs are one cluster and not near-duplicates.
    expect(alternateLinks("/prices")).toEqual([
      { hreflang: "en", href: "https://elcorix.de/en/prices" },
      { hreflang: "de", href: "https://elcorix.de/de/prices" },
      { hreflang: "uk", href: "https://elcorix.de/uk/prices" },
      { hreflang: "ru", href: "https://elcorix.de/ru/prices" },
      { hreflang: "x-default", href: "https://elcorix.de/de/prices" },
    ]);
  });

  it("emits Open Graph locales as language_TERRITORY", () => {
    // A bare "de" is silently ignored by the scrapers that read og:locale.
    expect(ogLocaleFor("de")).toBe("de_DE");
    expect(ogLocaleFor("en")).toBe("en_GB");
    expect(ogLocaleFor("uk")).toBe("uk_UA");
    expect(ogLocaleFor("ru")).toBe("ru_RU");
    expect(ogLocaleFor("en-GB")).toBe("en_GB");
    expect(ogLocaleFor(undefined)).toBe("de_DE");
    expect(ogAlternateLocales("de")).toEqual(["en_GB", "uk_UA", "ru_RU"]);
  });
});

describe("static head blocks", () => {
  const home = siteRoutes[0];
  const prices = siteRoutes.find((route) => route.path === "/prices")!;

  it("carries the route's own title, description and canonical per language", () => {
    const block = seoBlock(prices, "de", BOOKING_URL);
    const head = routeHead(prices, "de");

    expect(head.title).toBe(`${de.meta.prices.title} — elcorix`);
    expect(block).toContain(`<title>${head.title}</title>`);
    expect(block).toContain(`content="${de.meta.prices.description}"`);
    expect(block).toContain('<link rel="canonical" href="https://elcorix.de/de/prices" />');
    expect(block).toContain('content="de_DE"');

    const ukrainian = seoBlock(prices, "uk", BOOKING_URL);
    expect(ukrainian).toContain(`<title>${uk.meta.prices.title} — elcorix</title>`);
    expect(ukrainian).toContain('<link rel="canonical" href="https://elcorix.de/uk/prices" />');
    expect(ukrainian).toContain('content="uk_UA"');

    const russian = seoBlock(prices, "ru", BOOKING_URL);
    expect(russian).toContain(`<title>${ru.meta.prices.title} — elcorix</title>`);
    expect(russian).toContain('<link rel="canonical" href="https://elcorix.de/ru/prices" />');
    expect(russian).toContain('content="ru_RU"');
  });

  it("declares the hreflang alternates every crawler needs", () => {
    const block = seoBlock(prices, "en", BOOKING_URL);
    for (const language of supportedLanguages) {
      expect(block).toContain(
        `<link rel="alternate" hreflang="${language}" href="https://elcorix.de/${language}/prices" />`,
      );
    }
    expect(block).toContain(
      '<link rel="alternate" hreflang="x-default" href="https://elcorix.de/de/prices" />',
    );
    // Its own locale is not repeated as an alternate.
    expect(block).toContain('<meta property="og:locale" content="en_GB" />');
    expect(block).not.toContain('<meta property="og:locale:alternate" content="en_GB" />');
    expect(block).toContain('<meta property="og:locale:alternate" content="de_DE" />');
  });

  it("defaults to German when no language is given", () => {
    expect(routeHead(prices).title).toBe(`${de.meta.prices.title} — elcorix`);
  });

  it("escapes quotes so a translation can never break out of an attribute", () => {
    const block = seoBlock(prices, "de", BOOKING_URL);
    const attributes = [...block.matchAll(/content="([^"]*)"/g)].map((m) => m[1]);
    expect(attributes.length).toBeGreaterThan(0);
    for (const value of attributes) expect(value).not.toContain('"');
  });

  it("embeds LocalBusiness JSON-LD that parses and cannot close its own tag", () => {
    const block = seoBlock(home, "de", BOOKING_URL);
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
    const escaped = seoBlock(home, "de", "https://n1.alteg.io</script><script>alert(1)</script>");
    const script = escaped.slice(escaped.indexOf('application/ld+json">') + 21);
    expect(script.slice(0, script.indexOf("</script>"))).not.toContain("<");
  });
});

describe("injecting the block into index.html", () => {
  const document = "<!doctype html>\n<html>\n  <head>\n    <meta charset=\"UTF-8\" />\n  </head>\n  <body></body>\n</html>\n";

  it("adds exactly one block, inside the head", () => {
    const injected = injectSeoBlock(document, seoBlock(siteRoutes[0], "de", BOOKING_URL));
    expect(injected.match(/<title>/g)).toHaveLength(1);
    expect(injected.indexOf("<title>")).toBeLessThan(injected.indexOf("</head>"));
  });

  it("swaps one route's block for another without touching the rest", () => {
    const home = injectSeoBlock(document, seoBlock(siteRoutes[0], "de", BOOKING_URL));
    const prices = replaceSeoBlock(
      home,
      seoBlock(siteRoutes.find((route) => route.path === "/prices")!, "en", BOOKING_URL),
    );

    expect(prices.match(/<title>/g)).toHaveLength(1);
    expect(prices).toContain('href="https://elcorix.de/en/prices"');
    expect(prices).not.toContain('<link rel="canonical" href="https://elcorix.de/de" />');
    expect(prices).toContain('<meta charset="UTF-8" />');
    expect(prices).toContain("<body></body>");
  });

  it("refuses documents it cannot place the block in", () => {
    expect(() => injectSeoBlock("<html></html>", "x")).toThrow(/<\/head>/);
    expect(() => replaceSeoBlock(document, "x")).toThrow(/no SEO block/);
  });
});
