/**
 * Central image registry.
 *
 * Every photo is derived from the studio's own photo set and
 * committed to `client/public/images/`, served first-party (no CDN
 * request — required by the nginx CSP `img-src 'self'` and the site's
 * GDPR posture). No other photography is used anywhere on the site.
 *
 * Each entry below is one image slot of the elcorix Figma layout; the
 * crops and sizes were produced from the studio's originals.
 *
 * Every path here names the JPEG/PNG original. A WebP twin of the same
 * name sits next to it — regenerate with `npm run images -w client` — and
 * <Photo> picks it automatically, so nothing below has to list it.
 */
export const images = {
  /** Hero — treatment in progress, 16:10 landscape. */
  hero: "/images/hero.jpg",
  /**
   * 900px WebP crop of the hero for the full-bleed phone layout. Named
   * explicitly because it is a second size, not a second format; keep the
   * preload in index.html pointing at the same set.
   */
  heroSmall: "/images/hero-900.webp",
  /** Rounded thumbnail next to "Unsere Leistungen" in the hero. */
  serviceThumb: "/images/service-thumb.jpg",
  /** "Moderne Diodenlaser-Technologie" — the device in the studio. */
  technology: "/images/technology.jpg",
  /** Portrait of the specialist for the "Wer Sie behandelt" section. */
  specialist: "/images/specialist.jpg",
  /** Square thumbnails for the "Für wen ist es geeignet?" cards. */
  reasons: {
    convenience: "/images/reason-convenience.jpg",
    irritation: "/images/reason-irritation.jpg",
    shaving: "/images/reason-shaving.jpg",
    beard: "/images/reason-beard.jpg",
  },
  /** "Sehen Sie sich unsere Arbeiten an" — four tiles, as in the Figma. */
  work: [
    "/images/work-1.jpg",
    "/images/work-2.jpg",
    "/images/work-3.jpg",
    "/images/work-4.jpg",
  ],
} as const;

export type ReasonKey = keyof typeof images.reasons;
