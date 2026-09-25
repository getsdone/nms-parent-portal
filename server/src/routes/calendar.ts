import { Router } from "express";
import { pool } from "../db.js";

// Prototype has no auth: every request acts as family 1 (see docs/plan.md).
const FAMILY_ID = 1;

const router = Router();

// RFC 5545 line folding: no line may exceed 75 octets. Continuation lines
// start with a single space, and that leading space counts toward the next
// line's own 75-octet budget.
function foldLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let start = 0;
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Never split inside a multi-byte UTF-8 sequence: back off while the
    // byte at `end` is a continuation byte (10xxxxxx).
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end--;
    }
    parts.push(bytes.subarray(start, end).toString("utf8"));
    start = end;
    limit = 74; // continuation lines carry a leading space within the 75-octet cap
  }
  return parts.join("\r\n ");
}

// RFC 5545 TEXT escaping: backslash first, then the characters it would
// otherwise be mistaken for.
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

function formatDateTimeUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// `dateStr` is already YYYY-MM-DD text from the DB (see the ::text casts
// below), so this is pure string manipulation with no timezone to lose.
function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

function addOneDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

interface RsvpEventRow {
  id: number;
  title: string;
  location: string | null;
  description: string | null;
  starts_at: Date;
  ends_at: Date | null;
}

interface TodoRow {
  id: number;
  title: string;
  due_date: string;
}

interface HistoryRow {
  id: number;
  kind: string;
  title: string;
  start_date: string;
  end_date: string | null;
}

router.get("/", async (_req, res) => {
  const [events, todos, history] = await Promise.all([
    pool.query<RsvpEventRow>(
      `SELECT e.id, e.title, e.location, e.description, e.starts_at, e.ends_at
       FROM events e
       JOIN rsvps r ON r.event_id = e.id AND r.family_id = $1
       ORDER BY e.starts_at ASC`,
      [FAMILY_ID],
    ),
    pool.query<TodoRow>(
      `SELECT id, title, due_date::text AS due_date
       FROM todos
       WHERE family_id = $1 AND completed_at IS NULL AND due_date IS NOT NULL
       ORDER BY due_date ASC`,
      [FAMILY_ID],
    ),
    pool.query<HistoryRow>(
      `SELECT h.id, h.kind, h.title,
              h.start_date::text AS start_date, h.end_date::text AS end_date
       FROM program_history h
       JOIN stars s ON s.id = h.star_id
       WHERE s.family_id = $1 AND h.start_date IS NOT NULL
       ORDER BY h.start_date ASC`,
      [FAMILY_ID],
    ),
  ]);

  const dtstamp = formatDateTimeUtc(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//National Math Stars//Parent portal//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:National Math Stars",
  ];

  for (const e of events.rows) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:event-${e.id}@nms-parent-portal`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${formatDateTimeUtc(e.starts_at)}`);
    if (e.ends_at) {
      lines.push(`DTEND:${formatDateTimeUtc(e.ends_at)}`);
    }
    lines.push(`SUMMARY:${escapeText(e.title)}`);
    if (e.location) {
      lines.push(`LOCATION:${escapeText(e.location)}`);
    }
    if (e.description) {
      lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    }
    lines.push("END:VEVENT");
  }

  for (const t of todos.rows) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:todo-${t.id}@nms-parent-portal`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${formatDate(t.due_date)}`);
    lines.push(`SUMMARY:${escapeText(`Due: ${t.title}`)}`);
    lines.push("END:VEVENT");
  }

  for (const h of history.rows) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${h.kind}-${h.id}@nms-parent-portal`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${formatDate(h.start_date)}`);
    if (h.end_date) {
      lines.push(`DTEND;VALUE=DATE:${formatDate(addOneDay(h.end_date))}`);
    }
    lines.push(`SUMMARY:${escapeText(`${h.kind}: ${h.title}`)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  const body = lines.map(foldLine).join("\r\n") + "\r\n";

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'inline; filename="national-math-stars.ics"',
  );
  res.send(body);
});

export default router;
