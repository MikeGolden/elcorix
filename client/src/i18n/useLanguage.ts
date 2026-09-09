import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { anchorHref } from "../anchors";
import {
  defaultLanguage,
  isSupportedLanguage,
  localizedPath,
  splitLanguagePath,
  type SupportedLanguage,
} from "./routing";

/**
 * The language the current URL is under.
 *
 * The URL is the source of truth. The i18next value is only consulted for
 * the components rendered outside the language routes (header and footer
 * during the redirect from an unprefixed URL), where there is no segment
 * to read yet.
 */
export function useCurrentLanguage(): SupportedLanguage {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  const fromUrl = splitLanguagePath(pathname)?.language;
  if (fromUrl) return fromUrl;
  return isSupportedLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : defaultLanguage;
}

/** The route path without its language segment: "/prices", "/" on home. */
export function useUnlocalizedPath(): string {
  const { pathname } = useLocation();
  return splitLanguagePath(pathname)?.path ?? pathname;
}

/**
 * Prefixes an app path with the current language: `"/prices"` →
 * `"/de/prices"`. Anything that is not an app path — an anchor, a mailto:,
 * an absolute URL, a static file — is passed through untouched, so this is
 * safe to apply to any `to` value.
 */
export function useLocalizedPath(): (path: string) => string {
  const language = useCurrentLanguage();
  return useCallback(
    (path: string) => (path.startsWith("/") ? localizedPath(language, path) : path),
    [language],
  );
}

/**
 * `anchorHref` bound to the current location: `anchor("prices")` is
 * `"#prices"` on the home page and `"/de#prices"` anywhere else. The result
 * is already language-qualified, so it goes into a plain `<Link>`, not a
 * `<LocalizedLink>`.
 */
export function useAnchorHref(): (id: string) => string {
  const { pathname } = useLocation();
  const language = useCurrentLanguage();
  return useCallback((id: string) => anchorHref(pathname, id, language), [pathname, language]);
}
