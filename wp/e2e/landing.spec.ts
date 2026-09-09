import { test, expect } from "@playwright/test";
import { de, en } from "./paths";

test.describe("Landing page", () => {
  test("shows every section of the Figma layout", async ({ page }) => {
    await page.goto(en.home);
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

  test("the German landing page is the site root, with no prefix", async ({ page }) => {
    await page.goto(de.home);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Dauerhafte Laser-Haarentfernung in Kempten",
      }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", /^de/);
  });

  test("the anchor menu jumps to a section on the same page", async ({ page }) => {
    await page.goto(en.home);
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
    await page.goto(en.home);
    await page.getByRole("button", { name: "Accept all" }).click();
    await page.getByRole("link", { name: "See the full price list" }).click();
    await expect(page).toHaveURL(/\/en\/prices\/?$/);
    await page.getByRole("link", { name: "Book an appointment" }).first().click();
    await expect(page).toHaveURL(/\/en\/booking\/?$/);
    await expect(page.getByTestId("altegio-widget")).toBeVisible();
    await expect(page.getByTestId("altegio-widget")).toHaveAttribute("src", /alteg\.io/);
  });

  test("the header only paints its background once the page scrolls", async ({ page }) => {
    await page.goto(en.home);
    const header = page.locator("header");
    // Over the hero photo the header is transparent, so its buttons sit
    // directly on the photograph and there is no divider.
    await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

    await page.evaluate(() => window.scrollTo(0, 400));
    await expect
      .poll(async () => header.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe("rgba(0, 0, 0, 0)");
  });
});
