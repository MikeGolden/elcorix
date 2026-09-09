<?php
/**
 * "Moderne Diodenlaser-Technologie" — the device photo beside three
 * paragraphs whose lead-ins are bold, as in the Figma.
 *
 * The photo stays `aspect-[4/3]` in an `items-center` grid. Stretching the
 * tile to the text column's height was tried and reverted: the device
 * photo is 4:3 and `object-cover` then zoomed into it, cutting the tablet
 * and the room. A stretched media tile only works when the file is cropped
 * to the tile's own ratio.
 *
 * The reveal sits on a wrapper rather than on the image itself, because
 * elcorix_photo() renders a <picture>.
 *
 * @package Elcorix
 */

$elcorix_image = Elcorix_Content::section_image( 'technology', 'image', 'technology.jpg' );
?>
<section id="technology"
	aria-labelledby="technology-title"
	class="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
	<div class="grid items-center gap-10 md:grid-cols-2 md:gap-14">
		<div <?php echo elcorix_reveal_attrs(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
			<?php
			elcorix_photo(
				array(
					'src'    => $elcorix_image,
					'alt'    => Elcorix_Content::section_meta( 'technology', 'image_alt' ),
					'width'  => '1200',
					'height' => '900',
					'class'  => 'aspect-[4/3] w-full rounded-panel object-cover',
				)
			);
			?>
		</div>
		<div <?php echo elcorix_reveal_attrs( array( 'delay' => 110 ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
			<h2 id="technology-title" class="text-2xl font-bold sm:text-[1.9rem] sm:leading-tight">
				<?php echo esc_html( Elcorix_Content::section_title( 'technology' ) ); ?>
			</h2>
			<div class="elcorix-prose mt-6 space-y-4 text-[0.95rem] leading-relaxed">
				<?php echo wp_kses_post( Elcorix_Content::section_body( 'technology' ) ); ?>
			</div>
			<a href="<?php echo esc_url( elcorix_anchor_href( 'consultation' ) ); ?>" class="btn-primary mt-8">
				<?php esc_html_e( 'Learn more about our devices', 'elcorix' ); ?>
			</a>
		</div>
	</div>
</section>
