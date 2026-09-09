<?php
/**
 * Template Name: elcorix — Price list
 *
 * The full price list: the page's own title and intro, both zone tables,
 * the package table, the note from the prices section, and the booking
 * button.
 *
 * The tables are the same component the landing page uses, so a price is
 * edited in one place and both views follow.
 *
 * @package Elcorix
 */

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<section aria-labelledby="prices-page-title" class="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-20">
		<h1 id="prices-page-title" class="text-3xl font-extrabold sm:text-4xl"><?php the_title(); ?></h1>
		<div class="elcorix-prose mt-5 max-w-2xl text-[0.95rem] leading-relaxed">
			<?php the_content(); ?>
		</div>

		<div class="mt-12">
			<?php get_template_part( 'template-parts/components/price-tables', null, array( 'show' => 'zones' ) ); ?>
		</div>
		<div class="mt-14">
			<?php get_template_part( 'template-parts/components/price-tables', null, array( 'show' => 'packages' ) ); ?>
		</div>

		<?php $elcorix_note = Elcorix_Content::section_meta( 'prices', 'note' ); ?>
		<?php if ( '' !== $elcorix_note ) : ?>
			<p class="mt-12 max-w-2xl text-sm leading-relaxed text-ink-500"><?php echo esc_html( $elcorix_note ); ?></p>
		<?php endif; ?>

		<a href="<?php echo esc_url( elcorix_page_url( 'booking' ) ); ?>" class="btn-primary mt-8">
			<?php esc_html_e( 'Book an appointment', 'elcorix' ); ?>
		</a>
	</section>
	<?php
endwhile;

get_footer();
