<?php
/**
 * Template Name: elcorix — Legal page
 *
 * The shared shell for Impressum, Datenschutz, AGB and Leitbild: a narrow
 * readable column, the title, and the editor's content with each <h2>
 * turned into the design's ruled section head.
 *
 * The business details these pages must name — operator, address, phone,
 * e-mail, VAT id — come from the [elcorix_business] shortcode rather than
 * being typed in, so changing the phone number under Settings → elcorix
 * updates the Impressum too.
 *
 * @package Elcorix
 */

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<section aria-labelledby="legal-title" class="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
		<h1 id="legal-title" class="text-3xl font-extrabold sm:text-4xl"><?php the_title(); ?></h1>
		<div class="elcorix-legal elcorix-prose mt-6 text-[0.95rem] leading-relaxed">
			<?php the_content(); ?>
		</div>
	</section>
	<?php
endwhile;

get_footer();
