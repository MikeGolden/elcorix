import type { ComponentPropsWithoutRef } from "react";
import { webpFor } from "../images";

type PhotoProps = ComponentPropsWithoutRef<"img"> & {
  src: string;
  alt: string;
  /** Overrides the derived single-file WebP source, for responsive sets. */
  webpSrcSet?: string;
  sizes?: string;
};

/**
 * An <img> that prefers WebP and falls back to the committed JPEG/PNG.
 *
 * Every photo in `public/images/` is committed in both formats (see
 * `scripts/build-images.mjs`), so the WebP path is derived from the source
 * path rather than listed twice — one registry entry per photo, and the two
 * files can never drift apart in `images.ts`.
 *
 * The <picture> wrapper is `display: contents`, so it generates no box of
 * its own: the <img> keeps whatever position, aspect ratio and grid
 * placement its className gives it, exactly as a bare <img> would.
 */
export default function Photo({ src, alt, webpSrcSet, sizes, ...rest }: PhotoProps) {
  // Only raster originals have a WebP twin; an SVG is served as it is.
  const webp = webpSrcSet ?? (/\.(jpe?g|png)$/i.test(src) ? webpFor(src) : undefined);
  return (
    <picture className="contents">
      {webp && <source type="image/webp" srcSet={webp} sizes={sizes} />}
      <img src={src} alt={alt} {...rest} />
    </picture>
  );
}
