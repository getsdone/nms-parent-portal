import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { app } from "../src/app.js";

interface Todo {
  id: number;
  due_date: string | null;
  required: boolean;
  completed_at: string | null;
  completed_by: number | null;
  completed_by_name: string | null;
  status: "done" | "overdue" | "due_soon" | "upcoming";
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

// Counts come from db/seed.sql's own comment: Sofia's 8 todos (6 star_id=1
// plus 2 family-wide star_id=NULL) all surface under ?star=1: 3 overdue
// required, 2 due within 7 days, 1 later (upcoming), 2 already completed.
test("GET /api/todos?star=1 returns Sofia's 8 rows with correct status counts", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/todos?star=1`);
    assert.equal(res.status, 200);
    const todos = (await res.json()) as Todo[];
    assert.equal(todos.length, 8);

    const counts = { done: 0, overdue: 0, due_soon: 0, upcoming: 0 };
    for (const todo of todos) {
      counts[todo.status]++;
    }
    assert.deepEqual(counts, { done: 2, overdue: 3, due_soon: 2, upcoming: 1 });
  });
});

// Unfiltered (no ?star) includes Leo's 4 todos too: 12 total, 5 overdue
// required (3 from Sofia's rows above, 2 from Leo's).
test("GET /api/todos with no star filter returns all 12 rows across both stars", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/todos`);
    assert.equal(res.status, 200);
    const todos = (await res.json()) as Todo[];
    assert.equal(todos.length, 12);

    const overdueRequired = todos.filter(
      (t) => t.status === "overdue" && t.required,
    );
    assert.equal(overdueRequired.length, 5);
  });
});

test("GET /api/todos?star=0 returns 400", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/todos?star=0`);
    assert.equal(res.status, 400);
  });
});

// Id 6 ("Book winter camp travel", due 2026-11-15) is seeded incomplete and
// far enough out to stay "upcoming" regardless of the exact day this runs.
test("PATCH /api/todos/:id toggles completion and restores it", async () => {
  await withServer(async (base) => {
    const complete = await fetch(`${base}/api/todos/6`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    assert.equal(complete.status, 200);
    const completed = (await complete.json()) as Todo;
    assert.equal(completed.id, 6);
    assert.equal(completed.status, "done");
    assert.notEqual(completed.completed_at, null);

    const uncomplete = await fetch(`${base}/api/todos/6`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: false }),
    });
    assert.equal(uncomplete.status, 200);
    const restored = (await uncomplete.json()) as Todo;
    assert.equal(restored.id, 6);
    assert.equal(restored.completed_at, null);
    assert.equal(restored.status, "upcoming");
  });
});

// Elena Rivera (parent id 1) is a guardian in family 1's seed data.
test("PATCH /api/todos/:id with parent_id records completed_by_name, then undo clears it", async () => {
  await withServer(async (base) => {
    const complete = await fetch(`${base}/api/todos/6`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true, parent_id: 1 }),
    });
    assert.equal(complete.status, 200);
    const completed = (await complete.json()) as Todo;
    assert.equal(completed.completed_by, 1);
    assert.equal(completed.completed_by_name, "Elena Rivera");

    const undo = await fetch(`${base}/api/todos/6`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: false }),
    });
    assert.equal(undo.status, 200);
    const restored = (await undo.json()) as Todo;
    assert.equal(restored.completed_by, null);
    assert.equal(restored.completed_by_name, null);
  });
});

test("PATCH /api/todos/:id with a parent_id outside family 1 returns 404", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/todos/6`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true, parent_id: 9999 }),
    });
    assert.equal(res.status, 404);
  });
});

test("PATCH /api/todos/:id 404s for a todo outside family 1", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/todos/9999`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    assert.equal(res.status, 404);
  });
});
