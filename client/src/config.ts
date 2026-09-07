// Only non-translatable business data lives here; all user-visible copy
// is in src/i18n/locales/*/common.json.
export const business = {
  name: "elcorix",
  /** Legal name / owner — required in the German Impressum. */
  owner: "Elena Musterfrau",
  vatId: "DE000000000",
  address: "Bodmanstraße 14, 87435 Kempten (Allgäu), Germany",
  /** Short form used in the contact block, as in the Figma. */
  addressShort: "Bodmanstraße 14, Kempten",
  phone: "+49 155 625 14 872",
  email: "info@elcorix.com",
  instagram: "https://instagram.com/elcorix",
  instagramHandle: "@elcorix",
  /**
   * WhatsApp deep link (digits only, international format, no "+").
   * Must match the business phone above.
   */
  whatsapp: "https://wa.me/4915562514872",
  /**
   * Canonical production origin — used for <link rel="canonical">, Open
   * Graph URLs and JSON-LD. Keep public/robots.txt and public/sitemap.xml
   * in sync when changing it.
   */
  siteUrl: "https://elcorix.com",
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
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "19:00" },
    { days: ["Saturday"], opens: "09:00", closes: "15:00" },
  ],
  /**
   * Altegio booking page / widget.
   * Replace the company id with your real one from alteg.io
   * (Settings → Online booking → Booking link / widget).
   * Digits only: the id is interpolated into the booking/payment URL, so a
   * malformed value must never produce an unexpected host.
   */
  altegioCompanyId: sanitizeCompanyId(import.meta.env.VITE_ALTEGIO_COMPANY_ID),
} as const;

function sanitizeCompanyId(raw: string | undefined): string {
  return raw !== undefined && /^\d{1,12}$/.test(raw) ? raw : "000000";
}

export const altegioBookingUrl = `https://n${business.altegioCompanyId}.alteg.io`;

/** `tel:` href without the spaces the display format carries. */
export const telHref = `tel:${business.phone.replace(/\s/g, "")}`;
