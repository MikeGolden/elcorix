import type en from "./i18n/locales/en/common.json";

/**
 * Price list data taken from the elcorix Figma.
 *
 * Prices are non-translatable business data (numbers in EUR, formatted
 * per-locale at render time); the zone and package names live in the
 * translations under `prices.women.*`, `prices.men.*` and
 * `prices.packages.*` — the types below are derived from the English
 * resource, so a key without a translation is a compile error.
 */
type Prices = (typeof en)["prices"];

export type ZoneKey<G extends "women" | "men"> = keyof Prices[G] & string;

export type ZonePrice<G extends "women" | "men"> = {
  key: ZoneKey<G>;
  price: number;
};

/** "Leistungen für Frauen" */
export const womenPrices: ZonePrice<"women">[] = [
  { key: "upperLip", price: 39 },
  { key: "chin", price: 39 },
  { key: "underarms", price: 59 },
  { key: "bikiniClassic", price: 59 },
  { key: "intimateComplete", price: 99 },
  { key: "armsFull", price: 109 },
  { key: "lowerLegs", price: 109 },
  { key: "legsFull", price: 189 },
];

/** "Leistungen für Männer" */
export const menPrices: ZonePrice<"men">[] = [
  { key: "beardContour", price: 59 },
  { key: "throat", price: 49 },
  { key: "neck", price: 49 },
  { key: "underarms", price: 69 },
  { key: "shoulders", price: 69 },
  { key: "chest", price: 89 },
  { key: "backFull", price: 119 },
  { key: "intimateComplete", price: 99 },
];

export type PackageKey = keyof Prices["packages"] & string;

export type PricePackage = {
  key: PackageKey;
  /** Single treatment, 6-session and 8-session package prices. */
  single: number;
  six: number;
  eight: number;
};

/** "Paketlösungen für Frauen" */
export const packages: PricePackage[] = [
  { key: "p1", single: 129, six: 619, eight: 759 },
  { key: "p2", single: 169, six: 809, eight: 999 },
  { key: "p3", single: 209, six: 999, eight: 1239 },
  { key: "p4", single: 249, six: 1199, eight: 1479 },
  { key: "p5", single: 319, six: 1529, eight: 1889 },
];

export function formatPrice(language: string, price: number): string {
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
