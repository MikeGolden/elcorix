<?php
/**
 * Online booking.
 *
 * The Figma has no calendar of its own — the studio books through Altegio,
 * so the embed lives here in the Figma's section shell. Mykhailo asked to
 * keep this section between the price tables and the consultation form
 * even though the design does not have it, because the brief requires the
 * integration. Do not "fix" it back to the design.
 *
 * @package Elcorix
 */
?>
<section id="booking"
	aria-labelledby="booking-title"
	<?php echo elcorix_reveal_attrs( array( 'class' => 'mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<h2 id="booking-title" class="text-center text-2xl font-bold sm:text-3xl">
		<?php echo esc_html( Elcorix_Content::section_title( 'booking' ) ); ?>
	</h2>
	<p class="mx-auto mt-4 max-w-2xl text-center text-[0.95rem] leading-relaxed">
		<?php echo esc_html( Elcorix_Content::section_intro( 'booking' ) ); ?>
	</p>
	<div class="mt-10">
		<?php get_template_part( 'template-parts/components/altegio' ); ?>
	</div>
</section>
