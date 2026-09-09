<?php
/**
 * GDPR data-retention cleanup.
 *
 * The privacy policy promises that contact messages and booking requests
 * are deleted after at most 12 months, so something has to enforce it. In
 * the Express build that was a setInterval started at boot; here it is a
 * daily WP-Cron event, with the window configurable under Settings →
 * elcorix (`retentionMonths`).
 *
 * WP-Cron only fires when the site is visited. On a quiet studio site a
 * real cron entry hitting wp-cron.php is worth setting up — the README
 * says so — but the sweep deletes by age, so a late run still deletes
 * everything that is overdue rather than skipping a day.
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Elcorix_Retention {

	public const HOOK = 'elcorix_retention_cleanup';

	public static function init(): void {
		add_action( self::HOOK, array( __CLASS__, 'run' ) );
		add_action( 'init', array( __CLASS__, 'schedule' ) );
	}

	public static function schedule(): void {
		if ( ! wp_next_scheduled( self::HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::HOOK );
		}
	}

	public static function unschedule(): void {
		$timestamp = wp_next_scheduled( self::HOOK );
		if ( false !== $timestamp ) {
			wp_unschedule_event( $timestamp, self::HOOK );
		}
	}

	public static function run(): void {
		$months = (int) Elcorix_Settings::get( 'retentionMonths' );
		if ( $months <= 0 ) {
			// A nonsensical window must not be read as "delete everything".
			return;
		}

		$deleted = Elcorix_Store::delete_older_than( $months );
		if ( $deleted['contacts'] > 0 || $deleted['bookings'] > 0 ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log(
				sprintf(
					'elcorix retention cleanup: deleted %d contact message(s), %d booking request(s) older than %d months',
					$deleted['contacts'],
					$deleted['bookings'],
					$months
				)
			);
		}
	}
}
