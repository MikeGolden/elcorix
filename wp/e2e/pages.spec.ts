import { test, expect } from "@playwright/test";
import { en } from "./paths";

test.describe("Deep-link routes", () => {
  test("prices page lists both zone tables and the package table", async ({ page }) => {
    await page.goto(en.prices);
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Price list" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Services for women" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Services for men" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Package deals for women" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText("Beard contour")).toBeVisible();
    await expect(page).toHaveTitle(/Price list — elcorix/);
  });

  test("the price list is rendered by the server, not by script", async ({ request }) => {
    // Every price has to be in the HTML a crawler reads. The React build
    // could only promise this for the <head>.
    const html = await (await request.get(en.prices)).text();
    expect(html).toContain("Beard contour");
    expect(html).toContain("Package deals for women");
    expect(html).toContain("€189");
  });

  test("gallery page shows images with alt text", async ({ page }) => {
    await page.goto(en.gallery);
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Our work" })).toBeVisible();
    await expect(page.getByAltText("Diode laser device in the treatment room")).toBeVisible();
  });

  test("terms and mission pages are reachable", async ({ page }) => {
    await page.goto(en.terms);
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Terms and conditions" }),
    ).toBeVisible();
    await page.goto(en.mission);
    await expect(
      page.getByRole("heading", { level: 1, name: "Our mission" }),
    ).toBeVisible();
  });

  test("the imprint fills in the business details from the settings", async ({ page }) => {
    await page.goto(en.imprint);
    await expect(page.getByRole("heading", { level: 1, name: "Imprint" })).toBeVisible();
    // These come from Settings → elcorix through the shortcode, not from
    // text somebody retyped into the page.
    await expect(page.getByRole("link", { name: /\+49 155/ }).first()).toHaveAttribute(
      "href",
      /^tel:\+49/,
    );
    await expect(page.getByText("Bodmanstraße 14").first()).toBeVisible();
  });

  test("unknown routes render the 404 page, with a 404 status", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await page.getByRole("button", { name: "Nur notwendige" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("booking page offers the cookie-free consultation request", async ({ page }) => {
    await page.route("**/elcorix/v1/bookings", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, status: "pending" }),
      }),
    );
    await page.goto(en.booking);
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.getByLabel("Name").fill("Anna");
    await page.getByLabel("Phone number").fill("+49 155 1234567");
    await page.getByLabel("Preferred date").fill("2027-09-15");
    // The time field is a select of half-hour slots, not a free-text input.
    await page.getByLabel("Preferred time").selectOption("10:30");
    await page.getByRole("checkbox", { name: /privacy policy/i }).check();
    await page.getByRole("button", { name: "Get a consultation" }).click();
    await expect(page.getByRole("status")).toHaveText(/we will get back to you/i);
  });

  test("the consultation form refuses a time with no date", async ({ page }) => {
    await page.goto(en.booking);
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.getByLabel("Name").fill("Anna");
    await page.getByLabel("Phone number").fill("+49 155 1234567");
    await page.getByLabel("Preferred time").selectOption("10:30");
    await page.getByRole("checkbox", { name: /privacy policy/i }).check();
    await page.getByRole("button", { name: "Get a consultation" }).click();
    // "14:00" tells staff nothing about the day, so the visitor is asked
    // rather than having their choice silently dropped.
    await expect(page.locator("#consult-date-error")).toBeVisible();
    await expect(page.getByRole("status")).toBeHidden();
  });

  test("an invalid phone number is reported in the form, not by the browser", async ({
    page,
  }) => {
    await page.goto(en.booking);
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.getByLabel("Name").fill("Anna");
    await page.getByLabel("Phone number").fill("12");
    await page.getByRole("checkbox", { name: /privacy policy/i }).check();
    await page.getByRole("button", { name: "Get a consultation" }).click();
    await expect(page.locator("#consult-phone-error")).toBeVisible();
  });
});
