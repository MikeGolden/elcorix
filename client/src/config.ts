// Only non-translatable business data lives here; all user-visible copy
// (including the tagline) is in src/i18n/locales/*/common.json.
export const business = {
  name: "Kosmetic Füssen",
  // Placeholders — replace with the real owner and VAT id (required in the
  // German Impressum) before going live.
  owner: "Anna Musterfrau",
  vatId: "DE000000000",
  address: "Reichenstraße 1, 87629 Füssen, Germany",
  phone: "+49 8362 000000",
  email: "hello@kosmetic-fuessen.de",
  instagram: "https://instagram.com/kosmetic.fuessen",
  instagramHandle: "@kosmetic.fuessen",
  /**
   * WhatsApp deep link (digits only, international format, no "+").
   * Placeholder — must match the real business phone before going live.
   */
  whatsapp: "https://wa.me/498362000000",
  /**
   * Canonical production origin. Placeholder until the domain is live —
   * used for <link rel="canonical">, Open Graph URLs and JSON-LD. Keep
   * public/robots.txt and public/sitemap.xml in sync when changing it.
   */
  siteUrl: "https://kosmetic-fuessen.de",
  /** Approximate studio coordinates (Reichenstraße, Füssen) for the map. */
  geo: { latitude: 47.5709, longitude: 10.6986 },
  /**
   * Structured opening hours for schema.org JSON-LD (Google local search).
   * The human-readable string shown on the contact page stays translated
   * in common.json — keep the two in sync.
   */
  openingHours: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
    { days: ["Saturday"], opens: "10:00", closes: "14:00" },
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
