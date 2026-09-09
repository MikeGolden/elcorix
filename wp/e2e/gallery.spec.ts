import { test, expect } from "@playwright/test";
import { en } from "./paths";

const firstWorkAlt = "Laser hair removal on the legs in the treatment chair";
const secondWorkAlt = "Close-up of the handpiece during an underarm treatment";

test.describe("Work gallery", () => {
  test("opens a work photo full screen and pages through the set", async ({ page }) => {
    await page.goto(en.home);
    await page.getByRole("button", { name: "Only necessary" }).click();

    await page.getByTestId("work-tile-1").click();

    const lightbox = page.getByTestId("lightbox");
    await expect(lightbox).toBeVisible();
    await expect(lightbox.getByTestId("lightbox-image")).toHaveAttribute(
      "src",
      /work-1\.(jpe?g|webp)$/,
    );
    await expect(lightbox.getByText("1 of 4")).toBeVisible();

    await lightbox.getByRole("button", { name: "Next image" }).click();
    await expect(lightbox.getByTestId("lightbox-image")).toHaveAttribute(
      "src",
      /work-2\.(jpe?g|webp)$/,
    );
    await expect(lightbox.getByAltText(secondWorkAlt)).toBeVisible();

    await page.keyboard.press("ArrowLeft");
    await expect(lightbox.getByAltText(firstWorkAlt)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(lightbox).toBeHidden();
  });

  test("the slider arrow scrolls the track", async ({ page }) => {
    await page.goto(en.home);
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.setViewportSize({ width: 900, height: 900 });

    const track = page.locator("#work ul");
    await expect.poll(async () => track.evaluate((el) => el.scrollLeft)).toBe(0);
    await page.getByRole("button", { name: "Next images" }).click();
    await expect
      .poll(async () => track.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(100);
  });

  test("gallery page tiles open in the viewer too", async ({ page }) => {
    await page.goto(en.gallery);
    await page.getByRole("button", { name: "Only necessary" }).click();

    await page
      .getByRole("button", { name: "Open image: Diode laser device in the treatment room" })
      .click();
    const lightbox = page.getByTestId("lightbox");
    await expect(lightbox.getByTestId("lightbox-image")).toHaveAttribute(
      "src",
      /technology\.(jpe?g|webp)$/,
    );

    // A click on the backdrop (top-left corner, well clear of the photo) closes it.
    await lightbox.click({ position: { x: 8, y: 8 } });
    await expect(lightbox).toBeHidden();
  });

  test("the viewer locks the page behind it and gives focus back", async ({ page }) => {
    await page.goto(en.gallery);
    await page.getByRole("button", { name: "Only necessary" }).click();

    const tile = page.getByRole("button", { name: /^Open image:/ }).first();
    await tile.click();
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe("hidden");

    await page.keyboard.press("Escape");
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .not.toBe("hidden");
    await expect(tile).toBeFocused();
  });
});
