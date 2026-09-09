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

export type MetaKey =
  | "home"
  | "prices"
  | "gallery"
  | "booking"
  | "contact"
  | "privacy"
  | "imprint"
  | "terms"
  | "mission"
  | "notFound";

export type SiteRoute = {
  /** Router path, exactly as declared in App.tsx. */
  path: string;
  /** Addresses `meta.<key>.title` / `.description` in the translations. */
  metaKey: MetaKey;
  changefreq: "weekly" | "monthly" | "yearly";
  priority: string;
};

export const siteRoutes: readonly SiteRoute[] = [
  { path: "/", metaKey: "home", changefreq: "weekly", priority: "1.0" },
  { path: "/prices", metaKey: "prices", changefreq: "monthly", priority: "0.9" },
  { path: "/booking", metaKey: "booking", changefreq: "monthly", priority: "0.9" },
  { path: "/contact", metaKey: "contact", changefreq: "monthly", priority: "0.8" },
  { path: "/gallery", metaKey: "gallery", changefreq: "monthly", priority: "0.6" },
  { path: "/mission", metaKey: "mission", changefreq: "yearly", priority: "0.4" },
  { path: "/terms", metaKey: "terms", changefreq: "yearly", priority: "0.2" },
  { path: "/privacy", metaKey: "privacy", changefreq: "yearly", priority: "0.2" },
  { path: "/imprint", metaKey: "imprint", changefreq: "yearly", priority: "0.2" },
] as const;
