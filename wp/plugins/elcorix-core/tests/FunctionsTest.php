<?php
/**
 * The rules that decide whether a visitor's request is accepted, what a
 * price looks like, and where a booking URL points.
 *
 * Every case here is a port of an assertion the Vitest suite made against
 * the React client or the Express API. If one of these fails, the
 * WordPress build has drifted from the behaviour the old site shipped —
 * that is the whole point of keeping them.
 */

declare( strict_types = 1 );

use PHPUnit\Framework\TestCase;

final class FunctionsTest extends TestCase {

	/* ---------------------------------------------------------------- */
	/* Altegio company id                                                */
	/* ---------------------------------------------------------------- */

	public function testCompanyIdAcceptsDigits(): void {
		$this->assertSame( '123456', elcorix_sanitize_company_id( '123456' ) );
		$this->assertSame( '7', elcorix_sanitize_company_id( '7' ) );
		$this->assertSame( '123456789012', elcorix_sanitize_company_id( '123456789012' ) );
	}

	/**
	 * The id is interpolated into the booking URL, which fronts the payment
	 * flow — a malformed value must never produce an unexpected host.
	 */
	public function testCompanyIdRejectsAnythingElse(): void {
		foreach ( array( '', 'abc', '12a', '1234567890123', 'evil.com', '../x', null, 42 ) as $raw ) {
			$this->assertSame( '000000', elcorix_sanitize_company_id( $raw ) );
		}
	}

	public function testBookingUrlUsesTheCompanySubdomain(): void {
		$this->assertSame( 'https://n123456.alteg.io', elcorix_booking_url_for( '123456' ) );
		$this->assertSame(
			'https://n000000.alteg.io',
			elcorix_booking_url_for( elcorix_sanitize_company_id( 'evil.com' ) )
		);
	}

	/* ---------------------------------------------------------------- */
	/* Phone numbers                                                     */
	/* ---------------------------------------------------------------- */

	public function testPhoneAcceptsHowPeopleActuallyWriteNumbers(): void {
		foreach (
			array(
				'+49 155 625 14 872',
				'0155/6251487',
				'(0049) 155 625-14-872',
				'+49.155.6251487',
				'0155 625 1487',
			) as $value
		) {
			$this->assertTrue( elcorix_is_valid_phone( $value ), $value );
		}
	}

	public function testPhoneRejectsNonsense(): void {
		foreach ( array( '', '   ', 'asdf', '12', '+', '12345678901234567', '+49 155 abc', null, 49155 ) as $value ) {
			$this->assertFalse( elcorix_is_valid_phone( $value ), var_export( $value, true ) );
		}
	}

	public function testPhoneRejectsOverlongInput(): void {
		$this->assertFalse( elcorix_is_valid_phone( str_repeat( '1', 51 ) ) );
	}

	public function testTelHrefDropsTheDisplaySpacing(): void {
		$this->assertSame( 'tel:+4915562514872', elcorix_tel_href( '+49 155 625 14 872' ) );
	}

	/* ---------------------------------------------------------------- */
	/* Preferred appointment slot                                        */
	/* ---------------------------------------------------------------- */

	private const NOW = 1789000000; // 2026-09-09T… UTC

	public function testPreferredAtAcceptsADateWithAndWithoutATime(): void {
		$this->assertNull( elcorix_validate_preferred_at( '2026-09-15', self::NOW ) );
		$this->assertNull( elcorix_validate_preferred_at( '2026-09-15 10:30', self::NOW ) );
		$this->assertNull( elcorix_validate_preferred_at( '2026-09-15 23:59', self::NOW ) );
	}

	public function testPreferredAtRejectsMalformedValues(): void {
		foreach ( array( '', '14:00', '15.09.2026', '2026-9-15', '2026-09-15T10:30', '2026-09-15 24:00', '2026-09-15 10:60' ) as $value ) {
			$this->assertNotNull( elcorix_validate_preferred_at( $value, self::NOW ), $value );
		}
	}

	public function testPreferredAtRejectsImpossibleDates(): void {
		$this->assertSame(
			'preferredAt is not a real date',
			elcorix_validate_preferred_at( '2026-02-30', self::NOW )
		);
		$this->assertSame(
			'preferredAt is not a real date',
			elcorix_validate_preferred_at( '2026-13-01', self::NOW )
		);
	}

