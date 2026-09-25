import { Router } from "express";
import { pool } from "../db.js";

// No auth in this prototype: every request acts as family 1.
const FAMILY_ID = 1;

const router = Router();

router.get("/", async (_req, res) => {
  const result = await pool.query(
    `SELECT e.id, e.title, e.kind, e.starts_at, e.ends_at, e.location,
            e.description, e.rsvp_deadline,
            (r.family_id IS NOT NULL) AS rsvped
     FROM events e
     LEFT JOIN rsvps r ON r.event_id = e.id AND r.family_id = $1
     WHERE e.starts_at >= now()
     ORDER BY e.starts_at ASC`,
    [FAMILY_ID],
  );
  res.json(result.rows);
});

router.post("/:id/rsvp", async (req, res) => {
  const eventId = Number(req.params.id);
  const event = await pool.query("SELECT id FROM events WHERE id = $1", [eventId]);
  if (event.rowCount === 0) {
    res.status(404).json({ error: "event not found" });
    return;
  }

  await pool.query(
    `INSERT INTO rsvps (event_id, family_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [eventId, FAMILY_ID],
  );

  const result = await pool.query(
    `SELECT e.id, e.title, e.kind, e.starts_at, e.ends_at, e.location,
            e.description, e.rsvp_deadline,
            (r.family_id IS NOT NULL) AS rsvped
     FROM events e
     LEFT JOIN rsvps r ON r.event_id = e.id AND r.family_id = $2
     WHERE e.id = $1`,
    [eventId, FAMILY_ID],
  );
  res.json(result.rows[0]);
});

router.delete("/:id/rsvp", async (req, res) => {
  const eventId = Number(req.params.id);
  const event = await pool.query("SELECT id FROM events WHERE id = $1", [eventId]);
  if (event.rowCount === 0) {
    res.status(404).json({ error: "event not found" });
    return;
  }

  await pool.query("DELETE FROM rsvps WHERE event_id = $1 AND family_id = $2", [
    eventId,
    FAMILY_ID,
  ]);

  const result = await pool.query(
    `SELECT e.id, e.title, e.kind, e.starts_at, e.ends_at, e.location,
            e.description, e.rsvp_deadline,
            (r.family_id IS NOT NULL) AS rsvped
     FROM events e
     LEFT JOIN rsvps r ON r.event_id = e.id AND r.family_id = $2
     WHERE e.id = $1`,
    [eventId, FAMILY_ID],
  );
  res.json(result.rows[0]);
});

export default router;
