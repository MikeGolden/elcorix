<?php
/**
 * The <head> a crawler reads.
 *
 * The React build had to write this twice — once at build time into a
 * static shell per route, because nothing that skips JavaScript could see
 * React's output, and again at runtime for the visitor's language. A
 * rendered page needs neither: the server already knows the route and the
 * language, so there is one copy of the rules, here.
 *
 * The title rule, the canonical rule and the Open Graph locale map are the
 * same ones client/src/seo/meta.ts held, so a shared link keeps the shape
 * it had. The JSON-LD is the same BeautySalon object.
 *
 * hreflang alternates come from Polylang, and they are new: the old design
 * kept all three languages on one URL, which made alternates impossible.
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** The description for the current view: the excerpt, else the intro. */
function elcorix_meta_description(): string {
	if ( is_front_page() ) {
		$home = get_page_on_front();
		$text = $home > 0 ? get_the_excerpt( $home ) : '';
	} elseif ( is_singular() ) {
		$text = get_the_excerpt( get_queried_object_id() );
	} else {
		$text = get_bloginfo( 'description' );
	}

	$text = trim( wp_strip_all_tags( (string) $text ) );

	return '' !== $text ? wp_trim_words( $text, 40, '' ) : (string) get_bloginfo( 'description' );
}

/**
 * "elcorix — <page>" on the landing page, "<page> — elcorix" elsewhere.
 * WordPress's own separator logic would produce "<page> | <site>" for both.
 */
add_filter(
	'pre_get_document_title',
	static function ( string $title ): string {
		if ( ! function_exists( 'elcorix_compose_title' ) ) {
			return $title;
		}
		$business = Elcorix_Settings::business();

		if ( is_front_page() ) {
			$page = trim( wp_strip_all_tags( (string) get_the_title( (int) get_page_on_front() ) ) );

			return elcorix_compose_title( '/', $page, $business['name'] );
		}
		if ( is_404() ) {
			return elcorix_compose_title( '/404', __( 'Page not found', 'elcorix' ), $business['name'] );
		}
		if ( is_singular() ) {
			$page = trim( wp_strip_all_tags( (string) get_the_title( get_queried_object_id() ) ) );

			return elcorix_compose_title( '/' . get_post_field( 'post_name' ), $page, $business['name'] );
		}

		return $title;
	}
);

add_action(
	'wp_head',
	static function (): void {
		if ( ! function_exists( 'elcorix_local_business_jsonld' ) ) {
			return;
		}
		$business    = Elcorix_Settings::business();
		$description = elcorix_meta_description();
		$canonical   = is_singular() ? (string) get_permalink() : home_url( add_query_arg( array() ) );
		$title       = wp_get_document_title();

		printf( '<meta name="description" content="%s" />' . "\n", esc_attr( $description ) );
		printf( '<link rel="canonical" href="%s" />' . "\n", esc_url( $canonical ) );

		printf( '<meta property="og:site_name" content="%s" />' . "\n", esc_attr( $business['name'] ) );
		echo '<meta property="og:type" content="website" />' . "\n";
		printf( '<meta property="og:title" content="%s" />' . "\n", esc_attr( $title ) );
		printf( '<meta property="og:description" content="%s" />' . "\n", esc_attr( $description ) );
		printf( '<meta property="og:url" content="%s" />' . "\n", esc_url( $canonical ) );
		printf(
			'<meta property="og:locale" content="%s" />' . "\n",
			esc_attr( elcorix_og_locale_for( elcorix_current_language() ) )
		);
		printf(
			'<meta property="og:image" content="%s" />' . "\n",
			esc_url( get_theme_file_uri( 'assets/images/hero.jpg' ) )
		);
		echo '<meta name="twitter:card" content="summary_large_image" />' . "\n";

		// schema.org LocalBusiness for Google's local results. A literal
		// `</script>` inside a JSON string would close the tag it sits in, so
		// JSON_HEX_TAG escapes every angle bracket — still valid JSON, inert
		// HTML. UNESCAPED_UNICODE keeps "Bodmanstraße" readable.
		$json = wp_json_encode(
			elcorix_local_business_jsonld( $business, $business['bookingUrl'] ),
			JSON_HEX_TAG | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
		);
		if ( is_string( $json ) ) {
			echo '<script type="application/ld+json">' . $json . '</script>' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON_HEX_TAG makes this inert.
		}
	},
	5
);

/**
 * The 404 page must answer 404 — a "soft 404" that returns 200 gets the
 * page indexed as if it were real content.
 */
add_action(
	'template_redirect',
	static function (): void {
		if ( is_404() ) {
			status_header( 404 );
			nocache_headers();
		}
	}
);
