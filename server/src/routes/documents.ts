import { Router } from "express";
import { pool } from "../db.js";

// Prototype has no auth: every request acts as family 1 (see docs/plan.md).
const FAMILY_ID = 1;

const router = Router();

router.get("/", async (req, res) => {
  const { star } = req.query;
  let starId: number | null = null;
  if (star !== undefined) {
    starId = Number(star);
    if (typeof star !== "string" || !Number.isInteger(starId) || starId <= 0) {
      res.status(400).json({ error: "star must be a positive integer" });
      return;
    }
  }

  // star absent means every Star's documents (and family-wide ones); star
  // present means that Star's documents plus the family-wide ones
  // (star_id IS NULL), same rule as /api/todos.
  const { rows } = await pool.query(
    `SELECT d.id, d.title, d.kind, d.status,
            d.submitted_at, d.note, d.star_id, d.todo_id,
            s.first_name AS star_first_name
     FROM documents d
     LEFT JOIN stars s ON s.id = d.star_id
     WHERE d.family_id = $1 AND ($2::int IS NULL OR d.star_id = $2 OR d.star_id IS NULL)
     ORDER BY d.submitted_at DESC`,
    [FAMILY_ID, starId],
  );
  res.json(rows);
});

export default router;
