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
 * Seeded from the URL so the very first paint is already in the right
 * language — the alternative is a frame of German on `/en/prices`.
 */
const i18n = createI18nInstance(true, languageFromLocation(window.location.pathname));

function syncDocumentLanguage() {
  const language = i18n.resolvedLanguage ?? defaultLanguage;
  document.documentElement.lang = language;
  if (isSupportedLanguage(language)) rememberLanguage(language);
}

syncDocumentLanguage();
i18n.on("languageChanged", syncDocumentLanguage);

export default i18n;
