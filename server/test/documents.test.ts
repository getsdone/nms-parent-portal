import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { app } from "../src/app.js";

const ALLOWED_STATUSES = new Set([
  "received",
  "under_review",
  "accepted",
  "needs_attention",
]);

interface Document {
  id: number;
  title: string;
  kind: "form" | "upload" | "agreement";
  status: "received" | "under_review" | "accepted" | "needs_attention";
  submitted_at: string;
  note: string | null;
  star_id: number | null;
  todo_id: number | null;
  star_first_name: string | null;
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

// Counts come from db/seed.sql: 6 documents total for family 1 (3 on
// star_id 1, 2 on star_id 2, 1 family-wide with star_id NULL).
test("GET /api/documents with no star filter returns all 6 rows, newest first", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/documents`);
    assert.equal(res.status, 200);
    const documents = (await res.json()) as Document[];
    assert.equal(documents.length, 6);

    for (let i = 1; i < documents.length; i++) {
      const prev = new Date(documents[i - 1].submitted_at).getTime();
      const curr = new Date(documents[i].submitted_at).getTime();
      assert.ok(prev >= curr, "rows must be sorted newest first");
    }
  });
});

// ?star=1 keeps star_id=1 rows plus the family-wide row: 3 + 1 = 4, fewer
// than the unfiltered 6.
test("GET /api/documents?star=1 returns fewer rows than unfiltered", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/documents?star=1`);
    assert.equal(res.status, 200);
    const documents = (await res.json()) as Document[];
    assert.ok(documents.length < 6);
    assert.ok(documents.length > 0);
    for (const doc of documents) {
      assert.ok(doc.star_id === 1 || doc.star_id === null);
    }
  });
});

test("GET /api/documents?star=abc returns 400", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/documents?star=abc`);
    assert.equal(res.status, 400);
  });
});

test("GET /api/documents statuses are all within the allowed set", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/documents`);
    assert.equal(res.status, 200);
    const documents = (await res.json()) as Document[];
    assert.ok(documents.length > 0);
    for (const doc of documents) {
      assert.ok(
        ALLOWED_STATUSES.has(doc.status),
        `unexpected status: ${doc.status}`,
      );
    }
  });
});
