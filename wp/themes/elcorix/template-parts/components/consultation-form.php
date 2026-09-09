<?php
/**
 * The consultation request from the Figma ("Beratung erhalten"): name,
 * phone, preferred date and time, an optional marketing opt-in and a
 * required privacy consent.
 *
 * It talks only to our own endpoint — no third-party script, no cookies —
 * so a visitor who declines the Altegio calendar can still get an
 * appointment. Staff receive the request (stored row plus an e-mail) and
 * enter the appointment in Altegio themselves.
 *
 * The validation the React form did before submitting is repeated in
 * assets/js/app.js, and the server repeats all of it again in
 * elcorix_validate_booking — the client checks are a courtesy, the server
 * check is the guarantee.
 *
 * @package Elcorix
 */

$elcorix_slots = elcorix_time_slots();
// Recomputed on every render rather than frozen: a tab left open
// overnight would otherwise still be offering yesterday.
$elcorix_today = wp_date( 'Y-m-d' );
?>
<form data-elcorix-form="booking"
	method="post"
	aria-label="<?php echo esc_attr( Elcorix_Content::section_title( 'consultation' ) ); ?>"
	class="mx-auto max-w-3xl">
	<div class="grid gap-5 sm:grid-cols-2">
		<div>
			<label for="consult-name" class="sr-only"><?php esc_html_e( 'Name', 'elcorix' ); ?></label>
			<input id="consult-name"
				name="customerName"
				required
				maxlength="200"
				autocomplete="name"
				placeholder="<?php esc_attr_e( 'Name', 'elcorix' ); ?>"
				class="field" />
		</div>
		<div>
			<label for="consult-phone" class="sr-only"><?php esc_html_e( 'Phone number', 'elcorix' ); ?></label>
			<input id="consult-phone"
				name="customerPhone"
				type="tel"
				inputmode="tel"
				required
				maxlength="50"
				autocomplete="tel"
				placeholder="<?php esc_attr_e( 'Phone number', 'elcorix' ); ?>"
				class="field" />
			<p id="consult-phone-error" class="mt-2 text-xs font-medium text-red-600" data-elcorix-error="phone" hidden></p>
		</div>
		<div class="min-w-0">
			<label for="consult-date" class="mb-2 block text-xs font-semibold text-ink-300">
				<?php esc_html_e( 'Preferred date', 'elcorix' ); ?>
			</label>
			<input id="consult-date"
				name="date"
				type="date"
				min="<?php echo esc_attr( $elcorix_today ); ?>"
				class="field" />
			<p id="consult-date-error" class="mt-2 text-xs font-medium text-red-600" data-elcorix-error="date" hidden></p>
		</div>
		<div class="min-w-0">
			<label for="consult-time" class="mb-2 block text-xs font-semibold text-ink-300">
				<?php esc_html_e( 'Preferred time', 'elcorix' ); ?>
			</label>
			<select id="consult-time" name="time" class="field field-select">
				<option value="" selected><?php esc_html_e( 'No preference', 'elcorix' ); ?></option>
				<?php foreach ( $elcorix_slots as $elcorix_slot ) : ?>
					<option value="<?php echo esc_attr( $elcorix_slot ); ?>"><?php echo esc_html( $elcorix_slot ); ?></option>
				<?php endforeach; ?>
			</select>
		</div>
	</div>

	<?php // Honeypot — invisible to humans, catnip for spam bots. ?>
	<div class="hidden" aria-hidden="true">
		<label for="consult-website">Website</label>
		<input id="consult-website" name="website" type="text" tabindex="-1" autocomplete="off" />
	</div>

	<div class="mt-7 grid gap-5 text-xs leading-relaxed text-ink-500 sm:grid-cols-2">
		<div class="flex items-start gap-3">
			<input id="consult-marketing" name="marketingConsent" type="checkbox" class="mt-0.5 h-4 w-4 shrink-0 accent-brand-700" />
			<label for="consult-marketing">
				<?php
				esc_html_e(
					'I would like to receive offers and news by e-mail and phone. I can withdraw this consent at any time with effect for the future.',
					'elcorix'
				);
				?>
			</label>
		</div>
		<div class="flex items-start gap-3">
			<input id="consult-privacy" name="privacyConsent" type="checkbox" required class="mt-0.5 h-4 w-4 shrink-0 accent-brand-700" />
			<label for="consult-privacy">
				<?php
				printf(
					wp_kses(
						/* translators: %1$s: opening link tag, %2$s: closing link tag */
						__(
							'By submitting this form I agree that my details may be used to handle my appointment request. Information on how we process your personal data is in our %1$sprivacy policy%2$s.',
							'elcorix'
						),
						array( 'a' => array( 'href' => array(), 'class' => array() ) )
					),
					'<a href="' . esc_url( elcorix_page_url( 'privacy' ) ) . '" class="font-medium text-brand-600 underline underline-offset-2">',
					'</a>'
				);
				?>
			</label>
		</div>
	</div>

	<div class="mt-8 text-center">
		<button type="submit" class="btn-primary px-10" data-elcorix-submit
			data-label="<?php esc_attr_e( 'Get a consultation', 'elcorix' ); ?>"
			data-sending-label="<?php esc_attr_e( 'Sending…', 'elcorix' ); ?>">
			<?php esc_html_e( 'Get a consultation', 'elcorix' ); ?>
		</button>
		<p role="status" class="mt-4 text-sm font-medium text-brand-600" data-elcorix-status="sent" hidden>
			<?php esc_html_e( 'Thank you! We will get back to you during opening hours.', 'elcorix' ); ?>
		</p>
		<p role="alert" class="mt-4 text-sm font-medium text-red-600" data-elcorix-status="error" hidden>
			<?php esc_html_e( 'Something went wrong. Please try again or call us directly.', 'elcorix' ); ?>
		</p>
	</div>
</form>
