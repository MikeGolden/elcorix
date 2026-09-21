/**
 * Renders the app into the prerendered shells.
 *
 * Runs third in `npm run build`, after the client build (which writes
 * dist/ and one <head> shell per language × route) and the SSR build
 * (which writes dist-ssr/entry-server.js). For each shell it renders that
 * page's body and drops it into the empty `<div id="root">`, so the
 * document nginx serves is complete HTML rather than a mount point.
 *
 * Deliberately a separate step, not part of the Vite plugin: the plugin
 * runs inside the client build, where the app's own modules are not
 * loadable as Node code. This script runs after both builds and only
 * rewrites files they have already written.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, process.env.PRERENDER_DIST ?? "dist");
const { renderPage, prerenderTargets } = await import(
  resolve(root, process.env.PRERENDER_SSR_DIST ?? "dist-ssr", "entry-server.js")
);

const MOUNT = '<div id="root"></div>';

let written = 0;
for (const target of prerenderTargets()) {
  const file = join(dist, target.file);
  const shell = await readFile(file, "utf8");
  if (!shell.includes(MOUNT)) {
    // A silent miss here would ship an empty body again, which is the one
    // thing this step exists to prevent.
    throw new Error(`${target.file}: no ${MOUNT} to render into`);
  }
  const body = renderPage(target.language, target.location);
  await writeFile(file, shell.replace(MOUNT, `<div id="root">${body}</div>`), "utf8");
  written += 1;
}

console.log(`prerender: rendered ${written} documents into ${dist}`);
