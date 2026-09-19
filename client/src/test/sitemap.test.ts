import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { features } from "../config";
import { supportedLanguages } from "../i18n/routing";
import { canonicalUrl } from "../seo/meta";
import { publicRoutes, siteRoutes } from "../seo/routes";
import { buildSitemap } from "../seo/sitemap";

/** What the build actually emits: the flagged-off routes are not in here. */
const routes = publicRoutes(features);
const sitemap = buildSitemap("2026-09-09", routes);
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

describe("generated sitemap", () => {
  it("lists every route in every language, and nothing else", () => {
    expect([...urls].sort()).toEqual(
      routes
        .flatMap((route) =>
          supportedLanguages.map((language) => canonicalUrl(language, route.path)),
        )
        .sort(),
    );
    expect(urls).toHaveLength(routes.length * supportedLanguages.length);
    // No duplicates — a repeated <loc> makes Google drop the whole file.
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("gives every URL the full hreflang alternate set", () => {
    const alternates = [...sitemap.matchAll(/<xhtml:link[^>]*hreflang="([^"]+)"/g)].map(
      (m) => m[1],
    );
    // Each entry declares every supported language plus x-default.
    expect(alternates).toHaveLength(urls.length * (supportedLanguages.length + 1));
    expect(alternates.filter((code) => code === "x-default")).toHaveLength(urls.length);
  });

  it("leaves out routes whose feature flag is off", () => {
    // The Altegio booking block is hidden (src/features.ts). It must not be
    // advertised to crawlers while it is — but it is still in the table, so
    // turning the flag back on restores it without touching the sitemap.
    const hidden = siteRoutes.filter(
      (route) => route.feature !== undefined && !features[route.feature],
    );
    for (const route of hidden) {
      for (const language of supportedLanguages) {
        expect(urls).not.toContain(canonicalUrl(language, route.path));
      }
    }
    expect(routes.length + hidden.length).toBe(siteRoutes.length);
  });

  it("carries the route table's changefreq and priority", () => {
    const prices = sitemap
      .split("<url>")
      .find((block) => block.includes("<loc>https://elcorix.de/de/prices</loc>"))!;
    const route = siteRoutes.find((entry) => entry.path === "/prices")!;
    expect(prices).toContain(`<changefreq>${route.changefreq}</changefreq>`);
    expect(prices).toContain(`<priority>${route.priority}</priority>`);
    expect(prices).toContain("<lastmod>2026-09-09</lastmod>");
  });

  it("is well-formed XML in the sitemap and xhtml namespaces", () => {
    expect(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(sitemap).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(new DOMParser().parseFromString(sitemap, "application/xml").querySelector(
      "parsererror",
    )).toBeNull();
  });

  it("is the file robots.txt points crawlers at", () => {
    // The sitemap is written into dist/ by the prerender plugin, so the
    // origin in robots.txt has to match the one the URLs are built from.
    const robots = readFileSync(resolve(process.cwd(), "public/robots.txt"), "utf8");
    expect(robots).toContain("Sitemap: https://elcorix.de/sitemap.xml");
  });
});