	/**
	 * The comparison is against midnight of the requested day minus a day
	 * of slack, so today always passes however far into it the request
	 * arrives — a visitor in a time zone behind the server is not told
	 * their own date is in the past. Anything genuinely past is rejected.
	 */
	public function testPreferredAtAcceptsTodayAndRejectsThePast(): void {
		$today    = gmdate( 'Y-m-d', self::NOW );
		$lastWeek = gmdate( 'Y-m-d', self::NOW - 7 * 86400 );

		$this->assertNull( elcorix_validate_preferred_at( $today, self::NOW ) );
		$this->assertSame(
			'preferredAt is in the past',
			elcorix_validate_preferred_at( $lastWeek, self::NOW )
		);

		// The slack really is a day wide: at midnight exactly, yesterday is
		// still inside it.
		$midnight = (int) gmmktime( 0, 0, 0, (int) gmdate( 'n', self::NOW ), (int) gmdate( 'j', self::NOW ), (int) gmdate( 'Y', self::NOW ) );
		$this->assertNull(
			elcorix_validate_preferred_at( gmdate( 'Y-m-d', $midnight - 86400 ), $midnight )
		);
	}

	/* ---------------------------------------------------------------- */
	/* Contact validation                                                */
	/* ---------------------------------------------------------------- */

	public function testContactAcceptsACompleteMessage(): void {
		$this->assertNull(
			elcorix_validate_contact(
				array(
					'name'    => 'Anna',
					'email'   => 'anna@example.com',
					'message' => 'I would like an appointment.',
				)
			)
		);
	}

	public function testContactRequiresEveryField(): void {
		$this->assertSame( 'Name is required', elcorix_validate_contact( array( 'name' => '  ' ) ) );
		$this->assertSame(
			'A valid e-mail is required',
			elcorix_validate_contact( array( 'name' => 'Anna', 'email' => 'not-an-email' ) )
		);
		$this->assertSame(
			'Message is required',
			elcorix_validate_contact( array( 'name' => 'Anna', 'email' => 'a@b.co', 'message' => '' ) )
		);
		$this->assertSame( 'Invalid body', elcorix_validate_contact( 'nope' ) );
	}

	/** The 5000-character limit the 32 kB body cap was sized for. */
	public function testContactEnforcesLengthLimits(): void {
		$base = array( 'name' => 'Anna', 'email' => 'anna@example.com', 'message' => 'Hi' );

		$this->assertSame(
			'Name is too long',
			elcorix_validate_contact( array_merge( $base, array( 'name' => str_repeat( 'a', 201 ) ) ) )
		);
		$this->assertSame(
			'Message is too long',
			elcorix_validate_contact( array_merge( $base, array( 'message' => str_repeat( 'a', 5001 ) ) ) )
		);
		$this->assertNull(
			elcorix_validate_contact( array_merge( $base, array( 'message' => str_repeat( 'a', 5000 ) ) ) )
		);
	}

	/* ---------------------------------------------------------------- */
	/* Booking validation                                                */
	/* ---------------------------------------------------------------- */

	public function testBookingAcceptsAMinimalRequest(): void {
		$this->assertNull(
			elcorix_validate_booking(
				array(
					'customerName'  => 'Anna',
					'customerPhone' => '+49 155 1234567',
				),
				self::NOW
			)
		);
	}

	public function testBookingChecksNamePhoneAndSlot(): void {
		$this->assertSame(
			'customerName is required',
			elcorix_validate_booking( array( 'customerPhone' => '+49 155 1234567' ), self::NOW )
		);
		$this->assertSame(
			'customerPhone is invalid',
			elcorix_validate_booking(
				array( 'customerName' => 'Anna', 'customerPhone' => 'asdf' ),
				self::NOW
			)
		);
		$this->assertSame(
			'preferredAt is in the past',
			elcorix_validate_booking(
				array(
					'customerName'  => 'Anna',
					'customerPhone' => '+49 155 1234567',
					'preferredAt'   => '2020-01-01',
				),
				self::NOW
			)
		);
	}

	public function testBookingRejectsWrongTypes(): void {
		$base = array( 'customerName' => 'Anna', 'customerPhone' => '+49 155 1234567' );

		$this->assertSame(
			'preferredAt must be a string',
			elcorix_validate_booking( array_merge( $base, array( 'preferredAt' => 5 ) ), self::NOW )
		);
		$this->assertSame(
			'marketingConsent must be a boolean',
			elcorix_validate_booking( array_merge( $base, array( 'marketingConsent' => 'yes' ) ), self::NOW )
		);
	}

