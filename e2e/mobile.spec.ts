import { expect, test } from "@playwright/test";
import { ROUTES } from "./routes";

for (const route of ROUTES) {
  test(`${route.path} has no horizontal overflow at 390px`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.h1);
    await page.waitForLoadState("networkidle");
    const { scrollWidth, viewport } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement!.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(viewport).toBe(390);
    expect(scrollWidth).toBeLessThanOrEqual(viewport);
  });
}
