<?php
/**
 * Seed a fresh install with the site the React build shipped.
 *
 * Run once, with WP-CLI:
 *
 *   wp eval-file wp/tools/seed.php
 *
 * It creates every page, section, reason, work, price and package in all
 * three languages, imports the theme's photography into the media library
 * and links the translations together. Running it again updates what it
 * created rather than duplicating it, so it is safe to re-run after
 * editing tools/content/*.json.
 *
 * The copy comes from tools/content/{de,en,uk}.json — the React app's
 * translation files, copied here unchanged so the seeded site says exactly
 * what the old one said. The prices and the image assignments are below,
 * ported from client/src/pricing.ts and client/src/images.ts.
 *
 * Polylang must already have de, en and uk set up (Languages → Languages),
 * with German as the default and "Hide URL language information for the
 * default language" on. The script checks and stops with instructions
 * rather than guessing.
 */

declare( strict_types = 1 );

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	exit( "This script is meant to be run through WP-CLI: wp eval-file wp/tools/seed.php\n" );
}

if ( ! class_exists( 'Elcorix_Content' ) ) {
	WP_CLI::error( 'The elcorix Core plugin is not active.' );
}

/* -------------------------------------------------------------------- */
/* Data ported from the React build                                      */
/* -------------------------------------------------------------------- */

/** Zone prices — client/src/pricing.ts. Key is the translation key. */
const ELCORIX_WOMEN = array(
	'upperLip'         => 39,
	'chin'             => 39,
	'underarms'        => 59,
	'bikiniClassic'    => 59,
	'intimateComplete' => 99,
	'armsFull'         => 109,
	'lowerLegs'        => 109,
	'legsFull'         => 189,
);

const ELCORIX_MEN = array(
	'beardContour'     => 59,
	'throat'           => 49,
	'neck'             => 49,
	'underarms'        => 69,
	'shoulders'        => 69,
	'chest'            => 89,
	'backFull'         => 119,
	'intimateComplete' => 99,
);

/** Package prices: single, six-session, eight-session. */
const ELCORIX_PACKAGES = array(
	'p1' => array( 129, 619, 759 ),
	'p2' => array( 169, 809, 999 ),
	'p3' => array( 209, 999, 1239 ),
	'p4' => array( 249, 1199, 1479 ),
	'p5' => array( 319, 1529, 1889 ),
);

/** The four "Für wen ist es geeignet?" cards and their thumbnails. */
const ELCORIX_REASONS = array(
	'convenience' => 'reason-convenience.jpg',
	'irritation'  => 'reason-irritation.jpg',
	'shaving'     => 'reason-shaving.jpg',
	'beard'       => 'reason-beard.jpg',
);

/**
 * The gallery, in the order the React gallery page had it: the hero, the
 * four work tiles, the device and the specialist. Only the four work
 * tiles appear in the home-page slider.
 *
 * [ image file, translation key under gallery.alts, in slider ]
 */
const ELCORIX_WORKS = array(
	array( 'hero.jpg', 'hero', false ),
	array( 'work-1.jpg', 'n1', true ),
	array( 'work-2.jpg', 'n2', true ),
	array( 'work-3.jpg', 'n3', true ),
	array( 'work-4.jpg', 'n4', true ),
	array( 'technology.jpg', 'technology', false ),
	array( 'specialist.jpg', 'specialist', false ),
);

/* -------------------------------------------------------------------- */
/* Helpers                                                               */
/* -------------------------------------------------------------------- */

/** @return array<string,mixed> */
function elcorix_seed_load( string $language ): array {
	$file = __DIR__ . '/content/' . $language . '.json';
	if ( ! file_exists( $file ) ) {
		WP_CLI::error( "Missing seed content: {$file}" );
	}
	$data = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions

	return is_array( $data ) ? $data : array();
}

/** Dotted lookup into the translation data. */
function elcorix_seed_at( array $data, string $path, string $default = '' ): string {
	$node = $data;
	foreach ( explode( '.', $path ) as $part ) {
		if ( ! is_array( $node ) || ! array_key_exists( $part, $node ) ) {
			return $default;
		}
		$node = $node[ $part ];
	}

	return is_string( $node ) ? $node : $default;
}

/**
 * The i18n copy uses <b> for the bold lead-in of each paragraph; the
 * editor's own markup for that is <strong>.
 */
