import de from "../i18n/locales/de/common.json";
import en from "../i18n/locales/en/common.json";
import uk from "../i18n/locales/uk/common.json";
import ru from "../i18n/locales/ru/common.json";
import { staticBusiness } from "../business";
import { defaultLanguage, type SupportedLanguage } from "../i18n/routing";
import {
  alternateLinks,
  canonicalUrl,
  composeTitle,
  ogAlternateLocales,
  ogLocaleFor,
} from "./meta";
import type { SiteRoute } from "./routes";

/**
 * Build-time <head> generation for `vite/seoPrerender.ts`.
 *
 * Everything here is plain string work over the German translations and
 * `staticBusiness` — no DOM, no environment — so the Vite config can
 * import it and `staticMeta.test.ts` can assert on the output.
 *
 * One shell per language per route: `/de/prices`, `/en/prices` and
 * `/uk/prices` and `/ru/prices` are four URLs, so each gets its own head, in its own
 * language, declaring the other two as hreflang alternates. (Before the
 * language segments existed, they all shared one URL and the shell could
 * only be German — which is how Google, crawling with
 * `Accept-Language: en-US`, ended up indexing the German site in English.)
 *
 * The unprefixed `index.html` that nginx falls back to carries the German
 * home page's head, pointing its canonical at `/de` — a visitor arriving
 * there is redirected to their own language by the router.
 */

/** Translations addressed by language, for the head of each shell. */
const translations = { de, en, uk, ru } as const;

export const SEO_BLOCK_START = "<!--seo:start-->";
export const SEO_BLOCK_END = "<!--seo:end-->";

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * `</script>` inside a JSON string would close the tag it sits in, so the
 * "<" is escaped as a JSON unicode escape — still valid JSON, inert HTML.
 */
function embedJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** schema.org LocalBusiness data for Google's local results. */
export function localBusinessJsonLd(altegioBookingUrl: string): Record<string, unknown> {
  const [street, cityLine] = staticBusiness.address.split(", ");
  const [postalCode, ...cityParts] = (cityLine ?? "").split(" ");
  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: staticBusiness.name,
    url: staticBusiness.siteUrl,
    image: `${staticBusiness.siteUrl}/images/hero.jpg`,
    telephone: staticBusiness.phone,
    email: staticBusiness.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: street,
      postalCode,
      addressLocality: cityParts.join(" "),
      addressCountry: "DE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: staticBusiness.geo.latitude,
      longitude: staticBusiness.geo.longitude,
    },
    openingHoursSpecification: staticBusiness.openingHours.map((slot) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [...slot.days],
      opens: slot.opens,
      closes: slot.closes,
    })),
    sameAs: [staticBusiness.instagram],
    potentialAction: {
      "@type": "ReserveAction",
      target: altegioBookingUrl,
    },
  };
}

export type RouteHead = {
  title: string;
  description: string;
  canonical: string;
};

export function routeHead(
  route: SiteRoute,
  language: SupportedLanguage = defaultLanguage,
): RouteHead {
  const meta = translations[language].meta[route.metaKey];
  return {
    title: composeTitle(route.path, meta.title),
    description: meta.description,
    canonical: canonicalUrl(language, route.path),
  };
}

/**
 * The whole per-route part of <head>, wrapped in markers so that the
 * prerender step can swap it out of the built index.html for every other
 * route without re-parsing the document.
 */
export function seoBlock(
  route: SiteRoute,
  language: SupportedLanguage,
  altegioBookingUrl: string,
  { noindex = false }: { noindex?: boolean } = {},
): string {
  const head = routeHead(route, language);
  const lines = [
    `<title>${escapeAttribute(head.title)}</title>`,
    `<meta name="description" content="${escapeAttribute(head.description)}" />`,
    // The 404 document is served under every unknown URL there is. A
    // canonical or an hreflang set would invite Google to index one of
    // them; `noindex` is the whole point of giving it its own shell.
    ...(noindex
      ? ['<meta name="robots" content="noindex, follow" />']
      : [
          `<link rel="canonical" href="${head.canonical}" />`,
          ...alternateLinks(route.path).map(
            (alternate) =>
              `<link rel="alternate" hreflang="${alternate.hreflang}" href="${alternate.href}" />`,
          ),
        ]),
    `<meta property="og:title" content="${escapeAttribute(head.title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(head.description)}" />`,
    ...(noindex ? [] : [`<meta property="og:url" content="${head.canonical}" />`]),
    `<meta property="og:locale" content="${ogLocaleFor(language)}" />`,
    ...ogAlternateLocales(language).map(
      (locale) => `<meta property="og:locale:alternate" content="${locale}" />`,
    ),
    `<script type="application/ld+json">${embedJson(
      localBusinessJsonLd(altegioBookingUrl),
    )}</script>`,
  ];
  return [SEO_BLOCK_START, ...lines, SEO_BLOCK_END].join("\n    ");
}

/** True once `injectSeoBlock` has run on this HTML. */
export function hasSeoBlock(html: string): boolean {
  return html.includes(SEO_BLOCK_START) && html.includes(SEO_BLOCK_END);
}

export function injectSeoBlock(html: string, block: string): string {
  if (!html.includes("</head>")) {
    throw new Error("index.html has no </head> to inject the SEO block into");
  }
  return html.replace("</head>", `  ${block}\n  </head>`);
}

/** Swaps an already-injected block for another route's. */
export function replaceSeoBlock(html: string, block: string): string {
  if (!hasSeoBlock(html)) {
    throw new Error("index.html carries no SEO block to replace");
  }
  const pattern = new RegExp(`${SEO_BLOCK_START}[\\s\\S]*?${SEO_BLOCK_END}`);
  return html.replace(pattern, block);
}
