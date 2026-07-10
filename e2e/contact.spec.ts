import { test, expect } from "@playwright/test";

test.describe("Contact page", () => {
  test("shows tel, mailto and instagram links", async ({ page }) => {
    await page.goto("/contact");
    // Scope to <main>: the footer repeats the phone/e-mail links.
    const main = page.getByRole("main");
    await expect(
      main.getByRole("link", { name: /\+49 8362/ }),
    ).toHaveAttribute("href", /^tel:\+49/);
    await expect(
      main.getByRole("link", { name: /hello@kosmetic-fuessen\.de/ }),
    ).toHaveAttribute("href", /^mailto:/);
    await expect(
      main.getByRole("link", { name: /@kosmetic\.fuessen/ }),
    ).toHaveAttribute("href", /instagram\.com/);
  });

  test("submits the contact form (API mocked)", async ({ page }) => {
    await page.route("**/api/contact", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: 1 }),
      }),
    );
    await page.goto("/contact");
    await page.getByLabel("Name").fill("Anna");
    await page.getByLabel("E-mail").fill("anna@example.com");
    await page.getByLabel("Message").fill("I would like an appointment.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("status")).toHaveText(/thank you/i);
  });
});
