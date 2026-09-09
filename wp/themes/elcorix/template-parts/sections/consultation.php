<?php
/**
 * "Kostenlose Beratung anfordern".
 *
 * The tinted card fills the same 1200px-minus-gutters column as every
 * other section, so all block edges line up down the page.
 *
 * @package Elcorix
 */
?>
<section id="consultation"
	aria-labelledby="consultation-title"
	class="mx-auto max-w-[1200px] px-4 sm:px-6">
	<div <?php echo elcorix_reveal_attrs( array( 'class' => 'rounded-panel bg-surface-soft px-6 py-12 sm:px-10 sm:py-14' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
		<h2 id="consultation-title" class="text-center text-2xl font-bold sm:text-3xl">
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
