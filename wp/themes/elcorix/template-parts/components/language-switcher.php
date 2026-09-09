<?php
/**
 * The language switcher.
 *
 * An accessible listbox: the trigger is the word only — no pill border, no
 * flag — and the flags live in the dropdown, as Mykhailo asked. Keyboard
 * behaviour (arrows, Home/End, Enter, Escape) is in assets/js/app.js.
 *
 * What changed against the React version is underneath: each option is now
 * a real link to that language's URL rather than a button that swapped the
 * dictionary in place. That is what makes hreflang and per-language
 * indexing possible, and it means the switcher still works with
 * JavaScript off.
 *
 * @package Elcorix
 */

$elcorix_languages = elcorix_languages();
$elcorix_current   = elcorix_current_language();
if ( ! isset( $elcorix_languages[ $elcorix_current ] ) ) {
	$elcorix_current = elcorix_default_language();
}
$elcorix_flag_class = 'h-4 w-6 shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgba(20,32,63,0.12)]';
?>
<div class="relative" data-elcorix-language>
	<button type="button"
		data-testid="language-switcher"
		data-elcorix-language-trigger
		aria-haspopup="listbox"
		aria-expanded="false"
		aria-label="<?php esc_attr_e( 'Language', 'elcorix' ); ?>"
		class="flex items-center gap-1.5 rounded-full px-2 py-2 text-xs font-semibold text-brand-700 transition-colors hover:text-brand-500">
		<span class="hidden sm:inline"><?php echo esc_html( $elcorix_languages[ $elcorix_current ]['label'] ); ?></span>
		<span class="sm:hidden" aria-hidden="true"><?php echo esc_html( strtoupper( $elcorix_current ) ); ?></span>
		<svg viewBox="0 0 20 20" class="h-4 w-4 transition-transform" aria-hidden="true" focusable="false" data-elcorix-language-chevron>
			<path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.5" />
		</svg>
	</button>

	<ul role="listbox"
		hidden
		data-elcorix-language-list
		aria-label="<?php esc_attr_e( 'Language', 'elcorix' ); ?>"
		class="absolute right-0 z-50 mt-2 min-w-40 overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-[0_18px_48px_rgba(20,32,63,0.16)]">
		<?php foreach ( $elcorix_languages as $elcorix_slug => $elcorix_language ) : ?>
			<li role="option"
				tabindex="-1"
				aria-selected="<?php echo $elcorix_slug === $elcorix_current ? 'true' : 'false'; ?>"
				<?php echo $elcorix_slug === $elcorix_current ? 'aria-current="true"' : ''; ?>
				aria-label="<?php echo esc_attr( $elcorix_language['label'] ); ?>"
				data-elcorix-language-option="<?php echo esc_attr( elcorix_language_url( $elcorix_slug ) ); ?>"
				class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-surface-soft focus:bg-surface-soft focus:outline-none">
				<?php get_template_part( 'template-parts/components/flag', null, array( 'code' => $elcorix_slug, 'class' => $elcorix_flag_class ) ); ?>
				<a href="<?php echo esc_url( elcorix_language_url( $elcorix_slug ) ); ?>" class="block w-full" tabindex="-1">
					<?php echo esc_html( $elcorix_language['label'] ); ?>
				</a>
			</li>
		<?php endforeach; ?>
	</ul>
</div>
