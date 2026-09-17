import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows every section of the Figma layout", async ({ page }) => {
    await page.goto("/en");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Permanent laser hair removal in Kempten",
      }),
    ).toBeVisible();

    for (const name of [
      "Who is it for?",
      "Modern diode laser technology — matched to your skin",
      "Your skin in experienced hands",
      "Take a look at our work",
      "Popular services and prices",
      "Request a free consultation",
      "Contact & appointments",
    ]) {
      await expect(page.getByRole("heading", { name })).toBeVisible();
    }
  });

  test("the anchor menu jumps to a section on the same page", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.getByTestId("menu-toggle").click();
    await page
      .getByRole("navigation", { name: "Menu" })
      .getByRole("link", { name: "Our price list" })
      .click();
    await expect(page).toHaveURL(/#prices$/);
    await expect
      .poll(async () => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(500);
  });

  // While the Altegio flag is off (client/src/features.ts) the price list's
  // CTA leads to the consultation request instead of /booking. Restore the
  // "Book an appointment" → /booking → widget path together with the flag.
  test("leads from the price list to the consultation request", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Accept all" }).click();
    await page.getByRole("link", { name: "See the full price list" }).click();
    await expect(page).toHaveURL(/\/prices$/);
    await page.getByRole("link", { name: "Get a consultation" }).first().click();
    await expect(page).toHaveURL(/\/en#consultation$/);
    await expect(page.getByRole("heading", { name: "Request a free consultation" })).toBeVisible();
    await expect(page.getByTestId("altegio-widget")).toHaveCount(0);
  });

  test("the packages teaser opens the package tables on the price page", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Only necessary" }).click();
    const prices = page.locator("#prices");
    await expect(prices.getByRole("table")).toHaveCount(0);
    await prices.getByRole("link", { name: /save up to \d+%/ }).click();
    await expect(page).toHaveURL(/\/en\/prices#prices-packages-women$/);
    const heading = page.getByRole("heading", { name: "Combined packages for women" });
    await expect(heading).toBeInViewport();
  });
});
