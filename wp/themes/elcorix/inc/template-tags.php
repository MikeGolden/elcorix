<?php
/**
 * The handful of helpers the templates lean on.
 *
 * These are the ports of the React components that were pure markup:
 * `<Photo>`, `<Reveal>`, the icon set and `anchorHref`. Everything they
 * did is here; nothing here needs JavaScript to render.
 */

declare( strict_types = 1 );

/**
 * The home URL of the language being rendered — `/` in German, `/en/` and
 * `/uk/` under Polylang. Every internal link goes through this so a
 * visitor reading Ukrainian never gets bounced to the German page.
 */
function elcorix_home_url( string $path = '/' ): string {
	$base = function_exists( 'pll_home_url' ) ? (string) pll_home_url() : home_url( '/' );

	return untrailingslashit( $base ) . '/' . ltrim( $path, '/' );
}

/**
 * The permalink of one of the site's own pages, found by its role rather
 * than by a hard-coded slug.
 *
 * Every page the seeder creates carries `_elx_page` — "prices", "gallery",
 * "booking", "contact", "privacy", "imprint", "terms", "mission" — so
 * renaming "Preise" to "Preisliste" in wp-admin, or translating the slug,
 * cannot break the button that points at it. The React build got this for
 * free from a hard-coded route table; a CMS has to be told.
 */
function elcorix_page_url( string $role ): string {
	static $cache = array();

	$language = elcorix_current_language();
	if ( isset( $cache[ $language ][ $role ] ) ) {
		return $cache[ $language ][ $role ];
	}

	$pages = get_posts(
		array(
			'post_type'        => 'page',
			'posts_per_page'   => 1,
			'post_status'      => 'publish',
			'suppress_filters' => false,
			'lang'             => $language,
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_key'         => '_elx_page',
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			'meta_value'       => $role,
		)
	);

	// A page that has not been translated yet still needs a link, so fall
	// back to the default language's copy rather than to the home page.
	if ( array() === $pages ) {
		$pages = get_posts(
			array(
				'post_type'        => 'page',
				'posts_per_page'   => 1,
				'post_status'      => 'publish',
				'suppress_filters' => true,
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_key'         => '_elx_page',
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'meta_value'       => $role,
			)
		);
	}

	$url = isset( $pages[0] ) ? (string) get_permalink( $pages[0] ) : elcorix_home_url();

	$cache[ $language ][ $role ] = $url;

	return $url;
}

/**
 * The landing page is a one-pager with anchor navigation, but the deep
 * routes reuse the same sections. A menu entry therefore has to jump
 * within the page on the front page and navigate home everywhere else.
 *
 * Ported from client/src/anchors.ts.
 */
function elcorix_anchor_href( string $id ): string {
	return is_front_page() ? '#' . $id : elcorix_home_url( '/#' . $id );
}

/**
 * The scroll-reveal wrapper attributes.
 *
 * `data-revealed="false"` is the starting state; assets/js/app.js flips it
 * to "true" the first time the element enters the viewport, once. Without
 * JavaScript nothing ever flips it — so the CSS gives `.reveal` its visible
 * state whenever the reveal script has not marked the document as active,
 * and the page is readable either way.
 *
 * @param array<string,string|int> $args delay (ms), variant ("up"|"fade"), class
 */
function elcorix_reveal_attrs( array $args = array() ): string {
	$delay   = (int) ( $args['delay'] ?? 0 );
	$variant = (string) ( $args['variant'] ?? 'up' );
	$classes = trim( ( 'fade' === $variant ? 'reveal-fade' : 'reveal' ) . ' ' . (string) ( $args['class'] ?? '' ) );

	$attrs = sprintf( 'class="%s" data-revealed="false"', esc_attr( $classes ) );
	if ( 0 !== $delay ) {
		$attrs .= sprintf( ' style="transition-delay:%dms"', $delay );
	}

	return $attrs;
}

/**
 * An <img> that prefers WebP and falls back to the committed JPEG/PNG.
 *
 * Two kinds of source are accepted, and the difference matters:
 *
 *  - a file name ("hero.jpg") is one of the crops committed in the theme's
 *    assets/images folder. Its WebP twin has the same stem, so the path is
 *    derived rather than registered twice and the two cannot drift apart.
 *  - a numeric id is a media-library attachment, i.e. a photo somebody
 *    replaced in wp-admin. WordPress generates the WebP subsizes for it
 *    (Elcorix_Content::prefer_webp), so it goes out through the normal
 *    attachment pipeline with its own srcset.
 *
 * The <picture> wrapper is `display: contents`, so it generates no box of
 * its own and the <img> keeps whatever grid placement its class gives it.
 * `picture > source { display: none }` in the stylesheet is what stops the
 * <source> from claiming a grid cell of its own — do not remove it.
 *
 * @param array<string,string|int|bool> $args
 */
