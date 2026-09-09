<?php
/**
 * Shortcodes for the legal pages.
 *
 * The Impressum and the privacy policy have to name the operator, the
 * address, the phone number and the e-mail — the same values the contact
 * block shows. In the React build those pages interpolated `business.*`
 * into the translation strings. Here the pages are ordinary editable
 * content, so they interpolate the same values through a shortcode:
 *
 *   [elcorix_business field="phone"]   →  +49 155 625 14 872
 *   [elcorix_business field="email" link="1"]  →  a mailto: link
 *
 * That keeps a legally required detail in exactly one place. Change the
 * phone number under Settings → elcorix and the Impressum follows.
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) && ! defined( 'ELCORIX_TESTING' ) ) {
	exit;
}

/**
 * @param array<string,string>|string $atts
 */
function elcorix_business_shortcode( $atts ): string {
	$atts = shortcode_atts(
		array(
			'field' => 'name',
			'link'  => '0',
		),
		is_array( $atts ) ? $atts : array(),
		'elcorix_business'
	);

	$business = Elcorix_Settings::business();
	$field    = (string) $atts['field'];
	$value    = $business[ $field ] ?? '';

	if ( ! is_string( $value ) || '' === $value ) {
		return '';
	}

	if ( '1' !== (string) $atts['link'] ) {
		return esc_html( $value );
	}

	$href = match ( $field ) {
		'email'     => 'mailto:' . $value,
		'phone'     => $business['telHref'],
		'instagram' => $business['instagram'],
		'whatsapp'  => $business['whatsapp'],
		default     => '',
	};

	if ( '' === $href ) {
		return esc_html( $value );
	}

	return sprintf(
		'<a class="font-medium text-brand-600 underline-offset-4 hover:underline" href="%s">%s</a>',
		esc_url( $href ),
		esc_html( $value )
	);
}
add_shortcode( 'elcorix_business', 'elcorix_business_shortcode' );

/**
 * The year, so a footer or a legal page can say "© 2026" without anyone
 * having to remember to change it in January.
 */
function elcorix_year_shortcode(): string {
	return esc_html( (string) gmdate( 'Y' ) );
}
add_shortcode( 'elcorix_year', 'elcorix_year_shortcode' );
