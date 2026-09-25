import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { app } from "../src/app.js";

// From db/seed.sql, relative to "today" 2026-09-25: 3 required incomplete
// todos are overdue (due 09-10, 09-15, 09-20); 2 incomplete todos fall due
// within the next 7 days (09-27, 10-01); budget_transactions sum to 300000
// of 500000 allocated_cents, i.e. 60% used; and of the two events with an
// rsvp_deadline in the next 7 days (event 1, event 2), event 1 is already
// rsvped by family 1, leaving only event 2 in rsvp_deadlines. These are
// Sofia's (star 1) counts, which ?star=1 keeps unchanged since Leo's rows
// carry star_id 2.
const EXPECTED_OVERDUE_TODOS = 3;
const EXPECTED_DUE_SOON_TODOS = 2;
const EXPECTED_PERCENT_USED = 60;
const EXPECTED_RSVP_DEADLINES = 1;

interface DashboardResponse {
  overdue_todos: { id: number; title: string; due_date: string | null; link: string | null }[];
  due_soon_todos: { id: number; title: string; due_date: string | null; link: string | null }[];
  upcoming_rsvps: {
    id: number;
    title: string;
    starts_at: string;
    kind: string;
    location: string | null;
  }[];
  rsvp_deadlines: { id: number; title: string; rsvp_deadline: string; starts_at: string }[];
  budget: {
    fiscal_year: number;
    allocated_cents: number;
    spent_cents: number;
    remaining_cents: number;
    percent_used: number;
  };
}

test("GET /api/dashboard?star=1 returns nudges computed from seed data", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/dashboard?star=1`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as DashboardResponse;

    assert.equal(body.overdue_todos.length, EXPECTED_OVERDUE_TODOS);
    assert.equal(body.due_soon_todos.length, EXPECTED_DUE_SOON_TODOS);
    assert.equal(body.rsvp_deadlines.length, EXPECTED_RSVP_DEADLINES);
    assert.equal(body.budget.percent_used, EXPECTED_PERCENT_USED);

    for (const todo of [...body.overdue_todos, ...body.due_soon_todos]) {
      assert.equal(typeof todo.id, "number");
      assert.equal(typeof todo.title, "string");
      assert.ok("due_date" in todo);
      assert.ok("link" in todo);
    }

    for (const rsvp of body.upcoming_rsvps) {
      assert.equal(typeof rsvp.id, "number");
      assert.equal(typeof rsvp.title, "string");
      assert.equal(typeof rsvp.starts_at, "string");
      assert.equal(typeof rsvp.kind, "string");
      assert.ok("location" in rsvp);
    }

    for (const deadline of body.rsvp_deadlines) {
      assert.equal(typeof deadline.id, "number");
      assert.equal(typeof deadline.title, "string");
      assert.equal(typeof deadline.rsvp_deadline, "string");
      assert.equal(typeof deadline.starts_at, "string");
    }

    assert.equal(
      body.budget.remaining_cents,
      body.budget.allocated_cents - body.budget.spent_cents,
    );
  } finally {
    server.close();
  }
});

// Unfiltered (no ?star) folds in Leo's (star 2) 2 overdue required todos,
// so the required-overdue nudge rises from 3 to 5.
test("GET /api/dashboard with no star filter returns overdue todos across both stars", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/dashboard`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as DashboardResponse;

    assert.equal(body.overdue_todos.length, 5);
  } finally {
    server.close();
  }
});

test("GET /api/dashboard?star=abc returns 400", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/dashboard?star=abc`);
    assert.equal(res.status, 400);
  } finally {
    server.close();
  }
});
