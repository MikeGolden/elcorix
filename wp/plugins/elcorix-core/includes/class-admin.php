<?php
/**
 * A read-only inbox for what the forms collect.
 *
 * The Express build had no UI at all: staff read the notification e-mails
 * and the rows sat in Postgres. Since wp-admin is already the place this
 * studio works, the same rows are listed here — with the retention
 * deadline stated on the page, so nobody treats it as an archive.
 *
 * Read-only on purpose. Editing a stored message would only invite
 * "corrections" to what a visitor actually wrote.
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Elcorix_Admin {

	public static function init(): void {
		add_action( 'admin_menu', array( __CLASS__, 'add_page' ) );
	}

	public static function add_page(): void {
		add_menu_page(
			__( 'elcorix inbox', 'elcorix' ),
			__( 'elcorix inbox', 'elcorix' ),
			'edit_pages',
			'elcorix-inbox',
			array( __CLASS__, 'render' ),
			'dashicons-email-alt',
			26
		);
	}

	public static function render(): void {
		if ( ! current_user_can( 'edit_pages' ) ) {
			return;
		}
		$months = (int) Elcorix_Settings::get( 'retentionMonths' );

		echo '<div class="wrap"><h1>' . esc_html__( 'elcorix inbox', 'elcorix' ) . '</h1>';
		printf(
			'<p>%s</p>',
			esc_html(
				sprintf(
					/* translators: %d: number of months */
					__(
						'Contact messages and consultation requests. Everything here is deleted automatically after %d months, as the privacy policy promises — export anything you need to keep.',
						'elcorix'
					),
					$months
				)
			)
		);

		self::table(
			__( 'Consultation requests', 'elcorix' ),
			Elcorix_Store::recent( 'booking' ),
			array(
				'created_at'        => __( 'Received', 'elcorix' ),
				'customer_name'     => __( 'Name', 'elcorix' ),
				'customer_phone'    => __( 'Phone', 'elcorix' ),
				'preferred_at'      => __( 'Preferred slot', 'elcorix' ),
				'marketing_consent' => __( 'Marketing opt-in', 'elcorix' ),
			)
		);

		self::table(
			__( 'Contact messages', 'elcorix' ),
			Elcorix_Store::recent( 'contact' ),
			array(
				'created_at' => __( 'Received', 'elcorix' ),
				'name'       => __( 'Name', 'elcorix' ),
				'email'      => __( 'E-mail', 'elcorix' ),
				'message'    => __( 'Message', 'elcorix' ),
			)
		);

		echo '</div>';
	}

	/**
	 * @param array<int,array<string,mixed>> $rows
	 * @param array<string,string>           $columns
	 */
	private static function table( string $title, array $rows, array $columns ): void {
		echo '<h2>' . esc_html( $title ) . '</h2>';

		if ( array() === $rows ) {
			echo '<p>' . esc_html__( 'Nothing yet.', 'elcorix' ) . '</p>';

			return;
		}

		echo '<table class="widefat striped"><thead><tr>';
		foreach ( $columns as $label ) {
			echo '<th>' . esc_html( $label ) . '</th>';
		}
		echo '</tr></thead><tbody>';

		foreach ( $rows as $row ) {
			echo '<tr>';
			foreach ( array_keys( $columns ) as $key ) {
				$value = (string) ( $row[ $key ] ?? '' );
				if ( 'marketing_consent' === $key ) {
					$value = '1' === $value ? __( 'yes', 'elcorix' ) : __( 'no', 'elcorix' );
				}
				echo '<td>' . esc_html( $value ) . '</td>';
			}
			echo '</tr>';
		}

		echo '</tbody></table>';
	}
}
