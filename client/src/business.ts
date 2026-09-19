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
   * Impressum. No VAT ID: the studio uses the small-business scheme
   * (§ 19 UStG), as the AGB of 15.09.2026 state.
   */
  owner: "Ian Kipenko",
  address: "Bodmanstraße 14, 87435 Kempten (Allgäu), Germany",
  /** Short form used in the contact block, as in the Figma. */
  addressShort: "Bodmanstraße 14, Kempten",
  phone: "+49 155 625 14 872",
  email: "info@elcorix.de",
  instagram: "https://instagram.com/elcorix",
  instagramHandle: "@elcorix",
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
 * Altegio company id from the environment, or "000000" when it is unset or
 * malformed. Digits only: the id is interpolated into the booking/payment
 * URL, so a malformed value must never produce an unexpected host.
 *
 * Replace the id with your real one from alteg.io
 * (Settings → Online booking → Booking link / widget).
 */
export function sanitizeCompanyId(raw: string | undefined): string {
  return raw !== undefined && /^\d{1,12}$/.test(raw) ? raw : "000000";
}

export function altegioBookingUrlFor(companyId: string): string {
  return `https://n${companyId}.alteg.io`;
}
