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
  completed_by: number | null;
  completed_by_name: string | null;
}

const SELECT_COLUMNS = `t.id, t.title, t.description, t.link,
  to_char(t.due_date, 'YYYY-MM-DD') AS due_date, t.required, t.completed_at,
  t.completed_by, p.name AS completed_by_name`;
const FROM_CLAUSE = `FROM todos t LEFT JOIN parents p ON p.id = t.completed_by`;

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

router.get("/", async (req, res) => {
  const { star } = req.query;
  let starId: number | null = null;
  if (star !== undefined) {
    starId = Number(star);
    if (typeof star !== "string" || !Number.isInteger(starId) || starId <= 0) {
      return res.status(400).json({ error: "star must be a positive integer" });
    }
  }

  // star absent means every Star (and family-wide todos); star present
  // means that Star's todos plus the family-wide ones (star_id IS NULL).
  const { rows } = await pool.query<TodoRow>(
    `SELECT ${SELECT_COLUMNS}
     ${FROM_CLAUSE}
     WHERE t.family_id = $1 AND ($2::int IS NULL OR t.star_id = $2 OR t.star_id IS NULL)
     ORDER BY t.completed_at NULLS FIRST, t.due_date ASC`,
    [FAMILY_ID, starId],
  );
  res.json(rows.map(withStatus));
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { completed, parent_id } = req.body as {
    completed?: unknown;
    parent_id?: unknown;
  };
  if (!Number.isInteger(id) || typeof completed !== "boolean") {
    return res.status(400).json({ error: "completed must be a boolean" });
  }

  let parentId: number | null = null;
  if (parent_id !== undefined) {
    if (!Number.isInteger(parent_id)) {
      return res.status(400).json({ error: "parent_id must be an integer" });
    }
    const parentCheck = await pool.query(
      "SELECT id FROM parents WHERE id = $1 AND family_id = $2",
      [parent_id, FAMILY_ID],
    );
    if (parentCheck.rows.length === 0) {
      return res.status(404).json({ error: "parent not found" });
    }
    parentId = parent_id as number;
  }

  const { rows: updated } = await pool.query(
    `UPDATE todos
     SET completed_at = CASE WHEN $1 THEN now() ELSE NULL END,
         completed_by = CASE WHEN $1 THEN $4::int ELSE NULL END
     WHERE id = $2 AND family_id = $3
     RETURNING id`,
    [completed, id, FAMILY_ID, parentId],
  );
  if (updated.length === 0) {
    return res.status(404).json({ error: "not found" });
  }

  const { rows } = await pool.query<TodoRow>(
    `SELECT ${SELECT_COLUMNS} ${FROM_CLAUSE} WHERE t.id = $1`,
    [id],
  );
  res.json(withStatus(rows[0]));
});

export default router;
