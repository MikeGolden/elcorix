import { test, expect } from "@playwright/test";
import { en } from "./paths";

test.describe("Contact page", () => {
  test("shows tel, mailto and instagram links", async ({ page }) => {
    await page.goto(en.contact);
    // Scope to <main>: the footer repeats some of these.
    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: /\+49 155/ }).first()).toHaveAttribute(
      "href",
      /^tel:\+49/,
    );
    await expect(
      main.getByRole("link", { name: "info@elcorix.com" }).first(),
    ).toHaveAttribute("href", /^mailto:/);
    await expect(
      main.getByRole("link", { name: "@elcorix", exact: true }),
    ).toHaveAttribute("href", /instagram\.com/);
  });

  test("shows the opening hours from the design", async ({ page }) => {
    await page.goto(en.contact);
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(page.getByRole("heading", { name: "Opening hours" })).toBeVisible();
    await expect(page.getByText("09:00 to 19:00")).toBeVisible();
    await expect(page.getByText("closed")).toBeVisible();
  });

  test("submits the contact form (API mocked)", async ({ page }) => {
    await page.route("**/elcorix/v1/contact", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: 1 }),
      }),
    );
    await page.goto(en.contact);
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.getByLabel("Name").fill("Anna");
    await page.getByLabel("E-mail").fill("anna@example.com");
    await page.getByRole("textbox", { name: "Message" }).fill("I would like an appointment.");
    await page.getByRole("checkbox", { name: /privacy policy/i }).check();
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("status")).toHaveText(/thank you/i);
  });

  test("the honeypot answer is indistinguishable from a success", async ({ request }) => {
    // A bot that fills the hidden field must not learn it was filtered, and
    // nothing may be stored.
    const response = await request.post("/api/contact", {
      data: {
        name: "Bot",
        email: "bot@example.com",
        message: "buy things",
        website: "http://spam.example",
      },
    });
    expect(response.status()).toBe(201);
    expect(await response.json()).toEqual({ id: 0 });
  });

  test("the API rejects an incomplete message", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: { name: "Anna", email: "not-an-email", message: "hi" },
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toContain("e-mail");
  });
});
