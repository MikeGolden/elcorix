<?php
/**
 * GDPR consent banner.
 *
 * Non-modal on purpose: visitors must be able to read the privacy policy
 * (and the rest of the site) before deciding. "Accept all" and "Only
 * necessary" are styled identically — rejecting has to be as easy as
 * accepting.
 *
 * It is rendered on every page and hidden with the `hidden` attribute;
 * assets/js/app.js reveals it when localStorage holds no decision yet, and
 * the footer's "Cookie settings" button reopens it. Rendering it server-
 * side and hiding it (rather than building it in JavaScript) keeps the
 * decision instant instead of arriving a frame after the page.
 *
 * @package Elcorix
 */
?>
<div role="dialog"
	hidden
	data-elcorix-consent
	aria-labelledby="cookie-banner-title"
	class="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
	<div class="mx-auto flex max-w-[1200px] flex-col gap-4 rounded-panel border border-line bg-white p-5 shadow-[0_18px_48px_rgba(20,32,63,0.18)] sm:flex-row sm:items-center sm:p-6">
		<div class="flex-1">
			<h2 id="cookie-banner-title" class="text-base font-bold">
				<?php esc_html_e( 'Cookies & external services', 'elcorix' ); ?>
			</h2>
			<p class="mt-1.5 text-sm leading-relaxed">
				<?php
				esc_html_e(
					'We only use storage that is technically required (your language and this cookie decision). The Altegio booking calendar is an external service that sets cookies when it loads — we load it only with your consent. You can change your choice at any time under “Cookie settings” in the footer.',
					'elcorix'
				);
				?>
				<a href="<?php echo esc_url( elcorix_page_url( 'privacy' ) ); ?>" class="font-medium text-brand-600 underline underline-offset-4">
					<?php esc_html_e( 'Privacy policy', 'elcorix' ); ?>
				</a>
			</p>
		</div>
		<div class="flex shrink-0 flex-wrap gap-3">
			<button type="button" data-elcorix-consent-decide="deny" class="btn-ghost">
				<?php esc_html_e( 'Only necessary', 'elcorix' ); ?>
			</button>
			<button type="button" data-elcorix-consent-decide="allow" class="btn-primary">
				<?php esc_html_e( 'Accept all', 'elcorix' ); ?>
			</button>
		</div>
	</div>
</div>
