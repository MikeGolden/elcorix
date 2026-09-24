import { test, expect } from "@playwright/test";

test.describe("GDPR consent", () => {
  // The Altegio booking block is hidden behind an off feature flag
  // (client/src/features.ts), so /booking is not served and the embed never
  // renders. The consent gate itself is still covered by the unit tests in
  // client/src/test/consent.test.tsx; un-skip this together with the flag.
  test.skip("banner gates the Altegio calendar until consent and persists", async ({
    page,
  }) => {
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

  // The banner only asks about the Altegio calendar, which is behind the
  // off flag — so it is not rendered at all (CookieBanner.tsx). The banner
  // and its footer "Cookie settings" flow are unit-tested with the flag on
  // in client/src/test/consent.test.tsx.
  test("asks for no consent while nothing on the site needs it", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("footer").getByRole("button", { name: "Cookie settings" })).toHaveCount(0);
    // Nothing was written that would need a consent record either.
    expect(await page.evaluate(() => localStorage.getItem("cookie-consent"))).toBeNull();
  });

  test("privacy policy and imprint are reachable from the footer", async ({
    page,
  }) => {
    await page.goto("/en");

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
