<?php
/**
 * "Sehen Sie sich unsere Arbeiten an" — a horizontal slider of portrait
 * tiles.
 *
 * The track is a native scroll-snap list, so touch swiping and keyboard
 * scrolling work without a carousel library; the arrows page it by one
 * tile and disable themselves at either end. Each tile is a button that
 * opens the photo full screen in the shared viewer, which then pages
 * through the same set with its own arrows and keys.
 *
 * The reveal stops at the track on purpose: the viewer is `fixed` and must
 * not sit inside an element that is briefly transformed.
 *
 * @package Elcorix
 */

$elcorix_works = Elcorix_Content::works( 'in_slider' );
$elcorix_count = count( $elcorix_works );
?>
<section id="work"
	aria-labelledby="work-title"
	class="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
	<h2 id="work-title" <?php echo elcorix_reveal_attrs( array( 'class' => 'text-center text-2xl font-bold sm:text-3xl' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
		<?php echo esc_html( Elcorix_Content::section_title( 'work' ) ); ?>
	</h2>

	<div <?php echo elcorix_reveal_attrs( array( 'class' => 'relative mt-9', 'delay' => 90 ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
		<ul tabindex="0"
			data-elcorix-slider
			data-elcorix-gallery="work"
			class="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth sm:gap-5">
			<?php foreach ( $elcorix_works as $elcorix_index => $elcorix_work ) : ?>
				<?php
				$elcorix_thumb = get_post_thumbnail_id( elcorix_default_language_post( $elcorix_work->ID ) );
				if ( ! $elcorix_thumb ) {
					continue;
				}
				$elcorix_alt = $elcorix_work->post_title;
				?>
				<li class="w-[72%] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-3.75rem)/4)]">
					<button type="button"
						data-elcorix-gallery-item="<?php echo esc_attr( (string) $elcorix_index ); ?>"
						data-elcorix-gallery-alt="<?php echo esc_attr( $elcorix_alt ); ?>"
						aria-label="<?php
							printf(
								/* translators: %s: image description */
								esc_attr__( 'Open image: %s', 'elcorix' ),
								esc_attr( $elcorix_alt )
							);
						?>"
						data-testid="work-tile-<?php echo esc_attr( (string) ( $elcorix_index + 1 ) ); ?>"
						class="group block w-full cursor-zoom-in overflow-hidden rounded-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
						<?php
						elcorix_photo(
							array(
								'src'    => (string) $elcorix_thumb,
								'alt'    => $elcorix_alt,
								'width'  => '760',
								'height' => '1064',
								'class'  => 'aspect-[5/7] w-full rounded-panel object-cover transition-transform duration-300 group-hover:scale-[1.03]',
							)
						);
						?>
					</button>
				</li>
			<?php endforeach; ?>
		</ul>

		<?php if ( $elcorix_count > 1 ) : ?>
			<button type="button"
				data-elcorix-slider-step="-1"
				disabled
				aria-label="<?php esc_attr_e( 'Previous images', 'elcorix' ); ?>"
				class="absolute left-1 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-brand-700 shadow-sm backdrop-blur transition enabled:hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:-left-2 sm:flex">
				<?php elcorix_icon( 'chevron-left' ); ?>
			</button>
			<button type="button"
				data-elcorix-slider-step="1"
				disabled
				aria-label="<?php esc_attr_e( 'Next images', 'elcorix' ); ?>"
				class="absolute right-1 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-brand-700 shadow-sm backdrop-blur transition enabled:hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:-right-2 sm:flex">
				<?php elcorix_icon( 'chevron-right' ); ?>
			</button>
		<?php endif; ?>
	</div>
</section>
