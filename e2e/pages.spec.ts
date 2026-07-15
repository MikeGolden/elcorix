import { test, expect } from "@playwright/test";

test.describe("New pages", () => {
  test("prices page lists categories with formatted prices", async ({ page }) => {
    await page.goto("/prices");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Prices" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Facial treatments" })).toBeVisible();
    await expect(page.getByText("Classic facial (60 min)")).toBeVisible();
    await expect(page).toHaveTitle(/Prices — Kosmetic Füssen/);
  });

  test("gallery page shows images with alt text", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Gallery" })).toBeVisible();
    await expect(page.getByAltText("Treatment room of our studio")).toBeVisible();
  });

  test("unknown routes render the 404 page", async ({ page }) => {
    await page.goto("/no-such-page");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back to the home page" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("booking page offers the cookie-free call-back form", async ({ page }) => {
    await page.goto("/booking");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.route("**/api/bookings", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, status: "pending" }),
      }),
    );
    await page.getByLabel(/^name$/i).fill("Anna");
    await page.getByLabel(/phone/i).fill("+49 123 4567890");
    await page.getByLabel(/treatment/i).selectOption({ index: 1 });
    await page.getByRole("button", { name: "Request a call-back" }).click();
    await expect(page.getByRole("status")).toHaveText(/we will call you back/i);
  });

  test("scroll position resets when navigating between pages", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(async () => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(500);
    await page.getByRole("navigation").getByRole("link", { name: "Prices" }).click();
    await expect(page).toHaveURL(/\/prices$/);
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBe(0);
  });
});
