#!/usr/bin/env bash
# Downloads the landing-page photos (free-license, Unsplash) into
# client/public/images/ so the site serves them itself instead of
# hotlinking the Unsplash CDN (better performance + GDPR posture).
#
# Usage:  ./scripts/fetch-images.sh
# Then set VITE_LOCAL_IMAGES=true in .env.local and rebuild.
set -euo pipefail

dir="$(cd "$(dirname "$0")/.." && pwd)/client/public/images"
mkdir -p "$dir"

fetch() {
  local name="$1" id="$2" params="$3"
  echo "→ $name"
  curl -fsSL "https://images.unsplash.com/${id}?auto=format&${params}" -o "$dir/$name"
}

fetch hero.jpg                        photo-1509967419530-da38b4704bc6 "w=1900&q=75&fit=crop"
fetch interior.jpg                    photo-1633681926022-84c23e8cb2d6 "w=1000&q=70&fit=crop"
fetch cta-band.jpg                    photo-1519824145371-296894a0daa9 "w=1900&h=800&q=70&fit=crop"
fetch service-facial.jpg              photo-1570172619644-dfd03ed5d881 "w=800&h=600&q=70&fit=crop"
fetch service-permanent-makeup.jpg    photo-1487412947147-5cebf100ffc2 "w=800&h=600&q=70&fit=crop"
fetch service-laser.jpg               photo-1512290923902-8a9f81dc236c "w=800&h=600&q=70&fit=crop"
fetch service-nails.jpg               photo-1610992015732-2449b76344bc "w=800&h=600&q=70&fit=crop"
fetch service-lashes-brows.jpg        photo-1494869042583-f6c911f04b4c "w=800&h=600&q=70&fit=crop"
fetch service-body.jpg                photo-1544161515-4ab6ce6db874   "w=800&h=600&q=70&fit=crop"
fetch team-founder.jpg                photo-1580489944761-15a19d654956 "w=600&h=760&q=70&fit=crop"
fetch team-esthetician.jpg            photo-1594744803329-e58b31de8bf5 "w=600&h=760&q=70&fit=crop"
fetch team-nails.jpg                  photo-1544005313-94ddf0286df2   "w=600&h=760&q=70&fit=crop"

echo
echo "Done. Now set VITE_LOCAL_IMAGES=true in .env.local and rebuild."
