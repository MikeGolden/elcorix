import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * The consultation form's desktop pickers (components/DatePicker.tsx,
 * components/TimePicker.tsx). Desktop project only — phones keep the native
 * controls, covered in pages.spec.ts.
 */

/**
 * macOS Safari's click-focus model, which Chromium does not have: a
 * <button> is never focused by a click; focus goes to the nearest focusable
 * ancestor, or nowhere. That difference is what broke the month arrows in
 * Safari on 2026-09-29 while every Chromium test stayed green.
 */
async function emulateSafariClickFocus(page: Page) {
  await page.addInitScript(() => {
    document.addEventListener(
      "mousedown",
      (event) => {
        const button = (event.target as Element).closest("button");
        if (!button) return;
        event.preventDefault();
        // Click focus never scrolls, so neither may the emulation.
        let node = button.parentElement;
        while (node && !node.hasAttribute("tabindex")) node = node.parentElement;
        if (node) node.focus({ preventScroll: true });
        else (document.activeElement as HTMLElement | null)?.blur();
      },
      true,
    );
  });
}

function monthTitle(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

async function openCalendar(page: Page) {
  await page.goto("/en/");
  const trigger = page.getByRole("button", { name: /Preferred date/ });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  return page.getByRole("dialog", { name: "Preferred date" });
}

test.describe("Consultation pickers (desktop)", () => {
  const now = new Date();
  const thisMonth = monthTitle(now);
  const nextMonth = monthTitle(new Date(now.getFullYear(), now.getMonth() + 1, 1));

  test("month arrows page the calendar, and clicks on its text keep it open", async ({ page }) => {
    const calendar = await openCalendar(page);
    await calendar.getByText(thisMonth).click();
    await calendar.getByRole("columnheader").first().click();
    await expect(calendar).toBeVisible();

    await calendar.getByRole("button", { name: "Next month" }).click();
    await expect(calendar.getByText(nextMonth)).toBeVisible();
    await calendar.getByRole("button", { name: "Previous month" }).click();
    await expect(calendar.getByText(thisMonth)).toBeVisible();
  });

  test("month arrows and slots work under Safari's click-focus model", async ({ page }) => {
    await emulateSafariClickFocus(page);
    const calendar = await openCalendar(page);

    await calendar.getByRole("button", { name: "Next month" }).click();
    await expect(calendar.getByText(nextMonth)).toBeVisible();
    // Keyboard still reaches the popover after a click left focus on it.
    await page.keyboard.press("Escape");
    await expect(calendar).toBeHidden();

    await page.getByRole("button", { name: /Preferred date/ }).click();
    await calendar.getByRole("button", { name: "Next month" }).click();
    const first = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    while (first.getDay() === 0 || first.getDay() === 1) first.setDate(first.getDate() + 1);
    const label = new Intl.DateTimeFormat("en", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(first);
    await calendar.getByRole("button", { name: label, exact: true }).click();
    await expect(calendar).toBeHidden();
    await expect(page.locator('input[name="date"]')).not.toHaveValue("");

    await page.getByRole("button", { name: /Preferred time/ }).click();
    await page.getByRole("option", { name: "15:00" }).click();
    await expect(page.locator('input[name="time"]')).toHaveValue("15:00");
  });

  test("both open popovers pass axe", async ({ page }) => {
    await page.goto("/en/");
    // Measure contrast on settled colours: no scroll reveal, no fade-in.
    await page.addStyleTag({
      content:
        ".reveal,.reveal-fade{opacity:1!important;transform:none!important;transition:none!important}.picker-popover{animation:none!important}",
    });
    const trigger = page.getByRole("button", { name: /Preferred date/ });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const check = async () => {
      const results = await new AxeBuilder({ page })
        .include(".picker-popover")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    };
    await check();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /Preferred time/ }).click();
    await expect(page.getByRole("dialog", { name: "Preferred time" })).toBeVisible();
    await check();
  });
});
