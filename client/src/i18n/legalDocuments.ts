import type { SupportedLanguage } from "./routing";
import type germanLegal from "./locales/de/legal.json";

/**
 * The bodies of the three contract documents (AGB, Terminbedingungen,
 * Paketbedingungen), one `legal.json` per language.
 *
 * Deliberately NOT part of the i18next `common` resources:
 *   - weight — together they are ~34 kB gzipped, a third of the main chunk,
 *     and only the three legal pages need them, so each language is its own
 *     lazily loaded chunk (unlike the thin pages, see perf decisions);
 *   - types — nested arrays of paragraphs inside the typed `common`
 *     resources push react-i18next's key types past TypeScript's
 *     instantiation limit ("excessively deep").
 * Titles, the translation note and the footer labels stay in `common`.
 */
export type LegalDocuments = typeof germanLegal;
export type LegalDocumentKey = keyof LegalDocuments;

const loaders: Record<SupportedLanguage, () => Promise<LegalDocuments>> = {
  de: () => import("./locales/de/legal.json").then((module) => module.default),
  en: () => import("./locales/en/legal.json").then((module) => module.default),
  uk: () => import("./locales/uk/legal.json").then((module) => module.default),
  ru: () => import("./locales/ru/legal.json").then((module) => module.default),
};

const loaded = new Map<SupportedLanguage, LegalDocuments>();

/** Already-loaded documents for a language, or undefined. */
export function cachedLegalDocuments(language: SupportedLanguage): LegalDocuments | undefined {
  return loaded.get(language);
}

export async function loadLegalDocuments(language: SupportedLanguage): Promise<LegalDocuments> {
  const cached = loaded.get(language);
  if (cached) return cached;
  const documents = await loaders[language]();
  loaded.set(language, documents);
  return documents;
}
