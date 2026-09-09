<?php
/**
 * The business data that is NOT translatable — name, owner, address,
 * phone, e-mail, Instagram, WhatsApp, coordinates, opening hours, the
 * Altegio company id and the notification/retention settings.
 *
 * In the React build this lived in `client/src/business.ts` and had to be
 * changed by editing code and rebuilding. Here it is one options page
 * under Settings → elcorix, and every template reads it through
 * `Elcorix_Settings::business()`, which returns the same shape the old
 * `staticBusiness` object had so the ported templates read unchanged.
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Elcorix_Settings {

	public const OPTION = 'elcorix_business';

	/**
	 * Field definitions: key => [label, type, description].
	 * `type` drives both the admin control and the sanitizer.
	 *
	 * @return array<string,array{0:string,1:string,2:string}>
	 */
	public static function fields(): array {
		return array(
			'name'            => array( 'Business name', 'text', 'Shown in the wordmark, the page titles and the JSON-LD.' ),
			'owner'           => array( 'Owner / legal name', 'text', 'Required in the German Impressum.' ),
			'vatId'           => array( 'VAT ID', 'text', 'Umsatzsteuer-ID, shown on the Impressum page.' ),
			'address'         => array( 'Full address', 'text', 'Street, then "postcode City (Region), Country" — the JSON-LD splits on the comma.' ),
			'addressShort'    => array( 'Short address', 'text', 'The form used in the contact block, as in the Figma.' ),
			'phone'           => array( 'Phone', 'text', 'Display format; the tel: link strips the spaces.' ),
			'email'           => array( 'E-mail', 'email', '' ),
			'instagram'       => array( 'Instagram URL', 'url', '' ),
			'instagramHandle' => array( 'Instagram handle', 'text', '' ),
			'whatsapp'        => array( 'WhatsApp link', 'url', 'wa.me deep link — digits only, international format, no "+". Must match the phone above.' ),
			'siteUrl'         => array( 'Canonical site URL', 'url', 'Used for canonicals, Open Graph and JSON-LD. Keep robots.txt and the sitemap in step.' ),
			'latitude'        => array( 'Latitude', 'float', 'Studio coordinates for the map and the JSON-LD.' ),
			'longitude'       => array( 'Longitude', 'float', '' ),
			'openingDays'     => array( 'Opening days', 'text', 'Comma-separated English day names for the JSON-LD, e.g. "Tuesday, Wednesday, …". The human-readable line stays translated.' ),
			'opens'           => array( 'Opens', 'text', '24h "HH:MM".' ),
			'closes'          => array( 'Closes', 'text', '24h "HH:MM".' ),
			'altegioCompanyId' => array( 'Altegio company id', 'text', 'Digits only (Altegio → Settings → Online booking). Anything else falls back to 000000.' ),
			'notifyEmail'     => array( 'Notification e-mail', 'email', 'Where contact messages and booking requests are sent. Empty = store only.' ),
			'retentionMonths' => array( 'Retention (months)', 'int', 'Stored messages and requests are deleted after this many months — the promise the privacy policy makes. Default 12.' ),
		);
	}

	/**
	 * The defaults are the values the React build shipped with, so a fresh
	 * install renders the identical site before anything is edited.
	 *
	 * @return array<string,string|float|int>
	 */
	public static function defaults(): array {
		return array(
			'name'             => 'elcorix',
			'owner'            => 'Elena Musterfrau',
			'vatId'            => 'DE000000000',
			'address'          => 'Bodmanstraße 14, 87435 Kempten (Allgäu), Germany',
			'addressShort'     => 'Bodmanstraße 14, Kempten',
			'phone'            => '+49 155 625 14 872',
			'email'            => 'info@elcorix.com',
			'instagram'        => 'https://instagram.com/elcorix',
			'instagramHandle'  => '@elcorix',
			'whatsapp'         => 'https://wa.me/4915562514872',
			'siteUrl'          => 'https://elcorix.com',
			'latitude'         => 47.72538,
			'longitude'        => 10.30913,
			'openingDays'      => 'Tuesday, Wednesday, Thursday, Friday, Saturday',
			'opens'            => '09:00',
			'closes'           => '19:00',
			'altegioCompanyId' => '000000',
			'notifyEmail'      => '',
			'retentionMonths'  => 12,
		);
	}

	/** @return array<string,mixed> */
	public static function all(): array {
		$stored = get_option( self::OPTION, array() );

		return array_merge( self::defaults(), is_array( $stored ) ? $stored : array() );
	}

	public static function get( string $key ) {
		$all = self::all();

		return $all[ $key ] ?? null;
	}

	/**
	 * The same shape `staticBusiness` had in client/src/business.ts, plus
	 * the derived Altegio fields `config.ts` added — so a ported template
	 * reads `$business['addressShort']` exactly where it read
	 * `business.addressShort`.
	 *
	 * @return array<string,mixed>
	 */
	public static function business(): array {
		$all        = self::all();
		$company_id = elcorix_sanitize_company_id( (string) $all['altegioCompanyId'] );

		$days = array_values(
			array_filter(
				array_map( 'trim', explode( ',', (string) $all['openingDays'] ) )
			)
		);

		return array(
			'name'             => (string) $all['name'],
			'owner'            => (string) $all['owner'],
			'vatId'            => (string) $all['vatId'],
			'address'          => (string) $all['address'],
			'addressShort'     => (string) $all['addressShort'],
			'phone'            => (string) $all['phone'],
			'email'            => (string) $all['email'],
			'instagram'        => (string) $all['instagram'],
			'instagramHandle'  => (string) $all['instagramHandle'],
			'whatsapp'         => (string) $all['whatsapp'],
			'siteUrl'          => untrailingslashit( (string) $all['siteUrl'] ),
			'geo'              => array(
				'latitude'  => (float) $all['latitude'],
				'longitude' => (float) $all['longitude'],
			),
			'openingHours'     => array(
				array(
					'days'   => $days,
					'opens'  => (string) $all['opens'],
					'closes' => (string) $all['closes'],
				),
			),
			'altegioCompanyId' => $company_id,
			'bookingUrl'       => elcorix_booking_url_for( $company_id ),
			'telHref'          => elcorix_tel_href( (string) $all['phone'] ),
			'notifyEmail'      => (string) $all['notifyEmail'],
			'retentionMonths'  => (int) $all['retentionMonths'],
		);
	}

	public static function init(): void {
		add_action( 'admin_menu', array( __CLASS__, 'add_page' ) );
		add_action( 'admin_init', array( __CLASS__, 'register' ) );
	}

	public static function add_page(): void {
		add_options_page(
			__( 'elcorix business data', 'elcorix' ),
			__( 'elcorix', 'elcorix' ),
			'manage_options',
			'elcorix',
			array( __CLASS__, 'render_page' )
		);
	}

	public static function register(): void {
		register_setting(
			'elcorix',
			self::OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( __CLASS__, 'sanitize' ),
				'default'           => self::defaults(),
			)
		);

		add_settings_section(
			'elcorix_business',
			__( 'Business data', 'elcorix' ),
			static function (): void {
				echo '<p>' . esc_html__(
					'Non-translatable business data. Everything visitors read in their own language is edited on the pages themselves, or under Languages → Translations.',
					'elcorix'
				) . '</p>';
			},
			'elcorix'
		);

		foreach ( self::fields() as $key => $field ) {
			list( $label, $type, $description ) = $field;
			add_settings_field(
				'elcorix_' . $key,
				esc_html( $label ),
				array( __CLASS__, 'render_field' ),
				'elcorix',
				'elcorix_business',
				array(
					'key'         => $key,
					'type'        => $type,
					'description' => $description,
					'label_for'   => 'elcorix_' . $key,
				)
			);
		}
	}

	/**
	 * @param array<string,mixed> $args
	 */
	public static function render_field( array $args ): void {
		$all   = self::all();
		$key   = (string) $args['key'];
		$value = $all[ $key ] ?? '';
		$type  = array( 'email' => 'email', 'url' => 'url', 'int' => 'number', 'float' => 'number' )[ $args['type'] ] ?? 'text';

		printf(
			'<input type="%1$s" id="elcorix_%2$s" name="%3$s[%2$s]" value="%4$s" class="regular-text"%5$s />',
			esc_attr( $type ),
			esc_attr( $key ),
			esc_attr( self::OPTION ),
			esc_attr( (string) $value ),
			'float' === $args['type'] ? ' step="0.00001"' : ''
		);
		if ( '' !== $args['description'] ) {
			echo '<p class="description">' . esc_html( (string) $args['description'] ) . '</p>';
		}
	}

	/**
	 * @param mixed $input
	 * @return array<string,mixed>
	 */
	public static function sanitize( $input ): array {
		$input  = is_array( $input ) ? $input : array();
		$output = self::defaults();

		foreach ( self::fields() as $key => $field ) {
			if ( ! array_key_exists( $key, $input ) ) {
				continue;
			}
			$raw = $input[ $key ];
			switch ( $field[1] ) {
				case 'email':
					$output[ $key ] = sanitize_email( (string) $raw );
					break;
				case 'url':
					$output[ $key ] = esc_url_raw( (string) $raw );
					break;
				case 'int':
					$output[ $key ] = max( 1, (int) $raw );
					break;
				case 'float':
					$output[ $key ] = (float) $raw;
					break;
				default:
					$output[ $key ] = sanitize_text_field( (string) $raw );
			}
		}

		// The company id is interpolated into the booking URL, so a
		// malformed value must never leave this form (see
		// elcorix_sanitize_company_id).
		$output['altegioCompanyId'] = elcorix_sanitize_company_id( (string) $output['altegioCompanyId'] );

		return $output;
	}

	public static function render_page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		echo '<div class="wrap"><h1>' . esc_html__( 'elcorix business data', 'elcorix' ) . '</h1><form action="options.php" method="post">';
		settings_fields( 'elcorix' );
		do_settings_sections( 'elcorix' );
		submit_button();
		echo '</form></div>';
	}
}
