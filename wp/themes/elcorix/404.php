<?php
/**
 * Page not found.
 *
 * @package Elcorix
 */

get_header();
?>
<section aria-labelledby="not-found" class="mx-auto max-w-[1200px] px-4 py-24 text-center sm:px-6 sm:py-32">
	<p aria-hidden="true" class="font-display text-6xl font-extrabold text-brand-200">404</p>
	<h1 id="not-found" class="mt-6 text-3xl font-extrabold sm:text-4xl">
		<?php esc_html_e( 'Page not found', 'elcorix' ); ?>
	</h1>
	<p class="mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed">
		<?php
		esc_html_e(
			'This page does not exist or has been moved. Maybe you were looking for our price list, our work or the online booking?',
			'elcorix'
		);
		?>
	</p>
	<a href="<?php echo esc_url( elcorix_home_url() ); ?>" class="btn-primary mt-9">
		<?php esc_html_e( 'Back to the home page', 'elcorix' ); ?>
	</a>
</section>
<?php
get_footer();
