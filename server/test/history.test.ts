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

// Unfiltered now covers both stars (Sofia and Leo).
test("GET /api/history with no star filter returns both stars", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/history`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as HistoryResponse;

    assert.equal(body.stars.length, 2);
  });
});

test("GET /api/history?star=1 returns one star with 10 entries in start_date desc order", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/history?star=1`);
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

test("GET /api/history?kind=competition&star=1 returns only competitions, count matching seed", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/history?kind=competition&star=1`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as HistoryResponse;

    const [star] = body.stars;
    // seed.sql has 4 program_history rows with kind = 'competition' for
    // Sofia (star 1).
    assert.equal(star.history.length, 4);
    for (const entry of star.history) {
      assert.equal(entry.kind, "competition");
    }
  });
});

// Leo (star 2) adds 1 more competition row, so the unfiltered count across
// both stars rises to 5.
test("GET /api/history?kind=competition with no star filter returns 5 total across both stars", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/history?kind=competition`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as HistoryResponse;

    const total = body.stars.reduce((sum, star) => sum + star.history.length, 0);
    assert.equal(total, 5);
    for (const star of body.stars) {
      for (const entry of star.history) {
        assert.equal(entry.kind, "competition");
      }
    }
  });
});

test("GET /api/history?kind=bogus returns 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/history?kind=bogus`);
    assert.equal(res.status, 400);
  });
});

test("GET /api/history?star=abc returns 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/history?star=abc`);
    assert.equal(res.status, 400);
  });
});
