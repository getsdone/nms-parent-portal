import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { app } from "../src/app.js";

type HistoryEntry = {
  id: number;
  kind: string;
  title: string;
  provider: string | null;
  start_date: string | null;
  end_date: string | null;
  result: string | null;
  notes: string | null;
};

type HistoryResponse = {
  stars: { id: number; first_name: string; grade: number; history: HistoryEntry[] }[];
};

async function withServer(fn: (baseUrl: string) => Promise<void>) {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

test("GET /api/history returns one star with 10 entries in start_date desc order", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/history`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as HistoryResponse;

    assert.equal(body.stars.length, 1);
    const [star] = body.stars;
    assert.equal(star.history.length, 10);

    const dates = star.history.map((entry) => entry.start_date);
    const sorted = [...dates].sort().reverse();
    assert.deepEqual(dates, sorted);
  });
});

test("GET /api/history?kind=competition returns only competitions, count matching seed", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/history?kind=competition`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as HistoryResponse;

    const [star] = body.stars;
    // seed.sql has 4 program_history rows with kind = 'competition'.
    assert.equal(star.history.length, 4);
    for (const entry of star.history) {
      assert.equal(entry.kind, "competition");
    }
  });
});

test("GET /api/history?kind=bogus returns 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/history?kind=bogus`);
    assert.equal(res.status, 400);
  });
});