function elcorix_seed_paragraphs( array $data, array $paths ): string {
	$out = '';
	foreach ( $paths as $path ) {
		$text = elcorix_seed_at( $data, $path );
		if ( '' === $text ) {
			continue;
		}
		$text = str_replace( array( '<b>', '</b>' ), array( '<strong>', '</strong>' ), $text );
		$out .= '<p>' . $text . "</p>\n";
	}

	return trim( $out );
}

/** Import one of the theme's committed crops into the media library. */
function elcorix_seed_attachment( string $filename ): int {
	static $imported = array();
	if ( isset( $imported[ $filename ] ) ) {
		return $imported[ $filename ];
	}

	// Already imported by an earlier run?
	$existing = get_posts(
		array(
			'post_type'      => 'attachment',
			'posts_per_page' => 1,
			'post_status'    => 'inherit',
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_key'       => '_elx_source',
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			'meta_value'     => $filename,
		)
	);
	if ( isset( $existing[0] ) ) {
		$imported[ $filename ] = (int) $existing[0]->ID;

		return $imported[ $filename ];
	}

	$source = get_theme_file_path( 'assets/images/' . $filename );
	if ( ! file_exists( $source ) ) {
		WP_CLI::warning( "Image not found in the theme: {$filename}" );

		return 0;
	}

	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	$uploads = wp_upload_dir();
	$target  = trailingslashit( $uploads['path'] ) . $filename;
	if ( ! copy( $source, $target ) ) {
		WP_CLI::warning( "Could not copy {$filename} into the uploads folder" );

		return 0;
	}

	$id = wp_insert_attachment(
		array(
			'post_mime_type' => (string) wp_check_filetype( $filename )['type'],
			'post_title'     => pathinfo( $filename, PATHINFO_FILENAME ),
			'post_status'    => 'inherit',
		),
		$target
	);
	if ( is_wp_error( $id ) || 0 === $id ) {
		return 0;
	}

	wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $target ) );
	update_post_meta( $id, '_elx_source', $filename );

	$imported[ $filename ] = (int) $id;

	return (int) $id;
}

/**
 * Create or update one post, identified by its type, its slug and its
 * language — so re-running the seeder edits what it made last time.
 *
 * @param array<string,mixed> $fields
 * @param array<string,string> $meta
 */
function elcorix_seed_post( string $type, string $slug, string $language, array $fields, array $meta = array() ): int {
	$existing = get_posts(
		array(
			'post_type'        => $type,
			'name'             => $slug,
			'posts_per_page'   => 1,
			'post_status'      => 'any',
			'suppress_filters' => false,
			'lang'             => $language,
		)
	);

	$post = array_merge(
		array(
			'post_type'   => $type,
			'post_name'   => $slug,
			'post_status' => 'publish',
		),
		$fields
	);

	if ( isset( $existing[0] ) ) {
		$post['ID'] = $existing[0]->ID;
		$id         = wp_update_post( $post, true );
	} else {
		$id = wp_insert_post( $post, true );
	}

	if ( is_wp_error( $id ) ) {
		WP_CLI::warning( "{$type}/{$slug} ({$language}): " . $id->get_error_message() );

		return 0;
	}

	if ( function_exists( 'pll_set_post_language' ) ) {
		pll_set_post_language( (int) $id, $language );
	}

	foreach ( $meta as $key => $value ) {
		update_post_meta( (int) $id, $key, $value );
	}

	return (int) $id;
}

/** @param array<string,int> $ids language => post id */
function elcorix_seed_link( array $ids ): void {
	if ( ! function_exists( 'pll_save_post_translations' ) ) {
		return;
	}
	$ids = array_filter( $ids );
	if ( count( $ids ) > 1 ) {
		pll_save_post_translations( $ids );
	}
}

/* -------------------------------------------------------------------- */
/* Preconditions                                                         */
/* -------------------------------------------------------------------- */

$elcorix_languages = array( 'de', 'en', 'uk' );

if ( function_exists( 'pll_languages_list' ) ) {
	$configured = (array) pll_languages_list();
	$missing    = array_diff( $elcorix_languages, $configured );
	if ( array() !== $missing ) {
		WP_CLI::error(
			'Polylang is missing these languages: ' . implode( ', ', $missing )
			. '. Add them under Languages → Languages (German as the default), then run this again.'
		);
	}
} else {
	WP_CLI::warning( 'Polylang is not active — seeding the default language only.' );
	$elcorix_languages = array( 'de' );
}

