import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { app } from "../src/app.js";

async function withServer(fn: (base: string) => Promise<void>) {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

test("GET /api/calendar.ics returns a VCALENDAR with rsvps, due todos, and program dates", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/calendar.ics`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") ?? "", /^text\/calendar; ?charset=utf-8/);
    assert.equal(
      res.headers.get("content-disposition"),
      'inline; filename="national-math-stars.ics"',
    );

    const body = await res.text();
    assert.match(body, /^BEGIN:VCALENDAR\r\n/);
    assert.match(body, /END:VCALENDAR\r\n$/);

    // 2 seeded RSVPs for family 1 (events 1 and 3).
    const eventUids = body.match(/UID:event-\d+@nms-parent-portal/g) ?? [];
    assert.equal(eventUids.length, 2);

    // Seeded incomplete todos with a due_date: 6 for Sofia's block, 3 for
    // Leo's block (see db/seed.sql), independent of run date since every
    // due_date there is CURRENT_DATE-relative.
    const dueLines = body.match(/SUMMARY:Due: /g) ?? [];
    assert.equal(dueLines.length, 9);

    // A known program_history title (Sofia's AMC 8 2025 competition row).
    assert.match(body, /SUMMARY:competition: AMC 8 2025/);
  });
});
