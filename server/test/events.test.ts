import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { app } from "../src/app.js";

interface EventBody {
  id: number;
  starts_at: string;
  rsvped: boolean;
}

async function withServer(fn: (base: string) => Promise<void>) {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

test("GET /api/events returns upcoming seeded events, 2 rsvped", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/events`);
    assert.equal(res.status, 200);
    const events = (await res.json()) as EventBody[];

    assert.equal(events.length, 8);
    const starts = events.map((e) => e.starts_at);
    const sorted = [...starts].sort();
    assert.deepEqual(starts, sorted);

    const rsvped = events.filter((e) => e.rsvped === true);
    assert.equal(rsvped.length, 2);
    assert.deepEqual(
      rsvped.map((e) => e.id).sort(),
      [1, 3],
    );
  });
});

test("POST then DELETE rsvp on a non-rsvped event flips rsvped both ways", async () => {
  await withServer(async (base) => {
    // event 2 has no seeded rsvp for family 1
    const postRes = await fetch(`${base}/api/events/2/rsvp`, { method: "POST" });
    assert.equal(postRes.status, 200);
    const postBody = (await postRes.json()) as EventBody;
    assert.equal(postBody.id, 2);
    assert.equal(postBody.rsvped, true);

    const deleteRes = await fetch(`${base}/api/events/2/rsvp`, { method: "DELETE" });
    assert.equal(deleteRes.status, 200);
    const deleteBody = (await deleteRes.json()) as EventBody;
    assert.equal(deleteBody.id, 2);
    assert.equal(deleteBody.rsvped, false);
  });
});

test("POST /api/events/:id/rsvp 404s on a bad id", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/events/999999/rsvp`, { method: "POST" });
    assert.equal(res.status, 404);
  });
});

test("DELETE /api/events/:id/rsvp 404s on a bad id", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/events/999999/rsvp`, { method: "DELETE" });
    assert.equal(res.status, 404);
  });
});

test("POST /api/events/abc/rsvp 400s on a non-numeric id", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/events/abc/rsvp`, { method: "POST" });
    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: string };
    assert.equal(body.error, "id must be an integer");
  });
});
