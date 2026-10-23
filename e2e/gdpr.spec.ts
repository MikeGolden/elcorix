import { test, expect } from "@playwright/test";

test.describe("GDPR consent", () => {
  test("banner gates the Altegio calendar until consent and persists", async ({
    page,
  }) => {
    await page.route("https://n1463826.alteg.io/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<h1>Altegio stub</h1>" }),
    );
    await page.goto("/en/booking");
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

  test("asks once, and the footer reopens the choice", async ({ page }) => {
    await page.route("https://n1463826.alteg.io/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<h1>Altegio stub</h1>" }),
    );
    let altegioRequests = 0;
    page.on("request", (request) => {
      if (request.url().includes("alteg.io")) altegioRequests += 1;
    });
    await page.goto("/en");
    const banner = page.getByRole("dialog", { name: "Cookies & external services" });
    await expect(banner).toBeVisible();
    await banner.getByRole("button", { name: "Accept all" }).click();
    await expect(banner).toBeHidden();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("cookie-consent")!));
    expect(stored).toMatchObject({ version: 1, booking: true });

    await page.locator("footer").getByRole("button", { name: "Cookie settings" }).click();
    await expect(banner).toBeVisible();
    await banner.getByRole("button", { name: "Only necessary" }).click();
    // Declined: from here on, not one request may reach Altegio.
    altegioRequests = 0;
    await page.goto("/en/booking");
    await expect(page.getByTestId("altegio-consent-placeholder")).toBeVisible();
    await page.goto("/en");
    await expect(page.locator("#booking").getByTestId("altegio-consent-placeholder")).toBeVisible();
    expect(altegioRequests).toBe(0);
  });

  test("privacy policy and imprint are reachable from the footer", async ({
    page,
  }) => {
    await page.goto("/en");
    // The banner sits over the bottom of the page until the visitor decides.
    await page.getByRole("dialog").getByRole("button", { name: "Only necessary" }).click();

    const footer = page.locator("footer");
    await footer.getByRole("link", { name: "Privacy policy" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy policy" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Right to object", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/Hetzner Online GmbH/).first()).toBeVisible();

    await footer.getByRole("link", { name: "Imprint" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Imprint" }),
    ).toBeVisible();
  });

  test("forms link the privacy policy instead of asking for consent", async ({ page }) => {
    await page.goto("/en/contact");
    const form = page.getByRole("form", { name: "Contact form" });
    await expect(form.getByRole("checkbox")).toHaveCount(0);
    await expect(page.getByText("Please do not send health data or treatment photos through this form.")).toBeVisible();
    await form.getByRole("link", { name: "privacy policy" }).click();
    await expect(page).toHaveURL(/\/en\/privacy$/);
    await expect(
      page.getByRole("heading", { name: "6. Storage and transmission of form requests" }),
    ).toBeVisible();
  });
});
