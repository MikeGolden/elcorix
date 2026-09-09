<?php
/**
 * Plugin Name:       elcorix Core
 * Plugin URI:        https://elcorix.com
 * Description:       Content model, business settings, booking/contact endpoints and GDPR retention for the elcorix site. Everything the site needs that is not presentation lives here, so the theme stays swappable.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      8.1
 * Author:            elcorix
 * License:           GPL-2.0-or-later
 * Text Domain:       elcorix
 * Domain Path:       /languages
 *
 * @package Elcorix
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ELCORIX_CORE_VERSION', '1.0.0' );
define( 'ELCORIX_CORE_DIR', plugin_dir_path( __FILE__ ) );

require_once ELCORIX_CORE_DIR . 'includes/functions.php';
require_once ELCORIX_CORE_DIR . 'includes/i18n.php';
require_once ELCORIX_CORE_DIR . 'includes/class-settings.php';
require_once ELCORIX_CORE_DIR . 'includes/class-content.php';
require_once ELCORIX_CORE_DIR . 'includes/class-store.php';
require_once ELCORIX_CORE_DIR . 'includes/class-mail.php';
require_once ELCORIX_CORE_DIR . 'includes/class-rest.php';
require_once ELCORIX_CORE_DIR . 'includes/class-retention.php';
require_once ELCORIX_CORE_DIR . 'includes/class-admin.php';
require_once ELCORIX_CORE_DIR . 'includes/shortcodes.php';

/**
 * Wiring. Deliberately a plugin rather than the theme's functions.php: the
 * price list, the stored requests and the retention promise must survive a
 * theme change, and only presentation belongs in the theme.
 */
final class Elcorix_Plugin {

	public static function boot(): void {
		Elcorix_Settings::init();
		Elcorix_Content::init();
		Elcorix_Store::init();
		Elcorix_Rest::init();
		Elcorix_Retention::init();
		Elcorix_Admin::init();

		add_action( 'init', array( __CLASS__, 'load_textdomain' ) );
		add_action( 'init', array( __CLASS__, 'add_rewrites' ) );
		add_action( 'init', 'elcorix_register_polylang_strings' );
		add_filter( 'query_vars', array( __CLASS__, 'query_vars' ) );
	}

	public static function load_textdomain(): void {
		load_plugin_textdomain( 'elcorix', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
	}

	/**
	 * Keep the Express API's paths working.
	 *
	 * The forms, the Playwright suite and anything the studio has pointed at
	 * the old server all call `/api/contact`, `/api/bookings` and
	 * `/api/health`. Those URLs now land on the REST controller instead of
	 * an Express container, and nothing outside had to change.
	 */
	public static function add_rewrites(): void {
		$routes = array(
			'contact'       => '/elcorix/v1/contact',
			'bookings'      => '/elcorix/v1/bookings',
			'bookings/link' => '/elcorix/v1/bookings/link',
			'health'        => '/elcorix/v1/health',
		);
		foreach ( $routes as $path => $rest ) {
			add_rewrite_rule(
				'^api/' . $path . '/?$',
				'index.php?rest_route=' . $rest,
				'top'
			);
		}
	}

	/**
	 * @param string[] $vars
	 * @return string[]
	 */
	public static function query_vars( array $vars ): array {
		$vars[] = 'rest_route';

		return $vars;
	}

	public static function activate(): void {
		Elcorix_Store::install();
		self::add_rewrites();
		flush_rewrite_rules();
		Elcorix_Retention::schedule();
	}

	public static function deactivate(): void {
		Elcorix_Retention::unschedule();
		flush_rewrite_rules();
	}
}

register_activation_hook( __FILE__, array( 'Elcorix_Plugin', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'Elcorix_Plugin', 'deactivate' ) );

Elcorix_Plugin::boot();
