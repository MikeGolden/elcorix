<?php
/**
 * "Für wen ist es geeignet?" — four cards, image plus headline plus link.
 *
 * The cards land one after another rather than as a block; two columns
 * means the stagger only ever runs four steps deep.
 *
 * @package Elcorix
 */

$elcorix_reasons = Elcorix_Content::reasons();
?>
<section id="for-whom"
	aria-labelledby="for-whom-title"
	class="mx-auto max-w-[1200px] border-b border-line px-4 pb-16 sm:px-6 sm:pb-20">
	<h2 id="for-whom-title" <?php echo elcorix_reveal_attrs( array( 'class' => 'text-2xl font-bold sm:text-3xl' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
		<?php echo esc_html( Elcorix_Content::section_title( 'for-whom' ) ); ?>
	</h2>
	<ul class="mt-8 grid gap-5 md:grid-cols-2">
		<?php foreach ( $elcorix_reasons as $elcorix_index => $elcorix_reason ) : ?>
			<li <?php echo elcorix_reveal_attrs( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				array(
					'class' => 'flex items-center gap-5 rounded-panel bg-surface-soft p-5',
					'delay' => 80 * $elcorix_index,
				)
			); ?>>
				<?php
				$elcorix_thumb = get_post_thumbnail_id( elcorix_default_language_post( $elcorix_reason->ID ) );
				if ( $elcorix_thumb ) {
					elcorix_photo(
						array(
							'src'    => (string) $elcorix_thumb,
							'alt'    => '',
							'width'  => '480',
							'height' => '480',
							'class'  => 'h-24 w-24 shrink-0 rounded-2xl object-cover sm:h-28 sm:w-28',
						)
					);
				}
				?>
				<div>
					<h3 class="text-[1.05rem] font-bold leading-snug text-ink-900">
						<?php echo esc_html( $elcorix_reason->post_title ); ?>
					</h3>
					<a href="<?php echo esc_url( elcorix_anchor_href( 'consultation' ) ); ?>" class="link-more mt-3">
						<?php esc_html_e( 'Learn more', 'elcorix' ); ?>
						<?php elcorix_icon( 'arrow-right' ); ?>
					</a>
				</div>
			</li>
		<?php endforeach; ?>
	</ul>
</section>
