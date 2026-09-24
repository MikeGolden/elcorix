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
      "Diode laser and IPL for smooth skin",
      "Who treats you",
      "Take a look at our work",
      "Popular services and prices",
      "Request a free consultation",
      "Contact & appointments",
    ]) {
      await expect(page.getByRole("heading", { name })).toBeVisible();
    }
  });

  test("the technology write-up opens and closes below the section", async ({ page }) => {
    await page.goto("/ru");
    const toggle = page.getByTestId("technology-toggle");
    const panel = page.locator("#technology-more");
    await expect(toggle).toHaveText("Узнать больше о технологии");
    await expect(panel).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(
      panel.getByRole("heading", { name: "Современная лазерная и IPL-технология для вашей кожи" }),
    ).toBeVisible();
    await expect(panel.getByRole("heading", { name: "IPL — световая технология для отдельных задач" })).toBeVisible();

    await toggle.click();
    await expect(panel).toBeHidden();
  });

  test("the anchor menu jumps to a section on the same page", async ({ page }) => {
    await page.goto("/en");
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
    await page.getByTestId("packages-teaser").click();
    await expect(page).toHaveURL(/\/prices#prices-packages-women$/);
    // On a phone the header CTA lives in the menu drawer.
    if (test.info().project.name === "mobile") await page.getByTestId("menu-toggle").click();
    await page.getByRole("link", { name: "Get a consultation" }).locator("visible=true").first().click();
    await expect(page).toHaveURL(/\/en#consultation$/);
    await expect(page.getByRole("heading", { name: "Request a free consultation" })).toBeVisible();
    await expect(page.getByTestId("altegio-widget")).toHaveCount(0);
  });

  test("the packages teaser opens the package tables on the price page", async ({ page }) => {
    await page.goto("/en");
    const prices = page.locator("#prices");
    await expect(prices.getByRole("table")).toHaveCount(0);
    await prices.getByTestId("packages-teaser").click();
    await expect(page).toHaveURL(/\/en\/prices#prices-packages-women$/);
    const heading = page.getByRole("heading", { name: "Combined packages for women" });
    await expect(heading).toBeInViewport();
  });
});
