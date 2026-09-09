<?php
/**
 * The Altegio online-booking embed, behind the two-click consent gate.
 *
 * The embed sets third-party cookies from alteg.io, so GDPR requires the
 * placeholder first and the iframe only after an explicit opt-in. Both
 * states are rendered here and swapped by assets/js/app.js according to
 * the stored decision; the iframe's `src` is held in a data attribute
 * until then, so nothing is requested from alteg.io before consent — the
 * point of the whole pattern.
 *
 * The new-tab fallback link needs no consent: no third-party content
 * loads on our page when a visitor follows it.
 *
 * @package Elcorix
 */

$elcorix_business = Elcorix_Settings::business();
?>
<div data-elcorix-altegio>
	<div data-testid="altegio-consent-placeholder"
		data-elcorix-altegio-placeholder
		class="rounded-panel border border-line bg-surface-soft px-6 py-12 text-center sm:px-10">
		<h3 class="text-xl font-bold"><?php esc_html_e( 'External booking calendar', 'elcorix' ); ?></h3>
		<p class="mx-auto mt-3 max-w-xl text-[0.95rem] leading-relaxed">
			<?php
			esc_html_e(
				'Our online calendar is provided by Altegio. When it loads, Altegio sets cookies and processes your IP address — and, if you pay online, your payment data on Altegio\'s pages. Details are in our privacy policy.',
				'elcorix'
			);
			?>
		</p>
		<button type="button" data-elcorix-consent-decide="allow" class="btn-primary mt-7">
			<?php esc_html_e( 'Load calendar and accept Altegio cookies', 'elcorix' ); ?>
		</button>
		<p class="mt-5 text-sm">
			<a class="font-medium text-brand-600 underline underline-offset-4"
				href="<?php echo esc_url( $elcorix_business['bookingUrl'] ); ?>"
				target="_blank"
				rel="noreferrer">
				<?php
				printf(
					/* translators: %s: business name */
					esc_html__( 'Open the %s booking calendar in a new tab', 'elcorix' ),
					esc_html( $elcorix_business['name'] )
				);
				?>
			</a>
		</p>
	</div>

	<div data-elcorix-altegio-embed hidden>
		<?php
		// The iframe is the only child of the clipping box, so all four of
		// its corners follow the panel radius — with the fallback line inside
		// it the bottom two stayed square. `rounded-panel` on the iframe
		// itself as well: Safari does not always clip an iframe to a rounded
		// ancestor.
		?>
		<div class="overflow-hidden rounded-panel bg-white">
			<iframe title="<?php esc_attr_e( 'Altegio online booking', 'elcorix' ); ?>"
				data-testid="altegio-widget"
				data-elcorix-altegio-src="<?php echo esc_url( $elcorix_business['bookingUrl'] ); ?>"
				class="block h-[720px] w-full rounded-panel"
				loading="lazy"
				allow="payment"
				referrerpolicy="strict-origin-when-cross-origin"></iframe>
		</div>
		<p class="mt-4 text-center text-sm">
			<?php esc_html_e( 'Calendar not loading?', 'elcorix' ); ?>
			<a class="font-medium text-brand-600 underline underline-offset-4"
				href="<?php echo esc_url( $elcorix_business['bookingUrl'] ); ?>"
				target="_blank"
				rel="noreferrer">
				<?php
				printf(
					/* translators: %s: business name */
					esc_html__( 'Open the %s booking calendar in a new tab', 'elcorix' ),
					esc_html( $elcorix_business['name'] )
				);
				?>
			</a>
		</p>
	</div>
</div>
