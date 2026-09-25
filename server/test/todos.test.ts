import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { app } from "../src/app.js";

interface Todo {
  id: number;
  due_date: string | null;
  required: boolean;
  completed_at: string | null;
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

// Counts come from db/seed.sql's own comment: 8 todos, 3 overdue required,
// 2 due within 7 days, 1 later (upcoming), 2 already completed (done).
test("GET /api/todos returns all 8 seeded rows with correct status counts", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/todos`);
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