$elcorix_content = array();
foreach ( $elcorix_languages as $elcorix_language ) {
	$elcorix_content[ $elcorix_language ] = elcorix_seed_load( $elcorix_language );
}

/* -------------------------------------------------------------------- */
/* Price groups                                                          */
/* -------------------------------------------------------------------- */

foreach ( array( 'women', 'men' ) as $elcorix_group ) {
	if ( ! term_exists( $elcorix_group, Elcorix_Content::GROUP_TAX ) ) {
		wp_insert_term(
			ucfirst( $elcorix_group ),
			Elcorix_Content::GROUP_TAX,
			array( 'slug' => $elcorix_group )
		);
	}
}

/* -------------------------------------------------------------------- */
/* Sections                                                              */
/* -------------------------------------------------------------------- */

/**
 * key => [ title path, body paths, meta path map ]. The meta map's values
 * are translation paths; a value wrapped in brackets is a literal (the
 * image file names, which are business data and identical everywhere).
 */
$elcorix_sections = array(
	'hero'         => array(
		'hero.title',
		array(),
		array(
			'_elx_services_label' => 'hero.servicesLabel',
			'_elx_service_name'   => 'hero.serviceName',
			'_elx_service_count'  => 'hero.serviceCount',
			'_elx_image_alt'      => 'hero.imageAlt',
			'_elx_image'          => '[hero.jpg]',
			'_elx_thumb'          => '[service-thumb.jpg]',
		),
	),
	'for-whom'     => array( 'forWhom.title', array(), array() ),
	'technology'   => array(
		'technology.title',
		array( 'technology.p1', 'technology.p2', 'technology.p3' ),
		array(
			'_elx_image_alt' => 'technology.imageAlt',
			'_elx_image'     => '[technology.jpg]',
		),
	),
	'specialist'   => array(
		'specialist.title',
		array( 'specialist.p1', 'specialist.p2', 'specialist.p3' ),
		array(
			'_elx_image_alt'       => 'specialist.imageAlt',
			'_elx_certificate_alt' => 'specialist.certificateAlt',
			'_elx_image'           => '[specialist.jpg]',
			'_elx_certificate'     => '[certificate.png]',
		),
	),
	'work'         => array( 'work.title', array(), array() ),
	'prices'       => array( 'prices.title', array(), array( '_elx_note' => 'prices.note' ) ),
	'booking'      => array( 'booking.title', array( 'booking.intro' ), array() ),
	'consultation' => array( 'consultation.title', array( 'consultation.intro' ), array() ),
	'contact'      => array(
		'contact.title',
		array( 'contact.intro' ),
		array(
			'_elx_hours_title'          => 'contact.hoursTitle',
			'_elx_hours_weekdays_label' => 'contact.hours.weekdaysLabel',
			'_elx_hours_weekdays'       => 'contact.hours.weekdays',
			'_elx_hours_closed_label'   => 'contact.hours.closedLabel',
			'_elx_hours_closed'         => 'contact.hours.closed',
		),
	),
);

foreach ( $elcorix_sections as $elcorix_key => $elcorix_section ) {
	list( $elcorix_title_path, $elcorix_body_paths, $elcorix_meta_paths ) = $elcorix_section;
	$elcorix_ids = array();

	foreach ( $elcorix_languages as $elcorix_language ) {
		$data = $elcorix_content[ $elcorix_language ];
		$meta = array();
		foreach ( $elcorix_meta_paths as $meta_key => $meta_path ) {
			$meta[ $meta_key ] = str_starts_with( $meta_path, '[' )
				? trim( $meta_path, '[]' )
				: elcorix_seed_at( $data, $meta_path );
		}

		$elcorix_ids[ $elcorix_language ] = elcorix_seed_post(
			Elcorix_Content::SECTION,
			$elcorix_key,
			$elcorix_language,
			array(
				'post_title'   => elcorix_seed_at( $data, $elcorix_title_path ),
				'post_content' => elcorix_seed_paragraphs( $data, $elcorix_body_paths ),
			),
			$meta
		);
	}
	elcorix_seed_link( $elcorix_ids );
}
WP_CLI::log( 'Sections seeded.' );

