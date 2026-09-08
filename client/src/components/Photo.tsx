import type { ComponentPropsWithoutRef } from "react";

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
export function webpFor(src: string): string {
  return src.replace(/\.(jpe?g|png)$/i, ".webp");
}

type PhotoProps = ComponentPropsWithoutRef<"img"> & {
  src: string;
  alt: string;
  /** Overrides the derived single-file WebP source, for responsive sets. */
  webpSrcSet?: string;
  sizes?: string;
};

export default function Photo({ src, alt, webpSrcSet, sizes, ...rest }: PhotoProps) {
  return (
    <picture className="contents">
      <source type="image/webp" srcSet={webpSrcSet ?? webpFor(src)} sizes={sizes} />
      <img src={src} alt={alt} {...rest} />
    </picture>
  );
}
