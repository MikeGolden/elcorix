import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import App from "./App";
import { createI18nInstance } from "./i18n";
import { defaultLanguage, supportedLanguages, type SupportedLanguage } from "./i18n/routing";
import { features } from "./config";
import { localizedRouteFilePath } from "./seo/routePaths";
import { notFoundRoute, publicRoutes } from "./seo/routes";

/**
 * Build-time rendering of the page body.
 *
 * `vite/seoPrerender.ts` gives every URL its own <head>; this gives every
 * URL its own <body>. Until it existed the served document was a `<div
 * id="root">` and nothing else, so anything that does not run JavaScript —
 * GPTBot, ClaudeBot, PerplexityBot, Bingbot on a bad day, every social
 * scraper, and Google whenever it defers rendering — saw a page with no
 * words on it. A site whose text only exists after a bundle has parsed
 * cannot be quoted, summarised or ranked on that text.
 *
 * The markup produced here is *hydrated*, not replaced (see main.tsx), so
 * it has to be the same markup the browser's first render would produce.
 * Two components were made to agree for exactly this reason: `Reveal`
 * always starts unrevealed, and `ConsentProvider` reads localStorage in an
 * effect rather than during the first render.
 *
 * Nothing here runs in the browser: the whole module is built separately
 * (`vite build --ssr`) into `dist-ssr/`, used by `scripts/prerender.mjs`
 * and thrown away. It adds nothing to the bundle a visitor downloads.
 */
export function renderPage(language: SupportedLanguage, location: string): string {
  // One instance per page rather than a shared one: `changeLanguage` is
  // asynchronous, and a render must never see the previous page's
  // language half-applied.
  const i18n = createI18nInstance(true, language);
  return renderToString(
    <I18nextProvider i18n={i18n}>
      {/*
        `location` is decoded, not percent-encoded: React Router decodes
        the pathname before matching, so `/uk/ціни` is the form that
        matches the route.
      */}
      <StaticRouter location={location}>
        <App />
      </StaticRouter>
    </I18nextProvider>,
  );
}

export type PrerenderTarget = {
  /** Path of the shell inside dist/, as seoPrerender wrote it. */
  file: string;
  /** Language to render in — also what `<html lang>` of the shell says. */
  language: SupportedLanguage;
  /** URL to render, decoded, exactly as the browser will ask for it. */
  location: string;
};

/**
 * Every document the build produces: one per language per public route,
 * plus the 404 body. Derived from the same route table as the shells, so
 * the two lists cannot disagree about what exists.
 */
export function prerenderTargets(): PrerenderTarget[] {
  const routes = publicRoutes(features);
  const targets = supportedLanguages.flatMap((language) =>
    routes.map((route) => {
      const location = localizedRouteFilePath(language, route.path);
      return {
        file: `${location.replace(/^\//, "")}/index.html`,
        language,
        location,
      };
    }),
  );
  return [
    ...targets,
    // The unprefixed root: nginx's document for `/`, and the URL most
    // links point at. RootEntry renders the default language's home page
    // there and redirects after mount.
    { file: "index.html", language: defaultLanguage, location: "/" },
    // Unknown URLs: inside a language segment the router falls through to
    // NotFoundPage, which is exactly what the 404 document should carry.
    {
      file: "404.html",
      language: defaultLanguage,
      location: localizedRouteFilePath(defaultLanguage, notFoundRoute.path),
    },
  ];
}
