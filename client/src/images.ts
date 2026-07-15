/**
 * Central image registry for the landing page.
 *
 * All photos are committed to `client/public/images/` and served
 * first-party (no CDN request — required by the nginx CSP `img-src 'self'`
 * and the site's GDPR posture). They are free-license editorial images
 * originally from Unsplash; `scripts/fetch-images.sh` documents the source
 * of each file.
 *
 * Replace any entry with your own studio photography whenever it's ready:
 * drop the file into `client/public/images/` under the same name.
 */
export const images = {
  hero: "/images/hero.jpg",
  interior: "/images/interior.jpg",
  ctaBand: "/images/cta-band.jpg",
  services: {
    facial: "/images/service-facial.jpg",
    permanentMakeup: "/images/service-permanent-makeup.jpg",
    laser: "/images/service-laser.jpg",
    nails: "/images/service-nails.jpg",
    lashesBrows: "/images/service-lashes-brows.jpg",
    body: "/images/service-body.jpg",
  },
  team: {
    founder: "/images/team-founder.jpg",
    esthetician: "/images/team-esthetician.jpg",
    nails: "/images/team-nails.jpg",
  },
} as const;
