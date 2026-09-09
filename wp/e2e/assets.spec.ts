import { test, expect } from "@playwright/test";
import { en } from "./paths";

/**
 * The two things that quietly decide how fast the landing page feels: the
 * hero must be painted rather than faded in, and the photography must go
 * out as WebP.
 */
test.describe("Hero and image delivery", () => {
  test("the hero photo is painted on load, never behind a reveal", async ({ page }) => {
    await page.goto(en.home);
    const hero = page.getByTestId("hero-photo");

    await expect(hero).toBeVisible();
    await expect(hero).toHaveCSS("opacity", "1");
    // The LCP element must not sit inside a scroll-reveal: an element at
    // opacity 0 does not count as painted, which pushes LCP behind the
    // observer, the stagger and the 650ms fade.
    expect(
      await hero.evaluate((el) => el.closest(".reveal, .reveal-fade") !== null),
    ).toBe(false);
  });

  test("the hero is preloaded so the fetch starts before the bundle runs", async ({
    page,
  }) => {
    await page.goto(en.home);
    const preload = page.locator('link[rel="preload"][as="image"]');
    await expect(preload).toHaveCount(1);
    await expect(preload).toHaveAttribute("href", /\.webp$/);
  });

  test("the hero really loads the WebP, not the fallback in its src", async ({ page }) => {
    await page.goto(en.home);
    const hero = page.getByTestId("hero-photo");
    // <picture> leaves the JPEG on the <img src> as the fallback; what the
    // browser actually chose is currentSrc.
    await expect
      .poll(() => hero.evaluate((el: HTMLImageElement) => el.currentSrc))
      .toMatch(/\.webp$/);
  });

  test("photography is served as WebP, not the JPEG fallback", async ({ page }) => {
    const images: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "image") images.push(request.url());
    });

    await page.goto(en.home);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState("networkidle");

    const photos = images.filter(
      (url) => url.includes("/images/") || url.includes("/uploads/"),
    );
    expect(photos.length).toBeGreaterThan(0);
    const fallbacks = photos.filter((url) => /\.(jpe?g|png)$/i.test(url));
    expect(fallbacks, `served the fallback instead of WebP: ${fallbacks.join(", ")}`)
      .toEqual([]);
  });

  test("every photo reserves its space, so nothing below it jumps", async ({ page }) => {
    await page.goto(en.home);
    const missing = await page.evaluate(() =>
      [...document.querySelectorAll("img")]
        .filter((img) => {
          const styled = getComputedStyle(img).aspectRatio;
          const hasRatio = styled !== "auto" && styled !== "";
          return !hasRatio && !(img.hasAttribute("width") && img.hasAttribute("height"));
        })
        .map((img) => img.currentSrc || img.src),
    );
    expect(missing, "images with neither an aspect-ratio nor width/height").toEqual([]);
  });

  test("nothing is loaded from a third-party host", async ({ page }) => {
    // The site serves every asset first-party — the GDPR posture, and what
    // the Content-Security-Policy's 'self' allows. The only third parties
    // are the two embeds, and both are gated or declared.
    const foreign: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      const here = new URL(page.url());
      if (url.host !== here.host) foreign.push(request.url());
    });

    await page.goto(en.home);
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.waitForLoadState("networkidle");

    const unexpected = foreign.filter((url) => !url.includes("openstreetmap.org"));
    expect(unexpected, `third-party requests: ${unexpected.join(", ")}`).toEqual([]);
  });

  test("the fonts are self-hosted", async ({ page }) => {
    const fonts: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "font") fonts.push(request.url());
    });

    await page.goto(en.home);
    await page.waitForLoadState("networkidle");

    expect(fonts.length).toBeGreaterThan(0);
    expect(fonts.filter((url) => url.includes("fonts.gstatic.com"))).toEqual([]);
    expect(fonts.every((url) => url.endsWith(".woff2"))).toBe(true);
  });
});
