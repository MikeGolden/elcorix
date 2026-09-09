<?php
/**
 * Staff notifications and the visitor's auto-reply.
 *
 * The Express build used nodemailer and its own SMTP settings; here it is
 * `wp_mail`, so whatever the site already uses (an SMTP plugin, the host's
 * relay) carries these too. The behaviour is the one that mattered: the
 * record is stored first and the mail is best-effort, so a dead relay can
 * never lose a visitor's message.
 *
 * The signature on the auto-reply must name the business and the city the
 * site itself uses — a confirmation signed by a different studio in a
 * different town reads as a phishing attempt.
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Elcorix_Mail {

	/** Where staff notifications go; empty means "store only". */
	public static function notify_address(): string {
		$configured = (string) Elcorix_Settings::get( 'notifyEmail' );

		return '' !== $configured ? $configured : '';
	}

	/**
	 * "elcorix — Kempten": the business name and the city, taken from the
	 * short address ("Bodmanstraße 14, Kempten") so the two can never
	 * disagree with what the contact block shows.
	 */
	private static function signature(): string {
		$business = Elcorix_Settings::business();
		$parts    = array_map( 'trim', explode( ',', (string) $business['addressShort'] ) );
		$city     = end( $parts );

		return $business['name'] . ( is_string( $city ) && '' !== $city ? ' — ' . $city : '' );
	}

	/**
	 * @param array{name:string,email:string,message:string} $message
	 */
	public static function notify_contact( array $message, string $language ): void {
		$to = self::notify_address();
		if ( '' !== $to ) {
			wp_mail(
				$to,
				sprintf(
					/* translators: %s: sender name */
					__( 'New contact message from %s', 'elcorix' ),
					$message['name']
				),
				sprintf(
					"Name: %s\nE-mail: %s\n\n%s",
					$message['name'],
					$message['email'],
					$message['message']
				),
				array( 'Reply-To: ' . $message['email'] )
			);
		}

		self::confirm_receipt( $message['email'], $language );
	}

	/** The localized "we got it" reply the visitor receives. */
	private static function confirm_receipt( string $email, string $language ): void {
		if ( '' === self::notify_address() ) {
			// Same rule as before: with no mail configured at all, the record
			// is stored and nothing is sent.
			return;
		}
		$subject = elcorix_translate_string( __( 'We received your message', 'elcorix' ), $language );
		$body    = elcorix_translate_string(
			__(
				'Thank you for your message! We will get back to you as soon as possible, usually within one business day.',
				'elcorix'
			),
			$language
		);

		wp_mail(
			$email,
			$subject . ' — ' . Elcorix_Settings::get( 'name' ),
			$body . "\n\n" . self::signature()
		);
	}

	/**
	 * @param array<string,mixed> $request
	 */
	public static function notify_booking( array $request ): void {
		$to = self::notify_address();
		if ( '' === $to ) {
			return;
		}

		wp_mail(
			$to,
			sprintf(
				/* translators: %s: customer name */
				__( 'New booking request from %s', 'elcorix' ),
				$request['customerName']
			),
			sprintf(
				"Name: %s\nPhone: %s\nService: %s\nPreferred: %s\nMarketing opt-in: %s\n\n%s",
				$request['customerName'],
				$request['customerPhone'],
				'' !== (string) $request['service'] ? $request['service'] : '—',
				'' !== (string) $request['preferredAt'] ? $request['preferredAt'] : '—',
				$request['marketingConsent'] ? 'yes' : 'no',
				'Please follow up and enter the appointment in Altegio.'
			)
		);
	}
}
