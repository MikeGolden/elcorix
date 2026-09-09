import { localizedPath, type SupportedLanguage } from "./i18n/routing";

/**
 * The landing page is a one-pager with anchor navigation, but the deep
 * routes (/prices, /gallery, …) reuse the same sections. A menu entry
 * therefore has to jump within the page on the home route and navigate to
 * the language's home page everywhere else.
 *
 * `pathname` is the full location — language segment included — because
 * that is what tells "am I on the home page" apart from "/de/prices".
 */
export function anchorHref(
  pathname: string,
  id: string,
  language: SupportedLanguage,
): string {
  const home = localizedPath(language);
  return pathname === home || pathname === `${home}/` ? `#${id}` : `${home}#${id}`;
}
