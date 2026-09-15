import type en from "./i18n/locales/en/common.json";

/**
 * Price list data taken from the elcorix Figma.
 *
 * Prices are non-translatable business data (numbers in EUR, formatted
 * per-locale at render time); the zone and package names live in the
 * translations under `prices.women.*`, `prices.men.*`,
 * `prices.packages.women.*` and `prices.packages.men.*` — the types below
 * are derived from the English resource, so a key without a translation is
 * a compile error.
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

export type PackageGroup = "women" | "men";

export type PackageKey<G extends PackageGroup> = keyof Prices["packages"][G] & string;

export type PricePackage<G extends PackageGroup> = {
  key: PackageKey<G>;
  /** Single treatment, 6-session and 8-session package prices. */
  single: number;
  six: number;
  eight: number;
};

/** "Kombinierte Pakete für Frauen" — the studio's own price sheet. */
export const womenPackages: PricePackage<"women">[] = [
  { key: "smoothDuo", single: 129, six: 619, eight: 759 },
  { key: "smoothLegs", single: 169, six: 809, eight: 999 },
  { key: "smoothTrio", single: 209, six: 999, eight: 1239 },
  { key: "smoothComplete", single: 249, six: 1199, eight: 1479 },
  { key: "bodyCompleteWoman", single: 319, six: 1529, eight: 1889 },
];

/** "Kombinierte Pakete für Männer" — the studio's own price sheet. */
export const menPackages: PricePackage<"men">[] = [
  { key: "clearBack", single: 119, six: 569, eight: 709 },
  { key: "strongTorso", single: 139, six: 669, eight: 819 },
  { key: "coolClean", single: 159, six: 759, eight: 939 },
  { key: "intimClean", single: 99, six: 479, eight: 589 },
  { key: "businessBody", single: 219, six: 1049, eight: 1299 },
  { key: "bodyCompleteMan", single: 349, six: 1679, eight: 2069 },
];

/**
 * What a package saves against paying for each session separately.
 *
 * Every figure the table prints is derived from the two prices in the row,
 * so the small print can never contradict the price next to it. Nothing is
 * rounded here: the handover sheet of 2026-09-14 prints the per-treatment
 * price to the cent ("103,17 € / Behandlung") and the saving to a tenth of a
 * point ("Sie sparen 155 € · 20,0 %"), so the rounding is left to the
 * formatters, which do it the way Intl does — half away from zero.
 */
export type PackageDeal = {
  total: number;
  /** Exact price per session: the package total divided by its sessions. */
  perTreatment: number;
  /** Exact euros saved against six or eight single treatments. */
  saved: number;
  /** That saving as a percentage of the undiscounted price, unrounded. */
  savedPercent: number;
};

export function packageDeal(single: number, sessions: number, total: number): PackageDeal {
  const undiscounted = single * sessions;
  const saved = undiscounted - total;
  return {
    total,
    perTreatment: total / sessions,
    saved,
    savedPercent: (saved / undiscounted) * 100,
  };
}

/**
 * Constructing an Intl.NumberFormat is expensive — it resolves locale data
 * on every call — and the price tables format 31 cells per render. Building
 * one formatter per language and reusing it turns that into 31 lookups.
 */
const formatters = new Map<string, Intl.NumberFormat>();

/**
 * `currencyDisplay: "narrowSymbol"` is load-bearing, not a nicety: Ukrainian
 * CLDR has no default symbol for the euro, so without it every price on the
 * Ukrainian pages reads "1 239 EUR" while German, English and Russian read
 * "1.239 €". It changes nothing in the other three locales.
 */
function euro(language: string, digits: number): Intl.NumberFormat {
  const cacheKey = `${language}:${digits}`;
  let formatter = formatters.get(cacheKey);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(language, {
      style: "currency",
      currency: "EUR",
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    formatters.set(cacheKey, formatter);
  }
  return formatter;
}

/** Whole euros: every price the studio actually charges is a round number. */
export function formatPrice(language: string, price: number): string {
  return euro(language, 0).format(price);
}

/**
 * To the cent — only for the per-treatment line, which is a division and
 * almost never lands on a whole euro.
 */
export function formatPriceExact(language: string, price: number): string {
  return euro(language, 2).format(price);
}

const percentFormatters = new Map<string, Intl.NumberFormat>();

/**
 * One decimal, always — the sheet prints "20,0 %" and "26,0 %", not "20 %".
 * The number only; the "%" sign and its spacing live in the translation, so
 * each language can set them itself.
 */
export function formatPercent(language: string, percent: number): string {
  let formatter = percentFormatters.get(language);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(language, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    percentFormatters.set(language, formatter);
  }
  return formatter.format(percent);
}
