/**
 * The site's indexable routes, in one place.
 *
 * Each entry has a canonical `path` — the language-less identifier used
 * everywhere in the code — and a `slugs` map giving the URL segment that
 * path has in each language: `/prices` is `/de/preise`, `/en/prices`,
 * `/uk/ціни`, `/ru/цены`. The canonical path is never served; it only
 * names the page. `src/seo/routePaths.ts` translates between the two.
 *
 * Everything downstream is derived from this table, so nothing can drift:
 *   - `src/App.tsx` builds the router from it, once per language, and will
 *     not compile until a new entry has a page component,
 *   - `src/seo/sitemap.ts` emits routes × languages with their alternates,
 *   - `vite/seoPrerender.ts` writes one static HTML shell per pair.
 *
 * `src/test/sitemap.test.ts`, `src/test/routePaths.test.ts` and
 * `src/test/staticMeta.test.ts` assert the output, and fail if a metaKey
 * has no translation or a route has no slug in some language.
 */
import type { SupportedLanguage } from "../i18n/routing";
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
 * The URL of one page in each language, leading-slashed and *decoded*:
 * the Cyrillic slugs are written as they read, and percent-encoded on the
 * way into a URL by `routePaths.ts`.
 *
 * Slugs follow the language's own search habits rather than the page
 * title — "preise" over "preisliste" — because the segment is a ranking
 * signal and a breadcrumb, not a heading.
 */
export type RouteSlugs = Record<SupportedLanguage, string>;

/**
 * One page per "Für wen ist es geeignet?" card on the landing page.
 * `convenience` is the overview article; the other three are the
 * situations that have a card of their own.
 */
export const forWhomRoutes: Record<
  ReasonKey,
  { path: string; metaKey: MetaKey; slugs: RouteSlugs }
> = {
  convenience: {
    path: "/for-whom/laser-makes-life-easier",
    metaKey: "forWhomConvenience",
    slugs: {
      de: "/fuer-wen/laser-erleichtert-den-alltag",
      en: "/for-whom/laser-makes-life-easier",
      uk: "/для-кого/лазер-полегшує-життя",
      ru: "/для-кого/лазер-облегчает-жизнь",
    },
  },
  irritation: {
    path: "/for-whom/shaving-irritation",
    metaKey: "forWhomIrritation",
    slugs: {
      de: "/fuer-wen/hautirritationen-nach-der-rasur",
      en: "/for-whom/shaving-irritation",
      uk: "/для-кого/подразнення-після-гоління",
      ru: "/для-кого/раздражение-после-бритья",
    },
  },
  shaving: {
    path: "/for-whom/tired-of-shaving",
    metaKey: "forWhomShaving",
    slugs: {
      de: "/fuer-wen/staendiges-rasieren-satt",
      en: "/for-whom/tired-of-shaving",
      uk: "/для-кого/втомилися-голитися",
      ru: "/для-кого/устали-бриться",
    },
  },
  beard: {
    path: "/for-whom/beard-contour",
    metaKey: "forWhomBeard",
    slugs: {
      de: "/fuer-wen/klare-bartkontur",
      en: "/for-whom/beard-contour",
      uk: "/для-кого/контур-бороди",
      ru: "/для-кого/контур-бороды",
    },
  },
};

export type SiteRoute = {
  /** Canonical, language-less identifier for the page. Never served. */
  path: string;
  /** The served segment in each language, decoded and leading-slashed. */
  slugs: RouteSlugs;
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

const root: RouteSlugs = { de: "/", en: "/", uk: "/", ru: "/" };

export const siteRoutes: readonly SiteRoute[] = [
  { path: "/", slugs: root, metaKey: "home", changefreq: "weekly", priority: "1.0" },
  {
    path: "/prices",
    slugs: { de: "/preise", en: "/prices", uk: "/ціни", ru: "/цены" },
    metaKey: "prices",
    changefreq: "monthly",
    priority: "0.9",
  },
  {
    path: "/booking",
    slugs: { de: "/termin-vereinbaren", en: "/booking", uk: "/запис", ru: "/запись" },
    metaKey: "booking",
    changefreq: "monthly",
    priority: "0.9",
    feature: "altegio",
  },
  {
    path: "/contact",
    slugs: { de: "/kontakt", en: "/contact", uk: "/контакти", ru: "/контакты" },
    metaKey: "contact",
    changefreq: "monthly",
    priority: "0.8",
  },
  {
    path: "/gallery",
    slugs: { de: "/galerie", en: "/gallery", uk: "/галерея", ru: "/галерея" },
    metaKey: "gallery",
    changefreq: "monthly",
    priority: "0.6",
  },
  {
    path: "/mission",
    slugs: { de: "/leitbild", en: "/mission", uk: "/принципи", ru: "/принципы" },
    metaKey: "mission",
    changefreq: "yearly",
    priority: "0.4",
  },
  ...Object.values(forWhomRoutes).map(
    ({ path, metaKey, slugs }): SiteRoute => ({
      path,
      slugs,
      metaKey,
      changefreq: "monthly",
      priority: "0.7",
    }),
  ),
  {
    path: "/terms",
    slugs: { de: "/agb", en: "/terms", uk: "/умови", ru: "/условия" },
    metaKey: "terms",
    changefreq: "yearly",
    priority: "0.2",
  },
  {
    path: "/appointment-terms",
    slugs: {
      de: "/terminbedingungen",
      en: "/appointment-terms",
      uk: "/умови-запису",
      ru: "/условия-записи",
    },
    metaKey: "appointmentTerms",
    changefreq: "yearly",
    priority: "0.2",
  },
  {
    path: "/package-terms",
    slugs: {
      de: "/paketbedingungen",
      en: "/package-terms",
      uk: "/умови-пакетів",
      ru: "/условия-пакетов",
    },
    metaKey: "packageTerms",
    changefreq: "yearly",
    priority: "0.2",
  },
  {
    path: "/datenschutz",
    slugs: {
      de: "/datenschutz",
      en: "/privacy",
      uk: "/конфіденційність",
      ru: "/конфиденциальность",
    },
    metaKey: "privacy",
    changefreq: "yearly",
    priority: "0.2",
  },
  {
    path: "/imprint",
    slugs: {
      de: "/impressum",
      en: "/imprint",
      uk: "/вихідні-дані",
      ru: "/выходные-данные",
    },
    metaKey: "imprint",
    changefreq: "yearly",
    priority: "0.2",
  },
] as const;

/**
 * The document nginx returns for an unknown URL. It is deliberately *not*
 * in `siteRoutes`: it has no URL of its own, no canonical and no hreflang
 * set, it is never linked and never listed in the sitemap — it is only the
 * body of a 404 response, and `seoBlock` marks it `noindex`.
 */
export const notFoundRoute: SiteRoute = {
  path: "/404",
  slugs: { de: "/404", en: "/404", uk: "/404", ru: "/404" },
  metaKey: "notFound",
  changefreq: "yearly",
  priority: "0.0",
};

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

/**
 * Paths the site used to serve and still receives links for: the English
 * slugs every language shared before this table gained `slugs`, plus
 * `/privacy`, which was the privacy policy's address before it became
 * `/datenschutz`. `routePaths.ts` turns these into per-language redirects.
 */
export const legacyPaths: readonly { from: string; to: string }[] = [
  ...siteRoutes.map((route) => ({ from: route.path, to: route.path })),
  { from: "/privacy", to: "/datenschutz" },
];
