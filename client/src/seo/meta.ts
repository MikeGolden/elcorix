import { staticBusiness } from "../business";
import {
  defaultLanguage,
  localizedPath,
  normalizePath,
  supportedLanguages,
  type SupportedLanguage,
} from "../i18n/routing";

/**
 * Title/canonical/locale rules shared by the two places that emit page
 * metadata: `usePageMeta` at runtime and `staticHead` at build time. They
 * must agree — a mismatch means the tag a crawler reads is replaced by a
 * different one the moment React mounts.
 *
 * Every function here takes the *language-less* route path ("/", "/prices")
 * plus a language, because that pair is what a URL is made of now.
 */

export function isHomePath(path: string): boolean {
  return normalizePath(path) === "/";
}

/** "elcorix — <page>" on the landing page, "<page> — elcorix" elsewhere. */
export function composeTitle(path: string, pageTitle: string): string {
  return isHomePath(path)
    ? `${staticBusiness.name} — ${pageTitle}`
    : `${pageTitle} — ${staticBusiness.name}`;
}

/** Absolute URL of one page in one language: https://elcorix.de/de/prices */
export function canonicalUrl(language: SupportedLanguage, path: string): string {
  return `${staticBusiness.siteUrl}${localizedPath(language, path)}`;
}

export type AlternateLink = { hreflang: string; href: string };

/**
 * The hreflang set for a page: one entry per language plus `x-default`.
 *
 * This is the point of language-prefixed URLs. Google crawls with
 * `Accept-Language: en-US`, so while every language shared one URL the
 * German site was indexed in its English rendering and there was no second
 * URL to point at. `x-default` goes to German — the shop is in Kempten, and
 * that is also where an unprefixed URL redirects a visitor with no
 * preference.
 */
export function alternateLinks(path: string): AlternateLink[] {
  return [
    ...supportedLanguages.map((language) => ({
      hreflang: language,
      href: canonicalUrl(language, path),
    })),
    { hreflang: "x-default", href: canonicalUrl(defaultLanguage, path) },
  ];
}

/**
 * Open Graph wants language_TERRITORY, not a bare language subtag — a
 * plain "de" is silently ignored by the scrapers that read it.
 */
const ogLocales: Record<string, string> = {
  de: "de_DE",
  en: "en_GB",
  uk: "uk_UA",
  ru: "ru_RU",
};

export function ogLocaleFor(language: string | undefined): string {
  return ogLocales[(language ?? defaultLanguage).split("-")[0]] ?? "de_DE";
}

/** The other languages, as og:locale:alternate values. */
export function ogAlternateLocales(language: SupportedLanguage): string[] {
  return supportedLanguages
    .filter((other) => other !== language)
    .map((other) => ogLocaleFor(other));
}
