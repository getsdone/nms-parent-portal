-- Dummy data for the prototype. "Today" for relative dates is 2026-09-25.

INSERT INTO families (id, name, address_line1, city, state, zip) VALUES
  (1, 'The Rivera Family', '4210 Speedway Ave', 'Austin', 'TX', '78751');
SELECT setval('families_id_seq', (SELECT MAX(id) FROM families));

INSERT INTO parents (family_id, name, email, phone, is_primary) VALUES
  (1, 'Elena Rivera', 'elena.rivera@example.com', '512-555-0134', TRUE),
  (1, 'Marcus Rivera', 'marcus.rivera@example.com', '512-555-0198', FALSE);

INSERT INTO stars (family_id, first_name, grade, school_name, school_district) VALUES
  (1, 'Sofia', 7, 'Lamar Middle School', 'Austin ISD');

-- todos: 3 overdue required, 2 due within 7 days of 2026-09-25, 1 later,
-- 2 completed.
INSERT INTO todos (family_id, title, description, link, due_date, required, completed_at) VALUES
  (1, 'Submit enrollment confirmation', 'Confirm Sofia''s spot for the fall term.', 'https://nationalmathstars.org/forms/enrollment', '2026-09-10', TRUE, NULL),
  (1, 'Upload proof of grade level', 'A report card or enrollment letter showing 7th grade.', 'https://nationalmathstars.org/forms/grade-proof', '2026-09-15', TRUE, NULL),
  (1, 'Complete family survey', 'Annual survey on goals and availability.', NULL, '2026-09-20', TRUE, NULL),
  (1, 'Register for fall competition', 'MATHCOUNTS chapter round registration.', 'https://nationalmathstars.org/forms/mathcounts-fall', '2026-09-27', FALSE, NULL),
  (1, 'Submit W-9 for reimbursement', 'Needed before any camp reimbursement can be paid out.', NULL, '2026-10-01', TRUE, NULL),
  (1, 'Book winter camp travel', 'Reserve flights before prices rise.', NULL, '2026-11-15', FALSE, NULL),
  (1, 'RSVP to welcome call', 'Fall welcome call for new and returning families.', 'https://nationalmathstars.org/events/welcome-call', '2026-08-01', TRUE, '2026-08-01 15:04:00-05'),
  (1, 'Update emergency contact', 'Confirm current emergency contact info on file.', NULL, '2026-09-05', FALSE, '2026-09-04 10:22:00-05');

-- program_history: 10 rows across course/competition/camp with results.
INSERT INTO program_history (star_id, kind, title, provider, start_date, end_date, result, notes) VALUES
  (1, 'course', 'Pre-Algebra Foundations', 'Art of Problem Solving', '2024-09-01', '2025-05-30', 'A', 'Strong performance in number theory unit.'),
  (1, 'competition', 'MATHCOUNTS Chapter 2025', 'MATHCOUNTS', '2025-02-08', '2025-02-08', '5th place individual', 'First chapter-level competition.'),
  (1, 'camp', 'Summer Math Intensive 2025', 'AoPS Academy Austin', '2025-06-16', '2025-07-11', 'Completed, top group', 'Focused on combinatorics.'),
  (1, 'course', 'Algebra I Accelerated', 'Art of Problem Solving', '2025-09-01', '2026-05-29', 'A-', 'In progress as of last check-in.'),
  (1, 'competition', 'AMC 8 2025', 'MAA', '2025-11-11', '2025-11-11', 'Score 18/25', 'Qualified for honor roll cutoff.'),
  (1, 'competition', 'MATHCOUNTS Chapter 2026', 'MATHCOUNTS', '2026-02-07', '2026-02-07', '2nd place team', 'Advanced to state round.'),
  (1, 'camp', 'Spring Break Problem Solving Camp', 'National Math Stars', '2026-03-16', '2026-03-20', 'Completed', 'Daily problem sets, group review.'),
  (1, 'course', 'Geometry Enrichment', 'Art of Problem Solving', '2026-06-01', '2026-08-14', 'B+', 'Elective summer course.'),
  (1, 'competition', 'MATHCOUNTS State Round 2026', 'MATHCOUNTS', '2026-04-18', '2026-04-18', '12th place team', 'First state-level appearance.'),
  (1, 'course', 'Algebra II', 'Art of Problem Solving', '2026-09-01', '2027-05-28', NULL, 'Just started; no results yet.');

