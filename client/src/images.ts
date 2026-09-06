/**
 * Central image registry.
 *
 * All photos are committed to `client/public/images/` and served
 * first-party (no CDN request — required by the nginx CSP `img-src 'self'`
 * and the site's GDPR posture). `scripts/fetch-images.sh` documents the
 * source of each file.
 *
 * PLACEHOLDERS: these are the studio's previous stock photos, re-mapped to
 * the roles the elcorix layout needs. Replace each one with real
 * laser-hair-removal photography (same file name, same aspect ratio) —
 * the Figma calls for treatment shots, the device in the studio and a
 * portrait of the specialist.
 */
export const images = {
  /** Hero — treatment in progress, 4:3-ish landscape. */
  hero: "/images/hero.jpg",
  /** "Modern diode laser technology" — the device in the studio. */
  technology: "/images/interior.jpg",
  /** Portrait of the specialist for "Ihre Haut in erfahrenen Händen". */
  specialist: "/images/team-esthetician.jpg",
  /** Square thumbnails for the "who is it for?" cards. */
  reasons: {
    convenience: "/images/service-body.jpg",
    irritation: "/images/cta-band.jpg",
    shaving: "/images/service-facial.jpg",
    beard: "/images/team-founder.jpg",
  },
  /** The horizontal "our work" strip. */
  work: [
    "/images/service-laser.jpg",
    "/images/cta-band.jpg",
    "/images/service-body.jpg",
    "/images/service-facial.jpg",
    "/images/interior.jpg",
    "/images/service-permanent-makeup.jpg",
  ],
} as const;

export type ReasonKey = keyof typeof images.reasons;
