import type en from "./i18n/locales/en/common.json";

/**
 * Price list data — ELCORIX_Laser_Preise_Fuer_Website (sheet "Для_сайта"),
 * received 2026-10-22.
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

/** "Einzelzonen" (Damen), in the sheet's order. */
export const womenPrices: ZonePrice<"women">[] = [
  { key: "upperLip", price: 39 },
  { key: "chin", price: 39 },
  { key: "cheeks", price: 49 },
  { key: "face", price: 79 },
  { key: "throat", price: 49 },
  { key: "neck", price: 39 },
  { key: "underarms", price: 69 },
  { key: "bikiniClassic", price: 69 },
  { key: "intimateBasic", price: 79 },
  { key: "intimateComplete", price: 99 },
  { key: "buttockCrease", price: 39 },
  { key: "buttocks", price: 69 },
  { key: "buttocksFull", price: 89 },
  { key: "forearms", price: 69 },
  { key: "upperArms", price: 69 },
  { key: "armsFull", price: 109 },
  { key: "handsFingers", price: 29 },
  { key: "stomach", price: 59 },
  { key: "bellyLine", price: 29 },
  { key: "backFull", price: 89 },
  { key: "lowerLegs", price: 99 },
  { key: "thighs", price: 119 },
  { key: "legsFull", price: 179 },
  { key: "feetToes", price: 29 },
];

/** "Einzelzonen" (Herren), in the sheet's order. */
export const menPrices: ZonePrice<"men">[] = [
  { key: "beardContour", price: 59 },
  { key: "throat", price: 49 },
  { key: "neck", price: 49 },
  { key: "underarms", price: 59 },
  { key: "shoulders", price: 69 },
  { key: "chest", price: 89 },
  { key: "stomach", price: 79 },
  { key: "backFull", price: 119 },
  { key: "intimateComplete", price: 99 },
  { key: "buttockCrease", price: 49 },
  { key: "buttocks", price: 89 },
  { key: "armsFull", price: 129 },
  { key: "lowerLegs", price: 119 },
  { key: "thighs", price: 129 },
  { key: "legsFull", price: 199 },
];

export type PackageGroup = "women" | "men";

export type PackageKey<G extends PackageGroup> = keyof Prices["packages"][G] & string;

/** The three course sizes the sheet sells, and how many sessions each is. */
export const COURSE_SIZES = { six: 6, eight: 8, ten: 10 } as const;
export type CourseSize = keyof typeof COURSE_SIZES;

/**
 * One price list: the single treatment, and the price PER TREATMENT in a
 * course of 6, 8 or 10. The sheet states the per-treatment price and
 * multiplies it out ("132 € / Behandlung · 792 € gesamt"), so that is what is
 * stored; the total is derived and is always a whole number of euros.
 */
export type Tier = { single: number } & Record<CourseSize, number>;

export type CombinationKey = keyof Prices["combinations"] & string;

export type PricePackage<G extends PackageGroup> = {
  key: PackageKey<G>;
  prices: Tier;
  /**
   * Only for a package whose zones the client picks (Smooth Duo Light):
   * every combination it can be booked as, each at its own prices. `prices`
   * is then the cheapest of them, and a column where the combinations
   * disagree is printed as "ab …" — see `isFromPrice`.
   */
  combinations?: { key: CombinationKey; prices: Tier }[];
};

const duoLightUnderarmsBikini: Tier = { single: 129, six: 122, eight: 116, ten: 110 };

/** "Pakete für Damen" */
export const womenPackages: PricePackage<"women">[] = [
  {
    key: "smoothDuoLight",
    prices: duoLightUnderarmsBikini,
    combinations: [
      { key: "underarmsBikini", prices: duoLightUnderarmsBikini },
      { key: "lowerLegsPlusOne", prices: { single: 149, six: 135, eight: 122, ten: 110 } },
    ],
  },
  { key: "smoothDuo", prices: { single: 139, six: 132, eight: 126, ten: 120 } },
  { key: "smoothLegs", prices: { single: 179, six: 169, eight: 159, ten: 150 } },
  { key: "smoothTrioLight", prices: { single: 199, six: 185, eight: 175, ten: 165 } },
  { key: "smoothTrio", prices: { single: 229, six: 215, eight: 205, ten: 195 } },
  { key: "smoothComplete", prices: { single: 299, six: 285, eight: 270, ten: 255 } },
];

