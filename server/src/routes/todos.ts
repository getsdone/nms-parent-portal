import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

const FAMILY_ID = 1;
const DUE_SOON_DAYS = 7;

type TodoStatus = "done" | "overdue" | "due_soon" | "upcoming";

interface TodoRow {
  id: number;
  title: string;
  description: string | null;
  link: string | null;
  due_date: string | null;
  required: boolean;
  completed_at: Date | null;
}

const SELECT_COLUMNS = `id, title, description, link,
  to_char(due_date, 'YYYY-MM-DD') AS due_date, required, completed_at`;

// due_date and "today" are compared as UTC calendar dates so a DATE column
// (which pg parses at UTC midnight) lines up with the server's clock
// regardless of the server's own timezone offset.
function statusFor(row: TodoRow, today: Date): TodoStatus {
  if (row.completed_at) return "done";
  if (!row.due_date) return "upcoming";
  const due = new Date(`${row.due_date}T00:00:00Z`);
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const daysUntilDue = Math.floor((due.getTime() - todayUtc) / 86_400_000);
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= DUE_SOON_DAYS) return "due_soon";
  return "upcoming";
}

function withStatus(row: TodoRow) {
  return { ...row, status: statusFor(row, new Date()) };
}

router.get("/", async (_req, res) => {
  const { rows } = await pool.query<TodoRow>(
    `SELECT ${SELECT_COLUMNS}
     FROM todos
     WHERE family_id = $1
     ORDER BY completed_at NULLS FIRST, due_date ASC`,
    [FAMILY_ID],
  );
  res.json(rows.map(withStatus));
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { completed } = req.body as { completed?: unknown };
  if (!Number.isInteger(id) || typeof completed !== "boolean") {
    return res.status(400).json({ error: "completed must be a boolean" });
  }

  const { rows } = await pool.query<TodoRow>(
    `UPDATE todos
     SET completed_at = CASE WHEN $1 THEN now() ELSE NULL END
     WHERE id = $2 AND family_id = $3
     RETURNING ${SELECT_COLUMNS}`,
    [completed, id, FAMILY_ID],
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: "not found" });
  }
  res.json(withStatus(rows[0]));
});

export default router;
