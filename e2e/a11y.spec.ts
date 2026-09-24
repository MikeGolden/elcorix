import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { publicRoutes } from "../client/src/seo/routes";
import { localizedRoutePath } from "../client/src/seo/routePaths";
import { supportedLanguages } from "../client/src/i18n/routing";
import { featuresFrom } from "../client/src/features";

/**
 * axe-core over every served page in every language — the same route
 * table the router, the sitemap and the prerender use, so a new page is
 * checked the day it exists.
 *
 * WCAG 2.1 A + AA rules. A violation fails the run with axe's own report
 * (rule, impact, the offending node), which is usually enough to fix it
 * without opening a browser.
 *
 * Runs in both projects (desktop and phone): contrast and target problems
 * often only exist in one of the two layouts.
 */
const routes = publicRoutes(featuresFrom({}));

for (const language of supportedLanguages) {
  for (const route of routes) {
    const url = localizedRoutePath(language, route.path);
    test(`${decodeURIComponent(url)} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(url);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      // Legal pages load their text in a second chunk.
      await page.waitForLoadState("networkidle");
      // Scroll reveals start at opacity 0; show everything so contrast is
      // measured on the colours a visitor actually sees.
      await page.addStyleTag({
        content: ".reveal,.reveal-fade{opacity:1!important;transform:none!important;transition:none!important}",
      });

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        // Third-party iframe (OpenStreetMap) — not ours to fix.
        .exclude("iframe")
        .analyze();

      const report = results.violations.map((violation) => ({
        rule: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.slice(0, 5).map((node) => node.target.join(" ")),
      }));
      expect(report).toEqual([]);
    });
  }
}
