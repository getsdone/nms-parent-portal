import { Router } from "express";
import { pool } from "../db.js";

// Prototype has no auth: every request acts as family 1 (see docs/plan.md).
const FAMILY_ID = 1;

const VALID_KINDS = new Set(["course", "competition", "camp"]);

const router = Router();

router.get("/", async (req, res) => {
  const { kind } = req.query;

  if (kind !== undefined && (typeof kind !== "string" || !VALID_KINDS.has(kind))) {
    res.status(400).json({ error: "kind must be one of course, competition, camp" });
    return;
  }

  // NULLS LAST keeps rows with no start_date (in-progress programs) grouped
  // at the end of each star's list instead of sorting to the top.
  const { rows } = await pool.query(
    `SELECT s.id AS star_id, s.first_name, s.grade,
            h.id AS history_id, h.kind, h.title, h.provider,
            h.start_date::text AS start_date, h.end_date::text AS end_date,
            h.result, h.notes
     FROM stars s
     LEFT JOIN program_history h
       ON h.star_id = s.id AND ($1::text IS NULL OR h.kind = $1)
     WHERE s.family_id = $2
     ORDER BY s.id, h.start_date DESC NULLS LAST`,
    [kind ?? null, FAMILY_ID],
  );

  type Star = {
    id: number;
    first_name: string;
    grade: number;
    history: {
      id: number;
      kind: string;
      title: string;
      provider: string | null;
      start_date: string | null;
      end_date: string | null;
      result: string | null;
      notes: string | null;
    }[];
  };

  const stars = new Map<number, Star>();

  for (const row of rows) {
    let star = stars.get(row.star_id);
    if (!star) {
      star = { id: row.star_id, first_name: row.first_name, grade: row.grade, history: [] };
      stars.set(row.star_id, star);
    }
    if (row.history_id !== null) {
      star.history.push({
        id: row.history_id,
        kind: row.kind,
        title: row.title,
        provider: row.provider,
        start_date: row.start_date,
        end_date: row.end_date,
        result: row.result,
        notes: row.notes,
      });
    }
  }

  res.json({ stars: Array.from(stars.values()) });
});

export default router;
