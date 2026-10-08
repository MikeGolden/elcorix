import { test, expect } from "@playwright/test";

test.describe("Specialist certificate", () => {
  test("the tile serves the small WebP and opens the full scan", async ({ page }) => {
    await page.goto("/de");

    const tile = page.getByTestId("certificate-tile");
    await tile.scrollIntoViewIfNeeded();
    const thumb = tile.locator("img");
    await expect(thumb).toHaveJSProperty("complete", true);
    // The DOM src stays the JPEG fallback; currentSrc is what was fetched.
    expect(await thumb.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(
      /\/images\/certificate(-600)?\.webp$/,
    );
    await expect(page.getByText("NiSV-Fachkunde „Optische Strahlung“")).toBeVisible();

    await tile.click();
    const lightbox = page.getByTestId("lightbox");
    await expect(lightbox).toBeVisible();
    const full = lightbox.getByTestId("lightbox-image");
    await expect(full).toHaveJSProperty("complete", true);
    expect(await full.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(
      /\/images\/certificate\.webp$/,
    );
    // A single image: no paging and no "1 von 1".
    await expect(lightbox.getByRole("button", { name: "Nächstes Bild" })).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(lightbox).toBeHidden();
    await expect(tile).toBeFocused();
  });
});
