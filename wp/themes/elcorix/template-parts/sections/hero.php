<?php
/**
 * Hero of the Figma one-pager.
 *
 * The copy sits in the 1200px column while the photo bleeds to the right
 * edge of the viewport and runs the full height of the block, up behind
 * the (transparent) header — so the header buttons sit on the photo and
 * there is no divider between them.
 *
 * `-mt-19 pt-19` is the header's height: the section starts under the
 * header without moving any of its content. The copy's right padding keeps
 * it clear of the photo, which covers the right half of the *viewport*:
 * below 1200px that is 50vw plus a gutter, and above it the centred
 * container only ever overlaps the photo by 600px, so the padding caps at
 * 640px. A plain percentage grew with the screen and squeezed the headline
 * to one word per line above ~1400px.
 *
 * Everything here is above the fold, so the reveals fire on load: headline
 * first, then the button and the service teaser, ~90ms apart. The photo is
 * deliberately NOT revealed — it is the LCP element, and an element at
 * `opacity: 0` does not count as painted.
 *
 * @package Elcorix
 */

$elcorix_hero_image = Elcorix_Content::section_image( 'hero', 'image', 'hero.jpg' );
$elcorix_hero_thumb = Elcorix_Content::section_image( 'hero', 'thumb', 'service-thumb.jpg' );
$elcorix_hero_small = get_theme_file_uri( 'assets/images/hero-900.webp' );
?>
<section class="relative -mt-19 pt-19">
	<div class="mx-auto max-w-[1200px] px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:pr-[min(calc(50vw+2.5rem),640px)]">
		<h1 <?php echo elcorix_reveal_attrs( array( 'class' => 'text-[2.1rem] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-5xl lg:text-[3.35rem]' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
			<?php echo esc_html( Elcorix_Content::section_title( 'hero' ) ); ?>
		</h1>

		<a href="<?php echo esc_url( elcorix_anchor_href( 'booking' ) ); ?>"
			<?php echo elcorix_reveal_attrs( array( 'class' => 'btn-primary mt-8', 'delay' => 90 ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
			<?php esc_html_e( 'Book an appointment', 'elcorix' ); ?>
		</a>

		<div <?php echo elcorix_reveal_attrs( array( 'class' => 'mt-12', 'delay' => 270 ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
			<p class="text-sm font-bold text-brand-700">
				<?php echo esc_html( Elcorix_Content::section_meta( 'hero', 'services_label' ) ); ?>
			</p>
			<a href="<?php echo esc_url( elcorix_page_url( 'prices' ) ); ?>"
				class="mt-4 inline-flex items-center gap-4 rounded-panel p-2 pr-6 transition-colors hover:bg-surface-soft">
				<?php
				elcorix_photo(
					array(
						'src'    => $elcorix_hero_thumb,
						'alt'    => '',
						'width'  => '320',
						'height' => '320',
						'class'  => 'h-14 w-14 rounded-2xl object-cover',
					)
				);
				?>
				<span class="text-[0.95rem]">
					<span class="font-bold text-brand-700"><?php echo esc_html( Elcorix_Content::section_meta( 'hero', 'service_name' ) ); ?></span>
					<span class="text-ink-300"><?php echo esc_html( Elcorix_Content::section_meta( 'hero', 'service_count' ) ); ?></span>
				</span>
			</a>
		</div>

		<?php
		// Full-bleed below lg, half the viewport above it: a phone gets the
		// 900px crop (26kB) instead of the 1600px one. Keep this srcset in
		// step with the preload in inc/assets.php.
		elcorix_photo(
			array(
				'src'           => $elcorix_hero_image,
				'testid'        => 'hero-photo',
				'webp_srcset'   => ctype_digit( $elcorix_hero_image )
					? ''
					: $elcorix_hero_small . ' 900w, ' . get_theme_file_uri( 'assets/images/' . elcorix_webp_for( $elcorix_hero_image ) ) . ' 1600w',
				'sizes'         => '(min-width: 1024px) 50vw, 100vw',
				'alt'           => Elcorix_Content::section_meta( 'hero', 'image_alt' ),
				'width'         => '1600',
				'height'        => '1000',
				'loading'       => 'eager',
				'fetchpriority' => 'high',
				'class'         => 'mt-10 aspect-[16/10] w-full rounded-panel object-cover'
					. ' lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:aspect-auto lg:h-full'
					. ' lg:w-1/2 lg:rounded-l-panel lg:rounded-r-none',
			)
		);
		?>
	</div>
</section>
