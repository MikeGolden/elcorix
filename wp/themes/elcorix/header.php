<?php
/**
 * The document head and the site header.
 *
 * The header is transparent over the hero photo and only paints its
 * background once the page scrolls away from the top, so its buttons sit
 * directly on the photograph — Mykhailo's call, and the reason there is no
 * bottom border. `assets/js/app.js` adds `is-scrolled` past 8px.
 *
 * Both the menu and the language list are rendered here and hidden with
 * the `hidden` attribute rather than built by JavaScript: a crawler, and a
 * visitor whose script fails, still get every link in the markup.
 *
 * @package Elcorix
 */

$elcorix_business = Elcorix_Settings::business();

/**
 * The anchor menu of the header. These are the same seven jumps the React
 * `navAnchors` had; the labels are theme strings rather than section
 * titles because the menu wants "Our price list" where the section itself
 * says "Popular services and prices".
 */
$elcorix_anchors = array(
	'for-whom'     => __( 'Who is it for?', 'elcorix' ),
	'technology'   => __( 'Our technology', 'elcorix' ),
	'specialist'   => __( 'About the specialist', 'elcorix' ),
	'work'         => __( 'Our work', 'elcorix' ),
	'prices'       => __( 'Our price list', 'elcorix' ),
	'consultation' => __( 'Request a quote', 'elcorix' ),
	'contact'      => __( 'Contact', 'elcorix' ),
);

$elcorix_round_button = 'flex h-11 w-11 items-center justify-center rounded-full transition-colors';
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'flex min-h-screen flex-col bg-surface text-ink-500' ); ?>>
<?php wp_body_open(); ?>

<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand-700 focus:px-5 focus:py-2 focus:text-white">
	<?php esc_html_e( 'Skip to content', 'elcorix' ); ?>
</a>

<header class="site-header sticky top-0 z-40 bg-transparent transition-colors" data-elcorix-header>
	<div class="mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-4 sm:px-6">
		<div class="flex items-center gap-4">
			<?php elcorix_logo(); ?>
			<?php
			// Optically centred on the wordmark: the boxes are centred and the
			// 2px nudge lines the digits up with the x-height band of "corix",
			// which carries the logo's visual weight.
			?>
			<a href="<?php echo esc_url( $elcorix_business['telHref'] ); ?>"
				class="hidden translate-y-[2px] text-sm font-medium text-brand-700 transition-colors hover:text-brand-500 md:inline">
				<?php echo esc_html( $elcorix_business['phone'] ); ?>
			</a>
		</div>

		<div class="relative ml-auto flex items-center gap-2 sm:gap-3" data-elcorix-header-actions>
			<?php get_template_part( 'template-parts/components/language-switcher' ); ?>

			<a href="<?php echo esc_url( elcorix_anchor_href( 'consultation' ) ); ?>"
				class="btn-primary hidden px-6 py-3 text-sm sm:inline-flex">
				<?php esc_html_e( 'Get a consultation', 'elcorix' ); ?>
			</a>

			<a href="<?php echo esc_url( $elcorix_business['whatsapp'] ); ?>"
				target="_blank"
				rel="noreferrer"
				aria-label="<?php esc_attr_e( 'Message us on WhatsApp', 'elcorix' ); ?>"
				class="<?php echo esc_attr( $elcorix_round_button ); ?> bg-white text-brand-700 shadow-[0_1px_4px_rgba(20,32,63,0.14)] hover:bg-brand-50">
				<?php elcorix_icon( 'whatsapp' ); ?>
			</a>

			<button type="button"
				data-testid="menu-toggle"
				data-elcorix-menu-toggle
				aria-expanded="false"
				aria-controls="anchor-menu"
				aria-label="<?php esc_attr_e( 'Menu', 'elcorix' ); ?>"
				class="<?php echo esc_attr( $elcorix_round_button ); ?> bg-brand-700 text-white hover:bg-brand-800">
				<span data-elcorix-menu-icon="open"><?php elcorix_icon( 'menu' ); ?></span>
				<span data-elcorix-menu-icon="close" hidden><?php elcorix_icon( 'close' ); ?></span>
			</button>

			<nav id="anchor-menu"
				data-elcorix-menu
				hidden
				aria-label="<?php esc_attr_e( 'Menu', 'elcorix' ); ?>"
				class="absolute right-0 top-14 w-64 rounded-panel border border-line bg-white p-3 shadow-[0_18px_48px_rgba(20,32,63,0.14)]">
				<ul class="space-y-1">
					<?php foreach ( $elcorix_anchors as $elcorix_id => $elcorix_label ) : ?>
						<li>
							<a href="<?php echo esc_url( elcorix_anchor_href( $elcorix_id ) ); ?>"
								class="block rounded-xl px-4 py-2.5 text-[0.95rem] font-semibold text-brand-700 transition-colors hover:bg-brand-50">
								<?php echo esc_html( $elcorix_label ); ?>
							</a>
						</li>
					<?php endforeach; ?>
					<li class="pt-1 sm:hidden">
						<a href="<?php echo esc_url( elcorix_anchor_href( 'consultation' ) ); ?>" class="btn-primary w-full">
							<?php esc_html_e( 'Get a consultation', 'elcorix' ); ?>
						</a>
					</li>
				</ul>
			</nav>
		</div>
	</div>
</header>

<main id="main" class="flex-1">
