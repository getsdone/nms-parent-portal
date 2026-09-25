import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

const FAMILY_ID = 1;

router.get("/", async (_req, res) => {
  const budgetResult = await pool.query<{
    fiscal_year: number;
    allocated_cents: number;
  }>(
    `SELECT fiscal_year, allocated_cents
     FROM budgets
     WHERE family_id = $1
     ORDER BY fiscal_year DESC
     LIMIT 1`,
    [FAMILY_ID],
  );
  const budget = budgetResult.rows[0];
  if (!budget) {
    res.status(404).json({ error: "no budget found" });
    return;
  }

  // Transactions have no fiscal-year column and the prototype has one
  // budget, so spent is the sum of every transaction for the family.
  // occurred_on is cast to text in SQL because node-pg parses `date` into a
  // JS Date at local midnight; serializing that with toISOString() shifts
  // the calendar day by the server's timezone offset.
  const transactionsResult = await pool.query<{
    id: number;
    occurred_on: string;
    vendor: string;
    category: string | null;
    amount_cents: number;
    description: string | null;
  }>(
    `SELECT id, to_char(occurred_on, 'YYYY-MM-DD') AS occurred_on,
            vendor, category, amount_cents, description
     FROM budget_transactions
     WHERE family_id = $1
     ORDER BY occurred_on DESC`,
    [FAMILY_ID],
  );

  const spentCents = transactionsResult.rows.reduce(
    (sum, row) => sum + row.amount_cents,
    0,
  );

  res.json({
    fiscal_year: budget.fiscal_year,
    allocated_cents: budget.allocated_cents,
    spent_cents: spentCents,
    remaining_cents: budget.allocated_cents - spentCents,
    transactions: transactionsResult.rows.map((row) => ({
      id: row.id,
      occurred_on: row.occurred_on,
      vendor: row.vendor,
      category: row.category,
      amount_cents: row.amount_cents,
      description: row.description,
    })),
  });
});

export default router;
