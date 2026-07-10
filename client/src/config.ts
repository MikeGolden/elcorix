// Only non-translatable business data lives here; all user-visible copy
// (including the tagline) is in src/i18n/locales/*/common.json.
export const business = {
  name: "Kosmetic Füssen",
  address: "Reichenstraße 1, 87629 Füssen, Germany",
  phone: "+49 8362 000000",
  email: "hello@kosmetic-fuessen.de",
  instagram: "https://instagram.com/kosmetic.fuessen",
  instagramHandle: "@kosmetic.fuessen",
  /**
   * Altegio booking page / widget.
   * Replace the company id with your real one from alteg.io
   * (Settings → Online booking → Booking link / widget).
   */
  altegioCompanyId: import.meta.env.VITE_ALTEGIO_COMPANY_ID ?? "000000",
} as const;

export const altegioBookingUrl = `https://n${business.altegioCompanyId}.alteg.io`;
