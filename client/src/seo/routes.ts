/**
 * The site's indexable routes, in one place.
 *
 * Three things read this table and must never drift apart:
 *   - `src/App.tsx` — the router (every path here needs a <Route>),
 *   - `public/sitemap.xml` — the same URLs, with these changefreq values,
 *   - `vite/seoPrerender.ts` — writes one static HTML shell per entry.
 *
 * `src/test/staticMeta.test.ts` fails the build if the sitemap and this
 * table disagree, or if a metaKey has no translation.
 */
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
