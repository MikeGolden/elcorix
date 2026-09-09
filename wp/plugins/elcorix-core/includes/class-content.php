<?php
/**
 * The editable content model.
 *
 * In the React build the copy lived in three translation JSON files and the
 * structure in `content.ts` / `pricing.ts` / `images.ts`; changing a price
 * meant a commit and a rebuild. Here the same material is WordPress
 * content, so the studio edits it in wp-admin and Polylang translates it:
 *
 *   Sections   (elx_section)  one post per landing section — heading in the
 *                             title, body in the editor, the odd extra
 *                             string in a meta box. The one-pager and the
 *                             deep routes read the same post, exactly as
 *                             they shared a component before.
 *   Reasons    (elx_reason)   the four "Für wen ist es geeignet?" cards.
 *   Works      (elx_work)     the slider tiles and the gallery.
 *   Prices     (elx_price)    one zone per post, grouped women/men by the
 *                             elx_price_group taxonomy.
 *   Packages   (elx_package)  the package table's rows.
 *
 * Prices, ordering and images are business data, not copy: they are read
 * from the DEFAULT-language post even when a translation is being
 * rendered, so a number can never drift between the German and the
 * Ukrainian price list. Only what a translator should touch — names,
 * headings, paragraphs, alt text — comes from the translated post.
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Elcorix_Content {

	public const SECTION   = 'elx_section';
	public const REASON    = 'elx_reason';
	public const WORK      = 'elx_work';
	public const PRICE     = 'elx_price';
	public const PACKAGE   = 'elx_package';
	public const GROUP_TAX = 'elx_price_group';

	/** The landing sections, in the order the Figma one-pager has them. */
	public const SECTION_KEYS = array(
		'hero',
		'for-whom',
		'technology',
		'specialist',
		'work',
		'prices',
		'booking',
		'consultation',
		'contact',
	);

	/**
	 * Extra per-section strings that are neither a heading nor a body: the
	 * small labels and alt texts the design needs. key => [label, type].
	 *
	 * @return array<string,array<string,array{0:string,1:string}>>
	 */
	public static function section_fields(): array {
		return array(
			'hero'       => array(
				'services_label' => array( 'Services label', 'text' ),
				'service_name'   => array( 'Service name', 'text' ),
				'service_count'  => array( 'Service count', 'text' ),
				'image_alt'      => array( 'Hero photo alt text', 'text' ),
				'image'          => array( 'Hero photo', 'image' ),
				'thumb'          => array( 'Service thumbnail', 'image' ),
			),
			'technology' => array(
				'image_alt' => array( 'Photo alt text', 'text' ),
				'image'     => array( 'Photo', 'image' ),
			),
			'specialist' => array(
				'image_alt'       => array( 'Portrait alt text', 'text' ),
				'certificate_alt' => array( 'Certificate alt text', 'text' ),
				'image'           => array( 'Portrait', 'image' ),
				'certificate'     => array( 'Certificate', 'image' ),
			),
			'prices'     => array(
				'note' => array( 'Note under the price list', 'textarea' ),
			),
			'contact'    => array(
				'hours_title'          => array( 'Opening-hours heading', 'text' ),
				'hours_weekdays_label' => array( 'Open days label', 'text' ),
				'hours_weekdays'       => array( 'Open hours', 'text' ),
				'hours_closed_label'   => array( 'Closed days label', 'text' ),
				'hours_closed'         => array( 'Closed value', 'text' ),
			),
		);
	}

	public static function init(): void {
		add_action( 'init', array( __CLASS__, 'register_types' ) );
		add_action( 'add_meta_boxes', array( __CLASS__, 'add_meta_boxes' ) );
		add_action( 'save_post', array( __CLASS__, 'save_meta' ), 10, 2 );
		add_filter( 'manage_' . self::PRICE . '_posts_columns', array( __CLASS__, 'price_columns' ) );
		add_action( 'manage_' . self::PRICE . '_posts_custom_column', array( __CLASS__, 'price_column' ), 10, 2 );
		// Uploaded photography gets the same WebP treatment the committed
		// crops have — otherwise replacing a photo in wp-admin would quietly
		// drop the site back to JPEG delivery.
		add_filter( 'image_editor_output_format', array( __CLASS__, 'prefer_webp' ) );
	}

	/**
	 * @param array<string,string> $formats
	 * @return array<string,string>
	 */
	public static function prefer_webp( $formats ): array {
		$formats                = is_array( $formats ) ? $formats : array();
		$formats['image/jpeg']  = 'image/webp';
		$formats['image/png']   = 'image/webp';

		return $formats;
	}

	public static function register_types(): void {
		$shared = array(
			'public'       => false,
			'show_ui'      => true,
			'show_in_menu' => true,
			'show_in_rest' => true,
			'supports'     => array( 'title', 'editor', 'page-attributes', 'thumbnail' ),
			'menu_icon'    => 'dashicons-admin-customizer',
			'has_archive'  => false,
			'rewrite'      => false,
		);

		register_post_type(
			self::SECTION,
			array_merge(
				$shared,
				array(
					'labels'       => self::labels( __( 'Section', 'elcorix' ), __( 'Sections', 'elcorix' ) ),
					'supports'     => array( 'title', 'editor' ),
					'menu_icon'    => 'dashicons-layout',
					// Sections are seeded, never added ad hoc: a tenth section
					// would have no template to render it.
					'capabilities' => array( 'create_posts' => 'do_not_allow' ),
					'map_meta_cap' => true,
				)
			)
		);

		register_post_type(
			self::REASON,
			array_merge(
				$shared,
				array(
					'labels'    => self::labels( __( 'Reason', 'elcorix' ), __( 'Reasons', 'elcorix' ) ),
					'supports'  => array( 'title', 'page-attributes', 'thumbnail' ),
					'menu_icon' => 'dashicons-yes-alt',
				)
			)
		);

		register_post_type(
			self::WORK,
			array_merge(
				$shared,
				array(
					'labels'    => self::labels( __( 'Work', 'elcorix' ), __( 'Works', 'elcorix' ) ),
					'supports'  => array( 'title', 'page-attributes', 'thumbnail' ),
					'menu_icon' => 'dashicons-format-gallery',
				)
			)
		);

		register_post_type(
			self::PRICE,
			array_merge(
				$shared,
				array(
					'labels'     => self::labels( __( 'Price', 'elcorix' ), __( 'Prices', 'elcorix' ) ),
					'supports'   => array( 'title', 'page-attributes' ),
					'menu_icon'  => 'dashicons-tag',
					'taxonomies' => array( self::GROUP_TAX ),
				)
			)
		);

		register_post_type(
			self::PACKAGE,
			array_merge(
				$shared,
				array(
					'labels'    => self::labels( __( 'Package', 'elcorix' ), __( 'Packages', 'elcorix' ) ),
					'supports'  => array( 'title', 'page-attributes' ),
					'menu_icon' => 'dashicons-portfolio',
				)
			)
		);

		register_taxonomy(
			self::GROUP_TAX,
			array( self::PRICE ),
			array(
				'labels'            => self::labels( __( 'Price group', 'elcorix' ), __( 'Price groups', 'elcorix' ) ),
				'public'            => false,
				'show_ui'           => true,
				'show_in_rest'      => true,
				'hierarchical'      => true,
				'show_admin_column' => true,
				'rewrite'           => false,
			)
		);

		self::register_meta();
	}

	/** @return array<string,string> */
	private static function labels( string $single, string $plural ): array {
		return array(
			'name'          => $plural,
			'singular_name' => $single,
			'menu_name'     => $plural,
			/* translators: %s: post type name */
			'add_new_item'  => sprintf( __( 'Add %s', 'elcorix' ), $single ),
			/* translators: %s: post type name */
			'edit_item'     => sprintf( __( 'Edit %s', 'elcorix' ), $single ),
			'all_items'     => $plural,
		);
	}

	private static function register_meta(): void {
		$string_meta = array(
			self::PRICE   => array( '_elx_amount' ),
			self::PACKAGE => array( '_elx_zones', '_elx_single', '_elx_six', '_elx_eight' ),
			self::WORK    => array( '_elx_in_slider', '_elx_in_gallery' ),
		);

		foreach ( $string_meta as $type => $keys ) {
			foreach ( $keys as $key ) {
				self::register_string_meta( $type, $key );
			}
		}

		foreach ( self::section_fields() as $fields ) {
			foreach ( array_keys( $fields ) as $key ) {
				self::register_string_meta( self::SECTION, '_elx_' . $key );
			}
		}
	}

	private static function register_string_meta( string $type, string $key ): void {
		register_post_meta(
			$type,
			$key,
			array(
				'type'              => 'string',
				'single'            => true,
				'show_in_rest'      => true,
				'sanitize_callback' => 'sanitize_text_field',
				'auth_callback'     => array( __CLASS__, 'can_edit' ),
			)
		);
	}

	public static function can_edit(): bool {
		return current_user_can( 'edit_posts' );
	}

	/* ---------------------------------------------------------------- */
	/* Meta boxes                                                        */
	/* ---------------------------------------------------------------- */

	public static function add_meta_boxes(): void {
		add_meta_box(
			'elcorix_section_fields',
			__( 'Section details', 'elcorix' ),
			array( __CLASS__, 'render_section_box' ),
			self::SECTION,
			'normal',
			'high'
		);
		add_meta_box(
			'elcorix_price_fields',
			__( 'Price', 'elcorix' ),
			array( __CLASS__, 'render_price_box' ),
			self::PRICE,
			'side',
			'high'
		);
		add_meta_box(
			'elcorix_package_fields',
			__( 'Package', 'elcorix' ),
			array( __CLASS__, 'render_package_box' ),
			self::PACKAGE,
			'normal',
			'high'
		);
		add_meta_box(
			'elcorix_work_fields',
			__( 'Where it appears', 'elcorix' ),
			array( __CLASS__, 'render_work_box' ),
			self::WORK,
			'side',
			'high'
		);
	}

	private static function nonce_field(): void {
		wp_nonce_field( 'elcorix_meta', 'elcorix_meta_nonce' );
	}

	private static function text_row( int $post_id, string $key, string $label, string $type = 'text' ): void {
		$value = (string) get_post_meta( $post_id, '_elx_' . $key, true );
		printf( '<p><label for="elx_%1$s"><strong>%2$s</strong></label><br />', esc_attr( $key ), esc_html( $label ) );
		if ( 'textarea' === $type ) {
			printf(
				'<textarea id="elx_%1$s" name="elx_%1$s" rows="3" class="large-text">%2$s</textarea>',
				esc_attr( $key ),
				esc_textarea( $value )
			);
		} elseif ( 'image' === $type ) {
			printf(
				'<input type="text" id="elx_%1$s" name="elx_%1$s" value="%2$s" class="large-text" placeholder="%3$s" />',
				esc_attr( $key ),
				esc_attr( $value ),
				esc_attr__( 'Media library ID, or a file name from the theme images folder', 'elcorix' )
			);
		} else {
			printf(
				'<input type="text" id="elx_%1$s" name="elx_%1$s" value="%2$s" class="large-text" />',
				esc_attr( $key ),
				esc_attr( $value )
			);
		}
		echo '</p>';
	}

	public static function render_section_box( WP_Post $post ): void {
		self::nonce_field();
		$key    = self::section_key( $post->ID );
		$fields = self::section_fields()[ $key ] ?? array();

		if ( array() === $fields ) {
			echo '<p>' . esc_html__( 'This section is edited entirely through its title and body above.', 'elcorix' ) . '</p>';

			return;
		}
		foreach ( $fields as $field_key => $field ) {
			self::text_row( $post->ID, $field_key, $field[0], $field[1] );
		}
	}

	public static function render_price_box( WP_Post $post ): void {
		self::nonce_field();
		self::text_row( $post->ID, 'amount', __( 'Price in EUR (whole euros)', 'elcorix' ) );
		echo '<p class="description">' . esc_html__(
			'Read from the site default language, so every translation shows the same number.',
			'elcorix'
		) . '</p>';
	}

	public static function render_package_box( WP_Post $post ): void {
		self::nonce_field();
		self::text_row( $post->ID, 'zones', __( 'Included zones', 'elcorix' ), 'textarea' );
		self::text_row( $post->ID, 'single', __( 'Single treatment (EUR)', 'elcorix' ) );
		self::text_row( $post->ID, 'six', __( '6-session package (EUR)', 'elcorix' ) );
		self::text_row( $post->ID, 'eight', __( '8-session package (EUR)', 'elcorix' ) );
	}

	public static function render_work_box( WP_Post $post ): void {
		self::nonce_field();
		$boxes = array(
			'in_slider'  => __( 'Show in the home-page slider', 'elcorix' ),
			'in_gallery' => __( 'Show on the gallery page', 'elcorix' ),
		);
		foreach ( $boxes as $key => $label ) {
			$value = get_post_meta( $post->ID, '_elx_' . $key, true );
			printf(
				'<p><label><input type="checkbox" name="elx_%1$s" value="1" %2$s /> %3$s</label></p>',
				esc_attr( $key ),
				checked( '1', $value, false ),
				esc_html( $label )
			);
		}
	}

	public static function save_meta( int $post_id, WP_Post $post ): void {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		$nonce = isset( $_POST['elcorix_meta_nonce'] )
			? sanitize_text_field( wp_unslash( (string) $_POST['elcorix_meta_nonce'] ) )
			: '';
		if ( '' === $nonce || ! wp_verify_nonce( $nonce, 'elcorix_meta' ) ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$keys = array();
		if ( self::SECTION === $post->post_type ) {
			$keys = array_keys( self::section_fields()[ self::section_key( $post_id ) ] ?? array() );
		} elseif ( self::PRICE === $post->post_type ) {
			$keys = array( 'amount' );
		} elseif ( self::PACKAGE === $post->post_type ) {
			$keys = array( 'zones', 'single', 'six', 'eight' );
		}

		foreach ( $keys as $key ) {
			if ( ! isset( $_POST[ 'elx_' . $key ] ) ) {
				continue;
			}
			$value = sanitize_text_field( wp_unslash( (string) $_POST[ 'elx_' . $key ] ) );
			update_post_meta( $post_id, '_elx_' . $key, $value );
		}

		if ( self::WORK === $post->post_type ) {
			foreach ( array( 'in_slider', 'in_gallery' ) as $key ) {
				update_post_meta( $post_id, '_elx_' . $key, isset( $_POST[ 'elx_' . $key ] ) ? '1' : '0' );
			}
		}
	}

	/**
	 * @param array<string,string> $columns
	 * @return array<string,string>
	 */
	public static function price_columns( array $columns ): array {
		$columns['elx_amount'] = __( 'Price', 'elcorix' );

		return $columns;
	}

	public static function price_column( string $column, int $post_id ): void {
		if ( 'elx_amount' === $column ) {
			echo esc_html( elcorix_format_price( 'de', (float) get_post_meta( $post_id, '_elx_amount', true ) ) );
		}
	}

	/* ---------------------------------------------------------------- */
	/* Reading                                                           */
	/* ---------------------------------------------------------------- */

	/** The stable key of a section post (its slug in the default language). */
	public static function section_key( int $post_id ): string {
		$post = get_post( elcorix_default_language_post( $post_id ) );

		return $post instanceof WP_Post ? $post->post_name : '';
	}

	/** The section post for `$key` in the language being rendered. */
	public static function section( string $key ): ?WP_Post {
		static $cache = array();

		$language = elcorix_current_language();
		if ( isset( $cache[ $language ][ $key ] ) ) {
			return $cache[ $language ][ $key ];
		}

		$posts = get_posts(
			array(
				'post_type'        => self::SECTION,
				'name'             => $key,
				'posts_per_page'   => 1,
				'post_status'      => 'publish',
				'suppress_filters' => false,
				'lang'             => $language,
			)
		);
		$post = $posts[0] ?? null;

		// Polylang narrows the query to the current language; a section with
		// no translation yet still has to render, so fall back to the
		// default-language post rather than leaving a hole in the page.
		if ( null === $post ) {
			$fallback = get_posts(
				array(
					'post_type'        => self::SECTION,
					'name'             => $key,
					'posts_per_page'   => 1,
					'post_status'      => 'publish',
					'suppress_filters' => true,
				)
			);
			$post     = $fallback[0] ?? null;
		}

		$cache[ $language ][ $key ] = $post;

		return $post;
	}

	public static function section_title( string $key, string $default = '' ): string {
		$post = self::section( $key );

		return $post instanceof WP_Post ? $post->post_title : $default;
	}

	/** The section body, run through the content filters (paragraphs, bold). */
	public static function section_body( string $key ): string {
		$post = self::section( $key );
		if ( ! $post instanceof WP_Post ) {
			return '';
		}

		return apply_filters( 'the_content', $post->post_content );
	}

	/** The section body as one plain paragraph — for the short intros. */
	public static function section_intro( string $key, string $default = '' ): string {
		$post = self::section( $key );
		if ( ! $post instanceof WP_Post ) {
			return $default;
		}
		$text = trim( wp_strip_all_tags( $post->post_content ) );

		return '' !== $text ? $text : $default;
	}

	public static function section_meta( string $key, string $field, string $default = '' ): string {
		$post = self::section( $key );
		if ( ! $post instanceof WP_Post ) {
			return $default;
		}
		$value = (string) get_post_meta( $post->ID, '_elx_' . $field, true );

		return '' !== $value ? $value : $default;
	}

	/**
	 * Which photo is shown is business data, so it comes from the
	 * default-language post: a translator changes alt text, never the image.
	 */
	public static function section_image( string $key, string $field, string $default = '' ): string {
		$post = self::section( $key );
		if ( ! $post instanceof WP_Post ) {
			return $default;
		}
		$value = (string) get_post_meta( elcorix_default_language_post( $post->ID ), '_elx_' . $field, true );

		return '' !== $value ? $value : $default;
	}

	/**
	 * @param array<string,mixed> $extra
	 * @return WP_Post[]
	 */
	private static function query( string $type, array $extra = array() ): array {
		return get_posts(
			array_merge(
				array(
					'post_type'        => $type,
					'posts_per_page'   => -1,
					'post_status'      => 'publish',
					'orderby'          => array(
						'menu_order' => 'ASC',
						'title'      => 'ASC',
					),
					'suppress_filters' => false,
					'lang'             => elcorix_current_language(),
				),
				$extra
			)
		);
	}

	/** @return WP_Post[] */
	public static function reasons(): array {
		return self::query( self::REASON );
	}

	/** @return WP_Post[] */
	public static function works( string $where = 'in_slider' ): array {
		return array_values(
			array_filter(
				self::query( self::WORK ),
				static function ( WP_Post $post ) use ( $where ): bool {
					$source = elcorix_default_language_post( $post->ID );

					return '1' === (string) get_post_meta( $source, '_elx_' . $where, true );
				}
			)
		);
	}

	/** @return WP_Post[] */
	public static function prices( string $group ): array {
		return self::query(
			self::PRICE,
			array(
				'tax_query' => array(
					array(
						'taxonomy' => self::GROUP_TAX,
						'field'    => 'slug',
						'terms'    => $group,
					),
				),
			)
		);
	}

	/** @return WP_Post[] */
	public static function packages(): array {
		return self::query( self::PACKAGE );
	}

	/**
	 * A number attached to a post, read from the default-language original
	 * so translations cannot disagree about a price.
	 */
	public static function amount( int $post_id, string $field = 'amount' ): float {
		return (float) get_post_meta( elcorix_default_language_post( $post_id ), '_elx_' . $field, true );
	}
}
