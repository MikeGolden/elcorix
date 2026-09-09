import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { loadEnv, type Plugin, type ResolvedConfig } from "vite";
import { altegioBookingUrlFor, sanitizeCompanyId } from "../src/business";
import {
  defaultLanguage,
  localizedPath,
  supportedLanguages,
  type SupportedLanguage,
} from "../src/i18n/routing";
import { featuresFrom, type Features } from "../src/features";
import { publicRoutes, siteRoutes, type SiteRoute } from "../src/seo/routes";
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
 *
 * The shells carry no rendered body: React still owns everything below
 * <head>, so no hydration, LCP or consent behaviour changes. Full SSG was
 * considered and rejected — it needs the app made SSR-safe for a gain that
 * only applies to crawlers which already execute JavaScript.
 */

/** `dist/de/index.html`, `dist/en/prices/index.html`. */
function shellPath(outDir: string, language: SupportedLanguage, routePath: string): string {
  return join(outDir, localizedPath(language, routePath).replace(/^\//, ""), "index.html");
}

function setHtmlLang(html: string, language: SupportedLanguage): string {
  return html.replace(/<html([^>]*)\slang="[^"]*"/i, `<html$1 lang="${language}"`);
}

export function seoPrerender(): Plugin {
  let config: ResolvedConfig;
  let bookingUrl = altegioBookingUrlFor(sanitizeCompanyId(undefined));
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
      bookingUrl = altegioBookingUrlFor(
        sanitizeCompanyId(env.VITE_ALTEGIO_COMPANY_ID ?? process.env.VITE_ALTEGIO_COMPANY_ID),
      );
      const features: Features = featuresFrom({
        VITE_ENABLE_ALTEGIO: env.VITE_ENABLE_ALTEGIO ?? process.env.VITE_ENABLE_ALTEGIO,
      });
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

      await writeFile(join(outDir, "sitemap.xml"), sitemap(), "utf8");

      config.logger.info(
        `seo-prerender: wrote ${written} route shells (${supportedLanguages.length} languages × ${routes.length} routes) and sitemap.xml`,
      );
    },
  };
}
