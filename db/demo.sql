-- Demo overlay for sales demos. Runs after seed.sql inside the same
-- transaction (npm run db:demo). Only INSERTs rows for family 1; never edits
-- seed rows, so seed ids stay stable. Server tests assert seed.sql's counts,
-- so db:apply must not run this file.
-- Every date is relative to CURRENT_DATE / now(), like seed.sql.

-- A third Star: a high schooler with a strong record at a different school.
INSERT INTO stars (family_id, first_name, grade, school_name, school_district, math_teacher, counselor_email) VALUES
  (1, 'Mateo', 10, 'Westlake High School', 'Eanes ISD', 'Dr. Okafor', 'counselor.westlake@eanesisd.net');

-- Mateo's todos: one overdue required, one due soon, one later, one done
-- (completed by guardian Marcus Rivera).
INSERT INTO todos (family_id, star_id, title, description, link, due_date, required, completed_at, completed_by)
SELECT 1, s.id, t.title, t.description, t.link, t.due_date, t.required, t.completed_at, p.id
FROM stars s
CROSS JOIN (VALUES
  ('Submit AIME qualifier score report', 'Upload the official AMC 12 score report so Mateo''s AIME placement is on file.', 'https://nationalmathstars.org/forms/aime-score-report', CURRENT_DATE - 8, TRUE, NULL::timestamptz, NULL::text),
  ('Confirm summer proof-writing camp seat', 'Return the signed seat confirmation and first deposit.', 'https://nationalmathstars.org/forms/camp-seat', CURRENT_DATE + 3, TRUE, NULL, NULL),
  ('Request counselor letter for camp application', 'Ask Westlake counselor for a recommendation letter for the USAMO-track camp.', NULL, CURRENT_DATE + 34, FALSE, NULL, NULL),
  ('Upload spring transcript', 'Official transcript showing 10th grade math placement.', 'https://nationalmathstars.org/forms/grade-proof', CURRENT_DATE - 30, TRUE, date_trunc('day', now()) - interval '33 days' + interval '14 hours 41 minutes', 'Marcus Rivera')
) AS t(title, description, link, due_date, required, completed_at, completer)
LEFT JOIN parents p ON p.name = t.completer AND p.family_id = 1
WHERE s.first_name = 'Mateo' AND s.family_id = 1;

-- Mateo's program_history: all three kinds with notable results.
INSERT INTO program_history (star_id, kind, title, provider, start_date, end_date, result, notes)
SELECT s.id, h.kind, h.title, h.provider, h.start_date, h.end_date, h.result, h.notes
FROM stars s
CROSS JOIN (VALUES
  ('course', 'Intermediate Counting & Probability', 'Art of Problem Solving', CURRENT_DATE - 520, CURRENT_DATE - 330, 'A', 'Top of section; completed all challenge problems.'),
  ('competition', 'AMC 10A 2025', 'MAA', CURRENT_DATE - 380, CURRENT_DATE - 380, 'Score 126/150', 'Above the AIME qualifying cutoff.'),
  ('camp', 'Mathcamp Qualifying Quiz Prep Workshop', 'National Math Stars', CURRENT_DATE - 340, CURRENT_DATE - 336, 'Completed', 'Proof-writing practice with staff mentors.'),
  ('competition', 'AIME I 2026', 'MAA', CURRENT_DATE - 250, CURRENT_DATE - 250, 'Score 8/15', 'AIME qualifier on first attempt.'),
  ('course', 'Number Theory and Olympiad Geometry', 'Art of Problem Solving', CURRENT_DATE - 230, CURRENT_DATE - 60, 'A', 'Olympiad-style problem sets; two solutions shared with the class.'),
  ('camp', 'USAMO-Track Summer Problem Solving Camp', 'AoPS Academy Austin', CURRENT_DATE - 130, CURRENT_DATE - 116, 'Completed, advanced group', 'Three-week residential camp focused on olympiad proofs.'),
  ('competition', 'Texas State Math Olympiad 2026', 'Texas Math Association', CURRENT_DATE - 90, CURRENT_DATE - 90, '3rd place individual', 'Qualified for the national team selection round.'),
  ('course', 'Multivariable Calculus (dual credit)', 'Austin Community College', CURRENT_DATE - 45, CURRENT_DATE + 120, NULL, 'In progress; midterm grade not yet posted.')
) AS h(kind, title, provider, start_date, end_date, result, notes)
WHERE s.first_name = 'Mateo' AND s.family_id = 1;

-- Budget: seed spends 300000 of 500000 (60%). These rows add 125000 more,
-- landing at 425000 (85%).
INSERT INTO budget_transactions (family_id, occurred_on, vendor, category, amount_cents, description) VALUES
  (1, CURRENT_DATE - 128, 'AoPS Academy Austin', 'camp', 48000, 'USAMO-track summer camp tuition (Mateo)'),
  (1, CURRENT_DATE - 262, 'MAA', 'competition', 12500, 'AMC 12 and AIME registration (Mateo)'),
  (1, CURRENT_DATE - 215, 'Art of Problem Solving', 'course', 38500, 'Number Theory and Olympiad Geometry course fee (Mateo)'),
  (1, CURRENT_DATE - 70, 'Staples', 'supplies', 8000, 'Graph paper, binders, and proof notebooks'),
  (1, CURRENT_DATE - 12, 'National Math Stars', 'camp', 18000, 'Winter proof-writing camp deposit (Mateo)');

-- Events: one the family RSVP'd to inside the 14-day window, and one with an
-- RSVP deadline inside 7 days that the family has not answered.
INSERT INTO events (id, title, kind, starts_at, ends_at, location, description, rsvp_deadline) VALUES
  (9, 'AMC 10/12 Problem Review Workshop', 'in_person', date_trunc('day', now()) + interval '9 days 16 hours', date_trunc('day', now()) + interval '9 days 18 hours', 'Westlake High School, Library Annex', 'Staff walk through last year''s hardest AMC problems and common pitfalls.', date_trunc('day', now()) + interval '7 days 23 hours 59 minutes'),
  (10, 'Winter Camp Scholarship Q&A', 'virtual', date_trunc('day', now()) + interval '16 days 19 hours', date_trunc('day', now()) + interval '16 days 20 hours', NULL, 'Ask staff about financial aid and reimbursement for winter camps.', date_trunc('day', now()) + interval '2 days 23 hours 59 minutes');
SELECT setval('events_id_seq', (SELECT MAX(id) FROM events));

INSERT INTO rsvps (event_id, family_id) VALUES
  (9, 1);

-- Documents for Mateo: one in review, one needing attention, one accepted.
INSERT INTO documents (family_id, star_id, todo_id, title, kind, status, submitted_at, note)
SELECT 1, s.id, d.todo_id, d.title, d.kind, d.status, d.submitted_at, d.note
FROM stars s
CROSS JOIN (VALUES
  ('AMC 12 Score Report', 'upload', 'needs_attention', now() - interval '6 days', 'Report is cropped and the student ID is cut off; please upload the full page.', NULL::int),
  ('USAMO-Track Camp Seat Agreement', 'agreement', 'under_review', now() - interval '3 days', 'Staff are confirming the deposit before releasing the seat.', NULL),
  ('Spring Transcript', 'upload', 'accepted', now() - interval '33 days', NULL, (SELECT id FROM todos WHERE title = 'Upload spring transcript' AND star_id = (SELECT id FROM stars WHERE first_name = 'Mateo')))
) AS d(title, kind, status, submitted_at, note, todo_id)
WHERE s.first_name = 'Mateo' AND s.family_id = 1;
