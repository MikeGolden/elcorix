import { test, expect } from "@playwright/test";

test.describe("Deep-link routes", () => {
  test("prices page lists both zone tables and the package table", async ({ page }) => {
    await page.goto("/prices");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Price list" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Services for women" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Services for men" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Package deals for women" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText("Beard contour")).toBeVisible();
    await expect(page).toHaveTitle(/Price list — elcorix/);
  });

  test("gallery page shows images with alt text", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Our work" })).toBeVisible();
    await expect(page.getByAltText("Treatment room in the studio")).toBeVisible();
  });

  test("terms and mission pages are reachable", async ({ page }) => {
    await page.goto("/terms");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Terms and conditions" }),
    ).toBeVisible();
    await page.goto("/mission");
    await expect(
      page.getByRole("heading", { level: 1, name: "Our mission" }),
    ).toBeVisible();
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

  test("booking page offers the cookie-free consultation request", async ({ page }) => {
    await page.goto("/booking");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.route("**/api/bookings", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, status: "pending" }),
      }),
    );
    await page.getByLabel("Name").fill("Anna");
    await page.getByLabel("Phone number").fill("+49 155 1234567");
    await page.getByLabel("Preferred date").fill("2026-09-15");
    await page.getByLabel("Preferred time").fill("10:30");
    await page.getByRole("checkbox", { name: /privacy policy/i }).check();
    await page.getByRole("button", { name: "Get a consultation" }).click();
    await expect(page.getByRole("status")).toHaveText(/we will get back to you/i);
  });

  test("scroll position resets when navigating between pages", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(async () => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(500);
    await page.goto("/prices");
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBe(0);
  });
});
