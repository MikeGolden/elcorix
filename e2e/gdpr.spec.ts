import { test, expect } from "@playwright/test";

test.describe("GDPR consent", () => {
  test("banner gates the Altegio calendar until consent and persists", async ({
    page,
  }) => {
    await page.goto("/booking");
    const banner = page.getByRole("dialog", {
      name: "Cookies & external services",
    });
    await expect(banner).toBeVisible();

    await banner.getByRole("button", { name: "Only necessary" }).click();
    await expect(banner).toBeHidden();
    await expect(page.getByTestId("altegio-consent-placeholder")).toBeVisible();
    await expect(page.getByTestId("altegio-widget")).toHaveCount(0);

    // The rejection persists across reloads.
    await page.reload();
    await expect(page.getByTestId("altegio-consent-placeholder")).toBeVisible();

    // Two-click pattern: explicit opt-in on the placeholder loads the embed.
    await page
      .getByRole("button", { name: "Load calendar and accept Altegio cookies" })
      .click();
    await expect(page.getByTestId("altegio-widget")).toBeVisible();

    // The granted consent persists too.
    await page.reload();
    await expect(page.getByTestId("altegio-widget")).toBeVisible();
  });

  test("footer cookie settings reopen the banner to change the decision", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Accept all" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.getByRole("button", { name: "Cookie settings" }).click();
    await expect(
      page.getByRole("dialog", { name: "Cookies & external services" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Only necessary" }).click();

    await page.goto("/booking");
    await expect(page.getByTestId("altegio-consent-placeholder")).toBeVisible();
  });

  test("privacy policy and imprint are reachable from the footer", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Only necessary" }).click();

    const footer = page.locator("footer");
    await footer.getByRole("link", { name: "Privacy policy" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy policy" }),
    ).toBeVisible();

    await footer.getByRole("link", { name: "Imprint" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Imprint" }),
    ).toBeVisible();
  });

  test("contact form requires accepting the privacy policy", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.getByLabel("Name").fill("Anna");
    await page.getByLabel("E-mail").fill("anna@example.com");
    await page.getByRole("textbox", { name: "Message" }).fill("Hello!");
    // Without the checkbox the browser blocks submission (required).
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("status")).toHaveCount(0);
    const checkbox = page.getByRole("checkbox", { name: /privacy policy/i });
    await expect(checkbox).toHaveJSProperty("validity.valueMissing", true);
  });
});
