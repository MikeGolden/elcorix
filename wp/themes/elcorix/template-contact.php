<?php
/**
 * Template Name: elcorix — Contact
 *
 * The page's own heading, then the shared contact section (map, details,
 * opening hours), then the "write to us" form.
 *
 * @package Elcorix
 */

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<div class="mx-auto max-w-[1200px] px-4 pt-14 sm:px-6 sm:pt-20">
		<h1 class="text-3xl font-extrabold sm:text-4xl"><?php the_title(); ?></h1>
	</div>

	<?php get_template_part( 'template-parts/sections/contact' ); ?>

	<section aria-labelledby="contact-form-title" class="px-4 pb-16 sm:px-6 sm:pb-20">
		<div class="mx-auto max-w-[1200px] rounded-panel bg-surface-soft px-6 py-12 sm:px-10">
			<h2 id="contact-form-title" class="text-center text-2xl font-bold">
				<?php esc_html_e( 'Write to us', 'elcorix' ); ?>
			</h2>
			<?php get_template_part( 'template-parts/components/contact-form' ); ?>
		</div>
	</section>
	<?php
endwhile;

get_footer();
