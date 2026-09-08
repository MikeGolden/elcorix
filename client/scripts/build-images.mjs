/**
 * Regenerates the WebP twin of every photo in public/images/, plus the
 * 900px hero crop used by the phone layout.
 *
 * The JPEG/PNG originals stay committed as the <picture> fallback; this
 * script only ever writes .webp files, so it is safe to re-run. Requires
 * Python with Pillow, which is how the crops were produced in the first
 * place — no new npm dependency for a job that runs by hand.
 *
 *   npm run images -w client
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(here, "..", "public", "images");

const python = `
from PIL import Image
from pathlib import Path
import sys

images = Path(sys.argv[1])
QUALITY = 82

for source in sorted(images.iterdir()):
    if source.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
        continue
    with Image.open(source) as im:
        im.save(source.with_suffix(".webp"), "WEBP", quality=QUALITY, method=6)
    print(f"  {source.name} -> {source.with_suffix('.webp').name}")

# Phone-sized hero: full-bleed below the lg breakpoint, so ~900px covers a
# 450px viewport at 2x. Keep in step with the srcSet in sections/Hero.tsx.
with Image.open(images / "hero.jpg") as im:
    width = 900
    im.resize((width, round(width * im.height / im.width)), Image.LANCZOS).save(
        images / "hero-900.webp", "WEBP", quality=QUALITY, method=6
    )
print("  hero.jpg -> hero-900.webp (900w)")
`;

console.log(`Rebuilding WebP variants in ${imagesDir}`);
execFileSync("python3", ["-c", python, imagesDir], { stdio: "inherit" });
