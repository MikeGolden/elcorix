import i18next, { type i18n as I18n } from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en/common.json";
import de from "./locales/de/common.json";
import uk from "./locales/uk/common.json";

export const supportedLanguages = ["en", "de", "uk"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const resources = {
  en: { common: en },
  de: { common: de },
  uk: { common: uk },
} as const;

/**
 * Detection order: localStorage (i18nextLng) → browser language → German.
 * The business is in Füssen, so German is the default when nothing is
 * stored and the browser language is unsupported. English is the fallback
 * for individual missing keys (`fallbackLng`).
 */
export function createI18nInstance(bindReact = false): I18n {
  const instance = i18next.createInstance();

  const detector = new LanguageDetector();
  detector.addDetector({ name: "defaultToGerman", lookup: () => "de" });
  instance.use(detector);

  if (bindReact) instance.use(initReactI18next);

  void instance.init({
    resources,
    ns: ["common"],
    defaultNS: "common",
    fallbackLng: "en",
    supportedLngs: [...supportedLanguages],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    detection: {
      order: ["localStorage", "navigator", "defaultToGerman"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
    // Resources are bundled, no async backend — init synchronously so the
    // first render (and tests) never see a half-initialized instance.
    initAsync: false,
  });

  return instance;
}

const i18n = createI18nInstance(true);

function syncDocumentLanguage() {
  document.documentElement.lang = i18n.resolvedLanguage ?? "de";
}

syncDocumentLanguage();
i18n.on("languageChanged", syncDocumentLanguage);

export default i18n;
