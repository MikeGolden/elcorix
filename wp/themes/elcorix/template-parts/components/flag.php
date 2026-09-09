<?php
/**
 * The three decorative flags in the language dropdown. Inline SVG, a few
 * rectangles each — a flag icon font would be a whole extra request for
 * three shapes.
 *
 * @package Elcorix
 */

$elcorix_code  = (string) ( $args['code'] ?? 'de' );
$elcorix_class = (string) ( $args['class'] ?? '' );
?>
<?php if ( 'de' === $elcorix_code ) : ?>
	<svg viewBox="0 0 60 40" class="<?php echo esc_attr( $elcorix_class ); ?>" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
		<rect width="60" height="14" y="0" fill="#000000" />
		<rect width="60" height="13" y="14" fill="#DD0000" />
		<rect width="60" height="13" y="27" fill="#FFCE00" />
	</svg>
<?php elseif ( 'uk' === $elcorix_code ) : ?>
	<svg viewBox="0 0 60 40" class="<?php echo esc_attr( $elcorix_class ); ?>" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
		<rect width="60" height="20" y="0" fill="#0057B7" />
		<rect width="60" height="20" y="20" fill="#FFD700" />
	</svg>
<?php else : ?>
	<svg viewBox="0 0 60 40" class="<?php echo esc_attr( $elcorix_class ); ?>" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
		<rect width="60" height="40" fill="#012169" />
		<path d="M0 0 60 40 M60 0 0 40" stroke="#ffffff" stroke-width="8" />
		<path d="M0 0 60 40 M60 0 0 40" stroke="#C8102E" stroke-width="5" />
		<path d="M30 0 V40 M0 20 H60" stroke="#ffffff" stroke-width="13" />
		<path d="M30 0 V40 M0 20 H60" stroke="#C8102E" stroke-width="8" />
	</svg>
<?php endif; ?>
