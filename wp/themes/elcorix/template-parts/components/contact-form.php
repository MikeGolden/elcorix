<?php
/**
 * "Write to us" — the contact form on the contact page.
 *
 * Same shape as the consultation request: our own endpoint, a honeypot, a
 * required privacy checkbox, and status messages that were rendered with
 * the page rather than injected, so a screen reader's live region is
 * already in the accessibility tree when it fills in.
 *
 * @package Elcorix
 */
?>
<form data-elcorix-form="contact"
	method="post"
	class="mx-auto mt-8 max-w-3xl"
	aria-label="<?php esc_attr_e( 'Contact form', 'elcorix' ); ?>">
	<div class="grid gap-5 sm:grid-cols-2">
		<div>
			<label for="contact-name" class="sr-only"><?php esc_html_e( 'Name', 'elcorix' ); ?></label>
			<input id="contact-name"
				name="name"
				required
				maxlength="200"
				autocomplete="name"
				placeholder="<?php esc_attr_e( 'Name', 'elcorix' ); ?>"
				class="field" />
		</div>
		<div>
			<label for="contact-email" class="sr-only"><?php esc_html_e( 'E-mail', 'elcorix' ); ?></label>
			<input id="contact-email"
				name="email"
				type="email"
				required
				maxlength="320"
				autocomplete="email"
				placeholder="<?php esc_attr_e( 'E-mail', 'elcorix' ); ?>"
				class="field" />
		</div>
		<div class="sm:col-span-2">
			<label for="contact-message" class="sr-only"><?php esc_html_e( 'Message', 'elcorix' ); ?></label>
			<textarea id="contact-message"
				name="message"
				required
				rows="5"
				maxlength="5000"
				placeholder="<?php esc_attr_e( 'How can we help you?', 'elcorix' ); ?>"
				class="field"></textarea>
		</div>
	</div>

	<?php // Honeypot — invisible to humans, catnip for spam bots. ?>
	<div class="hidden" aria-hidden="true">
		<label for="contact-website">Website</label>
		<input id="contact-website" name="website" type="text" tabindex="-1" autocomplete="off" />
	</div>

	<div class="mt-6 flex items-start gap-3 text-xs leading-relaxed">
		<input id="contact-privacy" name="privacyConsent" type="checkbox" required class="mt-0.5 h-4 w-4 shrink-0 accent-brand-700" />
		<label for="contact-privacy">
			<?php
			printf(
				wp_kses(
					/* translators: %1$s: opening link tag, %2$s: closing link tag */
					__(
						'I have read the %1$sprivacy policy%2$s and agree that my details are processed to answer my enquiry.',
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

	<div class="mt-8 text-center">
		<button type="submit" class="btn-primary px-10" data-elcorix-submit
			data-label="<?php esc_attr_e( 'Send message', 'elcorix' ); ?>"
			data-sending-label="<?php esc_attr_e( 'Sending…', 'elcorix' ); ?>">
			<?php esc_html_e( 'Send message', 'elcorix' ); ?>
		</button>
		<p role="status" class="mt-4 text-sm font-medium text-brand-600" data-elcorix-status="sent" hidden>
			<?php esc_html_e( 'Thank you! We will get back to you shortly.', 'elcorix' ); ?>
		</p>
		<p role="alert" class="mt-4 text-sm font-medium text-red-600" data-elcorix-status="error" hidden>
			<?php esc_html_e( 'Something went wrong. Please try again or call us.', 'elcorix' ); ?>
		</p>
	</div>
</form>
