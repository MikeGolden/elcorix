<?php
/**
 * The price lists: the two zone tables side by side, and the package
 * table below them.
 *
 * The numbers come from the default-language post
 * (Elcorix_Content::amount), so the German and the Ukrainian list can
 * never disagree about a price; only the zone names are translated. That
 * is the same split the React build had between `pricing.ts` and the
 * translation files, kept honest by the CMS instead of by TypeScript.
 *
 * @param string $args['show'] "zones", "packages" or "all" (default).
 *
 * @package Elcorix
 */

$elcorix_show     = (string) ( $args['show'] ?? 'all' );
$elcorix_language = elcorix_current_language();

$elcorix_groups = array(
	'women' => __( 'Services for women', 'elcorix' ),
	'men'   => __( 'Services for men', 'elcorix' ),
);
?>

<?php if ( 'packages' !== $elcorix_show ) : ?>
	<div class="grid gap-x-16 gap-y-10 md:grid-cols-2">
		<?php foreach ( $elcorix_groups as $elcorix_group => $elcorix_group_label ) : ?>
			<?php $elcorix_rows = Elcorix_Content::prices( $elcorix_group ); ?>
			<section aria-labelledby="prices-<?php echo esc_attr( $elcorix_group ); ?>">
				<h3 id="prices-<?php echo esc_attr( $elcorix_group ); ?>" class="text-lg font-bold text-brand-700">
					<?php echo esc_html( $elcorix_group_label ); ?>
				</h3>
				<ul class="mt-4">
					<?php foreach ( $elcorix_rows as $elcorix_index => $elcorix_row ) : ?>
						<li class="flex items-baseline justify-between gap-6 rounded-lg px-4 py-3 text-[0.95rem] <?php echo 1 === $elcorix_index % 2 ? 'bg-surface-soft' : ''; ?>">
							<span class="text-ink-700"><?php echo esc_html( $elcorix_row->post_title ); ?></span>
							<span class="whitespace-nowrap font-semibold text-ink-900">
								<?php echo esc_html( elcorix_format_price( $elcorix_language, Elcorix_Content::amount( $elcorix_row->ID ) ) ); ?>
							</span>
						</li>
					<?php endforeach; ?>
				</ul>
			</section>
		<?php endforeach; ?>
	</div>
<?php endif; ?>

<?php if ( 'zones' !== $elcorix_show ) : ?>
	<?php $elcorix_packages = Elcorix_Content::packages(); ?>
	<section aria-labelledby="prices-packages" class="<?php echo 'all' === $elcorix_show ? 'mt-14' : ''; ?>">
		<h3 id="prices-packages" class="text-lg font-bold text-brand-700">
			<?php esc_html_e( 'Package deals for women', 'elcorix' ); ?>
		</h3>
		<?php // The table keeps its own scroll on small screens rather than widening the page. ?>
		<div class="mt-4 overflow-x-auto">
			<table class="w-full min-w-[42rem] border-collapse text-left text-sm">
				<thead>
					<tr class="text-ink-900">
						<th scope="col" class="px-4 py-3 font-semibold"><?php esc_html_e( 'Package', 'elcorix' ); ?></th>
						<th scope="col" class="px-4 py-3 font-semibold"><?php esc_html_e( 'Zones included', 'elcorix' ); ?></th>
						<th scope="col" class="whitespace-nowrap px-4 py-3 text-right font-semibold"><?php esc_html_e( 'Single treatment', 'elcorix' ); ?></th>
						<th scope="col" class="whitespace-nowrap px-4 py-3 text-right font-semibold"><?php esc_html_e( '6-session package', 'elcorix' ); ?></th>
						<th scope="col" class="whitespace-nowrap px-4 py-3 text-right font-semibold"><?php esc_html_e( '8-session package', 'elcorix' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $elcorix_packages as $elcorix_index => $elcorix_package ) : ?>
						<tr class="<?php echo 1 === $elcorix_index % 2 ? 'bg-surface-soft' : ''; ?>">
							<th scope="row" class="rounded-l-lg px-4 py-4 font-medium text-ink-700">
								<?php echo esc_html( $elcorix_package->post_title ); ?>
							</th>
							<td class="px-4 py-4 text-ink-500">
								<?php echo esc_html( (string) get_post_meta( $elcorix_package->ID, '_elx_zones', true ) ); ?>
							</td>
							<?php foreach ( array( 'single', 'six', 'eight' ) as $elcorix_column ) : ?>
								<td class="whitespace-nowrap <?php echo 'eight' === $elcorix_column ? 'rounded-r-lg ' : ''; ?>px-4 py-4 text-right font-semibold text-ink-900">
									<?php echo esc_html( elcorix_format_price( $elcorix_language, Elcorix_Content::amount( $elcorix_package->ID, $elcorix_column ) ) ); ?>
								</td>
							<?php endforeach; ?>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		</div>
	</section>
<?php endif; ?>
