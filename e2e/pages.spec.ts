import { expect, test } from "@playwright/test";
import { ROUTES, collectErrors } from "./routes";

for (const route of ROUTES) {
  test(`${route.path} loads with its h1 and no console errors`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(route.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.h1);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("every nav link reaches its page without a full reload", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));
  for (const route of ROUTES.slice(1)) {
    await page.locator(`a.nav__link[href="${route.path}"]`).first().click();
    await expect(page).toHaveURL(route.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.h1);
  }
  expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);
});

test("an unknown path still serves the app shell", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(200);
  await expect(page.locator("nav a.nav__link").first()).toBeVisible();
});

test("dashboard greets the primary parent and shows an overdue hero with days late", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hi, Elena.");
  const hero = page.locator(".hero-overdue");
  await expect(hero).toBeVisible();
  await expect(hero).toContainText(/\d+ days? late/);
  await expect(hero).toContainText("Overdue · 1 of");
});

test("budget hero shows $2,000 left of $5,000 and the legend shows Spent $3,000", async ({ page }) => {
  await page.goto("/budget");
  const hero = page.getByRole("region", { name: "Budget summary" });
  await expect(hero.locator(".budget-hero__amount")).toHaveText("$2,000");
  await expect(hero).toContainText("of $5,000");
  await expect(hero.locator(".legend__item--spent")).toHaveText("Spent $3,000");
  await expect(hero.locator(".legend__item--left")).toHaveText("Left $2,000");
  await expect(hero.locator(".progress__value")).toHaveText("60%");
});

test("budget activity dates match the seeded calendar days", async ({ page }) => {
  // Seed has a transaction on 2026-08-25; a UTC-midnight parse would show Aug 24 west of UTC.
  await page.goto("/budget");
  await expect(page.locator(".activity", { hasText: "Algebra II course fee" })).toContainText("Aug 25");
});
