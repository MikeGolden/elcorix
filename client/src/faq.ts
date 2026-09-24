import type { MetaKey } from "./seo/routes";

/**
 * Which questions each page answers. The copy lives in the translations
 * under `faq.items.<key>.question` / `.answer`.
 *
 * The two sets do not overlap on purpose: Google wants one FAQPage per
 * question, so the same pair marked up on two URLs would compete with
 * itself. The landing page takes the questions people ask before they
 * decide; the price page takes the ones they ask once they are comparing
 * figures.
 *
 * Env-free, like `business.ts` — `seo/staticHead.ts` imports this while the
 * Vite config is being bundled.
 */
export const faqSets = {
  home: ["pain", "sessions", "interval", "skinTypes", "preparation"],
  prices: ["consultation", "pricing", "packages", "cancellation"],
} as const satisfies Partial<Record<MetaKey, readonly string[]>>;

export type FaqPage = keyof typeof faqSets;
export type FaqKey = (typeof faqSets)[FaqPage][number];

export function faqKeysFor(metaKey: MetaKey): readonly FaqKey[] {
  return metaKey in faqSets ? faqSets[metaKey as FaqPage] : [];
}