/** "Pakete für Herren" */
export const menPackages: PricePackage<"men">[] = [
  { key: "clearBack", prices: { single: 179, six: 169, eight: 159, ten: 149 } },
  { key: "strongTorso", prices: { single: 149, six: 139, eight: 129, ten: 120 } },
  { key: "businessBody", prices: { single: 249, six: 235, eight: 225, ten: 210 } },
  { key: "neckShoulders", prices: { single: 109, six: 103, eight: 97, ten: 90 } },
  { key: "coolClean", prices: { single: 149, six: 139, eight: 129, ten: 120 } },
  { key: "menSmoothDuo", prices: { single: 139, six: 132, eight: 126, ten: 120 } },
];

/** True where a package's combinations do not all cost the same: print "ab". */
export function isFromPrice(
  row: { prices: Tier; combinations?: { prices: Tier }[] },
  column: "single" | CourseSize,
): boolean {
  return (row.combinations ?? []).some((c) => c.prices[column] !== row.prices[column]);
}

/**
 * The "Ersttermin" offer at the top of each block: one package's first
 * treatment, consultation included, at an introductory price. The regular
 * price it is compared with is that package's own single price, looked up
 * rather than repeated, so the two cannot disagree.
 */
export const firstVisitOffers = {
  women: { package: "smoothDuo", price: 129 },
  men: { package: "clearBack", price: 159 },
} as const satisfies { [G in PackageGroup]: { package: PackageKey<G>; price: number } };

export function firstVisitOffer(group: PackageGroup) {
  const offer = firstVisitOffers[group];
  const packages: { key: string; prices: Tier }[] =
    group === "women" ? womenPackages : menPackages;
  const row = packages.find((p) => p.key === offer.package);
  if (!row) throw new Error(`First-visit package ${offer.package} is not in the ${group} list`);
  return { packageKey: offer.package, price: offer.price, regular: row.prices.single };
}

/**
 * What a course costs and saves against paying for each session at the
 * single price. The sheet prints only the per-treatment price and the
 * total; the saving pill is derived from the same two numbers, so it can
 * never contradict the prices next to it. Nothing is rounded here — the
 * percentage is rounded by `formatPercent` at display time.
 */
export type PackageDeal = {
  perTreatment: number;
  /** perTreatment × sessions. */
  total: number;
  /** Euros saved against the same number of single treatments. */
  saved: number;
  /** That saving as a percentage of the undiscounted price, unrounded. */
  savedPercent: number;
};

export function packageDeal(single: number, sessions: number, perTreatment: number): PackageDeal {
  const undiscounted = single * sessions;
  const total = perTreatment * sessions;
  const saved = undiscounted - total;
  return { perTreatment, total, saved, savedPercent: (saved / undiscounted) * 100 };
}

/** Look one up, build it on the first miss only. */
function getOrCreate<T>(cache: Map<string, T>, key: string, create: () => T): T {
  let value = cache.get(key);
  if (value === undefined) {
    value = create();
    cache.set(key, value);
  }
  return value;
}

/**
 * Constructing an Intl.NumberFormat is expensive — it resolves locale data
 * on every call — and the price tables format well over a hundred cells per
 * render. Building one formatter per language and reusing it turns that into
 * lookups.
 */
const currencyFormatters = new Map<string, Intl.NumberFormat>();

/**
 * `currencyDisplay: "narrowSymbol"` is load-bearing, not a nicety: Ukrainian
 * CLDR has no default symbol for the euro, so without it every price on the
 * Ukrainian pages reads "1 239 EUR" while German, English and Russian read
 * "1.239 €". It changes nothing in the other three locales.
 */
function euro(language: string): Intl.NumberFormat {
  return getOrCreate(
    currencyFormatters,
    language,
    () =>
      new Intl.NumberFormat(language, {
        style: "currency",
        currency: "EUR",
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
  );
}

/** Whole euros: every price the studio actually charges is a round number. */
export function formatPrice(language: string, price: number): string {
  return euro(language).format(price);
}

const percentFormatters = new Map<string, Intl.NumberFormat>();

/**
 * One decimal, always ("5,0 %", not "5 %"), so the pills line up.
 * The number only; the "%" sign and its spacing live in the translation, so
 * each language can set them itself.
 */
export function formatPercent(language: string, percent: number): string {
  return getOrCreate(
    percentFormatters,
    language,
    () =>
      new Intl.NumberFormat(language, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
  ).format(percent);
}
