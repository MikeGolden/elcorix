<?php
/**
 * Test bootstrap.
 *
 * The functions under test are deliberately free of WordPress: no hooks,
 * no database, no `$wpdb`. ELCORIX_TESTING is what lets includes/functions.php
 * load outside a WordPress request, and nothing else is needed — which is
 * the point of keeping every rule in that one file.
 *
 * With PHPUnit installed:  vendor/bin/phpunit
 * Without it:              php tools/phpunit-lite.php
 */

declare( strict_types = 1 );

define( 'ELCORIX_TESTING', true );

if ( ! class_exists( \PHPUnit\Framework\TestCase::class ) ) {
	require_once __DIR__ . '/../../../tools/phpunit-lite.php';
}

require_once __DIR__ . '/../includes/functions.php';
