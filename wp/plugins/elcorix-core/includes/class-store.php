<?php
/**
 * Storage for the two things visitors send us: contact messages and
 * consultation/booking requests.
 *
 * These were two Postgres tables behind an Express API
 * (`server/src/db/schema.sql`). They are two custom MySQL tables here —
 * not custom post types: they hold personal data with a hard retention
 * deadline, they are never queried by the front end, and a post type would
 * put a visitor's phone number into the same table as the price list and
 * into every "recent content" listing in wp-admin.
 *
 * The columns are a straight port; only the types change (SERIAL →
 * BIGINT AUTO_INCREMENT, TIMESTAMPTZ → DATETIME in UTC, BOOLEAN →
 * TINYINT(1)).
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Elcorix_Store {

	/** Bumped whenever the schema below changes, to re-run dbDelta. */
	public const SCHEMA_VERSION = '1';
	public const VERSION_OPTION = 'elcorix_schema_version';

	public static function contact_table(): string {
		global $wpdb;

		return $wpdb->prefix . 'elcorix_contact_messages';
	}

	public static function booking_table(): string {
		global $wpdb;

		return $wpdb->prefix . 'elcorix_booking_requests';
	}

	public static function init(): void {
		// Cheap guard so an upgrade that changes the schema is applied
		// without the plugin having to be deactivated and reactivated.
		add_action( 'plugins_loaded', array( __CLASS__, 'maybe_install' ) );
	}

	public static function maybe_install(): void {
		if ( get_option( self::VERSION_OPTION ) === self::SCHEMA_VERSION ) {
			return;
		}
		self::install();
	}

	public static function install(): void {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$charset = $wpdb->get_charset_collate();

		$contact = self::contact_table();
		$booking = self::booking_table();

		// The created_at indexes exist for the retention sweep, which
		// deletes by age every night (see Elcorix_Retention).
		dbDelta(
			"CREATE TABLE {$contact} (
				id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
				name TEXT NOT NULL,
				email TEXT NOT NULL,
				message LONGTEXT NOT NULL,
				created_at DATETIME NOT NULL,
				PRIMARY KEY  (id),
				KEY created_at (created_at)
			) {$charset};"
		);

		dbDelta(
			"CREATE TABLE {$booking} (
				id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
				altegio_company_id VARCHAR(12) NOT NULL,
				service VARCHAR(200) NULL,
				customer_name VARCHAR(200) NOT NULL,
				customer_phone VARCHAR(50) NOT NULL,
				preferred_at VARCHAR(40) NULL,
				marketing_consent TINYINT(1) NOT NULL DEFAULT 0,
				status VARCHAR(20) NOT NULL DEFAULT 'pending',
				created_at DATETIME NOT NULL,
				PRIMARY KEY  (id),
				KEY created_at (created_at)
			) {$charset};"
		);

		update_option( self::VERSION_OPTION, self::SCHEMA_VERSION );
	}

	/**
	 * @param array{name:string,email:string,message:string} $message
	 * @return int|null The new row id, or null when the insert failed.
	 */
	public static function insert_contact( array $message ): ?int {
		global $wpdb;

		$ok = $wpdb->insert(
			self::contact_table(),
			array(
				'name'       => $message['name'],
				'email'      => $message['email'],
				'message'    => $message['message'],
				'created_at' => current_time( 'mysql', true ),
			),
			array( '%s', '%s', '%s', '%s' )
		);

		return false === $ok ? null : (int) $wpdb->insert_id;
	}

	/**
	 * @param array<string,mixed> $request
	 * @return int|null The new row id, or null when the insert failed.
	 */
	public static function insert_booking( array $request ): ?int {
		global $wpdb;

		$ok = $wpdb->insert(
			self::booking_table(),
			array(
				'altegio_company_id' => $request['companyId'],
				'service'            => $request['service'],
				'customer_name'      => $request['customerName'],
				'customer_phone'     => $request['customerPhone'],
				'preferred_at'       => $request['preferredAt'],
				'marketing_consent'  => $request['marketingConsent'] ? 1 : 0,
				'status'             => 'pending',
				'created_at'         => current_time( 'mysql', true ),
			),
			array( '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s' )
		);

		return false === $ok ? null : (int) $wpdb->insert_id;
	}

	/**
	 * Delete everything older than `$months`. Returns the row counts, the
	 * way the Express `cleanupExpiredRecords` did.
	 *
	 * @return array{contacts:int,bookings:int}
	 */
	public static function delete_older_than( int $months ): array {
		global $wpdb;

		$cutoff = gmdate( 'Y-m-d H:i:s', strtotime( '-' . $months . ' months' ) );

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table names cannot be placeholders.
		$contacts = (int) $wpdb->query(
			$wpdb->prepare( 'DELETE FROM ' . self::contact_table() . ' WHERE created_at < %s', $cutoff )
		);
		$bookings = (int) $wpdb->query(
			$wpdb->prepare( 'DELETE FROM ' . self::booking_table() . ' WHERE created_at < %s', $cutoff )
		);
		// phpcs:enable

		return array(
			'contacts' => $contacts,
			'bookings' => $bookings,
		);
	}

	/**
	 * @return array<int,array<string,mixed>>
	 */
	public static function recent( string $table, int $limit = 50 ): array {
		global $wpdb;

		$name = 'contact' === $table ? self::contact_table() : self::booking_table();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name cannot be a placeholder.
		$rows = $wpdb->get_results(
			$wpdb->prepare( 'SELECT * FROM ' . $name . ' ORDER BY created_at DESC LIMIT %d', $limit ),
			ARRAY_A
		);

		return is_array( $rows ) ? $rows : array();
	}
}
