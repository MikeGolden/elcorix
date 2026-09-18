import { images, type ReasonKey } from "./images";

/**
 * Structural page content that is not copy (copy lives in the
 * translations) and not business data (that lives in config.ts):
 * the anchor menu of the one-page layout and the card/photo ordering.
 */

/** Hamburger menu of the header — anchors into the landing page. */
export const navAnchors = [
  { id: "for-whom", key: "nav.forWhom" },
  { id: "technology", key: "nav.technology" },
  { id: "specialist", key: "nav.specialist" },
  { id: "work", key: "nav.work" },
  { id: "prices", key: "nav.prices" },
  { id: "consultation", key: "nav.consultation" },
  { id: "contact", key: "nav.contact" },
] as const;

/** "Für wen ist es geeignet?" — four cards, image + headline + link. */
export const reasons: { key: ReasonKey; image: string }[] = [
  { key: "convenience", image: images.reasons.convenience },
  { key: "irritation", image: images.reasons.irritation },
  { key: "shaving", image: images.reasons.shaving },
  { key: "beard", image: images.reasons.beard },
];


/**
 * The six situations of the "Wann Laser-Haarentfernung das Leben wirklich
 * erleichtert" article, in reading order. The first three are also cards
 * above (same keys) and have a page of their own; the other three live
 * only in the overview article. Copy: `forWhom.situations.<key>`.
 */
export const situations = [
  "irritation",
  "shaving",
  "beard",
  "face",
  "hardToReach",
  "ready",
] as const;

export type Situation = (typeof situations)[number];
