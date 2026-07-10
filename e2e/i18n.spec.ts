import { test, expect } from "@playwright/test";

test.describe("Internationalization", () => {
  test("switches to German, then Ukrainian, and persists across reloads", async ({
    page,
  }) => {
    await page.goto("/");
    // Playwright's default locale is en-US, so the site starts in English.
    await expect(page.getByRole("heading", { name: "Who we are" })).toBeVisible();

    await page.getByTestId("language-switcher").click();
    await page.getByRole("option", { name: "Deutsch" }).click();
    await expect(page.getByRole("heading", { name: "Wer wir sind" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Was wir tun" })).toBeVisible();

    await page.getByTestId("language-switcher").click();
    await page.getByRole("option", { name: "Українська" }).click();
    await expect(page.getByRole("heading", { name: "Хто ми" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Що ми робимо" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Хто ми" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  });
});
