import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows hero, who we are and what we do", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Kosmetic Füssen" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Who we are" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "What we do" }),
    ).toBeVisible();
  });

  test("navigates to the booking page with the Altegio widget", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Accept all" }).click();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Book an appointment" })
      .click();
    await expect(page).toHaveURL(/\/booking$/);
    await expect(page.getByTestId("altegio-widget")).toBeVisible();
    await expect(page.getByTestId("altegio-widget")).toHaveAttribute(
      "src",
      /alteg\.io/,
    );
  });
});
