<?php
/**
 * Theme supports and the small amount of WordPress chrome this design
 * actually wants.
 *
 * The site is a designed one-pager, not a blog: no sidebars, no widget
 * areas, no comments, no post feeds. What is registered here is only what
 * the templates use.
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'after_setup_theme',
	static function (): void {
		load_theme_textdomain( 'elcorix', get_theme_file_path( 'languages' ) );

		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support( 'automatic-feed-links' );
		add_theme_support( 'responsive-embeds' );
		add_theme_support(
			'html5',
			array( 'search-form', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
		);

		// No nav menus are registered on purpose. The header's anchor list
		// and the footer's legal row are both generated from the sections and
		// pages that actually exist, so adding a section or translating a
		// page slug keeps them correct without anyone editing a menu.

		// The design carries its own type scale and palette; the editor
		// should offer those and nothing else.
		add_theme_support( 'editor-styles' );
		add_editor_style( 'assets/css/app.css' );
		add_theme_support( 'disable-custom-colors' );
		add_theme_support( 'disable-custom-font-sizes' );
		add_theme_support(
			'editor-color-palette',
			array(
				array(
					'name'  => __( 'Brand', 'elcorix' ),
					'slug'  => 'brand',
					'color' => '#26397f',
				),
				array(
					'name'  => __( 'Brand link', 'elcorix' ),
					'slug'  => 'brand-link',
					'color' => '#2c4aa8',
				),
				array(
					'name'  => __( 'Headline', 'elcorix' ),
					'slug'  => 'ink-900',
					'color' => '#14203f',
				),
				array(
					'name'  => __( 'Body', 'elcorix' ),
					'slug'  => 'ink-500',
					'color' => '#66708c',
				),
				array(
					'name'  => __( 'Soft surface', 'elcorix' ),
					'slug'  => 'surface-soft',
					'color' => '#f4f6fa',
				),
			)
		);
	}
);

/**
 * Nothing on this site is commentable — it is a studio's landing page.
 * Closing comments in code rather than in the settings means importing the
 * database somewhere else cannot quietly reopen them.
 */
add_filter( 'comments_open', '__return_false', 20 );
add_filter( 'pings_open', '__return_false', 20 );

/**
 * WordPress advertises itself in the head and in a Link header. Neither is
 * useful here and both hand a scanner the version number, so they go —
 * the same posture SECURITY.md set for the nginx build.
 */
add_action(
	'init',
	static function (): void {
		remove_action( 'wp_head', 'wp_generator' );
		remove_action( 'wp_head', 'wlwmanifest_link' );
		remove_action( 'wp_head', 'rsd_link' );
		remove_action( 'wp_head', 'wp_shortlink_wp_head' );
		remove_action( 'template_redirect', 'wp_shortlink_header', 11 );

		// The emoji polyfill is an inline script plus a remote-ish sprite on
		// every page, for a site that renders no emoji. Removing it is a
		// small speed win and the reason `script-src 'self'` can stay strict.
		remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
		remove_action( 'wp_print_styles', 'print_emoji_styles' );
	}
);

/**
 * The REST API is how the site's own forms talk to it, so it stays open —
 * but user enumeration through `/wp/v2/users` is not something a landing
 * page needs to offer.
 */
add_filter(
	'rest_endpoints',
	static function ( array $endpoints ): array {
		unset( $endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\d]+)'] );

		return $endpoints;
	}
);

/**
 * Security headers, ported from docker/nginx.conf so they hold however the
 * site is served. The CSP names the two third parties the design embeds —
 * the Altegio booking calendar and the OpenStreetMap map — and nothing
 * else. `unsafe-inline` for styles covers WordPress's own inline blocks;
 * scripts stay strict, which is why the theme ships no inline JavaScript
 * and drops the emoji script above.
 *
 * Installing a plugin that prints an inline <script> will break under this
 * header. Relax it here rather than working around it in the plugin — and
 * see the README before you do.
 */
add_action(
	'send_headers',
	static function (): void {
		if ( is_admin() || is_user_logged_in() ) {
			// The admin bar and the block editor's front-end helpers both
			// print inline scripts; an editor previewing the site should not
			// be looking at a broken page.
			return;
		}
		header( 'X-Content-Type-Options: nosniff' );
		header( 'Referrer-Policy: strict-origin-when-cross-origin' );
		header( 'Permissions-Policy: camera=(), microphone=(), geolocation=()' );
		header(
			"Content-Security-Policy: default-src 'self'; script-src 'self'; "
			. "style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; "
			. "connect-src 'self'; frame-src https://*.alteg.io https://www.openstreetmap.org; "
			. "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"
		);
	}
);
