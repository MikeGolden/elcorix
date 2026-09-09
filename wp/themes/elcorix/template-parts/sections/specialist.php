<?php
/**
 * "Ihre Haut in erfahrenen Händen" — the tinted card with the specialist's
 * text on the left and the certificate plus the portrait on the right, as
 * in the Figma.
 *
 * The card rises as one piece: fading its halves separately would leave
 * the panel hanging there empty.
 *
 * @package Elcorix
 */

$elcorix_portrait    = Elcorix_Content::section_image( 'specialist', 'image', 'specialist.jpg' );
$elcorix_certificate = Elcorix_Content::section_image( 'specialist', 'certificate', 'certificate.png' );
?>
<section id="specialist"
	aria-labelledby="specialist-title"
	class="mx-auto max-w-[1200px] px-4 sm:px-6">
	<div <?php echo elcorix_reveal_attrs( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		array( 'class' => 'grid items-center gap-10 rounded-panel bg-surface-soft px-6 py-12 sm:px-10 sm:py-14 md:grid-cols-2 md:gap-14' )
	); ?>>
		<div>
			<h2 id="specialist-title" class="text-2xl font-bold sm:text-[1.9rem] sm:leading-tight">
				<?php echo esc_html( Elcorix_Content::section_title( 'specialist' ) ); ?>
			</h2>
			<div class="elcorix-prose mt-6 space-y-4 text-[0.95rem] leading-relaxed">
				<?php echo wp_kses_post( Elcorix_Content::section_body( 'specialist' ) ); ?>
			</div>
		</div>

		<div class="grid gap-5 sm:grid-cols-2">
			<?php
			// The certificate is `object-contain`: it is a scan with
			// transparent rounded corners, not a photograph to crop.
			elcorix_photo(
				array(
					'src'    => $elcorix_certificate,
					'alt'    => Elcorix_Content::section_meta( 'specialist', 'certificate_alt' ),
					'width'  => '274',
					'height' => '394',
					'class'  => 'h-full w-full rounded-panel object-contain',
				)
			);
			// The portrait tile renders around 1:2, so the file behind it is
			// cropped to that ratio — a centred 3:4 crop lost her shoulder.
			elcorix_photo(
				array(
					'src'    => $elcorix_portrait,
					'alt'    => Elcorix_Content::section_meta( 'specialist', 'image_alt' ),
					'width'  => '620',
					'height' => '1240',
					'class'  => 'h-full min-h-64 w-full rounded-panel object-cover',
				)
			);
			?>
		</div>
	</div>
</section>
