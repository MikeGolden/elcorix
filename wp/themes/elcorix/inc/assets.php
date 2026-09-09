<?php
/**
 * What the browser downloads.
 *
 * One stylesheet and two scripts, all first-party — no CDN request, which
 * is both the site's GDPR posture and what the CSP's `'self'` allows.
 *
 * The stylesheet is Tailwind's output for this theme (src/app.css →
 * assets/css/app.css) with the self-hosted Inter and Manrope faces inlined
 * at the top, so a visitor makes one CSS request and then only the font
 * subsets their language actually needs.
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** File modification time as the cache buster, so a rebuild is picked up. */
function elcorix_asset_version( string $relative ): string {
	$path = get_theme_file_path( $relative );

	return file_exists( $path ) ? (string) filemtime( $path ) : ELCORIX_THEME_VERSION;
}

add_action(
	'wp_enqueue_scripts',
	static function (): void {
		wp_enqueue_style(
			'elcorix',
			get_theme_file_uri( 'assets/css/app.css' ),
			array(),
			elcorix_asset_version( 'assets/css/app.css' )
		);

		// Two lines, in <head>, not deferred: it puts `js` on <html> before
		// the first paint so the scroll-reveal start state can apply. Any
		// later and the page would flash its content and then hide it.
		wp_enqueue_script(
			'elcorix-head',
			get_theme_file_uri( 'assets/js/head.js' ),
			array(),
			elcorix_asset_version( 'assets/js/head.js' ),
			array( 'in_footer' => false )
		);

		wp_enqueue_script(
			'elcorix',
			get_theme_file_uri( 'assets/js/app.js' ),
			array(),
			elcorix_asset_version( 'assets/js/app.js' ),
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);

		$business = Elcorix_Settings::business();

		// Everything the behaviour bundle needs to know about this page.
		// wp_localize_script writes it as a JSON blob rather than as markup
		// the scripts would have to scrape.
		wp_localize_script(
			'elcorix',
			'elcorixData',
			array(
				'restUrl'    => esc_url_raw( rest_url( 'elcorix/v1/' ) ),
				'bookingUrl' => $business['bookingUrl'],
				'language'   => elcorix_current_language(),
				'privacyUrl' => elcorix_page_url( 'privacy' ),
				'strings'    => array(
					'lightboxCounter' => __( '%1$d of %2$d', 'elcorix' ),
					'sending'         => __( 'Sending…', 'elcorix' ),
					'phoneError'      => __( 'Please enter a valid phone number, e.g. +49 155 625 14 872.', 'elcorix' ),
					'dateRequired'    => __( 'Please also choose a date for the time you picked.', 'elcorix' ),
					'datePast'        => __( 'Please choose a date that is not in the past.', 'elcorix' ),
				),
			)
		);
	}
);

/**
 * The hero photo is the LCP element and it is rendered halfway down the
 * markup, so the preload scanner would not reach it until the rest of the
 * document had parsed. Preloading it in <head> starts the fetch with the
 * first bytes of HTML — the same trick client/index.html played.
 *
 * Keep this in step with the srcset in template-parts/sections/hero.php.
 */
add_action(
	'wp_head',
	static function (): void {
		if ( ! is_front_page() || ! function_exists( 'elcorix_photo_url' ) ) {
			return;
		}
		$hero = Elcorix_Content::section_image( 'hero', 'image', 'hero.jpg' );
		$url  = ctype_digit( $hero )
			? elcorix_photo_url( $hero )
			: get_theme_file_uri( 'assets/images/' . elcorix_webp_for( $hero ) );

		printf(
			'<link rel="preload" as="image" href="%s" type="image/webp" fetchpriority="high" />' . "\n",
			esc_url( $url )
		);
	},
	1
);

/**
 * Icons, and the flash-free background.
 *
 * The `html { background }` rule matches the page's own surface so there is
 * no white-to-white flash before the stylesheet lands — carried over from
 * client/index.html.
 */
add_action(
	'wp_head',
	static function (): void {
		printf(
			'<link rel="icon" href="%s" type="image/svg+xml" />' . "\n",
			esc_url( get_theme_file_uri( 'assets/favicon.svg' ) )
		);
		printf(
			'<link rel="apple-touch-icon" href="%s" />' . "\n",
			esc_url( get_theme_file_uri( 'assets/apple-touch-icon.png' ) )
		);
		echo '<meta name="theme-color" content="#26397f" />' . "\n";
		// Matches the page's own surface, so there is no flash before the
		// stylesheet lands — carried over from client/index.html.
		echo '<style>html{background-color:#ffffff}</style>' . "\n";
	},
	2
);
