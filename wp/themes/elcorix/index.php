<?php
/**
 * The fallback template WordPress requires a theme to have.
 *
 * Nothing on this site routes here in normal use: the front page has its
 * own template, every other view is a page, and unknown URLs get 404.php.
 * It renders the queried content in the legal-page shell so that a stray
 * archive or a post someone creates is still readable rather than blank.
 *
 * @package Elcorix
 */

get_header();
?>
<section class="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
	<?php if ( have_posts() ) : ?>
		<?php while ( have_posts() ) : ?>
			<?php the_post(); ?>
			<article class="mb-14">
				<h1 class="text-3xl font-extrabold sm:text-4xl"><?php the_title(); ?></h1>
				<div class="elcorix-prose mt-6 space-y-4 text-[0.95rem] leading-relaxed">
					<?php the_content(); ?>
				</div>
			</article>
		<?php endwhile; ?>
	<?php else : ?>
		<h1 class="text-3xl font-extrabold sm:text-4xl"><?php esc_html_e( 'Nothing here', 'elcorix' ); ?></h1>
	<?php endif; ?>
</section>
<?php
get_footer();