-- budgets: one row, fiscal year 2026, $5,000 allocated.
INSERT INTO budgets (family_id, fiscal_year, allocated_cents) VALUES
  (1, 2026, 500000);

-- budget_transactions: 12 rows summing to 300000 cents (60% of allocated).
INSERT INTO budget_transactions (family_id, occurred_on, vendor, category, amount_cents, description) VALUES
  (1, '2025-08-05', 'Art of Problem Solving', 'course', 25000, 'Fall course materials fee'),
  (1, '2025-09-12', 'MATHCOUNTS', 'competition', 30000, 'Chapter round registration'),
  (1, '2025-10-20', 'Staples', 'supplies', 15000, 'Notebooks and calculators'),
  (1, '2025-11-15', 'MAA', 'competition', 20000, 'AMC 8 registration and prep materials'),
  (1, '2026-01-10', 'AoPS Academy Austin', 'camp', 35000, 'Spring camp deposit'),
  (1, '2026-02-01', 'MATHCOUNTS', 'competition', 18000, 'Chapter round travel'),
  (1, '2026-03-05', 'National Math Stars', 'camp', 22000, 'Spring break camp balance'),
  (1, '2026-04-10', 'MATHCOUNTS', 'competition', 27000, 'State round travel and lodging'),
  (1, '2026-05-18', 'Art of Problem Solving', 'course', 19000, 'Geometry course materials'),
  (1, '2026-06-22', 'AoPS Academy Austin', 'camp', 33000, 'Summer camp deposit'),
  (1, '2026-07-30', 'Office Depot', 'supplies', 21000, 'Graphing calculator replacement'),
  (1, '2026-08-25', 'Art of Problem Solving', 'course', 35000, 'Algebra II course fee');

-- events: 8 rows, mix of virtual/in_person, 2026-09-26 through December.
-- Two rsvp_deadlines fall within 7 days of 2026-09-25.
INSERT INTO events (id, title, kind, starts_at, ends_at, location, description, rsvp_deadline) VALUES
  (1, 'Fall Welcome Call', 'virtual', '2026-09-30 18:00-05', '2026-09-30 19:00-05', NULL, 'Kickoff call for the fall term.', '2026-09-28 23:59-05'),
  (2, 'Regional MATHCOUNTS Info Session', 'in_person', '2026-10-05 17:30-05', '2026-10-05 19:00-05', 'Austin Public Library, Central Branch', 'Info session on chapter round logistics.', '2026-09-29 23:59-05'),
  (3, 'Parent Office Hours', 'virtual', '2026-10-15 12:00-05', '2026-10-15 13:00-05', NULL, 'Drop-in Q&A with program staff.', '2026-10-10 23:59-05'),
  (4, 'Fall Math Circle Kickoff', 'in_person', '2026-10-20 16:00-05', '2026-10-20 17:30-05', 'Lamar Middle School, Room 204', 'First meeting of the fall math circle.', '2026-10-13 23:59-05'),
  (5, 'November Competition Prep', 'virtual', '2026-11-05 18:00-06', '2026-11-05 19:30-06', NULL, 'Prep session ahead of AMC 8.', '2026-10-30 23:59-06'),
  (6, 'Thanksgiving Break Social', 'in_person', '2026-11-25 15:00-06', '2026-11-25 17:00-06', 'Zilker Park Pavilion', 'Informal family social.', NULL),
  (7, 'December Awards Ceremony', 'in_person', '2026-12-10 18:00-06', '2026-12-10 20:00-06', 'Austin ISD Performing Arts Center', 'Recognizing fall competition results.', '2026-12-01 23:59-06'),
  (8, 'Winter Break Math Camp Info', 'virtual', '2026-12-15 12:00-06', '2026-12-15 13:00-06', NULL, 'Info session on winter camp options.', '2026-12-08 23:59-06');
SELECT setval('events_id_seq', (SELECT MAX(id) FROM events));

-- rsvps: family 1 RSVP'd to two events.
INSERT INTO rsvps (event_id, family_id) VALUES
  (1, 1),
  (3, 1);
