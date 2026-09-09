import { test, expect } from "@playwright/test";
import { en } from "./paths";

/** The section reveals are one-shot, so each check runs on a fresh load. */
test.describe("Scroll animations", () => {
  test("the hero settles in on load while the sections below wait", async ({ page }) => {
    await page.goto(en.home);

    const headline = page.getByRole("heading", { level: 1 });
    await expect(headline).toHaveAttribute("data-revealed", "true");
    await expect(headline).toHaveCSS("opacity", "1");

    // Two screens further down, nothing has been revealed yet.
    await expect(page.locator("#booking")).toHaveAttribute("data-revealed", "false");
  });

  test("a section reveals itself when it is scrolled into view", async ({ page }) => {
    await page.goto(en.home);
    const booking = page.locator("#booking");

    await booking.scrollIntoViewIfNeeded();

    await expect(booking).toHaveAttribute("data-revealed", "true");
    await expect(booking).toHaveCSS("opacity", "1");
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
    await page.goto(en.home);
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
    await page.goto(en.home);

    // No scrolling at all: the section below the fold is already solid.
    await expect(page.locator("#booking")).toHaveCSS("opacity", "1");
    await context.close();
  });

  test("without JavaScript nothing is hidden behind a reveal", async ({ browser }) => {
    // The start state is scoped to `html.js`, which only the head snippet
    // adds. A crawler, or anyone with scripts off, sees the whole page.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(en.home);

    await expect(page.locator("#booking")).toHaveCSS("opacity", "1");
    await expect(page.getByRole("heading", { name: "Who is it for?" })).toBeVisible();
    await context.close();
  });
});
