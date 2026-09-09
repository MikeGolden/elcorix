import { test, expect } from "@playwright/test";

/**
 * The language lives in the URL: /en/prices, /de/prices, /uk/prices and
 * /ru/prices are four addressable pages, and everything unprefixed redirects into one of
 * them. Playwright's default locale is en-US, so an undecided visitor here
 * is an English one.
 */
test.describe("Internationalization", () => {
  test("switches to German, then Ukrainian, moving the URL with the language", async ({
    page,
  }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { name: "Who is it for?" })).toBeVisible();

    await page.getByTestId("language-switcher").click();
    await page.getByRole("option", { name: "Deutsch" }).click();
    await expect(page).toHaveURL(/\/de$/);
    await expect(
      page.getByRole("heading", { name: "Für wen ist es geeignet?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ihre Haut in erfahrenen Händen" }),
    ).toBeVisible();

    await page.getByTestId("language-switcher").click();
    await page.getByRole("option", { name: "Українська" }).click();
    await expect(page).toHaveURL(/\/uk$/);
    await expect(page.getByRole("heading", { name: "Кому це підходить?" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ваша шкіра в досвідчених руках" }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Кому це підходить?" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  });

  test("a shared link opens in the language it names", async ({ page }) => {
    // No switching, no stored preference: the URL alone decides.
    await page.goto("/uk/prices");
    await page.getByRole("button", { name: /лише необхідні|only necessary/i }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Прайс-лист" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  });

  test("Russian is its own locale, not a fallback to Ukrainian", async ({ page }) => {
    // "Прайс-лист" is spelled the same in both, so the assertion has to be a
    // string the two languages disagree about.
    await page.goto("/ru/prices");
    await page.getByRole("button", { name: /только необходимые|only necessary/i }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(page.getByRole("heading", { name: "Услуги для женщин" })).toBeVisible();
    await expect(page.getByText("Зона бикини классическая").first()).toBeVisible();
  });

  test("switches from Ukrainian to Russian in place", async ({ page }) => {
    await page.goto("/uk");
    await page.getByRole("button", { name: /лише необхідні|only necessary/i }).click();
    await page.getByTestId("language-switcher").click();
    await page.getByRole("option", { name: "Русский" }).click();
    await expect(page).toHaveURL(/\/ru$/);
    await expect(page.getByRole("heading", { name: "Кому это подходит?" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ваша кожа в опытных руках" }),
    ).toBeVisible();
  });

  test("switching language stays on the same page", async ({ page }) => {
    await page.goto("/en/prices");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.getByTestId("language-switcher").click();
    await page.getByRole("option", { name: "Deutsch" }).click();
    await expect(page).toHaveURL(/\/de\/prices$/);
    await expect(page.getByRole("heading", { name: "Leistungen für Frauen" })).toBeVisible();
    await expect(page.getByText("Bikinizone klassisch").first()).toBeVisible();
  });

  test("an unprefixed URL redirects into a language, keeping the path", async ({ page }) => {
    await page.goto("/prices");
    await expect(page).toHaveURL(/\/en\/prices$/);
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Price list" })).toBeVisible();
  });

  test("the language picked last time is what an unprefixed URL uses", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Only necessary" }).click();
    await page.getByTestId("language-switcher").click();
    await page.getByRole("option", { name: "Deutsch" }).click();
    await expect(page).toHaveURL(/\/de$/);

    await page.goto("/contact");
    await expect(page).toHaveURL(/\/de\/contact$/);
  });

  test("a language the site does not have falls back instead of 404ing", async ({ page }) => {
    await page.goto("/fr/prices");
    await expect(page).toHaveURL(/\/en\/prices$/);
    await page.getByRole("button", { name: "Only necessary" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Price list" })).toBeVisible();
  });
});
