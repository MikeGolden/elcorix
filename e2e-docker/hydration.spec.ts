import { test, expect, type ConsoleMessage } from "@playwright/test";

/**
 * The prerendered document is *adopted* by React, not replaced.
 *
 * `scripts/prerender.mjs` renders every page into its shell and main.tsx
 * calls `hydrateRoot`, which only reuses that markup when the browser's
 * first render matches it exactly. When it does not, React throws the
 * whole document away and rebuilds it — the page still works, so nothing
 * in the other suites would fail, but the visitor sees the page blink and
 * the prerendered HTML has bought nothing.
 *
 * Only meaningful against the built site, so it lives here rather than in
 * e2e/ (which runs the dev server, where there is nothing to hydrate).
 */
const HYDRATION_ERROR =
  /hydrat|did not match|Minified React error #(418|423|425)|Text content does not match/i;

function watchConsole(messages: string[]) {
  return (message: ConsoleMessage) => {
    if (message.type() === "error" || message.type() === "warning") {
      messages.push(message.text());
    }
  };
}

for (const path of ["/", "/de/preise", "/uk/%D1%86%D1%96%D0%BD%D0%B8", "/en/contact"]) {
  test(`${path} hydrates without rebuilding the page`, async ({ page }) => {
    const messages: string[] = [];
    page.on("console", watchConsole(messages));
    page.on("pageerror", (error) => messages.push(error.message));

    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Let hydration and the mount effects (stored language, consent) run
    // before reading the console — a mismatch is reported during them.
    await page.waitForLoadState("networkidle");

    expect(messages.filter((text) => HYDRATION_ERROR.test(text))).toEqual([]);
  });
}

test("the prerendered page is interactive, not a screenshot", async ({ page }) => {
  await page.goto("/de/preise");
  await page.getByTestId("language-switcher").click();
  await page.getByRole("option", { name: "Українська" }).click();
  expect(decodeURIComponent(page.url())).toMatch(/\/uk\/ціни$/);
  await expect(page.getByRole("heading", { level: 1, name: "Прайс-лист" })).toBeVisible();
});

test("a visitor with no JavaScript still gets the page", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/de/preise");
  await expect(page.getByRole("heading", { level: 1, name: "Preisliste" })).toBeVisible();
  // The scroll reveals start transparent and are flipped by script; the
  // <noscript> rule in index.html is what keeps the text readable here.
  await expect(page.getByText("Leistungen für Frauen").first()).toBeVisible();
  await context.close();
});
