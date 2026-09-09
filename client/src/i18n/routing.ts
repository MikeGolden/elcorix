/**
 * The mapping between URL and language.
 *
 * Every page of the site lives under a language segment — `/de/prices`,
 * `/en/prices`, `/uk/prices`, `/ru/prices` — so each translation has its own
 * address that
 * can be linked, shared, cached and indexed. Google crawls with
 * `Accept-Language: en-US`; with one URL per language it was indexing the
 * German site's English rendering, and there was no way to declare
 * hreflang alternates because there were no alternate URLs to declare.
 *
 * This module is deliberately free of React, i18next and the DOM: the
 * router, the meta tags, the Vite prerender plugin and the sitemap
 * generator all derive their URLs from it, so they cannot drift apart.
 */

/** Ordered as the language switcher lists them. */
export const supportedLanguages = ["en", "de", "uk", "ru"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

/** The business is in Kempten — German is what an undecided visitor gets. */
export const defaultLanguage: SupportedLanguage = "de";

/** localStorage key. Unchanged from the pre-routing switcher, so a returning
 *  visitor keeps the language they picked before this refactor. */
export const LANGUAGE_STORAGE_KEY = "i18nextLng";

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return (
    typeof value === "string" &&
    (supportedLanguages as readonly string[]).includes(value)
  );
}

/**
 * Reduces "de-AT", "uk-UA", "ru-RU", "en_GB" to a supported language, or
 * undefined.
 * Browsers and stored values both come in region-tagged forms.
 */
export function normalizeLanguage(value: string | undefined | null): SupportedLanguage | undefined {
  if (!value) return undefined;
  const base = value.toLowerCase().replace("_", "-").split("-")[0];
  return isSupportedLanguage(base) ? base : undefined;
}

/** "/prices" from "prices", "/" from "" — one shape for everything below. */
function withLeadingSlash(path: string): string {
  if (path === "" || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/** Drops a trailing slash, except on the root itself. */
export function normalizePath(path: string): string {
  const withSlash = withLeadingSlash(path);
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : "/";
}

/** `("de", "/prices")` → `"/de/prices"`; `("de", "/")` → `"/de"`. */
export function localizedPath(language: SupportedLanguage, path: string = "/"): string {
  const rest = normalizePath(path);
  return rest === "/" ? `/${language}` : `/${language}${rest}`;
}

export type LanguagePath = {
  language: SupportedLanguage;
  /** The route path without the language segment, always leading-slashed. */
  path: string;
};

/**
 * `"/de/prices"` → `{ language: "de", path: "/prices" }`.
 * `null` for anything not under a supported language segment — that is what
 * the router's catch-all redirect keys off.
 */
export function splitLanguagePath(pathname: string): LanguagePath | null {
  const [, first = "", ...rest] = normalizePath(pathname).split("/");
  if (!isSupportedLanguage(first)) return null;
  return { language: first, path: normalizePath(rest.join("/")) };
}

/**
 * BCP-47 language tag: "fr", "es-MX", "zh-Hans", "zh-Hans-CN". Deliberately
 * strict about the subtag shapes — a loose `(-[a-z0-9]+)*` also matches
 * ordinary slugs like "no-such-page", which would then be stripped down to
 * the home page instead of reaching the 404.
 */
const languageSegment = /^[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|[0-9]{3}))?$/i;

/**
 * The path to redirect to, with a *foreign* language segment removed.
 * A visitor landing on `/fr/prices` from an old link or a mistyped locale
 * wants the price list, not a 404 nested under a language they don't have —
 * so `/fr/prices` becomes `/prices` and then `/de/prices`. Paths that merely
 * look like a route (`/en-us-something`, `/prices`) are left alone.
 */
export function stripForeignLanguagePrefix(pathname: string): string {
  const path = normalizePath(pathname);
  const [, first = "", ...rest] = path.split("/");
  if (isSupportedLanguage(first) || !languageSegment.test(first)) return path;
  return normalizePath(rest.join("/"));
}

/**
 * First supported language among the candidates, else German.
 * Callers pass the stored choice first, then `navigator.languages`.
 */
export function pickLanguage(candidates: readonly (string | undefined | null)[]): SupportedLanguage {
  for (const candidate of candidates) {
    const language = normalizeLanguage(candidate);
    if (language) return language;
  }
  return defaultLanguage;
}

function storedLanguage(): string | undefined {
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? undefined;
  } catch {
    // Safari in private mode throws on localStorage access.
    return undefined;
  }
}

/**
 * What an unprefixed URL should redirect to: the visitor's stored choice,
 * then their browser languages, then German. Used only when the URL itself
 * does not name a language — once it does, the URL wins.
 */
export function detectPreferredLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return defaultLanguage;
  return pickLanguage([
    storedLanguage(),
    ...(window.navigator.languages ?? []),
    window.navigator.language,
  ]);
}

export function rememberLanguage(language: SupportedLanguage): void {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage denied — the URL still carries the language, so this is
    // only about remembering it for the next unprefixed visit.
  }
}

/** The language of the current document, for the initial i18next `lng`. */
export function languageFromLocation(pathname: string): SupportedLanguage {
  return splitLanguagePath(pathname)?.language ?? detectPreferredLanguage();
}
