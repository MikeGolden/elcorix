/**
 * Central image registry.
 *
 * Every photo is derived from the studio's own `NewPics/` set and
 * committed to `client/public/images/`, served first-party (no CDN
 * request — required by the nginx CSP `img-src 'self'` and the site's
 * GDPR posture). No other photography is used anywhere on the site.
 *
 * Each entry below is one image slot of the elcorix Figma layout; the
 * crops and sizes were produced from the originals in `NewPics/`.
 */
export const images = {
  /** Hero — treatment in progress, 16:10 landscape. */
  hero: "/images/hero.jpg",
  /** Rounded thumbnail next to "Unsere Leistungen" in the hero. */
  serviceThumb: "/images/service-thumb.jpg",
  /** "Moderne Diodenlaser-Technologie" — the device in the studio. */
  technology: "/images/technology.jpg",
  /** Portrait of the specialist for "Ihre Haut in erfahrenen Händen". */
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