/* -------------------------------------------------------------------- */
/* Reasons                                                               */
/* -------------------------------------------------------------------- */

$elcorix_order = 0;
foreach ( ELCORIX_REASONS as $elcorix_reason => $elcorix_image ) {
	$elcorix_attachment = elcorix_seed_attachment( $elcorix_image );
	$elcorix_ids        = array();

	foreach ( $elcorix_languages as $elcorix_language ) {
		$id = elcorix_seed_post(
			Elcorix_Content::REASON,
			$elcorix_reason,
			$elcorix_language,
			array(
				'post_title'  => elcorix_seed_at(
					$elcorix_content[ $elcorix_language ],
					"forWhom.items.{$elcorix_reason}.title"
				),
				'menu_order'  => $elcorix_order,
			)
		);
		if ( $id > 0 && $elcorix_attachment > 0 ) {
			set_post_thumbnail( $id, $elcorix_attachment );
		}
		$elcorix_ids[ $elcorix_language ] = $id;
	}
	elcorix_seed_link( $elcorix_ids );
	++$elcorix_order;
}
WP_CLI::log( 'Reasons seeded.' );

/* -------------------------------------------------------------------- */
/* Works and gallery                                                     */
/* -------------------------------------------------------------------- */

$elcorix_order = 0;
foreach ( ELCORIX_WORKS as $elcorix_work ) {
	list( $elcorix_file, $elcorix_alt_key, $elcorix_in_slider ) = $elcorix_work;
	$elcorix_attachment = elcorix_seed_attachment( $elcorix_file );
	$elcorix_slug       = 'work-' . sanitize_title( pathinfo( $elcorix_file, PATHINFO_FILENAME ) );
	$elcorix_ids        = array();

	foreach ( $elcorix_languages as $elcorix_language ) {
		$id = elcorix_seed_post(
			Elcorix_Content::WORK,
			$elcorix_slug,
			$elcorix_language,
			array(
				// The title IS the alt text: it is the only thing a
				// translator should change about a photo.
				'post_title' => elcorix_seed_at(
					$elcorix_content[ $elcorix_language ],
					"gallery.alts.{$elcorix_alt_key}"
				),
				'menu_order' => $elcorix_order,
			),
			array(
				'_elx_in_slider'  => $elcorix_in_slider ? '1' : '0',
				'_elx_in_gallery' => '1',
			)
		);
		if ( $id > 0 && $elcorix_attachment > 0 ) {
			set_post_thumbnail( $id, $elcorix_attachment );
		}
		$elcorix_ids[ $elcorix_language ] = $id;
	}
	elcorix_seed_link( $elcorix_ids );
	++$elcorix_order;
}
WP_CLI::log( 'Works seeded.' );

/* -------------------------------------------------------------------- */
/* Prices and packages                                                   */
/* -------------------------------------------------------------------- */

foreach ( array( 'women' => ELCORIX_WOMEN, 'men' => ELCORIX_MEN ) as $elcorix_group => $elcorix_rows ) {
	$elcorix_order = 0;
	foreach ( $elcorix_rows as $elcorix_zone => $elcorix_amount ) {
		$elcorix_slug = $elcorix_group . '-' . sanitize_title( $elcorix_zone );
		$elcorix_ids  = array();

		foreach ( $elcorix_languages as $elcorix_language ) {
			$id = elcorix_seed_post(
				Elcorix_Content::PRICE,
				$elcorix_slug,
				$elcorix_language,
				array(
					'post_title' => elcorix_seed_at(
						$elcorix_content[ $elcorix_language ],
						"prices.{$elcorix_group}.{$elcorix_zone}"
					),
					'menu_order' => $elcorix_order,
				),
				array( '_elx_amount' => (string) $elcorix_amount )
			);
			if ( $id > 0 ) {
				wp_set_object_terms( $id, $elcorix_group, Elcorix_Content::GROUP_TAX );
			}
			$elcorix_ids[ $elcorix_language ] = $id;
		}
		elcorix_seed_link( $elcorix_ids );
		++$elcorix_order;
	}
}