	/** An empty preferred slot is "no preference", not an error. */
	public function testBookingTreatsAnEmptySlotAsNoPreference(): void {
		$this->assertNull(
			elcorix_validate_booking(
				array(
					'customerName'  => 'Anna',
					'customerPhone' => '+49 155 1234567',
					'preferredAt'   => '   ',
				),
				self::NOW
			)
		);
	}

	/* ---------------------------------------------------------------- */
	/* Honeypot                                                          */
	/* ---------------------------------------------------------------- */

	public function testHoneypotFiresOnlyWhenTheHiddenFieldIsFilled(): void {
		$this->assertTrue( elcorix_is_spam( array( 'website' => 'http://spam.example' ) ) );
		$this->assertFalse( elcorix_is_spam( array( 'website' => '' ) ) );
		$this->assertFalse( elcorix_is_spam( array( 'website' => '   ' ) ) );
		$this->assertFalse( elcorix_is_spam( array() ) );
		$this->assertFalse( elcorix_is_spam( null ) );
	}

	/* ---------------------------------------------------------------- */
	/* Prices                                                            */
	/* ---------------------------------------------------------------- */

	/**
	 * Pinned character for character against what Intl.NumberFormat
	 * produced for the React price tables — including the non-breaking
	 * spaces, and the fact that Ukrainian spells the currency out rather
	 * than using the symbol.
	 */
	public function testPriceFormattingMatchesTheReactOutput(): void {
		$nbsp = "\u{00A0}";

		$this->assertSame( '39' . $nbsp . '€', elcorix_format_price( 'de', 39 ) );
		$this->assertSame( '1.889' . $nbsp . '€', elcorix_format_price( 'de', 1889 ) );
		$this->assertSame( '€39', elcorix_format_price( 'en', 39 ) );
		$this->assertSame( '€1,889', elcorix_format_price( 'en', 1889 ) );
		$this->assertSame( '39' . $nbsp . 'EUR', elcorix_format_price( 'uk', 39 ) );
		$this->assertSame( '1' . $nbsp . '889' . $nbsp . 'EUR', elcorix_format_price( 'uk', 1889 ) );
	}

	public function testPricesNeverShowCents(): void {
		foreach ( array( 'de', 'en', 'uk' ) as $language ) {
			$this->assertStringNotContainsString( ',00', elcorix_format_price( $language, 189 ) );
			$this->assertStringNotContainsString( '.00', elcorix_format_price( $language, 189 ) );
		}
	}

	/** A regional variant is still the same language for pricing. */
	public function testPriceFormattingAcceptsLocaleTags(): void {
		$this->assertSame(
			elcorix_format_price( 'de', 109 ),
			elcorix_format_price( 'de_DE', 109 )
		);
		$this->assertSame(
			elcorix_format_price( 'en', 109 ),
			elcorix_format_price( 'en-GB', 109 )
		);
	}

	/* ---------------------------------------------------------------- */
	/* Titles, locales, slots, images                                    */
	/* ---------------------------------------------------------------- */

	public function testTitleRuleFlipsOnTheLandingPage(): void {
		$this->assertSame(
			'elcorix — Permanent laser hair removal in Kempten',
			elcorix_compose_title( '/', 'Permanent laser hair removal in Kempten', 'elcorix' )
		);
		$this->assertSame(
			'Price list — elcorix',
			elcorix_compose_title( '/prices', 'Price list', 'elcorix' )
		);
	}

	/** Open Graph wants language_TERRITORY; a bare "de" is ignored. */
	public function testOpenGraphLocales(): void {
		$this->assertSame( 'de_DE', elcorix_og_locale_for( 'de' ) );
		$this->assertSame( 'en_GB', elcorix_og_locale_for( 'en' ) );
		$this->assertSame( 'uk_UA', elcorix_og_locale_for( 'uk' ) );
		$this->assertSame( 'de_DE', elcorix_og_locale_for( null ) );
		$this->assertSame( 'de_DE', elcorix_og_locale_for( 'fr' ) );
		$this->assertSame( 'en_GB', elcorix_og_locale_for( 'en-US' ) );
	}

