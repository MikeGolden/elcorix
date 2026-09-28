import fs from "node:fs";
import path from "node:path";
import { chromium, type FullConfig } from "@playwright/test";
import lighthouse from "lighthouse";
import type { Result } from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { PAGES, REPORT_DIR, reportPath } from "./pages";

/**
 * Runs Lighthouse once per page (or LH_RUNS times, keeping the median) before
 * any test starts, and writes each result to lighthouse-reports/. The specs
 * only read those files — so a failing assertion never triggers a re-audit,
 * and every check on a page judges the same run.
 *
 * Lighthouse's default config IS the PageSpeed Insights mobile profile:
 * Moto G Power viewport, simulated slow 4G, 4× CPU slowdown.
 */

const RUNS = Math.max(1, Number(process.env.LH_RUNS ?? 1));

async function audit(url: string): Promise<{ lhr: Result; html: string }> {
  const chrome = await chromeLauncher.launch({
    chromePath: process.env.PW_CHROMIUM_PATH ?? chromium.executablePath(),
    // --no-sandbox: GitHub's Ubuntu 24 runners block the user namespaces
    // Chromium's sandbox needs (Playwright passes the same flag).
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "html",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });
    if (!result) throw new Error(`Lighthouse returned nothing for ${url}`);
    if (result.lhr.runtimeError) {
      throw new Error(`Lighthouse failed on ${url}: ${result.lhr.runtimeError.message}`);
    }
    return { lhr: result.lhr, html: result.report as string };
  } finally {
    chrome.kill();
  }
}

const perf = (lhr: Result) => lhr.categories.performance.score ?? 0;

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? "http://localhost:4173";
  fs.rmSync(REPORT_DIR, { recursive: true, force: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  for (const page of PAGES) {
    const url = new URL(page.path, baseURL).href;
    const runs = [];
    for (let i = 0; i < RUNS; i++) runs.push(await audit(url));
    // The median by performance score; the other categories don't vary.
    runs.sort((a, b) => perf(a.lhr) - perf(b.lhr));
    const { lhr, html } = runs[Math.floor(runs.length / 2)];

    fs.writeFileSync(reportPath(page.name, "json"), JSON.stringify(lhr));
    fs.writeFileSync(reportPath(page.name, "html"), html);
    const pct = (id: string) => Math.round((lhr.categories[id]?.score ?? 0) * 100);
    console.log(
      `lighthouse ${page.name.padEnd(10)} perf ${pct("performance")} · a11y ${pct("accessibility")}` +
        ` · best practices ${pct("best-practices")} · seo ${pct("seo")}` +
        (RUNS > 1 ? `  (median of ${RUNS}: ${runs.map((r) => Math.round(perf(r.lhr) * 100)).join("/")})` : "") +
        `  → ${path.relative(process.cwd(), reportPath(page.name, "html"))}`,
    );
  }
}
