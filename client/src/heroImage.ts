import { images, webpFor } from "./images";

/**
 * The hero photo's responsive WebP set, shared by <Hero> and the preload
 * that vite/seoPrerender.ts writes into the home page's documents.
 *
 * The two must match exactly: the browser only reuses a preloaded image
 * when the candidate it picks from the preload's imagesrcset/imagesizes is
 * the one the <img> then asks for. When they differed (a plain preload of
 * the 1600px file), phones downloaded both hero files.
 */

/** Full-bleed below lg, half the viewport above it: a phone gets the 900px crop. */
export const heroWebpSrcSet = `${images.heroSmall} 900w, ${webpFor(images.hero)} 1600w`;
export const heroSizes = "(min-width: 1024px) 50vw, 100vw";

/**
 * The hero is the LCP element but is rendered by React, so without this the
 * preload scanner never sees it and the fetch waits for the bundle. No
 * `href`: every browser that understands imagesrcset picks from it, and one
 * that does not would otherwise fetch the 1600px file as well.
 */
export const heroPreloadTag =
  `<link rel="preload" as="image" type="image/webp" fetchpriority="high"` +
  ` imagesrcset="${heroWebpSrcSet}" imagesizes="${heroSizes}" />`;
