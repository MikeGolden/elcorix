import fs from "node:fs";
import { test, expect } from "@playwright/test";
import type { Result } from "lighthouse";
import { PAGES, reportPath, type PageName } from "./pages";

/**
 * Lighthouse, run the way PageSpeed Insights runs it: mobile form factor
 * (Moto G Power), simulated slow 4G, 4× CPU slowdown — Lighthouse's default
 * config, which is what PSI's mobile tab uses.
 *
 * It runs against the production build (client/dist) served by
 * lighthouse/serve-dist.mjs with nginx's gzip and CSP, NOT the Vite dev
 * server, whose unbundled modules would make every number meaningless.
 *
 *   npm run build -w client
 *   npm run test:lighthouse            # LH_RUNS=3 for the median of 3
 *
 * global-setup.ts runs the audits; this file only judges them. JSON and
 * HTML reports land in lighthouse-reports/ (gitignored) — open the HTML one
 * for the same view PSI gives.
 *
 * What the lab cannot see: anything between nginx and the visitor. On
 * 2026-09-28 the live site served every file uncompressed because Caddy's
 * `Via` header switches nginx's gzip off (gzip_proxied defaults to off) —
 * this suite serves gzip itself and so would score that site in the 90s.
 * That regression needs its own guard next to the docker smoke tests.
 */

/**
 * Checks that fail today, each with the fix that makes it pass. test.fail()
 * turns them into expected failures, so CI stays green — and the moment a
 * fix lands the test reports "expected to fail, but passed", which is the
 * cue to delete its line here. "*" matches every page.
 */
const KNOWN_FAILURES: Record<string, string> = {
  "* best-practices":
    "fix 2: Vite inlines four small Manrope Cyrillic fonts as data: URLs; font-src 'self' refuses them → 4 console errors",
  "* no console errors": "fix 2: same data: font CSP violations",
  "* hero at most once":
    "fix 3: index.html preloads hero.webp (1600w) on every page, the phone then fetches hero-900.webp as well",
  "root seo": "fix 6: four 'Learn more' links in sections/ForWhom.tsx",
  "root image delivery": "fix 4: thumbnails, technology and specialist photos are 3–5× their rendered size",
  "home-de image delivery": "fix 4: same oversized images",
  "prices-de accessibility": "fix 7: h3#prices-women follows the h1 with no h2 in between",
};

function expectFailureIfKnown(page: PageName, check: string) {
  const reason = KNOWN_FAILURES[`${page} ${check}`] ?? KNOWN_FAILURES[`* ${check}`];
  test.fail(reason !== undefined, reason);
}

const score = (lhr: Result, category: string) =>
  Math.round((lhr.categories[category]?.score ?? 0) * 100);

/** Failing audits in a category, as readable lines for the assertion message. */
function failing(lhr: Result, category: string): string[] {
  return lhr.categories[category].auditRefs
    .filter((ref) => ref.weight > 0)
    .map((ref) => lhr.audits[ref.id])
    .filter((a) => a.score !== null && a.score < 1)
    .map((a) => `${a.id}: ${a.title}${a.displayValue ? ` (${a.displayValue})` : ""}`);
}

for (const pageSpec of PAGES) {
  test.describe(`Lighthouse mobile — ${pageSpec.name} (${pageSpec.path})`, () => {
    // Audited once, up front, by global-setup.ts. Read in a hook rather than
    // at collection time: Playwright lists the tests before global setup runs.
    let lhr: Result;
    test.beforeAll(() => {
      lhr = JSON.parse(fs.readFileSync(reportPath(pageSpec.name, "json"), "utf8"));
    });

    // ── Category scores ──────────────────────────────────────────────────

    // A floor, not the goal. The lab run of the current build scores 91–95
    // (with gzip — see above), single runs swing ±10, and CI runners are
    // slower than a laptop. Raise to 90 once fixes 3–5 have landed.
    test("performance ≥ 85", () => {
      expectFailureIfKnown(pageSpec.name, "performance");
      expect(score(lhr, "performance"), failing(lhr, "performance").join("\n")).toBeGreaterThanOrEqual(85);
    });

    for (const category of ["accessibility", "best-practices", "seo"] as const) {
      test(`${category} = 100`, () => {
        expectFailureIfKnown(pageSpec.name, category);
        expect(score(lhr, category), failing(lhr, category).join("\n")).toBe(100);
      });
    }

    // ── Core Web Vitals (lab) ────────────────────────────────────────────
    // Google's "good" line is LCP 2.5 s; the lab run sits right on it
    // today (2.5 s on /de), so 3 s keeps this from flapping. Tighten to
    // 2500 once fixes 3 and 5 are in.

    test("LCP ≤ 3.0 s, TBT ≤ 300 ms, CLS ≤ 0.1", () => {
      expectFailureIfKnown(pageSpec.name, "web vitals");
      const lcp = lhr.audits["largest-contentful-paint"].numericValue ?? Infinity;
      const tbt = lhr.audits["total-blocking-time"].numericValue ?? Infinity;
      const cls = lhr.audits["cumulative-layout-shift"].numericValue ?? Infinity;
      expect.soft(lcp, "Largest Contentful Paint (ms)").toBeLessThanOrEqual(3000);
      expect.soft(tbt, "Total Blocking Time (ms)").toBeLessThanOrEqual(300);
      expect.soft(cls, "Cumulative Layout Shift").toBeLessThanOrEqual(0.1);
    });

    // ── Specific regressions, named so a failure says what broke ─────────

    test("no console errors", () => {
      expectFailureIfKnown(pageSpec.name, "no console errors");
      const items = (lhr.audits["errors-in-console"].details as { items?: { description: string }[] })
        ?.items ?? [];
      expect(items.map((i) => i.description.slice(0, 160))).toEqual([]);
    });

    test("hero at most once", () => {
      expectFailureIfKnown(pageSpec.name, "hero at most once");
      const requests =
        (lhr.audits["network-requests"].details as { items?: { url: string }[] })?.items ?? [];
      const heroes = requests.map((r) => r.url).filter((u) => /\/images\/hero(-\d+)?\./.test(u));
      // Home: exactly the one size the viewport needs. Elsewhere: none.
      const expected = pageSpec.name === "prices-de" ? 0 : 1;
      expect(heroes, "hero downloads").toHaveLength(expected);
    });

    test("image delivery", () => {
      expectFailureIfKnown(pageSpec.name, "image delivery");
      const insight = lhr.audits["image-delivery-insight"];
      const items =
        (insight?.details as { items?: { url: string; wastedBytes: number }[] })?.items ?? [];
      const oversized = items
        .filter((i) => i.wastedBytes > 4 * 1024)
        .map((i) => `${i.url} wastes ${Math.round(i.wastedBytes / 1024)} KiB`);
      expect(oversized).toEqual([]);
    });

    test("JavaScript ≤ 170 KiB over the wire", () => {
      // 140 KiB gzipped today (437 KiB raw). A budget, not a target: it
      // trips when a dependency lands in the main chunk by accident.
      const requests =
        (lhr.audits["network-requests"].details as {
          items?: { url: string; resourceType?: string; transferSize?: number }[];
        })?.items ?? [];
      const js = requests
        .filter((r) => r.resourceType === "Script")
        .reduce((sum, r) => sum + (r.transferSize ?? 0), 0);
      expect(Math.round(js / 1024)).toBeLessThanOrEqual(170);
    });
  });
}
