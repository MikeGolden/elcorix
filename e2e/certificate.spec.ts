import { test, expect } from "@playwright/test";

test.describe("Specialist certificates", () => {
  test("the stack serves small WebPs and pages through both scans", async ({ page }) => {
    await page.goto("/de");

    const stack = page.getByTestId("certificate-stack");
    await stack.scrollIntoViewIfNeeded();
    // The DOM src stays the JPEG fallback; currentSrc is what was fetched.
    for (const [img, stem] of [
      [stack.getByAltText(/Optische Strahlung/), "certificate"],
      [stack.locator('img[src="/images/certificate-skin.jpg"]'), "certificate-skin"],
    ] as const) {
      await expect(img).toHaveJSProperty("complete", true);
      expect(await img.evaluate((el: HTMLImageElement) => el.currentSrc)).toMatch(
        new RegExp(`/images/${stem}(-600)?\\.webp$`),
      );
    }
    await expect(stack.getByText("2 Zertifikate")).toBeVisible();

    await stack.click();
    const lightbox = page.getByTestId("lightbox");
    await expect(lightbox).toBeVisible();
    await expect(lightbox.getByText("1 von 2")).toBeVisible();
    const full = lightbox.getByTestId("lightbox-image");
    await expect(full).toHaveAttribute("src", "/images/certificate.jpg");

    await lightbox.getByRole("button", { name: "Nächstes Bild", exact: true }).click();
    await expect(full).toHaveAttribute("src", "/images/certificate-skin.jpg");
    await expect(full).toHaveJSProperty("complete", true);
    expect(await full.evaluate((el: HTMLImageElement) => el.currentSrc)).toMatch(
      /\/images\/certificate-skin\.webp$/,
    );

    await page.keyboard.press("Escape");
    await expect(lightbox).toBeHidden();
    await expect(stack).toBeFocused();
  });
});
