import de from "../i18n/locales/de/common.json";
import { staticBusiness } from "../business";
import { canonicalUrl, composeTitle, ogLocaleFor } from "./meta";
import type { SiteRoute } from "./routes";

/**
 * Build-time <head> generation for `vite/seoPrerender.ts`.
 *
 * Everything here is plain string work over the German translations and
 * `staticBusiness` — no DOM, no environment — so the Vite config can
 * import it and `staticMeta.test.ts` can assert on the output.
 *
 * German, deliberately: the three languages share one URL, so a static
 * shell can only carry one of them, and the market is Kempten. Once a
 * visitor's browser runs the bundle, `usePageMeta` replaces these tags
 * with their chosen language.
 */

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

export function routeHead(route: SiteRoute): RouteHead {
  const meta = de.meta[route.metaKey];
  return {
    title: composeTitle(route.path, meta.title),
    description: meta.description,
    canonical: canonicalUrl(route.path),
  };
}

/**
 * The whole per-route part of <head>, wrapped in markers so that the
 * prerender step can swap it out of the built index.html for every other
 * route without re-parsing the document.
 */
export function seoBlock(route: SiteRoute, altegioBookingUrl: string): string {
  const head = routeHead(route);
  const lines = [
    `<title>${escapeAttribute(head.title)}</title>`,
    `<meta name="description" content="${escapeAttribute(head.description)}" />`,
    `<link rel="canonical" href="${head.canonical}" />`,
    `<meta property="og:title" content="${escapeAttribute(head.title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(head.description)}" />`,
    `<meta property="og:url" content="${head.canonical}" />`,
    `<meta property="og:locale" content="${ogLocaleFor("de")}" />`,
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
