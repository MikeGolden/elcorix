import { test, expect } from "@playwright/test";

test.describe("Deep-link routes", () => {
  test("prices page lists both zone tables and the package table", async ({ page }) => {
    await page.goto("/en/prices");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Price list" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Services for women" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Services for men" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Combined packages for women" })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(2); // one package table per gender
    await expect(page.getByText("Beard contour")).toBeVisible();
    await expect(page).toHaveTitle(/Price list — elcorix/);
  });

  test("gallery page shows images with alt text", async ({ page }) => {
    await page.goto("/en/gallery");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Our work" })).toBeVisible();
    await expect(page.getByAltText("Diode laser device in the treatment room")).toBeVisible();
  });

  test("terms and mission pages are reachable", async ({ page }) => {
    await page.goto("/en/terms");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "General Terms and Conditions (GTC)" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "9. Liability" })).toBeVisible();
    await page.getByRole("link", { name: "Read the German version" }).click();
    await expect(page).toHaveURL(/\/de\/terms$/);
    await expect(page.getByRole("heading", { name: "9. Haftung" })).toBeVisible();
    await page.goto("/en/package-terms");
    await expect(
      page.getByRole("heading", { level: 1, name: "Special Conditions for Treatment Packages" }),
    ).toBeVisible();
    await page.goto("/en/appointment-terms");
    await expect(page.getByRole("heading", { level: 1, name: "Appointment Terms" })).toBeVisible();
    await page.goto("/en/mission");
    await expect(
      page.getByRole("heading", { level: 1, name: "Our mission" }),
    ).toBeVisible();
  });

  test("unknown routes render the 404 page", async ({ page }) => {
    // Unprefixed: the router redirects it into the visitor's language
    // first, and only then finds nothing to render.
    await page.goto("/no-such-page");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/en\/no-such-page$/);
    await page.getByRole("link", { name: "Back to the home page" }).click();
    await expect(page).toHaveURL(/\/en$/);
  });

  test("the hidden Altegio booking block is nowhere on the site", async ({ page }) => {
    // The flag is off (client/src/features.ts): no landing section, no
    // embed, no route, and nothing linking to either.
    await page.goto("/en");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(page.locator("#booking")).toHaveCount(0);
    await expect(page.getByTestId("altegio-consent-placeholder")).toHaveCount(0);
    await expect(page.locator('a[href$="#booking"], a[href$="/booking"]')).toHaveCount(0);

    await page.goto("/en/booking");
    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
  });

  // Was the /booking page; that route is behind an off feature flag
  // (client/src/features.ts), so the same form is exercised where it also
  // lives — the consultation section of the landing page.
  test("landing page offers the cookie-free consultation request", async ({ page }) => {
    await page.goto("/en#consultation");
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
    // A fixed date goes stale — the form rejects past dates.
    const nextWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    await page.getByLabel("Preferred date").fill(nextWeek);
    // The time field is a select of half-hour slots, not a free-text input.
    await page.getByLabel("Preferred time").selectOption("10:30");
    await page.getByRole("button", { name: "Get a consultation" }).click();
    await expect(page.getByRole("status")).toHaveText(/we will get back to you/i);
  });

  test("scroll position resets when navigating between pages", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(async () => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(500);
    await page.goto("/en/prices");
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBe(0);
  });
});
