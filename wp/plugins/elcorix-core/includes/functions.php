<?php
/**
 * Pure helpers shared by the REST endpoints, the theme templates and the
 * seeder.
 *
 * Nothing in this file touches WordPress, the database or the network, so
 * every rule the React/Express build enforced can be unit-tested here the
 * same way it was there (`tests/FunctionsTest.php`). The comments name the
 * module each rule was ported from.
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) && ! defined( 'ELCORIX_TESTING' ) ) {
	exit;
}

/**
 * Altegio company id from a raw setting, or "000000" when it is unset or
 * malformed. Digits only: the id is interpolated into the booking/payment
 * URL, so a malformed value must never produce an unexpected host.
 *
 * Ported from client/src/business.ts (sanitizeCompanyId) and
 * server/src/routes/bookings.ts (altegioCompanyId) — the two agreed, and
 * this is now the single copy.
 */
function elcorix_sanitize_company_id( $raw ): string {
	return is_string( $raw ) && preg_match( '/^\d{1,12}$/', $raw ) === 1 ? $raw : '000000';
}

function elcorix_booking_url_for( string $company_id ): string {
	return 'https://n' . $company_id . '.alteg.io';
}

/**
 * Phone-number check for the consultation request (form + REST).
 *
 * Deliberately loose about formatting — visitors write "+49 155 625 14 872",
 * "0155/6251487" or "(0049) 155 625-14-872" — but strict about content: only
 * digits and the punctuation people actually use, and a plausible number of
 * digits (7 to 15, the E.164 maximum). "asdf" or "12" do not pass.
 *
 * Ported from client/src/phone.ts and server/src/phone.ts.
 */
function elcorix_is_valid_phone( $value ): bool {
	if ( ! is_string( $value ) ) {
		return false;
	}
	$trimmed = trim( $value );
	if ( '' === $trimmed || strlen( $trimmed ) > 50 ) {
		return false;
	}
	if ( preg_match( '#^\+?[\d\s()./-]+$#', $trimmed ) !== 1 ) {
		return false;
	}
	$digits = preg_replace( '/\D/', '', $trimmed );
	$length = strlen( (string) $digits );

	return $length >= 7 && $length <= 15;
}

/** `tel:` href without the spaces the display format carries. */
function elcorix_tel_href( string $phone ): string {
	return 'tel:' . preg_replace( '/\s/', '', $phone );
}

/**
 * The preferred slot is a customer wish, not a confirmed appointment — the
 * real booking is made in Altegio — but it still has to be a slot a human
 * can act on. A bare time with no day ("14:00") is meaningless to staff,
 * and a date in the past is always a mistake, so both are rejected here
 * rather than stored.
 *
 * The visitor's clock may legitimately be a day ahead of the server's, so
 * "yesterday" in UTC is still accepted; anything older is not.
 *
 * Ported from server/src/routes/bookings.ts (validatePreferredAt).
 *
 * @param int|null $now Unix timestamp to compare against; defaults to now.
 * @return string|null Error message, or null when the value is acceptable.
 */
function elcorix_validate_preferred_at( string $value, ?int $now = null ): ?string {
	$matched = preg_match(
		'/^(\d{4})-(\d{2})-(\d{2})(?: ([01]\d|2[0-3]):([0-5]\d))?$/',
		$value,
		$parts
	);
	if ( 1 !== $matched ) {
		return 'preferredAt must be YYYY-MM-DD, optionally followed by HH:MM';
	}

	list( , $year, $month, $day ) = $parts;
	if ( ! checkdate( (int) $month, (int) $day, (int) $year ) ) {
		return 'preferredAt is not a real date';
	}

	$day_ms    = 24 * 60 * 60;
	$timestamp = gmmktime( 0, 0, 0, (int) $month, (int) $day, (int) $year );
	$now       = $now ?? time();
	if ( $timestamp < $now - $day_ms ) {
		return 'preferredAt is in the past';
	}

	return null;
}

/**
 * Contact-form validation, ported from server/src/routes/contact.ts
 * (validateContact). The limits are the same, including the 5000-character
 * message the 32 kB body limit was sized for.
 *
 * @param array<string,mixed> $body
 * @return string|null Error message, or null when the body is acceptable.
 */
