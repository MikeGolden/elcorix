<?php
/**
 * "Kontakt & Terminvereinbarung" — the map beside the contact details,
 * the opening hours and the WhatsApp button.
 *
 * The map's wrapper stays a stretched grid item so the map keeps matching
 * the text column's height on md+.
 *
 * @package Elcorix
 */

$elcorix_business = Elcorix_Settings::business();
?>
<section id="contact"
	aria-labelledby="contact-title"
	class="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
	<div class="grid gap-10 md:grid-cols-2 md:gap-14">
		<div <?php echo elcorix_reveal_attrs(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
			<?php get_template_part( 'template-parts/components/map' ); ?>
		</div>
		<div <?php echo elcorix_reveal_attrs( array( 'delay' => 110 ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
			<h2 id="contact-title" class="text-2xl font-bold sm:text-[1.9rem]">
				<?php echo esc_html( Elcorix_Content::section_title( 'contact' ) ); ?>
			</h2>
			<p class="mt-5 text-[0.95rem] leading-relaxed">
				<?php echo esc_html( Elcorix_Content::section_intro( 'contact' ) ); ?>
			</p>

			<dl class="mt-7 space-y-2 text-[0.95rem]">
				<div class="flex flex-wrap gap-x-2">
					<dt class="font-semibold text-ink-900"><?php esc_html_e( 'Address', 'elcorix' ); ?>:</dt>
					<dd><?php echo esc_html( $elcorix_business['addressShort'] ); ?></dd>
				</div>
				<div class="flex flex-wrap gap-x-2">
					<dt class="font-semibold text-ink-900"><?php esc_html_e( 'Phone / WhatsApp', 'elcorix' ); ?>:</dt>
					<dd>
						<a class="text-brand-600 hover:underline" href="<?php echo esc_url( $elcorix_business['telHref'] ); ?>">
							<?php echo esc_html( $elcorix_business['phone'] ); ?>
						</a>
					</dd>
				</div>
				<div class="flex flex-wrap gap-x-2">
					<dt class="font-semibold text-ink-900"><?php esc_html_e( 'E-mail', 'elcorix' ); ?>:</dt>
					<dd>
						<a class="text-brand-600 hover:underline" href="mailto:<?php echo esc_attr( $elcorix_business['email'] ); ?>">
							<?php echo esc_html( $elcorix_business['email'] ); ?>
						</a>
					</dd>
				</div>
				<div class="flex flex-wrap gap-x-2">
					<dt class="font-semibold text-ink-900">Instagram:</dt>
					<dd>
						<a class="text-brand-600 hover:underline"
							href="<?php echo esc_url( $elcorix_business['instagram'] ); ?>"
							target="_blank"
							rel="noreferrer">
							<?php echo esc_html( $elcorix_business['instagramHandle'] ); ?>
						</a>
					</dd>
				</div>
			</dl>

			<h3 class="mt-9 text-xl font-bold">
				<?php echo esc_html( Elcorix_Content::section_meta( 'contact', 'hours_title', __( 'Opening hours', 'elcorix' ) ) ); ?>
			</h3>
			<ul class="mt-4 space-y-1.5 text-sm">
				<li>
					<span class="font-semibold text-ink-900"><?php echo esc_html( Elcorix_Content::section_meta( 'contact', 'hours_weekdays_label' ) ); ?>:</span>
					<?php echo esc_html( Elcorix_Content::section_meta( 'contact', 'hours_weekdays' ) ); ?>
				</li>
				<li>
					<span class="font-semibold text-ink-900"><?php echo esc_html( Elcorix_Content::section_meta( 'contact', 'hours_closed_label' ) ); ?>:</span>
					<?php echo esc_html( Elcorix_Content::section_meta( 'contact', 'hours_closed' ) ); ?>
				</li>
			</ul>

			<a href="<?php echo esc_url( $elcorix_business['whatsapp'] ); ?>"
				target="_blank"
				rel="noreferrer"
				class="btn-primary mt-8">
				<?php esc_html_e( 'Message us on WhatsApp', 'elcorix' ); ?>
			</a>
		</div>
	</div>
</section>
