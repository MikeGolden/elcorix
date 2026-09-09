<?php
/**
 * The footer band and the cookie banner.
 *
 * The Figma footer is a single indigo band: the wordmark on the left and
 * the legal links on the right. "Cookie settings" is added to that row —
 * the consent decision has to stay changeable from every page — and so is
 * a plain link to the sitemap, which WordPress generates itself at
 * /wp-sitemap.xml.
 *
 * @package Elcorix
 */

$elcorix_business = Elcorix_Settings::business();

$elcorix_legal = array(
	'imprint' => __( 'Imprint', 'elcorix' ),
	// Shorter than the page's own title in German ("Datenschutz" rather
	// than "Datenschutzerklärung"), so the footer row stays one line.
	'privacy' => _x( 'Privacy policy', 'footer link', 'elcorix' ),
	'terms'   => __( 'Terms', 'elcorix' ),
	'mission' => __( 'Mission', 'elcorix' ),
);

$elcorix_link_class = 'text-sm font-medium text-white/80 transition-colors hover:text-white';
?>
</main>

<footer class="pt-16">
	<?php
	// The indigo band spans the viewport; only its content keeps the
	// 1200px column of the rest of the page.
	?>
	<div class="rounded-t-panel bg-brand-700 py-10 sm:py-12">
		<div class="mx-auto flex max-w-[1200px] flex-col gap-7 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
			<div>
				<?php elcorix_logo( 'light' ); ?>
				<p class="mt-2 text-xs text-white/60">
					<?php
					printf(
						'&copy; %1$s %2$s',
						esc_html( (string) gmdate( 'Y' ) ),
						esc_html( $elcorix_business['name'] )
					);
					?>
				</p>
			</div>
			<nav aria-label="<?php esc_attr_e( 'Legal', 'elcorix' ); ?>">
				<ul class="flex flex-wrap gap-x-8 gap-y-3">
					<?php foreach ( $elcorix_legal as $elcorix_role => $elcorix_label ) : ?>
						<li>
							<a href="<?php echo esc_url( elcorix_page_url( $elcorix_role ) ); ?>" class="<?php echo esc_attr( $elcorix_link_class ); ?>">
								<?php echo esc_html( $elcorix_label ); ?>
							</a>
						</li>
					<?php endforeach; ?>
					<li>
						<a href="<?php echo esc_url( home_url( '/wp-sitemap.xml' ) ); ?>" class="<?php echo esc_attr( $elcorix_link_class ); ?>">
							<?php esc_html_e( 'Sitemap', 'elcorix' ); ?>
						</a>
					</li>
					<li>
						<button type="button" data-elcorix-consent-open class="<?php echo esc_attr( $elcorix_link_class ); ?>">
							<?php esc_html_e( 'Cookie settings', 'elcorix' ); ?>
						</button>
					</li>
				</ul>
			</nav>
		</div>
	</div>
</footer>

<?php
get_template_part( 'template-parts/components/cookie-banner' );
get_template_part( 'template-parts/components/lightbox' );
wp_footer();
?>
</body>
</html>
