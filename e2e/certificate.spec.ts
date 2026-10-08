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

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("the paging arrows sit on top of the scan and stand out from it", async ({ page }) => {
      await page.goto("/en");
      const stack = page.getByTestId("certificate-stack");
      await stack.scrollIntoViewIfNeeded();
      await stack.click();
      const lightbox = page.getByTestId("lightbox");
      await expect(lightbox.getByTestId("lightbox-image")).toHaveJSProperty("complete", true);

      for (const name of ["Previous image", "Next image"]) {
        const arrow = lightbox.getByRole("button", { name, exact: true });
        const { onTop, overImage, background } = await arrow.evaluate((button) => {
          const box = button.getBoundingClientRect();
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          const image = document.querySelector('[data-testid="lightbox-image"]')!.getBoundingClientRect();
          return {
            onTop: document.elementFromPoint(x, y)?.closest("button") === button,
            overImage: x > image.left && x < image.right,
            background: getComputedStyle(button).backgroundColor,
          };
        });
        // At this width the scan runs under the arrows — the case that hid them.
        expect(overImage, name).toBe(true);
        expect(onTop, name).toBe(true);
        // A dark, mostly opaque disc: white/10 over a white scan was invisible.
        const [r, g, b, a = 1] = background.match(/[\d.]+/g)!.map(Number);
        expect(Math.max(r, g, b), `${name} ${background}`).toBeLessThan(60);
        expect(a, `${name} ${background}`).toBeGreaterThanOrEqual(0.5);
      }

      await lightbox.getByRole("button", { name: "Next image", exact: true }).tap();
      await expect(lightbox.getByTestId("lightbox-image")).toHaveAttribute("src", "/images/certificate-skin.jpg");
    });
  });
});
