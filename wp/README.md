# elcorix — the WordPress build

An experiment: the same site, rebuilt on WordPress. Same design, same
copy, same photography, same booking flow, same GDPR posture — a classic
PHP theme and one plugin instead of React, Express and Postgres.

The React build is still on `main` and is untouched. This lives on
`experimental/wordpress` so the two can be compared side by side.

```
wp/
├── themes/elcorix/            the theme — presentation only
│   ├── front-page.php         the Figma one-pager
│   ├── template-*.php         prices, gallery, booking, contact, legal
│   ├── template-parts/        sections and components
│   ├── inc/                   setup, assets, SEO, template tags
│   ├── src/app.css            Tailwind source  →  assets/css/app.css
│   ├── assets/js/app.js       everything React used to do, in ~500 lines
│   └── languages/             de_DE and uk catalogues
├── plugins/elcorix-core/      content model, settings, endpoints, retention
│   ├── includes/functions.php every validation and formatting rule
│   └── tests/                 PHPUnit
├── tools/                     the seeder, the i18n import, the font build
├── e2e/                       Playwright, against a real WordPress
└── docker-compose.yml         WordPress + MariaDB + nightly dumps
```

## Getting it running

Prerequisites: Docker, and Node ≥ 20 if you want to rebuild the CSS.

```bash
cd wp
cp .env.example .env          # set DB_PASSWORD and DB_ROOT_PASSWORD
docker compose up -d --build
```

Then install WordPress and the one plugin the site depends on:

```bash
alias wp='docker compose run --rm wpcli'

wp core install \
  --url=http://localhost:8080 --title=elcorix \
  --admin_user=elena --admin_email=info@elcorix.com --admin_password='…'

wp plugin install polylang --activate
wp plugin activate elcorix-core
wp theme activate elcorix
wp rewrite structure '/%postname%/'
```

Set up the three languages in **Languages → Languages**: German first (it
becomes the default), then English and Ukrainian, and turn on *Hide URL
language information for the default language* under Languages → Settings.
That is what keeps the German URLs identical to the React site's.

Then seed the content:

```bash
wp eval-file wp-content/elcorix-tools/seed.php
```

That creates every page, section, price, package, reason and gallery image
in all three languages, imports the photography into the media library and
links the translations together. It is idempotent — run it again after
editing `tools/content/*.json` and it updates rather than duplicating.

Finally, open **Settings → elcorix** and put in the real business data: the
Altegio company id above all, plus the address, phone, VAT id and the
notification e-mail address.

## Where everything is edited

This is the part that is genuinely better than the React build, where a
price change meant a commit and a deploy.

| What | Where |
| --- | --- |
| Section headings and body copy | **Sections** — one post per landing section |
| The four "who is it for" cards | **Reasons** |
| Slider tiles and gallery photos | **Works** (a checkbox decides which of the two) |
| Zone prices | **Prices**, grouped women/men |
| Package table | **Packages** |
| Page intros, legal pages | the pages themselves |
| Address, phone, Altegio id, retention window | **Settings → elcorix** |
| Buttons, labels, form text | **Languages → Translations**, or the `.po` files |
| Contact messages and consultation requests | **elcorix inbox** (read-only) |

Numbers, images and ordering are read from the **default-language** post
even when a translation is being rendered. A translator changes the name of
a zone, never its price — the German and the Ukrainian price list cannot
disagree. That is the same separation `pricing.ts` and the translation
files had, enforced by the content model instead of by TypeScript.

## Building the CSS

The stylesheet is Tailwind v4, built from `themes/elcorix/src/app.css`,
with the self-hosted Inter and Manrope faces inlined at the top. The built
file is committed, so a deploy needs no Node:

```bash
npm install
npm run build          # fonts + CSS
npm run watch:css      # while working on templates
```

`npm run build:fonts` regenerates `src/fonts.css` from the `@fontsource`
packages in the React workspace and expects the `.woff2` files to already
be in `assets/fonts/`. Only the weights the design actually renders are
shipped — Manrope 700/800 and Inter 400/500/600/700 — and every face keeps
its `unicode-range`, so a German visitor never downloads the Cyrillic
subsets and a Ukrainian one does.

## Tests

```bash
# The plugin's rules: validation, price formatting, the Altegio id, JSON-LD.
php tools/phpunit-lite.php plugins/elcorix-core/tests
# …or, with PHPUnit installed:
vendor/bin/phpunit

# End to end, against a running site.
npx playwright install chromium      # once
npm run test:e2e
```

`tools/phpunit-lite.php` exists because this port was written on a machine
with no Composer access. The test files are ordinary PHPUnit test cases;
that file just implements the dozen assertions they use so they can run
anywhere. If PHPUnit is installed, it is never loaded.

Every assertion in `plugins/elcorix-core/tests` is a port of one the Vitest
suite made against the React client or the Express API. If one fails, this
build has drifted from the site it is supposed to reproduce.

## The API

The Express paths still work — the forms, the Playwright suite and anything
pointed at the old server call these, and nothing outside had to change:

| Method | Path | Also at |
| --- | --- | --- |
| GET | `/api/health` | `/wp-json/elcorix/v1/health` |
| POST | `/api/contact` | `/wp-json/elcorix/v1/contact` |
| GET | `/api/bookings/link` | `/wp-json/elcorix/v1/bookings/link` |
| POST | `/api/bookings` | `/wp-json/elcorix/v1/bookings` |

