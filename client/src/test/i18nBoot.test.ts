import { LANGUAGE_STORAGE_KEY } from "../i18n/routing";

/**
 * What `src/i18n/index.ts` does at import time — seeding the instance from
 * the URL and deciding whether that language is worth remembering.
 *
 * Worth its own file because it is module-level work: the instance is
 * created once, from `window.location`, so each case needs a fresh module
 * registry rather than a fresh render.
 */
async function bootAt(pathname: string) {
  window.history.replaceState({}, "", pathname);
  vi.resetModules();
  const module = await import("../i18n/index");
  return module.default;
}

afterEach(() => {
  window.history.replaceState({}, "", "/");
  vi.resetModules();
});

describe("i18n boot", () => {
  it("takes the language from the URL and remembers it", async () => {
    window.localStorage.clear();
    const i18n = await bootAt("/uk/ціни");
    expect(i18n.resolvedLanguage).toBe("uk");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("uk");
    expect(document.documentElement.lang).toBe("uk");
  });

  it("does not store the default language on an unprefixed URL", async () => {
    // Regression: the seed for an unprefixed URL is German because that
    // page is prerendered in German and hydrated. Storing it would read
    // back as a preference on the very next redirect and make every first
    // visit German for good — including for the Ukrainian half of the
    // clientele.
    window.localStorage.clear();
    const i18n = await bootAt("/prices");
    expect(i18n.resolvedLanguage).toBe("de");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
  });

  it("keeps a stored choice untouched when the URL names nothing", async () => {
    window.localStorage.clear();
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "ru");
    await bootAt("/prices");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("ru");
  });
});
