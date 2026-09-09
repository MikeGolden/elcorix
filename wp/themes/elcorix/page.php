<?php
/**
 * A plain page: title, then editor content in the legal-page shell.
 *
 * The site's real pages all pick a template of their own; this is what a
 * page someone adds later gets, and it is deliberately the same narrow,
 * readable column the legal pages use.
 *
 * @package Elcorix
 */

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<section aria-labelledby="page-title" class="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
		<h1 id="page-title" class="text-3xl font-extrabold sm:text-4xl"><?php the_title(); ?></h1>
		<div class="elcorix-prose mt-6 space-y-4 text-[0.95rem] leading-relaxed">
			<?php the_content(); ?>
		</div>
	</section>
	<?php
endwhile;

get_footer();
