import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { app } from "../src/app.js";

// From db/seed.sql: 12 budget_transactions rows for family 1 sum to 300000.
const EXPECTED_SPENT_CENTS = 300000;
const EXPECTED_ALLOCATED_CENTS = 500000;
const EXPECTED_TRANSACTION_COUNT = 12;

interface BudgetResponse {
  fiscal_year: number;
  allocated_cents: number;
  spent_cents: number;
  remaining_cents: number;
  transactions: { id: number; occurred_on: string; amount_cents: number }[];
}

test("GET /api/budget returns the current fiscal year summary and transactions", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/budget`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as BudgetResponse;

    assert.equal(body.fiscal_year, 2026);
    assert.equal(body.allocated_cents, EXPECTED_ALLOCATED_CENTS);
    assert.equal(body.spent_cents, EXPECTED_SPENT_CENTS);
    assert.equal(
      body.remaining_cents,
      EXPECTED_ALLOCATED_CENTS - EXPECTED_SPENT_CENTS,
    );

    assert.equal(body.transactions.length, EXPECTED_TRANSACTION_COUNT);
    const sum = body.transactions.reduce((total, t) => total + t.amount_cents, 0);
    assert.equal(sum, EXPECTED_SPENT_CENTS);

    const dates = body.transactions.map((t) => t.occurred_on);
    const sortedDesc = [...dates].sort().reverse();
    assert.deepEqual(dates, sortedDesc);
  } finally {
    server.close();
  }
});

// Parent id 3 (Rosa Alvarez) is the seeded caregiver in family 1.
test("GET /api/budget?parent=3 returns 403 for a caregiver", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/budget?parent=3`);
    assert.equal(res.status, 403);
  } finally {
    server.close();
  }
});

test("GET /api/budget?parent=1 still succeeds for a guardian", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/budget?parent=1`);
    assert.equal(res.status, 200);
  } finally {
    server.close();
  }
});

test("GET /api/budget?parent=999999 returns 404", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/budget?parent=999999`);
    assert.equal(res.status, 404);
  } finally {
    server.close();
  }
});

test("GET /api/budget?parent=abc returns 400", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/budget?parent=abc`);
    assert.equal(res.status, 400);
  } finally {
    server.close();
  }
});
