# The official WordPress image plus WP-CLI.
#
# WP-CLI is here because the seeder (wp/tools/seed.php) runs through it,
# and because `wp plugin install polylang` is part of first-time setup.
#
# Nothing else is added. In particular ext-intl is deliberately NOT
# installed: prices are formatted by elcorix_format_price(), which writes
# the three locales out by hand precisely so the output cannot depend on
# which ICU data set an image happens to ship.
FROM wordpress:6.7-php8.3-apache

RUN set -eux; \
	curl -fsSL -o /usr/local/bin/wp \
		https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar; \
	chmod +x /usr/local/bin/wp; \
	wp --allow-root --info > /dev/null

# WordPress writes its own uploads into the wp-data volume; the theme and
# the plugin are bind-mounted from the repo, so an edit shows up on the
# next request without a rebuild.
