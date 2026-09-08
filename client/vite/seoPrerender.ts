import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { loadEnv, type Plugin, type ResolvedConfig } from "vite";
import { altegioBookingUrlFor, sanitizeCompanyId } from "../src/business";
import { siteRoutes } from "../src/seo/routes";
import { injectSeoBlock, replaceSeoBlock, seoBlock } from "../src/seo/staticHead";

/**
 * Writes the per-route <head> that crawlers actually read.
 *
 * The app is a client-rendered SPA: `usePageMeta` sets the title,
 * description, canonical and Open Graph tags in an effect, and the
 * LocalBusiness JSON-LD used to be injected the same way. Everything that
 * does not execute JavaScript therefore saw one document — the unmodified
 * index.html — whatever URL it asked for. That is every social scraper
 * there is: a link to /prices shared on WhatsApp or Instagram previewed as
 * the home page, and the structured data behind Google's local results
 * only existed after a render pass.
 *
 * So this plugin does two things:
 *
 *  1. `transformIndexHtml` (dev and build) injects the marked SEO block —
 *     home-page title/description/canonical/OG plus the JSON-LD — into
 *     index.html, so development and production serve the same head.
 *  2. after the bundle is written, every other route in `siteRoutes` gets
 *     its own `dist/<path>/index.html`: the same built document with that
 *     block swapped for the route's own. nginx serves it via
 *     `try_files $uri $uri/index.html /index.html`.
 *
 * The shells are German (see staticHead.ts) and carry no rendered body:
 * React still owns everything below <head>, so no hydration, LCP or
 * consent behaviour changes. Full SSG was considered and rejected — it
 * needs the app made SSR-safe for a gain that only applies to crawlers
 * which already execute JavaScript.
 */
export function seoPrerender(): Plugin {
  let config: ResolvedConfig;
  let bookingUrl = altegioBookingUrlFor(sanitizeCompanyId(undefined));

  const home = siteRoutes.find((route) => route.path === "/");
  if (!home) throw new Error('siteRoutes must contain the "/" route');

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
    },

    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return injectSeoBlock(html, seoBlock(home, bookingUrl));
      },
    },

    async closeBundle() {
      if (config.command !== "build") return;

      const outDir = join(config.root, config.build.outDir);
      const source = join(outDir, "index.html");
      let html: string;
      try {
        html = await readFile(source, "utf8");
      } catch {
        // Library or SSR builds have no index.html — nothing to shell.
        return;
      }

      const written: string[] = [];
      for (const route of siteRoutes) {
        if (route.path === "/") continue;
        const target = join(outDir, route.path.replace(/^\//, ""), "index.html");
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, replaceSeoBlock(html, seoBlock(route, bookingUrl)), "utf8");
        written.push(route.path);
      }

      config.logger.info(`seo-prerender: wrote ${written.length} route shells (${written.join(", ")})`);
    },
  };
}
