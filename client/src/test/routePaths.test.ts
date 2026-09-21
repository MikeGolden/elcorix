import {
  canonicalPathFor,
  decodePath,
  encodePath,
  legacyRedirects,
  localizedRouteFilePath,
  localizedRoutePath,
  slugFor,
} from "../seo/routePaths";
import { siteRoutes } from "../seo/routes";
import { supportedLanguages } from "../i18n/routing";

describe("localized route slugs", () => {
  it("gives every route a slug in every language", () => {
    for (const route of siteRoutes) {
      for (const language of supportedLanguages) {
        expect(route.slugs[language], `${route.path} in ${language}`).toMatch(/^\//);
      }
    }
  });

  it("keeps the slugs of one language distinct, so no two pages share a URL", () => {
    for (const language of supportedLanguages) {
      const slugs = siteRoutes.map((route) => route.slugs[language]);
      expect(new Set(slugs).size, `duplicate slug in ${language}`).toBe(slugs.length);
    }
  });

  it("percent-encodes the Cyrillic slugs for the browser, per segment", () => {
    expect(localizedRoutePath("de", "/prices")).toBe("/de/preise");
    expect(localizedRoutePath("uk", "/prices")).toBe("/uk/%D1%86%D1%96%D0%BD%D0%B8");
    expect(localizedRoutePath("ru", "/for-whom/beard-contour")).toBe(
      `/ru/${encodeURIComponent("для-кого")}/${encodeURIComponent("контур-бороды")}`,
    );
    expect(localizedRoutePath("uk", "/")).toBe("/uk");
  });

  it("leaves the slug decoded for the file written to disk", () => {
    // nginx decodes the request URI before try_files, so the shell has to
    // live at the real UTF-8 directory name.
    expect(localizedRouteFilePath("uk", "/prices")).toBe("/uk/ціни");
    expect(localizedRouteFilePath("de", "/")).toBe("/de");
  });

  it("passes a path that is not a route through untouched", () => {
    expect(localizedRoutePath("de", "/no-such-page")).toBe("/de/no-such-page");
    expect(slugFor("de", "/no-such-page")).toBe("/no-such-page");
  });

  it("maps a served slug back to its canonical path, encoded or not", () => {
    for (const route of siteRoutes) {
      for (const language of supportedLanguages) {
        const slug = route.slugs[language];
        expect(canonicalPathFor(language, slug)).toBe(route.path);
        expect(canonicalPathFor(language, encodePath(slug))).toBe(route.path);
      }
    }
    expect(canonicalPathFor("de", "/prices")).toBeNull();
    expect(canonicalPathFor("uk", "/no-such-page")).toBeNull();
  });

  it("survives a stray percent sign instead of throwing inside a render", () => {
    expect(decodePath("/100%")).toBe("/100%");
  });
});

describe("legacy redirects", () => {
  it("keeps only the one English URL that did change: /datenschutz", () => {
    // The German word was the shared path for every language before the
    // slugs were localized; in English the page is now /en/privacy.
    expect(legacyRedirects("en")).toEqual([{ from: "datenschutz", to: "/en/privacy" }]);
  });

  it("sends the old English slug to the language's own URL", () => {
    expect(legacyRedirects("uk")).toContainEqual({
      from: "prices",
      to: "/uk/%D1%86%D1%96%D0%BD%D0%B8",
    });
    expect(legacyRedirects("de")).toContainEqual({ from: "prices", to: "/de/preise" });
  });

  it("keeps the pre-rename /privacy working in every language", () => {
    expect(legacyRedirects("de")).toContainEqual({ from: "privacy", to: "/de/datenschutz" });
    expect(legacyRedirects("uk")).toContainEqual({
      from: "privacy",
      to: `/uk/${encodeURIComponent("конфіденційність")}`,
    });
  });

  it("never redirects a path to itself", () => {
    for (const language of supportedLanguages) {
      for (const { from, to } of legacyRedirects(language)) {
        expect(`/${language}/${from}`).not.toBe(to);
      }
    }
  });

  it("drops a redirect whose target is behind an off feature flag", () => {
    const withoutBooking = siteRoutes.filter((route) => route.feature === undefined);
    const froms = legacyRedirects("de", withoutBooking).map((redirect) => redirect.from);
    expect(froms).not.toContain("booking");
    expect(froms).toContain("prices");
  });
});
