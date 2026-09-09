<?php
/**
 * elcorix theme bootstrap.
 *
 * The theme is presentation only: every piece of content and all business
 * data come from the elcorix Core plugin, so the site survives a theme
 * change. If the plugin is not active, say so plainly instead of rendering
 * a page full of blanks.
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ELCORIX_THEME_VERSION', '1.0.0' );

require_once get_theme_file_path( 'inc/setup.php' );
require_once get_theme_file_path( 'inc/assets.php' );
require_once get_theme_file_path( 'inc/seo.php' );

if ( class_exists( 'Elcorix_Settings' ) ) {
	require_once get_theme_file_path( 'inc/template-tags.php' );
} else {
	/*
	 * Without the plugin there is no content, no business data and no
	 * template tags — every template would fatal on its first call. Say so,
	 * in wp-admin and on the front end, rather than serving a white screen
	 * that looks like a hosting failure.
	 */
	add_action(
		'admin_notices',
		static function (): void {
			echo '<div class="notice notice-error"><p>'
				. esc_html__(
					'The elcorix theme needs the elcorix Core plugin: it holds the content model, the business data and the booking endpoints. Activate it under Plugins.',
					'elcorix'
				)
				. '</p></div>';
		}
	);

	add_filter(
		'template_include',
		static function (): string {
			return get_theme_file_path( 'inc/missing-plugin.php' );
		},
		PHP_INT_MAX
	);
}
