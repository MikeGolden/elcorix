<?php
/**
 * "Beliebte Leistungen und Preise" — the two zone tables, the package
 * table a screen further down, and the link to the full list.
 *
 * The package table gets its own reveal rather than sharing the zone
 * tables': by the time a visitor reaches it, the first reveal has long
 * since fired.
 *
 * @package Elcorix
 */
?>
<section id="prices"
	aria-labelledby="prices-title"
	class="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
	<h2 id="prices-title" <?php echo elcorix_reveal_attrs( array( 'class' => 'text-center text-2xl font-bold sm:text-3xl' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
		<?php echo esc_html( Elcorix_Content::section_title( 'prices' ) ); ?>
	</h2>

	<div <?php echo elcorix_reveal_attrs( array( 'class' => 'mt-10', 'delay' => 90 ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
		<?php get_template_part( 'template-parts/components/price-tables', null, array( 'show' => 'zones' ) ); ?>
	</div>

	<div <?php echo elcorix_reveal_attrs( array( 'class' => 'mt-14' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
		<?php get_template_part( 'template-parts/components/price-tables', null, array( 'show' => 'packages' ) ); ?>
	</div>

	<div <?php echo elcorix_reveal_attrs( array( 'class' => 'mt-10 flex justify-end', 'delay' => 90 ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
		<a href="<?php echo esc_url( elcorix_page_url( 'prices' ) ); ?>" class="btn-primary">
			<?php esc_html_e( 'See the full price list', 'elcorix' ); ?>
		</a>
	</div>
</section>