Both POST endpoints keep the hidden **honeypot** field (`website`):
submissions that fill it get a response identical to a success and are
stored nowhere, so a bot never learns it was filtered. Writes are
rate-limited to 30 per IP per 15 minutes.

Messages and requests go into two custom tables rather than into posts:
they hold personal data with a hard retention deadline, they are never
queried by the front end, and a post type would put a visitor's phone
number into every "recent content" listing in wp-admin. A daily WP-Cron
sweep deletes anything older than `retentionMonths` (default 12), which is
the promise the privacy policy makes.

**WP-Cron only fires when somebody visits the site.** On a quiet studio
site, point a real cron at it:

```
*/15 * * * * curl -s http://localhost:8080/wp-cron.php?doing_wp_cron > /dev/null
```

and set `define('DISABLE_WP_CRON', true);`.

## What changed, and why

Three deliberate differences from the React build. Everything else — the
layout, the copy, the section order, the photography, the consent
behaviour, the price list — is the same.

**1. Language is in the URL.** The React site kept all three languages on
one URL and switched them in the browser from `localStorage`. Polylang puts
German at the root (`/prices`) and the others under a prefix (`/en/prices`,
`/uk/prices`). So the German URLs are unchanged and the other two are new.

This is a real gain, not just a difference: the old design could not have
`hreflang` alternates, because alternates need distinct URLs, and its
prerendered `<head>` could only ever be in one language. Now every language
is separately indexable, and the switcher works with JavaScript off,
because each option is a link.

**2. There is no build-time prerender step.** `client/vite/seoPrerender.ts`
existed because a client-rendered SPA shows a crawler an empty `<div>`. The
pages are rendered on the server here, so the title, the description, the
canonical, the Open Graph tags, the JSON-LD *and the body* are all in the
first response. `e2e/seo.spec.ts` checks the price list itself is in the
raw HTML — something the React build could not have claimed.

**3. Prices are formatted by hand, not by `Intl`.** `NumberFormatter` gives
the right answer only with a full ICU data set; on an image with a trimmed
one it quietly returns "39 EUR" for every language, which would change the
German price list without failing anything. The three locales are written
out in `elcorix_format_price()` and pinned by a test — including the fact
that Ukrainian really does spell the currency out (`39 EUR`), which is what
`Intl.NumberFormat` produced for the React tables.

Two smaller ones: only `.woff2` is shipped (the Vite build also emitted a
`.woff` fallback; every browser that can run this site supports woff2), and
the sitemap is WordPress's own `/wp-sitemap.xml` rather than a hand-written
`sitemap.xml`.

## Security

The posture from `SECURITY.md` and `docker/nginx.conf` is kept, now set by
the theme so it holds however the site is served:

- `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and a
  CSP that names the two embeds — Altegio and OpenStreetMap — and nothing
  else.
- `script-src 'self'` with **no** `'unsafe-inline'`. The theme ships no
  inline JavaScript at all, which is why `assets/js/head.js` is a separate
  two-line file, and why the emoji polyfill is removed. A plugin that
  prints an inline `<script>` will break under this header — relax it in
  `inc/setup.php` rather than working around it, and know what you are
  giving up.
- The headers are skipped for logged-in users: the admin bar and the block
  editor's front-end helpers both print inline scripts, and an editor
  previewing the site should not be looking at a broken page.
- User enumeration through `/wp-json/wp/v2/users` is removed.
- `DISALLOW_FILE_EDIT` is on in the container; set `DISALLOW_FILE_MODS=true`
  in `.env` for production so a compromised admin account cannot install
  PHP.
- Payments stay on Altegio's own pages — card data never touches this
  codebase, exactly as before.

## GDPR

Unchanged in substance:

- The **Altegio embed is consent-gated** (two-click pattern). Its `src`
  lives in a data attribute until the visitor opts in, so nothing is
  requested from `alteg.io` before consent — `e2e/gdpr.spec.ts` watches the
  network to prove it. A no-cookie fallback link and the cookie-free
  call-back form are always available.
- The **OpenStreetMap embed** loads with the contact section, as Mykhailo
  asked; the privacy policy says so and must keep saying so.
- The consent banner offers "Accept all" and "Only necessary" with equal
  prominence, stores the decision (with its timestamp, as the consent
  record) in `localStorage`, and stays changeable from the footer.
- Stored requests are deleted after `retentionMonths`.
- The site sets no cookies of its own for a logged-out visitor —
  `e2e/gdpr.spec.ts` asserts it.

Note that logging into wp-admin *does* set WordPress's session cookies.
Those are strictly necessary for an authenticated session and need no
consent, but they are a new thing on this domain, so the privacy policy's
cookie section should mention them before launch.

## Still to do before this could replace `main`

- The `certificate.png` in the specialist section is still the blank
  template ("VOR- UND NACHNAME") — swap it for the real scan.
- The prices, the owner name and the VAT id in **Settings → elcorix** are
  placeholders.
- The Terms and the privacy policy need a lawyer's read, as they did before.
- An SMTP route: `wp_mail`'s default PHP `mail()` will not reach many
  inboxes. Install an SMTP plugin, or point the container at a relay.
