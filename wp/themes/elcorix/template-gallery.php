<?php
/**
 * Template Name: elcorix — Gallery
 *
 * Every photo on this page comes from the studio's own set — the works
 * tiles plus whatever else is flagged for the gallery. Each tile opens
 * full screen in the shared viewer.
 *
 * @package Elcorix
 */

get_header();

$elcorix_items = Elcorix_Content::works( 'in_gallery' );

while ( have_posts() ) :
	the_post();
	?>
	<section aria-labelledby="gallery-title" class="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-20">
		<h1 id="gallery-title" class="text-3xl font-extrabold sm:text-4xl"><?php the_title(); ?></h1>
		<div class="elcorix-prose mt-5 max-w-2xl text-[0.95rem] leading-relaxed">
			<?php the_content(); ?>
		</div>

		<ul class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-elcorix-gallery="page">
			<?php foreach ( $elcorix_items as $elcorix_index => $elcorix_item ) : ?>
				<?php
				$elcorix_thumb = get_post_thumbnail_id( elcorix_default_language_post( $elcorix_item->ID ) );
				if ( ! $elcorix_thumb ) {
					continue;
				}
				$elcorix_alt = $elcorix_item->post_title;
				?>
				<li>
					<button type="button"
						data-elcorix-gallery-item="<?php echo esc_attr( (string) $elcorix_index ); ?>"
						data-elcorix-gallery-alt="<?php echo esc_attr( $elcorix_alt ); ?>"
						aria-label="<?php printf( /* translators: %s: image description */ esc_attr__( 'Open image: %s', 'elcorix' ), esc_attr( $elcorix_alt ) ); ?>"
						class="group block w-full cursor-zoom-in overflow-hidden rounded-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
						<?php
						elcorix_photo(
							array(
								'src'    => (string) $elcorix_thumb,
								'alt'    => $elcorix_alt,
								'width'  => '760',
								'height' => '570',
								'sizes'  => '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
								'class'  => 'aspect-[4/3] w-full rounded-panel object-cover transition-transform duration-300 group-hover:scale-[1.03]',
							)
						);
						?>
					</button>
				</li>
			<?php endforeach; ?>
		</ul>
	</section>
	<?php
endwhile;

get_footer();
