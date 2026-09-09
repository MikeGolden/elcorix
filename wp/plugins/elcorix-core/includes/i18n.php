<?php
/**
 * Language plumbing.
 *
 * The React build kept all three languages on one URL and switched them in
 * the browser (localStorage `i18nextLng`, German default, English fallback
 * for missing keys). The WordPress build uses Polylang instead, so a
 * language is part of the URL — German at the root (`/prices`), English and
 * Ukrainian under a prefix (`/en/prices`, `/uk/prices`). That is the one
 * deliberate departure from the old behaviour, and it buys real hreflang
 * alternates, which the single-URL design could not have.
 *
 * Every function here degrades to sensible German-only behaviour when
 * Polylang is not active, so the theme still renders on a bare WordPress
 * install (and in the unit tests).
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) && ! defined( 'ELCORIX_TESTING' ) ) {
	exit;
}

/**
 * The languages the site ships, in the order the switcher lists them —
 * the same order and labels the React <LanguageSwitcher> had.
 *
 * @return array<string,array{label:string,locale:string}>
 */
function elcorix_languages(): array {
	return array(
		'en' => array(
			'label'  => 'English',
			'locale' => 'en_GB',
		),
		'de' => array(
			'label'  => 'Deutsch',
			'locale' => 'de_DE',
		),
		'uk' => array(
			'label'  => 'Українська',
			'locale' => 'uk',
		),
	);
}

/**
 * The business is in Kempten, so German is the default when Polylang is
 * absent or has no opinion — matching the old detection chain's last step.
 */
function elcorix_default_language(): string {
	if ( function_exists( 'pll_default_language' ) ) {
		$default = pll_default_language( 'slug' );
		if ( is_string( $default ) && '' !== $default ) {
			return $default;
		}
	}

	return 'de';
}

/** The language slug being rendered. */
function elcorix_current_language(): string {
	if ( function_exists( 'pll_current_language' ) ) {
		$current = pll_current_language( 'slug' );
		if ( is_string( $current ) && '' !== $current ) {
			return $current;
		}
	}

	return elcorix_default_language();
}

/**
 * The default-language original of a post.
 *
 * Numbers, images and ordering are business data: they are stored once, on
 * the original, and every translation reads them from there. Without this
 * the German price list and the Ukrainian one could quietly disagree — the
 * exact failure the old `pricing.ts` / `images.ts` split existed to prevent.
 */
function elcorix_default_language_post( int $post_id ): int {
	if ( ! function_exists( 'pll_get_post' ) ) {
		return $post_id;
	}
	$source = pll_get_post( $post_id, elcorix_default_language() );

	return is_int( $source ) && $source > 0 ? $source : $post_id;
}

/**
 * The home URL for a language, used by the switcher and the hreflang tags.
 * Polylang keeps the current page when a translation exists and falls back
 * to that language's home page when it does not — the behaviour a visitor
 * expects from a switcher.
 */
function elcorix_language_url( string $slug ): string {
	if ( function_exists( 'pll_get_post' ) && is_singular() ) {
		$translated = pll_get_post( get_queried_object_id(), $slug );
		if ( is_int( $translated ) && $translated > 0 ) {
			$permalink = get_permalink( $translated );
			if ( is_string( $permalink ) ) {
				return $permalink;
			}
		}
	}
	if ( function_exists( 'pll_home_url' ) ) {
		return (string) pll_home_url( $slug );
	}

	return home_url( '/' );
}

/**
 * Register the plugin's own strings with Polylang so the studio can
 * translate them under Languages → Translations without touching a .po
 * file. Everything content-shaped already lives in translatable posts;
 * these are the few operational strings that do not.
 */
function elcorix_register_polylang_strings(): void {
	if ( ! function_exists( 'pll_register_string' ) ) {
		return;
	}
	$strings = array(
		'confirmation_subject' => __( 'We received your message', 'elcorix' ),
		'confirmation_body'    => __(
			'Thank you for your message! We will get back to you as soon as possible, usually within one business day.',
			'elcorix'
		),
	);
	foreach ( $strings as $name => $value ) {
		pll_register_string( $name, $value, 'elcorix', true );
	}
}

/**
 * Translate one of the strings above in a given language. Used by the
 * auto-reply mail, which must be written in the visitor's language rather
 * than the language the cron happens to run in.
 */
function elcorix_translate_string( string $value, string $language ): string {
	if ( function_exists( 'pll_translate_string' ) ) {
		$translated = pll_translate_string( $value, $language );
		if ( is_string( $translated ) && '' !== $translated ) {
			return $translated;
		}
	}

	return $value;
}
