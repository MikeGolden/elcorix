import { test, expect } from "@playwright/test";

test.describe("Deep-link routes", () => {
  test("prices page lists both zone tables and the package table", async ({ page }) => {
    await page.goto("/en/prices");
    await expect(page.getByRole("heading", { level: 1, name: "Price list" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Services for women" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Services for men" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Combined packages for women" })).toBeVisible();
    // One package table per gender on desktop; phones get the same figures
    // as stacked cards (PriceTables.tsx), so there is no <table> to count.
    const isMobile = test.info().project.name === "mobile";
    await expect(page.getByRole("table")).toHaveCount(isMobile ? 0 : 2);
    await expect(page.getByText("Beard contour", { exact: true })).toBeVisible();
    await expect(page).toHaveTitle("Laser hair removal prices in Kempten — elcorix");
  });

  test("prices page leads with the Ersttermin offers and links the package terms", async ({ page }) => {
    await page.goto("/de/preise");
    // \s: Intl puts a no-break space before €.
    await expect(page.getByTestId("prices-first-visit-women")).toContainText(
      /Ersttermin 129\s€ · regulär 139\s€/,
    );
    await expect(page.getByTestId("prices-first-visit-men")).toContainText(
      /Ersttermin 159\s€ · regulär 179\s€/,
    );
    await expect(page.getByTestId("prices-combinations-smoothDuoLight")).toBeVisible();
    const goodToKnow = page.getByRole("region", { name: /Gut zu wissen/ });
    await expect(goodToKnow).toContainText("inklusive 19 % MwSt.");
    await goodToKnow.getByRole("link", { name: "Paketbedingungen" }).click();
    await expect(page).toHaveURL(/\/de\/paketbedingungen$/);
  });

  test("the jump links at the top of /prices land on each block", async ({ page }) => {
    await page.goto("/de/preise");
    const jumps = page.getByRole("navigation", { name: "Zu den Preisen springen" });
    await expect(jumps).toBeInViewport();
    for (const [name, heading] of [
      ["Herren", "Herren · Ersttermin"],
      ["Kursbedingungen", "Gut zu wissen · für Damen und Herren"],
      ["Damen", "Damen · Ersttermin"],
    ]) {
      await page.goto("/de/preise");
      await jumps.getByRole("link", { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#prices-`));
      const target = page.getByRole("heading", { name: heading });
      await expect(target).toBeInViewport();
      // Not hidden under the sticky header.
      const box = await target.boundingBox();
      const header = await page.getByRole("banner").boundingBox();
      expect(box!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1);
    }
  });

  test("booking buttons lead to the calendar and never push the page sideways", async ({ page }) => {
    await page.goto("/de/preise");
    const men = page.getByTestId("prices-first-visit-men");
    await expect(men.getByRole("link", { name: "Ersttermin buchen" })).toHaveAttribute(
      "href",
      "/de/termin-vereinbaren?service=firstVisitMen",
    );
    const beard = page.getByRole("link", { name: "Bartkontur buchen" });
    await expect(beard).toBeVisible();
    await expect(beard).toHaveAttribute("href", "/de/termin-vereinbaren?service=beardContour");
    for (const width of [390, 640, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/de", "/de/preise"]) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
      }
    }
  });

  test("gallery page shows images with alt text", async ({ page }) => {
    await page.goto("/en/gallery");
    await expect(page.getByRole("heading", { level: 1, name: "Our work" })).toBeVisible();
    await expect(page.getByAltText("Diode laser device in the treatment room")).toBeVisible();
  });

  test("terms and mission pages are reachable", async ({ page }) => {
    await page.goto("/en/terms");
    await expect(
      page.getByRole("heading", { level: 1, name: "General Terms and Conditions (GTC)" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "9. Liability" })).toBeVisible();
    await page.getByRole("link", { name: "Read the German version" }).click();
    await expect(page).toHaveURL(/\/de\/agb$/);
    await expect(page.getByRole("heading", { name: "9. Haftung" })).toBeVisible();
    await page.goto("/en/package-terms");
    await expect(
      page.getByRole("heading", { level: 1, name: "Special Conditions for Treatment Packages" }),
    ).toBeVisible();
    await page.goto("/en/appointment-terms");
    await expect(page.getByRole("heading", { level: 1, name: "Appointment Terms" })).toBeVisible();
    await page.goto("/en/mission");
    await expect(
      page.getByRole("heading", { level: 1, name: "Our mission" }),
    ).toBeVisible();
  });

  test("every for-whom card opens its own page", async ({ page }) => {
    await page.goto("/ru");
    const cards = page.locator("#for-whom").getByRole("link", { name: "Узнать больше" });
    await expect(cards).toHaveCount(4);

    await cards.nth(3).click();
    // Decoded for readability: page.url() is percent-encoded Cyrillic.
    expect(decodeURIComponent(page.url())).toMatch(/\/ru\/для-кого\/контур-бороды$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Борода есть, но её контур приходится постоянно поправлять",
      }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/Чёткий контур бороды — elcorix/);

    // The overview article carries all six situations.
    await page.getByRole("link", { name: /Когда лазерная эпиляция/ }).click();
    expect(decodeURIComponent(page.url())).toMatch(/\/ru\/для-кого\/лазер-облегчает-жизнь$/);
    await expect(page.locator("main").getByRole("heading", { level: 2 })).toHaveCount(7); // 6 situations + "others"

    // Back to the section on the landing page.
    await page.getByRole("link", { name: "Кому это подходит?" }).click();
    await expect(page).toHaveURL(/\/ru#for-whom$/);
    await expect(page.locator("#for-whom")).toBeInViewport();
  });

  test("every page in the sitemap is linked from the home page", async ({ page, request }) => {
    // An URL only the sitemap knows is an orphan: crawlers rank it low and
    // visitors never find it. Checked for the German pages; the other
    // languages render the same components.
    const sitemap = await (await request.get("/sitemap.xml")).text();
    const wanted = [...sitemap.matchAll(/<loc>https:\/\/[^/]+(\/de(?:\/[^<]*)?)<\/loc>/g)].map(
      (match) => decodeURI(match[1]!),
    );
    expect(wanted.length).toBeGreaterThan(10);

    await page.goto("/de");
    const linked = new Set(
      await page
        .locator("a[href]")
        .evaluateAll((anchors) =>
          anchors.map((a) => decodeURI(new URL((a as HTMLAnchorElement).href).pathname)),
        ),
    );
    const orphans = wanted.filter((path) => !linked.has(path));
    expect(orphans, "sitemap URLs with no link on /de").toEqual([]);
  });

  test("unknown routes render the 404 page", async ({ page }) => {
    // Unprefixed: the router redirects it into the visitor's language
    // first, and only then finds nothing to render.
    await page.goto("/no-such-page");
    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/en\/no-such-page$/);
    await page.getByRole("link", { name: "Back to the home page" }).click();
    await expect(page).toHaveURL(/\/en$/);
  });

  test("the booking section and the booking page show the calendar after consent", async ({ page }) => {
    // Altegio itself is stubbed: the test is about our page, not their uptime.
    await page.route("https://n1463826.alteg.io/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<title>Altegio</title><h1>Altegio stub</h1>" }),
    );
    await page.goto("/en");
    await expect(page.locator("#booking")).toHaveCount(1);
    await expect(page.locator("#booking").getByTestId("altegio-consent-placeholder")).toBeVisible();
    await expect(page.getByTestId("altegio-widget")).toHaveCount(0);

    await page.goto("/de/preise");
    await page.getByRole("dialog").getByRole("button", { name: "Nur notwendige" }).click();
    await page.getByTestId("prices-first-visit-women").getByRole("link", { name: "Ersttermin buchen" }).click();
    await expect(page).toHaveURL(/\/de\/termin-vereinbaren\?service=firstVisitWomen$/);
    await page.getByRole("button", { name: /Kalender laden/ }).click();
    const frame = page.getByTestId("altegio-widget");
    await expect(frame).toHaveAttribute(
      "src",
      "https://n1463826.alteg.io/company/1390972/personal/select-services?o=s13920267",
    );
    await expect(page.frameLocator('[data-testid="altegio-widget"]').getByRole("heading")).toHaveText(
      "Altegio stub",
    );
  });

  // Was the /booking page; that route is behind an off feature flag
  // (client/src/features.ts), so the same form is exercised where it also
  // lives — the consultation section of the landing page.
  test("landing page offers the cookie-free consultation request", async ({ page, isMobile }) => {
    await page.goto("/en#consultation");
    await page.route("**/api/bookings", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, status: "pending" }),
      }),
    );
    await page.getByLabel("Name").fill("Anna");
    await page.getByLabel("Phone number").fill("+49 155 1234567");
    // A fixed date goes stale — the form rejects past dates. A week ahead,
    // moved on to a day the studio is open (Tue–Sat).
    const day = new Date(Date.now() + 7 * 86_400_000);
    while (day.getDay() === 0 || day.getDay() === 1) day.setDate(day.getDate() + 1);
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    if (isMobile) {
      // Touch devices keep the native input and the OS's own picker.
      await page.getByLabel("Preferred date").fill(iso);
    } else {
      // A mouse gets the site's own calendar (components/DatePicker.tsx).
      await page.getByRole("button", { name: /Preferred date/ }).click();
      const calendar = page.getByRole("dialog", { name: "Preferred date" });
      if (day.getMonth() !== new Date().getMonth()) {
        await calendar.getByRole("button", { name: "Next month" }).click();
      }
      const label = new Intl.DateTimeFormat("en", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(day);
      await calendar.getByRole("button", { name: label, exact: true }).click();
      await expect(calendar).toBeHidden();
    }
    await expect(page.locator('input[name="date"]')).toHaveValue(iso);
    // Half-hour slots only, never free text: the native select on touch,
    // the calendar-styled popover (components/TimePicker.tsx) with a mouse.
    if (isMobile) {
      await page.getByLabel("Preferred time").selectOption("10:30");
    } else {
      await page.getByRole("button", { name: /Preferred time/ }).click();
      await page.getByRole("option", { name: "10:30" }).click();
      await expect(page.locator('input[name="time"]')).toHaveValue("10:30");
    }
    await page.getByRole("button", { name: "Get a consultation" }).click();
    await expect(page.getByRole("status")).toHaveText(/we will get back to you/i);
  });

  test("scroll position resets when navigating between pages", async ({ page }) => {
    await page.goto("/en");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(async () => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(500);
    await page.goto("/en/prices");
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBe(0);
  });
});
