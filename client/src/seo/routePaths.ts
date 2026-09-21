/**
 * Translating between the canonical route path the code speaks in and the
 * localized URL the visitor sees.
 *
 * `seo/routes.ts` names every page by a canonical, language-less path
 * (`/prices`) and lists the slug that page has in each language
 * (`/preise`, `/prices`, `/ціни`, `/цены`). Everything that builds a URL —
 * the router, `LocalizedLink`, the canonical and hreflang tags, the
 * sitemap, the prerendered shells — goes through this module, so a slug is
 * changed in exactly one place.
 *
 * ## Encoded or decoded
 *
 * The Ukrainian and Russian slugs are non-ASCII, and that splits the
 * output in two:
 *
 *   - **Encoded** (`/uk/%D1%86%D1%96%D0%BD%D0%B8`) is what goes out into
 *     the world: links, `<Navigate>` targets, canonicals, hreflang and
 *     sitemap URLs. It is the form a crawler, a log line and a `curl` all
 *     agree on, and the form `window.location.pathname` reports; browsers
 *     display it decoded in the address bar.
 *   - **Decoded** (`/uk/ціни`) is what route patterns and files use.
 *     React Router decodes the pathname before matching, so a `<Route>`
 *     must carry the real UTF-8 slug (`src/test/App.test.tsx` covers both
 *     URL forms); nginx likewise decodes the request URI before
 *     `try_files`, so the prerendered shell lives at a directory whose
 *     name is that same slug.
 */
import {
  localizedPath,
  normalizePath,
  type SupportedLanguage,
} from "../i18n/routing";
import { legacyPaths, siteRoutes, type SiteRoute } from "./routes";

/** `/для-кого/контур-бороди` → `/%D0%B4%D0%BB%D1%8F.../...`. */
export function encodePath(path: string): string {
  return normalizePath(path)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/** The inverse. Safe on an already-decoded path. */
export function decodePath(path: string): string {
  return normalizePath(path)
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        // A stray "%" in a hand-typed URL — leave the segment alone
        // rather than throwing inside a render.
        return segment;
      }
    })
    .join("/");
}

function routeFor(canonicalPath: string): SiteRoute | undefined {
  const path = normalizePath(canonicalPath);
  return siteRoutes.find((route) => route.path === path);
}

/** The slug of a canonical path in one language, decoded: `/preise`. */
export function slugFor(language: SupportedLanguage, canonicalPath: string): string {
  return routeFor(canonicalPath)?.slugs[language] ?? normalizePath(canonicalPath);
}

/** Splits `/prices#packages` into its path and everything after it. */
function splitSuffix(path: string): [string, string] {
  const index = path.search(/[?#]/);
  return index === -1 ? [path, ""] : [path.slice(0, index), path.slice(index)];
}

/**
 * The URL of a canonical path in one language, ready for the browser:
 * `("uk", "/prices")` → `/uk/%D1%86%D1%96%D0%BD%D0%B8`.
 *
 * A query or hash is carried through untouched — every anchor link on the
 * site arrives here as `/prices#prices-packages-women` — and a path that
 * is not in the route table is prefixed unchanged, so this is safe to
 * apply to anything that starts with "/".
 */
export function localizedRoutePath(
  language: SupportedLanguage,
  canonicalPath: string = "/",
): string {
  const [path, suffix] = splitSuffix(canonicalPath);
  return encodePath(localizedPath(language, slugFor(language, path))) + suffix;
}

/** The same URL with the slug left as UTF-8 — for file paths on disk. */
export function localizedRouteFilePath(
  language: SupportedLanguage,
  canonicalPath: string = "/",
): string {
  return localizedPath(language, slugFor(language, canonicalPath));
}

/**
 * The inverse of `slugFor`: the canonical path a served slug belongs to,
 * or `null` when nothing matches. Accepts the encoded or the decoded form.
 */
export function canonicalPathFor(
  language: SupportedLanguage,
  slug: string,
): string | null {
  const decoded = decodePath(slug);
  return siteRoutes.find((route) => route.slugs[language] === decoded)?.path ?? null;
}

/**
 * Paths that must keep working after a slug change: the English slug every
 * language used to share, and `/privacy`. Each becomes a redirect to the
 * language's current URL — except where the old path *is* the current slug
 * (every English route, `/de/datenschutz`), which would be a loop.
 *
 * `from` is relative to the language segment and encoded, so it can be
 * handed straight to a `<Route path>`; `to` is a full, encoded URL path.
 */
export type LegacyRedirect = { from: string; to: string };

export function legacyRedirects(
  language: SupportedLanguage,
  routes: readonly SiteRoute[] = siteRoutes,
): LegacyRedirect[] {
  const served = new Set(routes.map((route) => route.slugs[language]));
  const seen = new Set<string>();
  const redirects: LegacyRedirect[] = [];

  for (const { from, to } of legacyPaths) {
    const target = routes.find((route) => route.path === normalizePath(to));
    if (!target) continue; // behind an off feature flag
    if (served.has(normalizePath(from))) continue; // already the real URL
    if (seen.has(from)) continue;
    seen.add(from);
    redirects.push({
      // Decoded, like the route patterns it is handed to.
      from: normalizePath(from).slice(1),
      to: localizedRoutePath(language, target.path),
    });
  }

  return redirects;
}
