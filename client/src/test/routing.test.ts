import {
  defaultLanguage,
  detectPreferredLanguage,
  isSupportedLanguage,
  languageFromLocation,
  localizedPath,
  normalizeLanguage,
  normalizePath,
  pickLanguage,
  splitLanguagePath,
  stripForeignLanguagePrefix,
  supportedLanguages,
} from "../i18n/routing";

describe("language URLs", () => {
  it("prefixes app paths with the language", () => {
    expect(localizedPath("de")).toBe("/de");
    expect(localizedPath("de", "/")).toBe("/de");
    expect(localizedPath("uk", "/prices")).toBe("/uk/prices");
    expect(localizedPath("ru", "/prices")).toBe("/ru/prices");
    expect(localizedPath("en", "prices")).toBe("/en/prices");
    // A trailing slash must not produce "/en/prices/" — that is a second
    // URL for the same page as far as a crawler is concerned.
    expect(localizedPath("en", "/prices/")).toBe("/en/prices");
  });

  it("splits a prefixed path back into language and route", () => {
    expect(splitLanguagePath("/de/prices")).toEqual({ language: "de", path: "/prices" });
    expect(splitLanguagePath("/de")).toEqual({ language: "de", path: "/" });
    expect(splitLanguagePath("/de/")).toEqual({ language: "de", path: "/" });
    expect(splitLanguagePath("/uk/legal/imprint")).toEqual({
      language: "uk",
      path: "/legal/imprint",
    });
    expect(splitLanguagePath("/ru/prices")).toEqual({ language: "ru", path: "/prices" });
  });

  it("returns null for paths that carry no supported language", () => {
    expect(splitLanguagePath("/")).toBeNull();
    expect(splitLanguagePath("/prices")).toBeNull();
    expect(splitLanguagePath("/fr/prices")).toBeNull();
    // "den" starts with "de" but is not a language segment.
    expect(splitLanguagePath("/den/prices")).toBeNull();
  });

  it("round-trips every supported language through both directions", () => {
    for (const language of supportedLanguages) {
      expect(splitLanguagePath(localizedPath(language, "/contact"))).toEqual({
        language,
        path: "/contact",
      });
    }
  });

  it("normalizes paths to one leading and no trailing slash", () => {
    expect(normalizePath("")).toBe("/");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("prices")).toBe("/prices");
    expect(normalizePath("/prices/")).toBe("/prices");
  });
});

describe("redirect targets", () => {
  it("drops a language segment the site does not have", () => {
    expect(stripForeignLanguagePrefix("/fr/prices")).toBe("/prices");
    expect(stripForeignLanguagePrefix("/es-MX")).toBe("/");
  });

  it("leaves real routes and supported languages alone", () => {
    expect(stripForeignLanguagePrefix("/prices")).toBe("/prices");
    expect(stripForeignLanguagePrefix("/de/prices")).toBe("/de/prices");
    expect(stripForeignLanguagePrefix("/")).toBe("/");
    expect(stripForeignLanguagePrefix("/booking")).toBe("/booking");
  });

  it("does not mistake a hyphenated slug for a language tag", () => {
    // "no-such-page" parses as language+subtags under a loose pattern, and
    // stripping it would send a 404 to the home page instead.
    expect(stripForeignLanguagePrefix("/no-such-page")).toBe("/no-such-page");
    expect(stripForeignLanguagePrefix("/laser-hair-removal")).toBe("/laser-hair-removal");
    // …while real tags still are ones.
    expect(stripForeignLanguagePrefix("/zh-Hans/prices")).toBe("/prices");
    expect(stripForeignLanguagePrefix("/pt-BR")).toBe("/");
  });
});

describe("language detection", () => {
  it("takes the first supported candidate", () => {
    expect(pickLanguage(["uk-UA"])).toBe("uk");
    expect(pickLanguage(["ru-RU"])).toBe("ru");
    // A Russian-speaking visitor in Ukraine gets Russian, not Ukrainian:
    // the first supported candidate wins, whatever the region tag says.
    expect(pickLanguage(["ru-UA", "uk"])).toBe("ru");
    expect(pickLanguage([null, undefined, "fr-FR", "en-US"])).toBe("en");
  });

  it("falls back to German when nothing matches", () => {
    expect(pickLanguage(["fr-FR", "it"])).toBe(defaultLanguage);
    expect(pickLanguage([])).toBe("de");
  });

  it("reduces region-tagged and underscore forms to the base language", () => {
    expect(normalizeLanguage("de-AT")).toBe("de");
    expect(normalizeLanguage("en_GB")).toBe("en");
    expect(normalizeLanguage("fr")).toBeUndefined();
    expect(normalizeLanguage(undefined)).toBeUndefined();
  });

  it("recognizes exactly the supported codes", () => {
    expect(supportedLanguages).toEqual(["en", "de", "uk", "ru"]);
    expect(supportedLanguages.every(isSupportedLanguage)).toBe(true);
    expect(isSupportedLanguage("ua")).toBe(false);
    expect(isSupportedLanguage("rus")).toBe(false);
    expect(isSupportedLanguage(42)).toBe(false);
  });

  it("prefers the stored choice over the browser languages", () => {
    window.localStorage.setItem("i18nextLng", "uk");
    expect(detectPreferredLanguage()).toBe("uk");
  });

  it("lets the URL override everything when it names a language", () => {
    window.localStorage.setItem("i18nextLng", "uk");
    expect(languageFromLocation("/en/prices")).toBe("en");
    // …and falls back to detection when it does not.
    expect(languageFromLocation("/prices")).toBe("uk");
  });
});
