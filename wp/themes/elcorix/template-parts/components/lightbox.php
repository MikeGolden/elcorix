<?php
/**
 * The full-screen image viewer.
 *
 * One empty shell per document, filled in by assets/js/app.js from
 * whichever tile was clicked — the works slider and the gallery grid share
 * it, as they shared the React <Lightbox>.
 *
 * The overlay is `fixed` and nothing in the layout creates a stacking
 * context above it, which is why it can live at the end of the body rather
 * than in a portal. It must NOT be nested inside a `.reveal`: the reveal's
 * transform would make that element a containing block and the overlay
 * would be trapped inside the section.
 *
 * @package Elcorix
 */
?>
<div role="dialog"
	hidden
	aria-modal="true"
	tabindex="-1"
	data-testid="lightbox"
	data-elcorix-lightbox
	aria-label="<?php esc_attr_e( 'Image viewer', 'elcorix' ); ?>"
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 outline-none sm:p-8">
	<figure class="pointer-events-none flex max-h-full max-w-[min(1100px,100%)] flex-col items-center gap-3">
		<picture class="contents">
			<source type="image/webp" srcset="" data-elcorix-lightbox-source />
			<img src=""
				alt=""
				decoding="async"
				data-testid="lightbox-image"
				data-elcorix-lightbox-image
				class="max-h-[78vh] w-auto max-w-full rounded-panel object-contain shadow-2xl" />
		</picture>
		<figcaption class="text-center text-sm text-white/80">
			<span data-elcorix-lightbox-caption></span>
			<span class="ml-2 whitespace-nowrap text-white/60" data-elcorix-lightbox-counter hidden></span>
		</figcaption>
	</figure>

	<button type="button"
		data-elcorix-lightbox-close
		aria-label="<?php esc_attr_e( 'Close image viewer', 'elcorix' ); ?>"
		class="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:right-5 sm:top-5">
		<?php elcorix_icon( 'close' ); ?>
	</button>

	<button type="button"
		data-elcorix-lightbox-step="-1"
		aria-label="<?php esc_attr_e( 'Previous image', 'elcorix' ); ?>"
		class="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:left-5">
		<?php elcorix_icon( 'chevron-left' ); ?>
	</button>
	<button type="button"
		data-elcorix-lightbox-step="1"
		aria-label="<?php esc_attr_e( 'Next image', 'elcorix' ); ?>"
		class="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:right-5">
		<?php elcorix_icon( 'chevron-right' ); ?>
	</button>
</div>
