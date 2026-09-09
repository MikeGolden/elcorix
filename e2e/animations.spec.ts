import { test, expect } from "@playwright/test";

/** The section reveals are one-shot, so each check runs on a fresh load. */
test.describe("Scroll animations", () => {
  test("the hero settles in on load while the sections below wait", async ({ page }) => {
    await page.goto("/en");

    const headline = page.getByRole("heading", { level: 1 });
    await expect(headline).toHaveAttribute("data-revealed", "true");
    await expect(headline).toHaveCSS("opacity", "1");

    // Two screens further down, nothing has been revealed yet.
    // #booking used to be the probe here; it is behind an off feature flag
    // (client/src/features.ts), so the consultation card two screens down
    // takes its place. That card is the <Reveal>, not the <section>.
    await expect(page.locator("#consultation .reveal")).toHaveAttribute(
      "data-revealed",
      "false",
    );
  });

  test("a section reveals itself when it is scrolled into view", async ({ page }) => {
    await page.goto("/en");
    const consultation = page.locator("#consultation .reveal");

    await consultation.scrollIntoViewIfNeeded();

    await expect(consultation).toHaveAttribute("data-revealed", "true");
    await expect(consultation).toHaveCSS("opacity", "1");
    // The reveal transform must never widen the page.
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test("the whole page is readable after scrolling through it", async ({ page }) => {
    await page.goto("/en");
    // Walk down in viewport-sized steps, the way a visitor scrolls, so every
    // section really passes through the observer's view.
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.7);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      window.scrollTo(0, document.body.scrollHeight);
    });

    await expect(page.getByRole("heading", { name: "Contact & appointments" })).toBeVisible();
    // Nothing may be left transparent behind an animation that never fired.
    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            [...document.querySelectorAll(".reveal, .reveal-fade")].filter(
              (el) => Number(getComputedStyle(el).opacity) < 1,
            ).length,
        ),
      )
      .toBe(0);
  });

  test("visitors who ask for less motion get every section at full opacity", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/en");

    // No scrolling at all: the section below the fold is already solid.
    await expect(page.locator("#consultation")).toHaveCSS("opacity", "1");
    await expect(page.locator("#consultation .reveal")).toHaveCSS("opacity", "1");
    await context.close();
  });
});
