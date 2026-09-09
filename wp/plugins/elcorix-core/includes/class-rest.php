<?php
/**
 * The two write endpoints the site's own forms use.
 *
 * The paths are unchanged from the Express API — `/api/contact`,
 * `/api/bookings`, `/api/bookings/link`, `/api/health` — because the forms,
 * the e2e mocks and any monitoring already point at them. They are
 * registered on the WP REST API under `elcorix/v1` and the old paths are
 * rewritten onto them (see Elcorix_Plugin::add_rewrites), so both spellings
 * answer.
 *
 * Everything the Express routes guaranteed is kept:
 *   - the honeypot answers exactly like a success and stores nothing, so a
 *     bot never learns it was filtered;
 *   - validation rules are byte-for-byte the old ones (functions.php);
 *   - the record is stored before any mail is attempted, and a mail failure
 *     can never turn into a second response;
 *   - writes are rate-limited per IP (30 per 15 minutes by default).
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Elcorix_Rest {

	public const NAMESPACE = 'elcorix/v1';

	/** Express used 30 writes per IP per 15 minutes; so do we. */
	public const RATE_LIMIT  = 30;
	public const RATE_WINDOW = 900;

	public static function init(): void {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/health',
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'health' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/contact',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'contact' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/bookings',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'booking' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/bookings/link',
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'booking_link' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/** Liveness plus a real database round-trip, as the old healthcheck did. */
	public static function health(): WP_REST_Response {
		global $wpdb;

		$ok = (int) $wpdb->get_var( 'SELECT 1' ) === 1;

		return new WP_REST_Response(
			array( 'status' => $ok ? 'ok' : 'degraded' ),
			$ok ? 200 : 503
		);
	}

	public static function booking_link(): WP_REST_Response {
		$business = Elcorix_Settings::business();

		return new WP_REST_Response(
			array(
				'companyId' => $business['altegioCompanyId'],
				'url'       => $business['bookingUrl'],
			)
		);
	}

	/**
	 * A fixed window per IP, kept in a transient. Not as precise as
	 * express-rate-limit's sliding window, but it is the same order of
	 * magnitude and needs nothing beyond the object cache.
	 */
	private static function rate_limited(): bool {
		$ip = isset( $_SERVER['REMOTE_ADDR'] )
			? sanitize_text_field( wp_unslash( (string) $_SERVER['REMOTE_ADDR'] ) )
			: '';
		if ( '' === $ip ) {
			return false;
		}
		$key   = 'elcorix_rl_' . md5( $ip );
		$count = (int) get_transient( $key );
		if ( $count >= self::RATE_LIMIT ) {
			return true;
		}
		set_transient( $key, $count + 1, self::RATE_WINDOW );

		return false;
	}

	private static function too_many(): WP_REST_Response {
		return new WP_REST_Response(
			array( 'error' => 'Too many requests, please try again later' ),
			429
		);
	}

	/**
	 * The request body as a plain array. `get_json_params` covers the
	 * JSON the forms send; `get_body_params` keeps a plain HTML form post
	 * working for visitors with JavaScript disabled.
	 *
	 * @return array<string,mixed>
	 */
	private static function body( WP_REST_Request $request ): array {
		$json = $request->get_json_params();
		if ( is_array( $json ) && array() !== $json ) {
			return $json;
		}
		$body = $request->get_body_params();

		return is_array( $body ) ? $body : array();
	}

	public static function contact( WP_REST_Request $request ): WP_REST_Response {
		$body = self::body( $request );

		// Honeypot: real visitors never see the "website" field. Answer
		// exactly like a success so bots do not learn they were filtered,
		// and store nothing.
		if ( elcorix_is_spam( $body ) ) {
			return new WP_REST_Response( array( 'id' => 0 ), 201 );
		}
		if ( self::rate_limited() ) {
			return self::too_many();
		}

		$error = elcorix_validate_contact( $body );
		if ( null !== $error ) {
			return new WP_REST_Response( array( 'error' => $error ), 400 );
		}

		$message = array(
			'name'    => trim( sanitize_text_field( (string) $body['name'] ) ),
			'email'   => trim( sanitize_email( (string) $body['email'] ) ),
			'message' => trim( sanitize_textarea_field( (string) $body['message'] ) ),
		);

		$id = Elcorix_Store::insert_contact( $message );
		if ( null === $id ) {
			return new WP_REST_Response( array( 'error' => 'Internal server error' ), 500 );
		}

		$language = self::language( $body );
		// After the record is safe, and never able to change the response.
		Elcorix_Mail::notify_contact( $message, $language );

		return new WP_REST_Response( array( 'id' => $id ), 201 );
	}

	public static function booking( WP_REST_Request $request ): WP_REST_Response {
		$body = self::body( $request );

		if ( elcorix_is_spam( $body ) ) {
			return new WP_REST_Response(
				array(
					'id'     => 0,
					'status' => 'pending',
				),
				201
			);
		}
		if ( self::rate_limited() ) {
			return self::too_many();
		}

		$error = elcorix_validate_booking( $body );
		if ( null !== $error ) {
			return new WP_REST_Response( array( 'error' => $error ), 400 );
		}

		$business  = Elcorix_Settings::business();
		$preferred = isset( $body['preferredAt'] ) && is_string( $body['preferredAt'] )
			? trim( $body['preferredAt'] )
			: '';
		$service   = isset( $body['service'] ) && is_string( $body['service'] )
			? trim( sanitize_text_field( $body['service'] ) )
			: '';

		$stored = array(
			'companyId'        => $business['altegioCompanyId'],
			'service'          => '' !== $service ? $service : null,
			'customerName'     => trim( sanitize_text_field( (string) $body['customerName'] ) ),
			'customerPhone'    => trim( sanitize_text_field( (string) $body['customerPhone'] ) ),
			'preferredAt'      => '' !== $preferred ? $preferred : null,
			'marketingConsent' => true === ( $body['marketingConsent'] ?? false ),
		);

		$id = Elcorix_Store::insert_booking( $stored );
		if ( null === $id ) {
			return new WP_REST_Response( array( 'error' => 'Internal server error' ), 500 );
		}

		Elcorix_Mail::notify_booking(
			array_merge(
				$stored,
				array(
					'service'     => (string) ( $stored['service'] ?? '' ),
					'preferredAt' => (string) ( $stored['preferredAt'] ?? '' ),
				)
			)
		);

		return new WP_REST_Response(
			array(
				'id'     => $id,
				'status' => 'pending',
			),
			201
		);
	}

	/**
	 * The language of the auto-reply: what the form sent, if we ship it.
	 *
	 * @param array<string,mixed> $body
	 */
	private static function language( array $body ): string {
		$raw = isset( $body['lang'] ) && is_string( $body['lang'] ) ? $body['lang'] : '';

		return array_key_exists( $raw, elcorix_languages() ) ? $raw : elcorix_default_language();
	}
}
