import { Router } from "express";
import { pool } from "../db.js";

// No auth in this prototype: every request acts as family 1.
const FAMILY_ID = 1;
const DUE_SOON_DAYS = 7;
const RSVP_DEADLINE_DAYS = 7;
const RSVP_WINDOW_DAYS = 14;

const router = Router();

interface TodoNudge {
  id: number;
  title: string;
  due_date: string | null;
  link: string | null;
}

interface RsvpUpcoming {
  id: number;
  title: string;
  starts_at: Date;
  kind: string;
  location: string | null;
}

interface RsvpDeadline {
  id: number;
  title: string;
  rsvp_deadline: Date;
  starts_at: Date;
}

router.get("/", async (_req, res) => {
  const TODO_COLUMNS = `id, title, to_char(due_date, 'YYYY-MM-DD') AS due_date, link`;

  const [
    overdueTodos,
    dueSoonTodos,
    upcomingRsvps,
    rsvpDeadlines,
    budgetRow,
  ] = await Promise.all([
    pool.query<TodoNudge>(
      `SELECT ${TODO_COLUMNS}
       FROM todos
       WHERE family_id = $1 AND required AND completed_at IS NULL
         AND due_date < CURRENT_DATE
       ORDER BY due_date ASC`,
      [FAMILY_ID],
    ),
    pool.query<TodoNudge>(
      `SELECT ${TODO_COLUMNS}
       FROM todos
       WHERE family_id = $1 AND completed_at IS NULL
         AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $2::int
       ORDER BY due_date ASC`,
      [FAMILY_ID, DUE_SOON_DAYS],
    ),
    pool.query<RsvpUpcoming>(
      `SELECT e.id, e.title, e.starts_at, e.kind, e.location
       FROM events e
       JOIN rsvps r ON r.event_id = e.id AND r.family_id = $1
       WHERE e.starts_at BETWEEN now() AND now() + ($2 || ' days')::interval
       ORDER BY e.starts_at ASC`,
      [FAMILY_ID, RSVP_WINDOW_DAYS],
    ),
    // rsvp_deadline is a timestamptz; cast to date so "within today..+7"
    // matches on calendar day the same way it does for the date-typed
    // todo due_date column above.
    pool.query<RsvpDeadline>(
      `SELECT e.id, e.title, e.rsvp_deadline, e.starts_at
       FROM events e
       WHERE e.rsvp_deadline::date BETWEEN CURRENT_DATE AND CURRENT_DATE + $2::int
         AND NOT EXISTS (
           SELECT 1 FROM rsvps r WHERE r.event_id = e.id AND r.family_id = $1
         )
       ORDER BY e.rsvp_deadline ASC`,
      [FAMILY_ID, RSVP_DEADLINE_DAYS],
    ),
    pool.query<{ fiscal_year: number; allocated_cents: number }>(
      `SELECT fiscal_year, allocated_cents
       FROM budgets
       WHERE family_id = $1
       ORDER BY fiscal_year DESC
       LIMIT 1`,
      [FAMILY_ID],
    ),
  ]);

  let budget = {
    fiscal_year: null as number | null,
    allocated_cents: 0,
    spent_cents: 0,
    remaining_cents: 0,
    percent_used: 0,
  };
  const budgetInfo = budgetRow.rows[0];
  if (budgetInfo) {
    const spentResult = await pool.query<{ spent_cents: string }>(
      `SELECT COALESCE(SUM(amount_cents), 0) AS spent_cents
       FROM budget_transactions
       WHERE family_id = $1`,
      [FAMILY_ID],
    );
    const spentCents = Number(spentResult.rows[0].spent_cents);
    const percentUsed =
      budgetInfo.allocated_cents > 0
        ? Math.min(100, Math.round((spentCents / budgetInfo.allocated_cents) * 100))
        : 0;
    budget = {
      fiscal_year: budgetInfo.fiscal_year,
      allocated_cents: budgetInfo.allocated_cents,
      spent_cents: spentCents,
      remaining_cents: budgetInfo.allocated_cents - spentCents,
      percent_used: percentUsed,
    };
  }

  res.json({
    overdue_todos: overdueTodos.rows,
    due_soon_todos: dueSoonTodos.rows,
    upcoming_rsvps: upcomingRsvps.rows,
    rsvp_deadlines: rsvpDeadlines.rows,
    budget,
  });
});

export default router;
