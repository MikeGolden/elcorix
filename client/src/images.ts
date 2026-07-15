/**
 * Central image registry for the landing page.
 *
 * All photos are free-license editorial images from Unsplash, hand-picked
 * to match the ivory/taupe visual language. By default they are loaded
 * from the Unsplash CDN (fine for development). For production — better
 * performance and GDPR posture (no third-party request) — run
 * `scripts/fetch-images.sh` once to download them into
 * `client/public/images/` and set `VITE_LOCAL_IMAGES=true` in `.env.local`.
 *
 * Replace any entry with your own studio photography whenever it's ready:
 * drop the file into `client/public/images/` under the same name.
 */

const unsplash = (id: string, params: string) =>
  `https://images.unsplash.com/${id}?auto=format&${params}`;

const useLocal = import.meta.env.VITE_LOCAL_IMAGES === "true";

const remote = {
  hero: unsplash("photo-1509967419530-da38b4704bc6", "w=1900&q=75&fit=crop"),
  interior: unsplash("photo-1633681926022-84c23e8cb2d6", "w=1000&q=70&fit=crop"),
  ctaBand: unsplash("photo-1519824145371-296894a0daa9", "w=1900&h=800&q=70&fit=crop"),
  services: {
    facial: unsplash("photo-1570172619644-dfd03ed5d881", "w=800&h=600&q=70&fit=crop"),
    permanentMakeup: unsplash("photo-1487412947147-5cebf100ffc2", "w=800&h=600&q=70&fit=crop"),
    laser: unsplash("photo-1512290923902-8a9f81dc236c", "w=800&h=600&q=70&fit=crop"),
    nails: unsplash("photo-1610992015732-2449b76344bc", "w=800&h=600&q=70&fit=crop"),
    lashesBrows: unsplash("photo-1494869042583-f6c911f04b4c", "w=800&h=600&q=70&fit=crop"),
    body: unsplash("photo-1544161515-4ab6ce6db874", "w=800&h=600&q=70&fit=crop"),
  },
  team: {
    founder: unsplash("photo-1580489944761-15a19d654956", "w=600&h=760&q=70&fit=crop"),
    esthetician: unsplash("photo-1594744803329-e58b31de8bf5", "w=600&h=760&q=70&fit=crop"),
    nails: unsplash("photo-1544005313-94ddf0286df2", "w=600&h=760&q=70&fit=crop"),
  },
} as const;

const local = {
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

export const images = useLocal ? local : remote;
