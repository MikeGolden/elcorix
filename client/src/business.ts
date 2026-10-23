/**
 * Static business data — no environment access, no runtime imports.
 *
 * Split out of `config.ts` so that build-time tooling can read it:
 * `vite/seoPrerender.ts` imports this module while Vite is bundling its
 * own config, where `import.meta.env` does not exist. Anything that
 * depends on an environment variable stays in `config.ts`.
 *
 * Only non-translatable data belongs here; all user-visible copy is in
 * the i18n resources under `src/i18n/locales`.
 */
export const staticBusiness = {
  name: "elcorix",
  /**
   * Legal name of the owner, trading as ELCORIX — required in the German
   * Impressum. No VAT ID listed yet. The AGB of 15.09.2026 describe the
   * small-business scheme (§ 19 UStG), but the price sheet of 2026-10-22
   * states prices "inklusive 19 % MwSt." — if the studio is now
   * VAT-registered, its USt-IdNr belongs in the Impressum.
   */
  owner: "Ian Kipenko",
  address: "Bodmanstraße 14, 87435 Kempten (Allgäu), Germany",
  /** Short form used in the contact block, as in the Figma. */
  addressShort: "Bodmanstraße 14, Kempten",
  phone: "+49 155 625 14 872",
  email: "info@elcorix.de",
  instagram: "https://www.instagram.com/elcorix.de",
  instagramHandle: "@elcorix.de",
  /** The Facebook page has no username, only its numeric id. */
  facebook: "https://www.facebook.com/61595256750262",
  /** Link text for the Facebook page — the page name, since there is no handle. */
  facebookLabel: "elcorix",
  /**
   * WhatsApp deep link (digits only, international format, no "+").
   * Must match the business phone above.
   */
  whatsapp: "https://wa.me/4915562514872",
  /**
   * Canonical production origin — used for <link rel="canonical">, Open
   * Graph URLs and JSON-LD. Keep public/robots.txt in sync when changing it
   * (sitemap.xml is generated from this value — see src/seo/sitemap.ts).
   */
  siteUrl: "https://elcorix.de",
  /**
   * Studio coordinates for the map and the JSON-LD — the Bodmanstraße 14
   * building itself (OSM way/112674650, geocoded via Nominatim).
   */
  geo: { latitude: 47.72538, longitude: 10.30913 },
  /**
   * Structured opening hours for schema.org JSON-LD (Google local search).
   * The human-readable strings shown in the contact section stay
   * translated in common.json — keep the two in sync.
   */
  openingHours: [
    {
      days: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "19:00",
    },
  ],
} as const;

/**
 * The studio's Altegio booking pages (2026-10-23). `general` is the start
 * page; the other three open the service list with that one service
 * already chosen and its price in the footer bar ("1 Dienstleistung ·
 * 129 € · Fortsetzen"). Used as the iframe source on /booking and as the
 * new-tab fallback link.
 *
 * `select-services`, not the `select-master` links the studio sent: those
 * bounce to the start page and hang on a spinner (checked in Chromium on
 * 2026-10-23, in and outside an iframe). Each `s…` id must stay in step
 * with the price shown next to its button — firstVisitOffers and the beard
 * contour zone in pricing.ts; AltegioLinks.test.tsx pins both.
 */
const altegioServices = "https://n1463826.alteg.io/company/1390972/personal/select-services";

export const altegioLinks = {
  general: "https://n1463826.alteg.io",
  /** Smooth Duo – Ersttermin, 129 €. */
  firstVisitWomen: `${altegioServices}?o=s13920267`,
  /** Clear Back – Ersttermin, 159 €. */
  firstVisitMen: `${altegioServices}?o=s13920268`,
  /** Bartkontur, 59 €. */
  beardContour: `${altegioServices}?o=s13859238`,
} as const;

export type AltegioService = keyof typeof altegioLinks;

/** `?service=` on /booking is visitor input: only the four keys above count. */
export function parseAltegioService(raw: string | null): AltegioService {
  return raw !== null && Object.hasOwn(altegioLinks, raw) ? (raw as AltegioService) : "general";
}
