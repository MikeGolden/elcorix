import { test, expect } from "@playwright/test";
import { de, en, uk } from "./paths";

/**
 * The one deliberate change from the React build: a language is a URL, not
 * a localStorage key. German keeps the bare paths; English and Ukrainian
 * sit under a prefix. That is what makes the next two tests possible at
 * all — the old design could not have hreflang, because all three
 * languages shared one URL.
 */
test.describe("Internationalization", () => {
  test("each language has its own URL and renders server-side", async ({ request }) => {
    const german = await (await request.get(de.home)).text();
    expect(german).toContain("Für wen ist es geeignet?");
    expect(german).toContain('lang="de-DE"');

    const english = await (await request.get(en.home)).text();
    expect(english).toContain("Who is it for?");

    const ukrainian = await (await request.get(uk.home)).text();
    expect(ukrainian).toContain("Кому це підходить?");
  });

  test("the switcher moves between languages and keeps the page", async ({ page }) => {
    await page.goto(en.prices);
    await expect(page.getByRole("heading", { name: "Services for women" })).toBeVisible();

    await page.getByTestId("language-switcher").click();
    await page.getByRole("option", { name: "Deutsch" }).click();

    await expect(page).toHaveURL(/\/prices\/?$/);
    await expect(page).not.toHaveURL(/\/en\//);
    await expect(page.getByRole("heading", { name: "Leistungen für Frauen" })).toBeVisible();
    await expect(page.getByText("Bikinizone klassisch").first()).toBeVisible();
  });

  test("switching to Ukrainian keeps the price list identical", async ({ page }) => {
    await page.goto(uk.prices);
    await expect(page.locator("html")).toHaveAttribute("lang", /^uk/);
    // The zone names are translated; the numbers are read from the German
    // originals, so they cannot drift between languages.
    await expect(page.getByText("189").first()).toBeVisible();
  });

  test("every page offers hreflang alternates", async ({ page }) => {
    await page.goto(en.prices);
    for (const language of ["de", "en", "uk"]) {
      await expect(
        page.locator(`link[rel="alternate"][hreflang="${language}"]`),
      ).toHaveCount(1);
    }
  });

  test("the switcher works without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(en.home);
    // Each option is a real link, not a button that swaps a dictionary.
    const link = page.locator('[data-elcorix-language-option] a', { hasText: "Deutsch" });
    await expect(link).toHaveAttribute("href", /\/$/);
    await context.close();
  });
});
