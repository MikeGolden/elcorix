import type en from "./i18n/locales/en/common.json";

/**
 * Price list data. Prices are non-translatable business data (numbers in
 * EUR, formatted per-locale at render time); the item names live in the
 * translations under `prices.items.<category>.<key>` — the types below
 * are derived from the English resource, so an item key without a
 * translation is a compile error.
 *
 * Placeholder prices — replace with the real Preisliste before going live.
 * `from: true` renders the localized "from" prefix (e.g. "ab 59 €").
 */
type PriceItems = (typeof en)["prices"]["items"];

export type PriceCategoryKey = keyof PriceItems;

export type PriceItem<C extends PriceCategoryKey = PriceCategoryKey> = {
  key: keyof PriceItems[C] & string;
  price: number;
  from?: boolean;
};

export type PriceCategory = {
  [C in PriceCategoryKey]: { key: C; items: PriceItem<C>[] };
}[PriceCategoryKey];

export const priceList: PriceCategory[] = [
  {
    key: "facial",
    items: [
      { key: "basic", price: 59 },
      { key: "deepCleansing", price: 79 },
      { key: "antiAging", price: 99, from: true },
    ],
  },
  {
    key: "permanentMakeup",
    items: [
      { key: "brows", price: 349 },
      { key: "lips", price: 379 },
      { key: "refresh", price: 149, from: true },
    ],
  },
  {
    key: "laser",
    items: [
      { key: "faceSmall", price: 39, from: true },
      { key: "legs", price: 89, from: true },
      { key: "skinRejuvenation", price: 119, from: true },
    ],
  },
  {
    key: "nails",
    items: [
      { key: "manicure", price: 35 },
      { key: "manicureGel", price: 55 },
      { key: "pedicure", price: 49 },
    ],
  },
  {
    key: "lashesBrows",
    items: [
      { key: "lashLifting", price: 65 },
      { key: "browLamination", price: 55 },
      { key: "tinting", price: 25 },
    ],
  },
  {
    key: "body",
    items: [
      { key: "massage", price: 69 },
      { key: "peeling", price: 59 },
      { key: "firming", price: 89, from: true },
    ],
  },
];
