<?php
/**
 * The OpenStreetMap embed on the contact block.
 *
 * Loaded with the page, not click-to-load: Mykhailo asked for the map to
 * be visible straight away. The privacy policy states the consequence —
 * the visitor's IP reaches OpenStreetMap as soon as the contact section
 * loads — and it must keep saying so.
 *
 * The map stretches to the text column's height on md+, which is safe
 * here because a map has no subject to crop.
 *
 * @package Elcorix
 */

$elcorix_business = Elcorix_Settings::business();
$elcorix_map_url  = elcorix_map_embed_url(
	(float) $elcorix_business['geo']['latitude'],
	(float) $elcorix_business['geo']['longitude']
);
?>
<iframe title="<?php esc_attr_e( 'Map showing the studio location', 'elcorix' ); ?>"
	data-testid="map-embed"
	src="<?php echo esc_url( $elcorix_map_url ); ?>"
	class="aspect-[4/3] h-full w-full rounded-panel border-0 md:aspect-auto md:min-h-[420px]"
	loading="lazy"
	referrerpolicy="strict-origin-when-cross-origin"></iframe>
