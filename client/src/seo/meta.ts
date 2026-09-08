import { staticBusiness } from "../business";

/**
 * Title/canonical/locale rules shared by the two places that emit page
 * metadata: `usePageMeta` at runtime and `staticHead` at build time. They
 * must agree — a mismatch means the tag a crawler reads is replaced by a
 * different one the moment React mounts.
 */

/** "elcorix — <page>" on the landing page, "<page> — elcorix" elsewhere. */
export function composeTitle(pathname: string, pageTitle: string): string {
  return pathname === "/"
    ? `${staticBusiness.name} — ${pageTitle}`
    : `${pageTitle} — ${staticBusiness.name}`;
}

export function canonicalUrl(pathname: string): string {
  return `${staticBusiness.siteUrl}${pathname === "/" ? "/" : pathname}`;
}

/**
 * Open Graph wants language_TERRITORY, not a bare language subtag — a
 * plain "de" is silently ignored by the scrapers that read it.
 */
const ogLocales: Record<string, string> = {
  de: "de_DE",
  en: "en_GB",
  uk: "uk_UA",
};

export function ogLocaleFor(language: string | undefined): string {
  return ogLocales[(language ?? "de").split("-")[0]] ?? "de_DE";
}
