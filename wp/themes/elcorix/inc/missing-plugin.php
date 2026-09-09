<?php
/**
 * What the front end shows when the elcorix Core plugin is not active.
 *
 * The theme is presentation only: without the plugin there is no content,
 * no business data and none of the template tags the templates call, so
 * every one of them would fatal on its first line. A plain, styled page
 * that names the cause is more useful than a blank one — to whoever is
 * setting the site up, and to a visitor who would otherwise see nothing.
 *
 * @package Elcorix
 */

status_header( 503 );
nocache_headers();
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="robots" content="noindex" />
	<title><?php bloginfo( 'name' ); ?></title>
	<link rel="stylesheet" href="<?php echo esc_url( get_theme_file_uri( 'assets/css/app.css' ) ); ?>" />
</head>
<body class="bg-surface font-sans text-ink-500">
	<section class="mx-auto max-w-xl px-6 py-24 text-center">
		<h1 class="text-2xl font-bold"><?php bloginfo( 'name' ); ?></h1>
		<p class="mt-4 text-[0.95rem] leading-relaxed">
			<?php
			esc_html_e(
				'This site is not finished setting up. The elcorix Core plugin, which holds all of its content, is not active.',
				'elcorix'
			);
			?>
		</p>
	</section>
</body>
</html>
