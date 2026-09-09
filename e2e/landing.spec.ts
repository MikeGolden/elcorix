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

  test("navigates to the booking page with the Altegio widget", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Accept all" }).click();
    await page.getByRole("link", { name: "See the full price list" }).click();
    await expect(page).toHaveURL(/\/prices$/);
    await page.getByRole("link", { name: "Book an appointment" }).first().click();
    await expect(page).toHaveURL(/\/booking$/);
    await expect(page.getByTestId("altegio-widget")).toBeVisible();
    await expect(page.getByTestId("altegio-widget")).toHaveAttribute("src", /alteg\.io/);
  });
});