$elcorix_order = 0;
foreach ( ELCORIX_PACKAGES as $elcorix_package => $elcorix_prices ) {
	$elcorix_ids = array();
	foreach ( $elcorix_languages as $elcorix_language ) {
		$data = $elcorix_content[ $elcorix_language ];
		$elcorix_ids[ $elcorix_language ] = elcorix_seed_post(
			Elcorix_Content::PACKAGE,
			'package-' . $elcorix_package,
			$elcorix_language,
			array(
				'post_title' => elcorix_seed_at( $data, "prices.packages.{$elcorix_package}.name" ),
				'menu_order' => $elcorix_order,
			),
			array(
				'_elx_zones'  => elcorix_seed_at( $data, "prices.packages.{$elcorix_package}.zones" ),
				'_elx_single' => (string) $elcorix_prices[0],
				'_elx_six'    => (string) $elcorix_prices[1],
				'_elx_eight'  => (string) $elcorix_prices[2],
			)
		);
	}
	elcorix_seed_link( $elcorix_ids );
	++$elcorix_order;
}
WP_CLI::log( 'Prices and packages seeded.' );

/* -------------------------------------------------------------------- */
/* Legal page bodies                                                     */
/* -------------------------------------------------------------------- */

/**
 * The legal pages were React components that interpolated `business.*`
 * into translated strings. Here they become editable content, and the
 * details that must stay in one place come back through the
 * [elcorix_business] shortcode.
 */
function elcorix_seed_privacy( array $data ): string {
	$body = '<p>' . elcorix_seed_at( $data, 'privacy.intro' ) . "</p>\n";
	foreach ( array( 'controller', 'hosting', 'contactForm', 'booking', 'storage', 'rights' ) as $key ) {
		$text = elcorix_seed_at( $data, "privacy.sections.{$key}.body" );
		$text = strtr(
			$text,
			array(
				'{{businessName}}' => '[elcorix_business field="name"]',
				'{{address}}'      => '[elcorix_business field="address"]',
				'{{email}}'        => '[elcorix_business field="email"]',
				'{{phone}}'        => '[elcorix_business field="phone"]',
			)
		);
		$body .= '<h2>' . elcorix_seed_at( $data, "privacy.sections.{$key}.title" ) . "</h2>\n";
		$body .= '<p>' . $text . "</p>\n";
	}

	return trim( $body );
}

function elcorix_seed_imprint( array $data ): string {
	$body  = '<h2>' . elcorix_seed_at( $data, 'imprint.operatorTitle' ) . "</h2>\n";
	$body .= "<p>[elcorix_business field=\"name\"]<br />\n"
		. elcorix_seed_at( $data, 'imprint.ownerLabel' ) . ': [elcorix_business field="owner"]<br />' . "\n"
		. "[elcorix_business field=\"address\"]</p>\n";

	$body .= '<h2>' . elcorix_seed_at( $data, 'imprint.contactTitle' ) . "</h2>\n";
	$body .= "<p>[elcorix_business field=\"phone\" link=\"1\"]<br />\n"
		. "[elcorix_business field=\"email\" link=\"1\"]</p>\n";

	$body .= '<h2>' . elcorix_seed_at( $data, 'imprint.vatLabel' ) . "</h2>\n";
	$body .= "<p>[elcorix_business field=\"vatId\"]</p>\n";

	$body .= '<h2>' . elcorix_seed_at( $data, 'imprint.responsibleLabel' ) . "</h2>\n";
	$body .= "<p>[elcorix_business field=\"owner\"], [elcorix_business field=\"address\"]</p>\n";

	$body .= '<p>' . elcorix_seed_at( $data, 'imprint.dispute' ) . "</p>\n";

	return trim( $body );
}

/** @param string[] $keys */
function elcorix_seed_sections_page( array $data, string $prefix, array $keys, string $note = '' ): string {
	$body = '<p>' . elcorix_seed_at( $data, "{$prefix}.intro" ) . "</p>\n";
	foreach ( $keys as $key ) {
		$body .= '<h2>' . elcorix_seed_at( $data, "{$prefix}.sections.{$key}.title" ) . "</h2>\n";
		$body .= '<p>' . elcorix_seed_at( $data, "{$prefix}.sections.{$key}.body" ) . "</p>\n";
	}
	if ( '' !== $note ) {
		$body .= '<p>' . elcorix_seed_at( $data, $note ) . "</p>\n";
	}

	return trim( $body );
}

