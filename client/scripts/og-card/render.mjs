/**
 * Renders the Open Graph share card, public/images/og-elcorix.jpg (1200×630).
 *
 *   node client/scripts/og-card/render.mjs
 *
 * card.html is the design; it pulls the hero photo from public/images and
 * Manrope from node_modules, so the card matches the site. Chromium does the
 * layout and writes the JPEG (set PW_CHROMIUM_PATH if Playwright's own
 * browser is not installed). Re-run it after changing the hero photo.
 */
import { chromium } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "../../public/images/og-elcorix.jpg");

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(join(here, "card.html")).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out, type: "jpeg", quality: 85 });
await browser.close();
console.log(`wrote ${out}`);
