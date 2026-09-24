import { test, expect } from "@playwright/test";

test.describe("Contact page", () => {
  test("shows tel, mailto and instagram links", async ({ page }) => {
    await page.goto("/en/contact");
    // Scope to <main>: the footer repeats the phone/e-mail links.
    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: /\+49 155/ }).first()).toHaveAttribute(
      "href",
      /^tel:\+49/,
    );
    await expect(
      main.getByRole("link", { name: "info@elcorix.de" }).first(),
    ).toHaveAttribute("href", /^mailto:/);
    await expect(
      main.getByRole("link", { name: "@elcorix", exact: true }),
    ).toHaveAttribute(
      "href",
      /instagram\.com/,
    );
  });

  test("shows the opening hours from the design", async ({ page }) => {
    await page.goto("/en/contact");
    await expect(page.getByRole("heading", { name: "Opening hours" })).toBeVisible();
    await expect(page.getByText("09:00 to 19:00")).toBeVisible();
    await expect(page.getByText("closed")).toBeVisible();
  });

  test("submits the contact form (API mocked)", async ({ page }) => {
    await page.route("**/api/contact", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: 1 }),
      }),
    );
    await page.goto("/en/contact");
    await page.getByLabel("Name").fill("Anna");
    await page.getByLabel("E-mail").fill("anna@example.com");
    await page.getByRole("textbox", { name: "Message" }).fill("I would like an appointment.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("status")).toHaveText(/thank you/i);
  });
});
