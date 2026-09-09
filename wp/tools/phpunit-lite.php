<?php
/**
 * A stand-in for PHPUnit, for environments that cannot install it.
 *
 * The tests in plugins/elcorix-core/tests are ordinary PHPUnit test cases
 * and `vendor/bin/phpunit` is the right way to run them. But this repo has
 * to be checkable on a machine with no Composer access — which is exactly
 * where the WordPress port was written — so this file implements the few
 * assertions those tests actually use and runs them.
 *
 * It is a fallback, not a test framework: if PHPUnit is installed, the
 * runner below never loads.
 *
 *   php tools/phpunit-lite.php plugins/elcorix-core/tests
 */

declare( strict_types = 1 );

namespace PHPUnit\Framework {

if ( ! class_exists( '\PHPUnit\Framework\TestCase' ) ) {

	class AssertionFailed extends \RuntimeException {}

	abstract class TestCase {

		/** @var int */
		public static $assertions = 0;

		protected static function fail( string $message ): void {
			throw new AssertionFailed( $message );
		}

		private static function describe( $value ): string {
			return is_string( $value ) ? '"' . $value . '"' : var_export( $value, true );
		}

		private static function ok( bool $condition, string $message ): void {
			++self::$assertions;
			if ( ! $condition ) {
				self::fail( $message );
			}
		}

		public function assertSame( $expected, $actual, string $message = '' ): void {
			self::ok(
				$expected === $actual,
				$message . ' expected ' . self::describe( $expected ) . ', got ' . self::describe( $actual )
			);
		}

		public function assertEquals( $expected, $actual, string $message = '' ): void {
			self::ok(
				$expected == $actual, // phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
				$message . ' expected ' . self::describe( $expected ) . ', got ' . self::describe( $actual )
			);
		}

		public function assertTrue( $actual, string $message = '' ): void {
			self::ok( true === $actual, $message . ' expected true, got ' . self::describe( $actual ) );
		}

		public function assertFalse( $actual, string $message = '' ): void {
			self::ok( false === $actual, $message . ' expected false, got ' . self::describe( $actual ) );
		}

		public function assertNull( $actual, string $message = '' ): void {
			self::ok( null === $actual, $message . ' expected null, got ' . self::describe( $actual ) );
		}

		public function assertNotNull( $actual, string $message = '' ): void {
			self::ok( null !== $actual, $message . ' expected a value, got null' );
		}

		public function assertIsString( $actual, string $message = '' ): void {
			self::ok( is_string( $actual ), $message . ' expected a string, got ' . gettype( $actual ) );
		}

		public function assertCount( int $expected, $actual, string $message = '' ): void {
			$count = is_countable( $actual ) ? count( $actual ) : -1;
			self::ok( $expected === $count, $message . " expected {$expected} items, got {$count}" );
		}

		public function assertContains( $needle, array $haystack, string $message = '' ): void {
			self::ok( in_array( $needle, $haystack, true ), $message . ' missing ' . self::describe( $needle ) );
		}

		public function assertNotContains( $needle, array $haystack, string $message = '' ): void {
			self::ok( ! in_array( $needle, $haystack, true ), $message . ' unexpectedly found ' . self::describe( $needle ) );
		}

		public function assertStringContainsString( string $needle, string $haystack, string $message = '' ): void {
			self::ok( str_contains( $haystack, $needle ), $message . " \"{$haystack}\" does not contain \"{$needle}\"" );
		}

		public function assertStringNotContainsString( string $needle, string $haystack, string $message = '' ): void {
			self::ok( ! str_contains( $haystack, $needle ), $message . " \"{$haystack}\" contains \"{$needle}\"" );
		}

		public function assertStringStartsWith( string $prefix, string $actual, string $message = '' ): void {
			self::ok( str_starts_with( $actual, $prefix ), $message . " \"{$actual}\" does not start with \"{$prefix}\"" );
		}

		public function assertStringEndsWith( string $suffix, string $actual, string $message = '' ): void {
			self::ok( str_ends_with( $actual, $suffix ), $message . " \"{$actual}\" does not end with \"{$suffix}\"" );
		}
	}
}
}

namespace {

	// Only run when this file is the entry point.
	if ( ! isset( $argv ) || realpath( $argv[0] ?? '' ) !== realpath( __FILE__ ) ) {
		return;
	}

	$directory = $argv[1] ?? 'plugins/elcorix-core/tests';
	require_once $directory . '/bootstrap.php';

	$before = get_declared_classes();
	foreach ( glob( $directory . '/*Test.php' ) ?: array() as $file ) {
		require_once $file;
	}
	$classes = array_diff( get_declared_classes(), $before );

	$passed  = 0;
	$failed  = array();
	$started = microtime( true );

	foreach ( $classes as $class ) {
		if ( ! is_subclass_of( $class, \PHPUnit\Framework\TestCase::class ) ) {
			continue;
		}
		foreach ( get_class_methods( $class ) as $method ) {
			if ( ! str_starts_with( $method, 'test' ) ) {
				continue;
			}
			$instance = new $class();
			try {
				$instance->$method();
				++$passed;
				echo '.';
			} catch ( \Throwable $error ) {
				$failed[] = "{$class}::{$method} — " . $error->getMessage();
				echo 'F';
			}
		}
	}

	printf(
		"\n\n%d test(s), %d assertion(s), %.0fms\n",
		$passed + count( $failed ),
		\PHPUnit\Framework\TestCase::$assertions,
		( microtime( true ) - $started ) * 1000
	);

	if ( array() !== $failed ) {
		echo "\nFAILURES\n";
		foreach ( $failed as $failure ) {
			echo '  ' . $failure . "\n";
		}
		exit( 1 );
	}

	echo "OK\n";
}
