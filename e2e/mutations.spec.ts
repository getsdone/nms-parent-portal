// Each test changes one seeded row and puts it back. The finally blocks
// restore through the API so a failed assertion does not leave the branch dirty.
import { expect, test } from "@playwright/test";

test("todos: progress text, toggle first open item, survives reload, toggle back", async ({ page, request }) => {
  await page.goto("/todos");
  const lede = page.locator(".page__lede");
  await expect(lede).toHaveText("2 of 8 done this year");

  const checkboxId = (await page
    .locator("ul.list")
    .first()
    .locator('input[type="checkbox"]')
    .first()
    .getAttribute("id"))!;
  const todoId = checkboxId.replace("todo-", "");
  // Pin to the id: a positional locator re-resolves to the next open item
  // once this one moves to the done list, and check() then clicks it too.
  const firstOpen = page.locator(`#${checkboxId}`);
  await expect(firstOpen).not.toBeChecked();
  const title = (await page.locator(`label[for="${checkboxId}"]`).innerText()).replace("Required", "").trim();

  try {
    const patched = page.waitForResponse((r) => r.url().endsWith(`/api/todos/${todoId}`) && r.request().method() === "PATCH");
    await firstOpen.click();
    expect((await patched).ok()).toBe(true);
    await expect(lede).toHaveText("3 of 8 done this year");

    await page.reload();
    await expect(lede).toHaveText("3 of 8 done this year");
    await expect(page.locator(`#${checkboxId}`)).toHaveCount(0);
    await page.getByRole("button", { name: "Show 3 completed" }).click();
    const doneBox = page.locator(`#${checkboxId}`);
    await expect(doneBox).toBeChecked();
    await expect(page.locator(`label[for="${checkboxId}"]`)).toContainText(title);

    const unpatched = page.waitForResponse((r) => r.url().endsWith(`/api/todos/${todoId}`) && r.request().method() === "PATCH");
    await doneBox.click();
    expect((await unpatched).ok()).toBe(true);
    await page.reload();
    await expect(lede).toHaveText("2 of 8 done this year");
    await expect(page.locator(`#${checkboxId}`)).not.toBeChecked();
  } finally {
    await request.patch(`/api/todos/${todoId}`, { data: { completed: false } });
  }
});

test("events: Going tab lists exactly 2; RSVP a new event, survives reload, then cancel", async ({ page, request }) => {
  await page.goto("/events");
  const panel = page.locator("#events-panel");
  const goingTab = page.getByRole("tab", { name: "Going (2)" });
  await goingTab.click();
  await expect(goingTab).toHaveAttribute("aria-selected", "true");
  await expect(panel.locator("li.list__row")).toHaveCount(2);

  await page.getByRole("tab", { name: "Upcoming" }).click();
  const row = panel.locator("li.list__row", { has: page.getByRole("button", { name: "RSVP", exact: true }) }).first();
  const title = await row.locator("h3").innerText();
  const eventsRes = await request.get("/api/events");
  const eventId = ((await eventsRes.json()) as { id: number; title: string }[]).find((e) => e.title === title)!.id;

  try {
    const posted = page.waitForResponse((r) => r.url().endsWith(`/api/events/${eventId}/rsvp`) && r.request().method() === "POST");
    await row.getByRole("button", { name: "RSVP", exact: true }).click();
    expect((await posted).ok()).toBe(true);
    const goingButton = panel.getByRole("button", { name: `Going to ${title}. Cancel RSVP` });
    await expect(goingButton).toContainText("Going");
    await expect(page.getByRole("tab", { name: "Going (3)" })).toBeVisible();

    await page.reload();
    await expect(goingButton).toContainText("Going");
    await expect(page.getByRole("tab", { name: "Going (3)" })).toBeVisible();

    const deleted = page.waitForResponse((r) => r.url().endsWith(`/api/events/${eventId}/rsvp`) && r.request().method() === "DELETE");
    await goingButton.click();
    expect((await deleted).ok()).toBe(true);
    await page.reload();
    await expect(page.getByRole("tab", { name: "Going (2)" })).toBeVisible();
    await expect(
      panel.locator("li.list__row", { hasText: title }).getByRole("button", { name: "RSVP", exact: true }),
    ).toBeVisible();
  } finally {
    await request.delete(`/api/events/${eventId}/rsvp`);
  }
});

test("events: the Going count follows the Virtual / In person filter", async ({ page }) => {
  // Seeded RSVPs are events 1 and 3, both virtual.
  await page.goto("/events");
  await page.getByLabel("In person").check();
  await expect(page.getByRole("tab", { name: "Going (0)" })).toBeVisible();
  await page.getByRole("tab", { name: "Going (0)" }).click();
  await expect(page.locator("#events-panel")).toContainText("No RSVPs yet.");
  await page.getByLabel("Virtual").check();
  await expect(page.locator("#events-panel li.list__row")).toHaveCount(2);
});

test("profile: change city, save, reload, see it, restore", async ({ page, request }) => {
  const original = await (await request.get("/api/family")).json();
  const originalCity: string = original.city;
  const newCity = "São Paulo – Test";

  try {
    await page.goto("/profile");
    const city = page.getByLabel("City");
    await expect(city).toHaveValue(originalCity);
    await city.fill(newCity);
    const saved = page.waitForResponse((r) => r.url().endsWith("/api/family") && r.request().method() === "PATCH");
    await page.getByRole("button", { name: "Save" }).click();
    expect((await saved).ok()).toBe(true);
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();

    await page.reload();
    await expect(city).toHaveValue(newCity);

    await city.fill(originalCity);
    const restored = page.waitForResponse((r) => r.url().endsWith("/api/family") && r.request().method() === "PATCH");
    await page.getByRole("button", { name: "Save" }).click();
    expect((await restored).ok()).toBe(true);
    await page.reload();
    await expect(city).toHaveValue(originalCity);
  } finally {
    const current = await (await request.get("/api/family")).json();
    if (current.city !== originalCity) {
      await request.patch("/api/family", {
        data: {
          address_line1: current.address_line1,
          city: originalCity,
          state: current.state,
          zip: current.zip,
          parents: current.parents.map((p: { id: number; name: string; email: string; phone: string | null }) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone ?? "",
          })),
          stars: current.stars.map((s: { id: number; school_name: string | null; school_district: string | null; grade: number }) => ({
            id: s.id,
            school_name: s.school_name ?? "",
            school_district: s.school_district ?? "",
            grade: s.grade,
          })),
        },
      });
    }
  }
});
