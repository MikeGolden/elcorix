import i18next, { type i18n as I18n } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/common.json";
import de from "./locales/de/common.json";
import uk from "./locales/uk/common.json";
import ru from "./locales/ru/common.json";
import {
  defaultLanguage,
  isSupportedLanguage,
  languageFromLocation,
  rememberLanguage,
  splitLanguagePath,
  supportedLanguages,
  type SupportedLanguage,
} from "./routing";

export * from "./routing";

export const resources = {
  en: { common: en },
  de: { common: de },
  uk: { common: uk },
  ru: { common: ru },
} as const;

/**
 * The active language is decided by the URL, not by i18next: every page
 * lives under `/de`, `/en`, `/uk` or `/ru` (see ./routing), and `LanguageLayout`
 * calls `changeLanguage` for whichever segment the router matched. So no
 * language detector is plugged in here — detection only picks the redirect
 * target for an unprefixed URL, which `detectPreferredLanguage` does.
 *
 * English stays the per-key fallback: a string missing from `de`, `uk` or `ru`
 * renders in English rather than as a raw key.
 */
export function createI18nInstance(
  bindReact = false,
  language: SupportedLanguage = defaultLanguage,
): I18n {
  const instance = i18next.createInstance();

  if (bindReact) instance.use(initReactI18next);

  void instance.init({
    resources,
    lng: language,
    ns: ["common"],
    defaultNS: "common",
    fallbackLng: "en",
    supportedLngs: [...supportedLanguages],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    interpolation: { escapeValue: false },
    // Resources are bundled, no async backend — init synchronously so the
    // first render (and tests) never see a half-initialized instance.
    initAsync: false,
  });

  return instance;
}

/**
 * The browser's instance, seeded from the URL so the very first paint is
 * already in the right language — the alternative is a frame of German on
 * `/en/prices`.
 *
 * The DOM is touched behind `typeof window` guards so that this module can
 * be imported in Node: `src/entry-server.tsx` renders the same tree at
 * build time and needs `createI18nInstance`, one instance per language,
 * with no document to seed from.
 */
const pathname = typeof window === "undefined" ? "/" : window.location.pathname;

/** Whether the URL itself names a language, or we are falling back. */
const urlNamesLanguage = splitLanguagePath(pathname)?.language !== undefined;

const i18n = createI18nInstance(true, languageFromLocation(pathname));

function syncDocumentLanguage(remember: boolean) {
  if (typeof document === "undefined") return;
  const language = i18n.resolvedLanguage ?? defaultLanguage;
  document.documentElement.lang = language;
  if (remember && isSupportedLanguage(language)) rememberLanguage(language);
}

// The seed is only worth storing when the URL named it. On an unprefixed
// URL the seed is the *default* language, not a choice the visitor made —
// storing it would quietly make every first visit German for good, and the
// redirect that follows would then read it back as a preference.
syncDocumentLanguage(urlNamesLanguage);
i18n.on("languageChanged", () => syncDocumentLanguage(true));

export default i18n;
