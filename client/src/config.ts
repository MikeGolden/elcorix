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
