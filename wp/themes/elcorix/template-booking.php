<?php
/**
 * Template Name: elcorix — Booking
 *
 * The Altegio calendar behind its consent gate, and below it the
 * cookie-free consultation request — so a visitor who declines the
 * calendar can still get an appointment.
 *
 * @package Elcorix
 */

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<section aria-labelledby="booking-page-title" class="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-20">
		<h1 id="booking-page-title" class="text-3xl font-extrabold sm:text-4xl"><?php the_title(); ?></h1>
		<div class="elcorix-prose mt-5 max-w-2xl text-[0.95rem] leading-relaxed">
			<?php the_content(); ?>
		</div>
		<div class="mt-10">
			<?php get_template_part( 'template-parts/components/altegio' ); ?>
		</div>

		<div class="mt-14 rounded-panel bg-surface-soft px-6 py-12 sm:px-10">
			<h2 class="text-center text-2xl font-bold">
				<?php echo esc_html( Elcorix_Content::section_title( 'consultation' ) ); ?>
			</h2>
			<p class="mx-auto mt-4 max-w-2xl text-center text-[0.95rem] leading-relaxed">
				<?php echo esc_html( Elcorix_Content::section_intro( 'consultation' ) ); ?>
			</p>
			<div class="mt-10">
				<?php get_template_part( 'template-parts/components/consultation-form' ); ?>
			</div>
		</div>
	</section>
	<?php
endwhile;

get_footer();