function elcorix_validate_contact( $body ): ?string {
	if ( ! is_array( $body ) ) {
		return 'Invalid body';
	}
	$name    = $body['name'] ?? null;
	$email   = $body['email'] ?? null;
	$message = $body['message'] ?? null;

	if ( ! is_string( $name ) || '' === trim( $name ) ) {
		return 'Name is required';
	}
	if ( strlen( $name ) > 200 ) {
		return 'Name is too long';
	}
	if ( ! is_string( $email ) || preg_match( '/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email ) !== 1 ) {
		return 'A valid e-mail is required';
	}
	if ( strlen( $email ) > 320 ) {
		return 'E-mail is too long';
	}
	if ( ! is_string( $message ) || '' === trim( $message ) ) {
		return 'Message is required';
	}
	if ( strlen( $message ) > 5000 ) {
		return 'Message is too long';
	}

	return null;
}

/**
 * Booking-request validation, ported from server/src/routes/bookings.ts.
 *
 * @param array<string,mixed> $body
 * @return string|null Error message, or null when the body is acceptable.
 */
function elcorix_validate_booking( $body, ?int $now = null ): ?string {
	if ( ! is_array( $body ) ) {
		return 'Invalid body';
	}
	$name    = $body['customerName'] ?? null;
	$phone   = $body['customerPhone'] ?? null;
	$service = $body['service'] ?? null;

	if ( ! is_string( $name ) || '' === trim( $name ) ) {
		return 'customerName is required';
	}
	if ( strlen( $name ) > 200 ) {
		return 'customerName is too long';
	}
	if ( ! is_string( $phone ) || '' === trim( $phone ) ) {
		return 'customerPhone is required';
	}
	if ( strlen( $phone ) > 50 ) {
		return 'customerPhone is too long';
	}
	// Same rule as the form — the form check is a courtesy, this one is the
	// guarantee.
	if ( ! elcorix_is_valid_phone( $phone ) ) {
		return 'customerPhone is invalid';
	}
	if ( is_string( $service ) && strlen( $service ) > 200 ) {
		return 'service is too long';
	}

	$preferred = $body['preferredAt'] ?? null;
	if ( null !== $preferred && ! is_string( $preferred ) ) {
		return 'preferredAt must be a string';
	}
	$preferred = is_string( $preferred ) ? trim( $preferred ) : '';
	if ( '' !== $preferred ) {
		if ( strlen( $preferred ) > 40 ) {
			return 'preferredAt is too long';
		}
		$error = elcorix_validate_preferred_at( $preferred, $now );
		if ( null !== $error ) {
			return $error;
		}
	}

	$marketing = $body['marketingConsent'] ?? null;
	if ( null !== $marketing && ! is_bool( $marketing ) ) {
		return 'marketingConsent must be a boolean';
	}

	return null;
}

/**
 * True when the hidden honeypot field was filled in — i.e. a spam bot.
 * Both endpoints answer such a request exactly like a success, so bots
 * never learn they were filtered, and store nothing.
 *
 * Ported from server/src/routes/contact.ts (isSpam).
 */
function elcorix_is_spam( $body ): bool {
	if ( ! is_array( $body ) ) {
		return false;
	}
	$website = $body['website'] ?? null;

	return is_string( $website ) && '' !== trim( $website );
}

/**
 * A price, exactly as `Intl.NumberFormat(lang, { style: "currency",
 * currency: "EUR", maximumFractionDigits: 0 })` rendered it in the React
 * price tables:
 *
 *   de  "39 €"   "1.889 €"   (non-breaking space before the symbol)
 *   en  "€39"    "€1,889"
 *   uk  "39 EUR" "1 889 EUR" (Ukrainian spells the currency out, and
 *                             groups thousands with a non-breaking space)
 *
 * Written out rather than handed to ext-intl on purpose. `NumberFormatter`
 * gives the right answer only with a full ICU data set; on a build with a
 * trimmed one it quietly falls back to "39 EUR" for every language, which
 * would change the German price list without failing anything. The rules
 * for three fixed locales fit in ten lines, so they live here where a test
 * can pin them.
 */
function elcorix_format_price( string $language, $amount ): string {
	$language = strtolower( substr( $language, 0, 2 ) );
	$amount   = (int) round( (float) $amount );
	$nbsp     = "\u{00A0}";

	if ( 'en' === $language ) {
		return '€' . number_format( $amount, 0, '.', ',' );
	}

	if ( 'uk' === $language ) {
		return number_format( $amount, 0, ',', $nbsp ) . $nbsp . 'EUR';
	}

	return number_format( $amount, 0, ',', '.' ) . $nbsp . '€';
}

/**
 * "elcorix — <page>" on the landing page, "<page> — elcorix" elsewhere.
 * Ported from client/src/seo/meta.ts (composeTitle) — the rule the
 * prerendered head and the runtime head shared.
 */
function elcorix_compose_title( string $path, string $page_title, string $business_name ): string {
	return '/' === $path
		? $business_name . ' — ' . $page_title
		: $page_title . ' — ' . $business_name;
}

/**
 * Open Graph wants language_TERRITORY, not a bare language subtag — a
 * plain "de" is silently ignored by the scrapers that read it.
 */
function elcorix_og_locale_for( ?string $language ): string {
	$locales = array(
		'de' => 'de_DE',
		'en' => 'en_GB',
		'uk' => 'uk_UA',
	);
	$key = strtolower( substr( (string) ( $language ?? 'de' ), 0, 2 ) );

	return $locales[ $key ] ?? 'de_DE';
}

/**
 * "09:00", "09:30", … "18:30" — appointments start on the half hour only.
 * Opening hours are 09:00–19:00; the last slot starts half an hour before
 * close. Ported from client/src/components/ConsultationForm.tsx.
 *
 * @return string[]
 */
function elcorix_time_slots(): array {
	$first = 9 * 60;
	$last  = 18 * 60 + 30;
	$step  = 30;

	$slots = array();
	for ( $minutes = $first; $minutes <= $last; $minutes += $step ) {
		$slots[] = sprintf( '%02d:%02d', intdiv( $minutes, 60 ), $minutes % 60 );
	}

	return $slots;
}

/**
 * The WebP twin of a committed JPEG/PNG. Every photo ships in both formats,
 * so the WebP path is derived rather than registered twice and the two can
 * never drift apart.
 *
 * Ported from client/src/components/Photo.tsx (webpFor).
 */
function elcorix_webp_for( string $src ): string {
	return preg_replace( '/\.(jpe?g|png)$/i', '.webp', $src ) ?? $src;
}

/**
 * schema.org LocalBusiness data for Google's local results.
 * Ported from client/src/seo/staticHead.ts (localBusinessJsonLd).
 *
 * @param array<string,mixed> $business
 * @return array<string,mixed>
 */
function elcorix_local_business_jsonld( array $business, string $booking_url ): array {
	$address_parts = explode( ', ', (string) ( $business['address'] ?? '' ) );
	$street        = $address_parts[0] ?? '';
	$city_line     = $address_parts[1] ?? '';
	$city_parts    = explode( ' ', $city_line );
	$postal_code   = array_shift( $city_parts );

	$hours = array();
	foreach ( (array) ( $business['openingHours'] ?? array() ) as $slot ) {
		$hours[] = array(
			'@type'     => 'OpeningHoursSpecification',
			'dayOfWeek' => array_values( (array) $slot['days'] ),
			'opens'     => $slot['opens'],
			'closes'    => $slot['closes'],
		);
	}

	return array(
		'@context'   => 'https://schema.org',
		'@type'      => 'BeautySalon',
		'name'       => $business['name'],
		'url'        => $business['siteUrl'],
		'image'      => rtrim( (string) $business['siteUrl'], '/' ) . '/images/hero.jpg',
		'telephone'  => $business['phone'],
		'email'      => $business['email'],
		'address'    => array(
			'@type'           => 'PostalAddress',
			'streetAddress'   => $street,
			'postalCode'      => (string) $postal_code,
			'addressLocality' => implode( ' ', $city_parts ),
			'addressCountry'  => 'DE',
		),
		'geo'        => array(
			'@type'     => 'GeoCoordinates',
			'latitude'  => (float) $business['geo']['latitude'],
			'longitude' => (float) $business['geo']['longitude'],
		),
		'openingHoursSpecification' => $hours,
		'sameAs'                    => array( $business['instagram'] ),
		'potentialAction'           => array(
			'@type'  => 'ReserveAction',
			'target' => $booking_url,
		),
	);
}

/**
 * OpenStreetMap embed URL for the studio's coordinates — the same bounding
 * box the React <MapEmbed> computed (±0.006° lon, ±0.003° lat).
 */
function elcorix_map_embed_url( float $latitude, float $longitude ): string {
	$bbox = implode(
		',',
		array(
			$longitude - 0.006,
			$latitude - 0.003,
			$longitude + 0.006,
			$latitude + 0.003,
		)
	);

	return 'https://www.openstreetmap.org/export/embed.html?bbox=' . $bbox
		. '&layer=mapnik&marker=' . $latitude . ',' . $longitude;
}
