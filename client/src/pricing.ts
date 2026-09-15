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
 * so the small print can never contradict the price next to it. Both are
 * rounded to whole units, which is how the studio's price sheet reads
 * ("ca. 103 € pro Behandlung", "Sie sparen 20 %").
 */
export type PackageDeal = {
  total: number;
  perTreatment: number;
  /** Exact euros saved against six or eight single treatments. */
  saved: number;
  /** That saving as a percentage of the undiscounted price, rounded. */
  savedPercent: number;
  /** What the table prints — see TIER_DISCOUNT. */
  advertisedPercent: number;
};

/**
 * The discount each package size advertises. The studio sells "6er = 20 %,
 * 8er = 26 %" as the offer itself, so the pill states the tier rather than
 * each row's own arithmetic — Mykhailo's call on 2026-09-10, together with
 * "prices stay as they are".
 *
 * Ten of the eleven rows land on their tier exactly. Intim Clean is the one
 * that does not: 99 € × 6 = 594 €, minus 479 € is 19,4 %, and it still
 * prints 20 %. The euro figure beside it (115 €) is always the real one.
 *
 * `PriceTables.test.tsx` fails if any row drifts more than a point from its
 * tier, so a future price edit cannot quietly turn this into a claim that is
 * plainly wrong.
 */
export const TIER_DISCOUNT: Record<number, number> = { 6: 20, 8: 26 };

/**
 * Half-to-even, the rule the studio's price sheet was calculated with:
 * 1.239 € / 8 = 154,875 → 155, but 999 € / 6 = 166,5 → 166 and
 * 669 € / 6 = 111,5 → 112. Math.round() rounds every half up and would
 * print 167 and 127 where the printed price list says 166 and 126.
 */
function roundHalfToEven(value: number): number {
  const floor = Math.floor(value);
  const rest = value - floor;
  if (rest > 0.5) return floor + 1;
  if (rest < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}

export function packageDeal(single: number, sessions: number, total: number): PackageDeal {
  const undiscounted = single * sessions;
  const saved = undiscounted - total;
  const savedPercent = Math.round((saved / undiscounted) * 100);
  return {
    total,
    perTreatment: roundHalfToEven(total / sessions),
    saved,
    savedPercent,
    advertisedPercent: TIER_DISCOUNT[sessions] ?? savedPercent,
  };
}

/**
 * Constructing an Intl.NumberFormat is expensive — it resolves locale data
 * on every call — and the price tables format 31 cells per render. Building
 * one formatter per language and reusing it turns that into 31 lookups.
 */
const formatters = new Map<string, Intl.NumberFormat>();

export function formatPrice(language: string, price: number): string {
  let formatter = formatters.get(language);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(language, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    formatters.set(language, formatter);
  }
  return formatter.format(price);
}
