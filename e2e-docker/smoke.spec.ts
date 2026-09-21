import { test, expect } from "@playwright/test";

/**
 * Smoke test against the real composed stack (nginx + API + Postgres) —
 * run with `npm run test:e2e:docker` after `docker compose up -d --build`.
 * Unlike the regular e2e suite nothing is mocked here: it catches
 * nginx-proxy, CSP, migration and container-wiring regressions.
 */
test.describe("Docker stack smoke", () => {
  test("serves the SPA with security headers", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    const headers = response?.headers() ?? {};
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    // "/" is prerendered in German and the router then moves the visitor
    // to their own language, so either headline is a pass here.
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /(Dauerhafte )?Laser-Haarentfernung in Kempten|laser hair removal in Kempten/i,
      }),
    ).toBeVisible();
  });

  test("API is healthy through the nginx proxy", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  test("stores a real contact message end-to-end", async ({ page }) => {
    await page.goto("/en/contact");
    await page.getByRole("button", { name: /only necessary|nur notwendige/i }).click();
    await page.getByLabel(/^name$/i).fill("Smoke Test");
    await page.getByLabel(/e-mail/i).fill("smoke@example.com");
    await page
      .getByRole("textbox", { name: /^(message|nachricht)$/i })
      .fill("Automated smoke test message.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /send message|nachricht senden/i }).click();
    await expect(page.getByRole("status")).toBeVisible();
  });

  test("SPA fallback serves client-side routes and 404 page", async ({ page }) => {
    await page.goto("/en/prices");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const missing = await page.goto("/definitely-not-a-page");
    expect(missing?.status()).toBe(404);
    await expect(page.getByText("404")).toBeVisible();
  });
});