/* -------------------------------------------------------------------- */
/* Pages                                                                 */
/* -------------------------------------------------------------------- */

/**
 * role => [ slug, title path, description path, template, body builder ].
 * The body builder receives the language's translation data.
 */
$elcorix_pages = array(
	'home'    => array(
		'home',
		'meta.home.title',
		'meta.home.description',
		'',
		static fn( array $data ): string => '',
	),
	'prices'  => array(
		'prices',
		'prices.pageTitle',
		'meta.prices.description',
		'template-prices.php',
		static fn( array $data ): string => '<p>' . elcorix_seed_at( $data, 'prices.intro' ) . '</p>',
	),
	'gallery' => array(
		'gallery',
		'gallery.title',
		'meta.gallery.description',
		'template-gallery.php',
		static fn( array $data ): string => '<p>' . elcorix_seed_at( $data, 'gallery.intro' ) . '</p>',
	),
	'booking' => array(
		'booking',
		'booking.title',
		'meta.booking.description',
		'template-booking.php',
		static fn( array $data ): string => '<p>' . elcorix_seed_at( $data, 'booking.intro' ) . '</p>',
	),
	'contact' => array(
		'contact',
		'contact.pageTitle',
		'meta.contact.description',
		'template-contact.php',
		static fn( array $data ): string => '',
	),
	'privacy' => array(
		'privacy',
		'privacy.title',
		'meta.privacy.description',
		'template-legal.php',
		'elcorix_seed_privacy',
	),
	'imprint' => array(
		'imprint',
		'imprint.title',
		'meta.imprint.description',
		'template-legal.php',
		'elcorix_seed_imprint',
	),
	'terms'   => array(
		'terms',
		'terms.title',
		'meta.terms.description',
		'template-legal.php',
		static fn( array $data ): string => elcorix_seed_sections_page(
			$data,
			'terms',
			array( 'scope', 'appointments', 'cancellation', 'payment', 'liability' ),
			'terms.note'
		),
	),
	'mission' => array(
		'mission',
		'mission.title',
		'meta.mission.description',
		'template-legal.php',
		static fn( array $data ): string => elcorix_seed_sections_page(
			$data,
			'mission',
			array( 'safety', 'honesty', 'care' )
		),
	),
);

$elcorix_home_ids = array();

foreach ( $elcorix_pages as $elcorix_role => $elcorix_page ) {
	list( $elcorix_slug, $elcorix_title, $elcorix_description, $elcorix_template, $elcorix_body ) = $elcorix_page;
	$elcorix_ids = array();

	foreach ( $elcorix_languages as $elcorix_language ) {
		$data = $elcorix_content[ $elcorix_language ];
		$meta = array( '_elx_page' => $elcorix_role );
		if ( '' !== $elcorix_template ) {
			$meta['_wp_page_template'] = $elcorix_template;
		}

		$id = elcorix_seed_post(
			'page',
			$elcorix_slug,
			$elcorix_language,
			array(
				'post_title'   => elcorix_seed_at( $data, $elcorix_title ),
				'post_content' => $elcorix_body( $data ),
				'post_excerpt' => elcorix_seed_at( $data, $elcorix_description ),
			),
			$meta
		);
		$elcorix_ids[ $elcorix_language ] = $id;
	}
	elcorix_seed_link( $elcorix_ids );

	if ( 'home' === $elcorix_role ) {
		$elcorix_home_ids = $elcorix_ids;
	}
}

/* The site shows a page, not a blog, and Polylang keeps one home page per
   language pointing at the same setting. */
update_option( 'show_on_front', 'page' );
if ( isset( $elcorix_home_ids['de'] ) && $elcorix_home_ids['de'] > 0 ) {
	update_option( 'page_on_front', $elcorix_home_ids['de'] );
}
update_option( 'page_for_posts', 0 );

WP_CLI::log( 'Pages seeded.' );

/* Permalinks have to be pretty for /prices and /en/prices to exist at all. */
if ( '' === (string) get_option( 'permalink_structure' ) ) {
	update_option( 'permalink_structure', '/%postname%/' );
}
flush_rewrite_rules();

WP_CLI::success( 'elcorix content seeded. Check Settings → elcorix for the business data before going live.' );