	public function testTimeSlotsRunFromOpeningToHalfAnHourBeforeClose(): void {
		$slots = elcorix_time_slots();

		$this->assertSame( '09:00', $slots[0] );
		$this->assertSame( '18:30', end( $slots ) );
		$this->assertCount( 20, $slots );
		$this->assertContains( '13:30', $slots );
		$this->assertNotContains( '19:00', $slots );
	}

	public function testWebPTwinIsDerivedFromTheSourcePath(): void {
		$this->assertSame( 'hero.webp', elcorix_webp_for( 'hero.jpg' ) );
		$this->assertSame( 'certificate.webp', elcorix_webp_for( 'certificate.png' ) );
		$this->assertSame( 'a.webp', elcorix_webp_for( 'a.JPEG' ) );
		// Already WebP, or something else entirely: left alone.
		$this->assertSame( 'hero.webp', elcorix_webp_for( 'hero.webp' ) );
		$this->assertSame( 'logo.svg', elcorix_webp_for( 'logo.svg' ) );
	}

	/* ---------------------------------------------------------------- */
	/* Structured data                                                   */
	/* ---------------------------------------------------------------- */

	/** @return array<string,mixed> */
	private function business(): array {
		return array(
			'name'         => 'elcorix',
			'siteUrl'      => 'https://elcorix.com',
			'phone'        => '+49 155 625 14 872',
			'email'        => 'info@elcorix.com',
			'address'      => 'Bodmanstraße 14, 87435 Kempten (Allgäu), Germany',
			'instagram'    => 'https://instagram.com/elcorix',
			'geo'          => array( 'latitude' => 47.72538, 'longitude' => 10.30913 ),
			'openingHours' => array(
				array(
					'days'   => array( 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ),
					'opens'  => '09:00',
					'closes' => '19:00',
				),
			),
		);
	}

	public function testJsonLdSplitsTheAddressTheWayGoogleWantsIt(): void {
		$data = elcorix_local_business_jsonld( $this->business(), 'https://n123456.alteg.io' );

		$this->assertSame( 'BeautySalon', $data['@type'] );
		$this->assertSame( 'Bodmanstraße 14', $data['address']['streetAddress'] );
		$this->assertSame( '87435', $data['address']['postalCode'] );
		$this->assertSame( 'Kempten (Allgäu)', $data['address']['addressLocality'] );
		$this->assertSame( 'DE', $data['address']['addressCountry'] );
	}

	public function testJsonLdCarriesOpeningHoursAndTheBookingAction(): void {
		$data = elcorix_local_business_jsonld( $this->business(), 'https://n123456.alteg.io' );

		$this->assertCount( 1, $data['openingHoursSpecification'] );
		$this->assertCount( 5, $data['openingHoursSpecification'][0]['dayOfWeek'] );
		$this->assertSame( '09:00', $data['openingHoursSpecification'][0]['opens'] );
		$this->assertSame( 'https://n123456.alteg.io', $data['potentialAction']['target'] );
		$this->assertSame( 47.72538, $data['geo']['latitude'] );
	}

	/**
	 * The JSON-LD is printed inside a <script>, so a literal "</script>" in
	 * any field would end the block early. JSON_HEX_TAG is what inc/seo.php
	 * relies on; check the encoder actually neutralises it.
	 */
	public function testJsonLdCannotEscapeItsScriptTag(): void {
		$business         = $this->business();
		$business['name'] = 'elcorix</script><script>alert(1)</script>';

		$json = json_encode(
			elcorix_local_business_jsonld( $business, 'https://n1.alteg.io' ),
			JSON_HEX_TAG | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
		);

		$this->assertIsString( $json );
		$this->assertStringNotContainsString( '</script>', $json );
		$this->assertStringNotContainsString( '<script>', $json );
	}

	/* ---------------------------------------------------------------- */
	/* Map                                                               */
	/* ---------------------------------------------------------------- */

	public function testMapUrlBoxesTheStudioCoordinates(): void {
		$url = elcorix_map_embed_url( 47.72538, 10.30913 );

		$this->assertStringStartsWith( 'https://www.openstreetmap.org/export/embed.html?bbox=', $url );
		$this->assertStringContainsString( 'marker=47.72538,10.30913', $url );
		$this->assertStringContainsString( 'layer=mapnik', $url );
	}
}
