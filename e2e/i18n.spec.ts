import { test, expect } from "@playwright/test";

test.describe("Internationalization", () => {
  test("switches to German, then Ukrainian, and persists across reloads", async ({
    page,
  }) => {
    await page.goto("/");
    // Playwright's default locale is en-US, so the site starts in English.
    await expect(page.getByRole("heading", { name: "Who is it for?" })).toBeVisible();

    await page.getByTestId("language-switcher").click();
    await page.getByRole("option", { name: "Deutsch" }).click();
    await expect(
      page.getByRole("heading", { name: "Für wen ist es geeignet?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ihre Haut in erfahrenen Händen" }),
    ).toBeVisible();

    await page.getByTestId("language-switcher").click();
    await page.getByRole("option", { name: "Українська" }).click();
    await expect(page.getByRole("heading", { name: "Кому це підходить?" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ваша шкіра в досвідчених руках" }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Кому це підходить?" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  });

  test("translates the price tables too", async ({ page }) => {
    await page.goto("/prices");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.getByTestId("language-switcher").click();
    await page.getByRole("option", { name: "Deutsch" }).click();
    await expect(page.getByRole("heading", { name: "Leistungen für Frauen" })).toBeVisible();
    await expect(page.getByText("Bikinizone klassisch").first()).toBeVisible();
  });
});
