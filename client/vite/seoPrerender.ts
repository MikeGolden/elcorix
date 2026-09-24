import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { loadEnv, type Plugin, type ResolvedConfig } from "vite";
import { altegioBookingUrlFor, sanitizeCompanyId } from "../src/business";
import {
  defaultLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from "../src/i18n/routing";
import { localizedRouteFilePath } from "../src/seo/routePaths";
import { redirectMap } from "../src/seo/redirects";
import { featuresFrom, type Features } from "../src/features";
import { notFoundRoute, publicRoutes, siteRoutes, type SiteRoute } from "../src/seo/routes";
import { buildSitemap } from "../src/seo/sitemap";
import { injectSeoBlock, replaceSeoBlock, seoBlock } from "../src/seo/staticHead";

/**
 * Writes the per-language, per-route <head> that crawlers actually read,
 * plus the sitemap that lists those URLs.
 *
 * The app is a client-rendered SPA: `usePageMeta` sets the title,
 * description, canonical, hreflang and Open Graph tags in an effect, and
 * the LocalBusiness JSON-LD used to be injected the same way. Everything
 * that does not execute JavaScript therefore saw one document — the
 * unmodified index.html — whatever URL it asked for. That is every social
 * scraper there is: a link to /de/prices shared on WhatsApp or Instagram
 * previewed as the home page, and the structured data behind Google's local
 * results only existed after a render pass.
 *
 * So this plugin does three things:
 *
 *  1. `transformIndexHtml` (dev and build) injects the marked SEO block —
 *     title/description/canonical/hreflang/OG plus the JSON-LD — into
 *     index.html, so development and production serve the same head. That
 *     copy is German and canonicalises to `/de`; it is what nginx falls
 *     back to for `/` and for unknown URLs, both of which the router then
 *     redirects to a language.
 *  2. after the bundle is written, every language of every route in
 *     `publicRoutes` gets its own `dist/<lang>/<path>/index.html`: the same
 *     built document with that block swapped for the route's own, in that
 *     language, and `<html lang>` set to match. nginx serves them via
 *     `try_files $uri $uri/index.html /index.html`.
 *  3. `dist/sitemap.xml` is generated from the same route list, so the
 *     URLs and their hreflang alternates cannot drift from the router —
 *     including when a feature flag hides one of the routes.
 *  4. `dist/404.html` — the body of nginx's 404 response, marked
 *     `noindex` and carrying neither a canonical nor an hreflang set.
 *     Before it existed, every unknown URL was answered with index.html
 *     and a 200, so a typo, an old link or a scanner's guess was a
 *     perfectly indexable duplicate of the home page.
 *  5. `dist/_redirects.map` — an nginx `map` of every URL the site used to
 *     serve to the one it serves now, so the slug localization costs no
 *     inbound link. Generated from the same table for the same reason as
 *     the sitemap: a hand-kept list would be wrong within a month.
 *
 * The shells carry no rendered body: React still owns everything below
 * <head>, so no hydration, LCP or consent behaviour changes. Full SSG was
 * considered and rejected — it needs the app made SSR-safe for a gain that
 * only applies to crawlers which already execute JavaScript.
 */

/**
 * `dist/de/index.html`, `dist/de/preise/index.html`, `dist/uk/ціни/index.html`.
 *
 * Decoded, not percent-encoded: nginx decodes the request URI before
 * `try_files`, so the directory on disk has to be the real UTF-8 slug.
 */
function shellPath(outDir: string, language: SupportedLanguage, routePath: string): string {
  return join(outDir, localizedRouteFilePath(language, routePath).replace(/^\//, ""), "index.html");
}

function setHtmlLang(html: string, language: SupportedLanguage): string {
  return html.replace(/<html([^>]*)\slang="[^"]*"/i, `<html$1 lang="${language}"`);
}

export function seoPrerender(): Plugin {
  let config: ResolvedConfig;
  // Null while the Altegio flag is off — see localBusinessJsonLd.
  let bookingUrl: string | null = null;
  // Replaced in configResolved, once loadEnv has run. The flags decide
  // which routes get a shell and a sitemap entry — a route hidden in the
  // app must not be handed to crawlers here.
  let routes: readonly SiteRoute[] = publicRoutes(featuresFrom({}));

  const home = siteRoutes.find((route) => route.path === "/");
  if (!home) throw new Error('siteRoutes must contain the "/" route');

  const sitemap = () => buildSitemap(new Date().toISOString().slice(0, 10), routes);

  return {
    name: "elcorix:seo-prerender",
    configResolved(resolved) {
      config = resolved;
      // Vite has already loaded .env* by now, but only VITE_* variables it
      // decided to expose; loadEnv re-reads them for the config context.
      const env = loadEnv(resolved.mode, resolved.envDir ?? resolved.root, "VITE_");
      const features: Features = featuresFrom({
        VITE_ENABLE_ALTEGIO: env.VITE_ENABLE_ALTEGIO ?? process.env.VITE_ENABLE_ALTEGIO,
      });
      bookingUrl = features.altegio
        ? altegioBookingUrlFor(
            sanitizeCompanyId(env.VITE_ALTEGIO_COMPANY_ID ?? process.env.VITE_ALTEGIO_COMPANY_ID),
          )
        : null;
      routes = publicRoutes(features);
    },

    // The sitemap is generated, so there is no file in public/ for the dev
    // server to serve — and the footer links to it from every page.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== "/sitemap.xml") return next();
        res.setHeader("Content-Type", "application/xml");
        res.end(sitemap());
      });
    },

    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return injectSeoBlock(html, seoBlock(home, defaultLanguage, bookingUrl));
      },
    },

    async closeBundle() {
      if (config.command !== "build") return;
      // `npm run build` runs a second, SSR build for scripts/prerender.mjs
      // (src/entry-server.tsx). It has no index.html and no shells of its
      // own — everything below belongs to the client build only.
      if (config.build.ssr) return;

      // resolve, not join: an --outDir outside the project is absolute,
      // and join would nest it under the project root.
      const outDir = resolve(config.root, config.build.outDir);
      const source = join(outDir, "index.html");
      let html: string;
      try {
        html = await readFile(source, "utf8");
      } catch {
        // Library or SSR builds have no index.html — nothing to shell.
        return;
      }

      let written = 0;
      for (const language of supportedLanguages) {
        for (const route of routes) {
          const target = shellPath(outDir, language, route.path);
          await mkdir(dirname(target), { recursive: true });
          await writeFile(
            target,
            setHtmlLang(replaceSeoBlock(html, seoBlock(route, language, bookingUrl)), language),
            "utf8",
          );
          written += 1;
        }
      }

      // The 404 body: default language, no canonical, no alternates.
      await writeFile(
        join(outDir, "404.html"),
        setHtmlLang(
          replaceSeoBlock(
            html,
            seoBlock(notFoundRoute, defaultLanguage, bookingUrl, { noindex: true }),
          ),
          defaultLanguage,
        ),
        "utf8",
      );

      await writeFile(join(outDir, "sitemap.xml"), sitemap(), "utf8");
      await writeFile(join(outDir, "_redirects.map"), redirectMap(routes), "utf8");

      config.logger.info(
        `seo-prerender: wrote ${written} route shells (${supportedLanguages.length} languages × ${routes.length} routes), 404.html, sitemap.xml and _redirects.map`,
      );
    },
  };
}
