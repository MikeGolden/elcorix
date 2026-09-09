/**
 * Where each page lives now.
 *
 * This is the one thing the WordPress build changed on purpose: language
 * is part of the URL. German is the default and keeps the bare paths the
 * React site had; English and Ukrainian sit under a prefix. Every spec
 * imports from here rather than hard-coding a path, so the day somebody
 * turns the prefix off for a language, one file changes.
 */
export const de = {
  home: "/",
  prices: "/prices/",
  gallery: "/gallery/",
  booking: "/booking/",
  contact: "/contact/",
  privacy: "/privacy/",
  imprint: "/imprint/",
  terms: "/terms/",
  mission: "/mission/",
};

export const en = {
  home: "/en/",
  prices: "/en/prices/",
  gallery: "/en/gallery/",
  booking: "/en/booking/",
  contact: "/en/contact/",
  privacy: "/en/privacy/",
  imprint: "/en/imprint/",
  terms: "/en/terms/",
  mission: "/en/mission/",
};

export const uk = {
  home: "/uk/",
  prices: "/uk/prices/",
};
