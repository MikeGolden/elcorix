/**
 * The site's indexable routes, in one place — language-less: each entry is
 * one page in every language, and `src/i18n/routing.ts` supplies the
 * segments (`/de/prices`, `/en/prices`, `/uk/prices`).
 *
 * Everything downstream is derived from this table, so nothing can drift:
 *   - `src/App.tsx` builds the router from it, once per language, and will
 *     not compile until a new entry has a page component,
 *   - `src/seo/sitemap.ts` emits routes × languages with their alternates,
 *   - `vite/seoPrerender.ts` writes one static HTML shell per pair.
 *
 * `src/test/sitemap.test.ts` and `src/test/staticMeta.test.ts` assert the
 * output, and fail if a metaKey has no translation.
 */
import type { Features } from "../features";
import type { ReasonKey } from "../images";

export type MetaKey =
  | "home"
  | "prices"
  | "gallery"
  | "booking"
  | "contact"
  | "privacy"
  | "imprint"
  | "terms"
  | "appointmentTerms"
  | "packageTerms"
  | "mission"
  | "forWhomConvenience"
  | "forWhomIrritation"
  | "forWhomShaving"
  | "forWhomBeard"
  | "notFound";

/**
 * One page per "Für wen ist es geeignet?" card on the landing page. The
 * slugs are English in every language, like the rest of the site's paths.
 * `convenience` is the overview article; the other three are the situations
 * that have a card of their own.
 */
export const forWhomRoutes: Record<ReasonKey, { path: string; metaKey: MetaKey }> = {
  convenience: { path: "/for-whom/laser-makes-life-easier", metaKey: "forWhomConvenience" },
  irritation: { path: "/for-whom/shaving-irritation", metaKey: "forWhomIrritation" },
  shaving: { path: "/for-whom/tired-of-shaving", metaKey: "forWhomShaving" },
  beard: { path: "/for-whom/beard-contour", metaKey: "forWhomBeard" },
};

export type SiteRoute = {
  /** Router path, exactly as declared in App.tsx. */
  path: string;
  /** Addresses `meta.<key>.title` / `.description` in the translations. */
  metaKey: MetaKey;
  changefreq: "weekly" | "monthly" | "yearly";
  priority: string;
  /**
   * Feature flag this route belongs to. A route with one is only served,
   * listed in the sitemap and prerendered while that flag is on — see
   * `publicRoutes` below.
   */
  feature?: keyof Features;
};

export const siteRoutes: readonly SiteRoute[] = [
  { path: "/", metaKey: "home", changefreq: "weekly", priority: "1.0" },
  { path: "/prices", metaKey: "prices", changefreq: "monthly", priority: "0.9" },
  {
    path: "/booking",
    metaKey: "booking",
    changefreq: "monthly",
    priority: "0.9",
    feature: "altegio",
  },
  { path: "/contact", metaKey: "contact", changefreq: "monthly", priority: "0.8" },
  { path: "/gallery", metaKey: "gallery", changefreq: "monthly", priority: "0.6" },
  { path: "/mission", metaKey: "mission", changefreq: "yearly", priority: "0.4" },
  ...Object.values(forWhomRoutes).map(
    ({ path, metaKey }): SiteRoute => ({ path, metaKey, changefreq: "monthly", priority: "0.7" }),
  ),
  { path: "/terms", metaKey: "terms", changefreq: "yearly", priority: "0.2" },
  {
    path: "/appointment-terms",
    metaKey: "appointmentTerms",
    changefreq: "yearly",
    priority: "0.2",
  },
  { path: "/package-terms", metaKey: "packageTerms", changefreq: "yearly", priority: "0.2" },
  { path: "/datenschutz", metaKey: "privacy", changefreq: "yearly", priority: "0.2" },
  { path: "/imprint", metaKey: "imprint", changefreq: "yearly", priority: "0.2" },
] as const;

/**
 * The routes actually served for a given set of flags. `siteRoutes` stays
 * the complete table — the translations, the page component and the meta
 * entries of a flagged-off route all stay in the tree — but the router,
 * the sitemap and the prerendered shells are built from this, so a hidden
 * route is not reachable, not indexed and not linked.
 */
export function publicRoutes(features: Features): readonly SiteRoute[] {
  return siteRoutes.filter((route) => route.feature === undefined || features[route.feature]);
}