function elcorix_photo( array $args ): void {
	$src = (string) ( $args['src'] ?? '' );
	if ( '' === $src ) {
		return;
	}

	$attrs = array(
		'alt'           => (string) ( $args['alt'] ?? '' ),
		'class'         => (string) ( $args['class'] ?? '' ),
		'width'         => (string) ( $args['width'] ?? '' ),
		'height'        => (string) ( $args['height'] ?? '' ),
		'loading'       => (string) ( $args['loading'] ?? 'lazy' ),
		'decoding'      => (string) ( $args['decoding'] ?? 'async' ),
		'sizes'         => (string) ( $args['sizes'] ?? '' ),
		'fetchpriority' => (string) ( $args['fetchpriority'] ?? '' ),
	);
	if ( isset( $args['testid'] ) ) {
		$attrs['data-testid'] = (string) $args['testid'];
	}

	// A media-library replacement: let WordPress emit it, srcset and all.
	if ( ctype_digit( $src ) ) {
		$html = wp_get_attachment_image(
			(int) $src,
			'full',
			false,
			array_filter(
				$attrs,
				static fn( string $value ): bool => '' !== $value
			)
		);
		echo wp_kses_post( $html );

		return;
	}

	$url  = get_theme_file_uri( 'assets/images/' . $src );
	$webp = isset( $args['webp_srcset'] )
		? (string) $args['webp_srcset']
		: get_theme_file_uri( 'assets/images/' . elcorix_webp_for( $src ) );

	echo '<picture class="contents">';
	printf(
		'<source type="image/webp" srcset="%s"%s />',
		esc_attr( $webp ),
		'' !== $attrs['sizes'] ? ' sizes="' . esc_attr( $attrs['sizes'] ) . '"' : ''
	);
	echo '<img src="' . esc_url( $url ) . '"';
	foreach ( $attrs as $name => $value ) {
		if ( '' === $value ) {
			continue;
		}
		printf( ' %s="%s"', esc_attr( $name ), esc_attr( $value ) );
	}
	echo ' />';
	echo '</picture>';
}

/**
 * The image URL behind a photo field, for the preload link and Open Graph.
 */
function elcorix_photo_url( string $src ): string {
	if ( '' === $src ) {
		return '';
	}
	if ( ctype_digit( $src ) ) {
		return (string) wp_get_attachment_image_url( (int) $src, 'full' );
	}

	return get_theme_file_uri( 'assets/images/' . $src );
}

/**
 * The icon set. All of them inherit `currentColor` and are decorative by
 * default — a straight port of client/src/components/icons.tsx.
 */
function elcorix_icon( string $name, string $class = '' ): void {
	$paths = array(
		'arrow-right'   => array( 'M4 10h11m0 0-4-4m4 4-4 4', '20', '1.6', 'h-4 w-4' ),
		'menu'          => array( 'M3 6h14M3 10h14M3 14h14', '20', '1.7', 'h-5 w-5' ),
		'close'         => array( 'M5 5l10 10M15 5L5 15', '20', '1.7', 'h-5 w-5' ),
		'check'         => array( 'M4 10.5l4 4 8-9', '20', '1.8', 'h-4 w-4' ),
		'chevron-down'  => array( 'M5 8l5 5 5-5', '20', '1.5', 'h-4 w-4' ),
		'chevron-left'  => array( 'M12.5 4 6.5 10l6 6', '20', '1.6', 'h-5 w-5' ),
		'chevron-right' => array( 'M7.5 4l6 6-6 6', '20', '1.6', 'h-5 w-5' ),
	);

	if ( 'whatsapp' === $name ) {
		printf(
			'<svg viewBox="0 0 24 24" class="%s" aria-hidden="true" focusable="false"><path fill="currentColor" d="%s" /></svg>',
			esc_attr( '' !== $class ? $class : 'h-5 w-5' ),
			esc_attr( elcorix_whatsapp_path() )
		);

		return;
	}

	if ( ! isset( $paths[ $name ] ) ) {
		return;
	}
	list( $d, $box, $width, $default_class ) = $paths[ $name ];

	printf(
		'<svg viewBox="0 0 %1$s %1$s" class="%2$s" aria-hidden="true" focusable="false">'
		. '<path d="%3$s" fill="none" stroke="currentColor" stroke-width="%4$s" stroke-linecap="round" stroke-linejoin="round" /></svg>',
		esc_attr( $box ),
		esc_attr( '' !== $class ? $class : $default_class ),
		esc_attr( $d ),
		esc_attr( $width )
	);
}

/** Kept out of the table above only because of its length. */
function elcorix_whatsapp_path(): string {
	return 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.437-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.480-8.413';
}

/**
 * The elcorix wordmark, traced from the brand artwork Mykhailo supplied
 * (Figma logo node 202-28). Inline outlines: no webfont, no extra request,
 * and it inherits currentColor, so the footer's light variant is the same
 * shape in white.
 */
function elcorix_logo( string $variant = 'dark' ): void {
	$business = Elcorix_Settings::business();
	printf(
		'<a href="%s" aria-label="%s" class="inline-flex transition-opacity hover:opacity-80 %s">',
		esc_url( elcorix_home_url() ),
		esc_attr( $business['name'] ),
		'light' === $variant ? 'text-white' : 'text-brand-700'
	);
	get_template_part( 'template-parts/components/wordmark' );
	echo '</a>';
}
