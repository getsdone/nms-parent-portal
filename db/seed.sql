-- Dummy data for the prototype. Every date and timestamp is an expression
-- relative to the run date (CURRENT_DATE / now()), so the counts the tests
-- assert stay true no matter when this file is applied.

INSERT INTO families (id, name, address_line1, city, state, zip) VALUES
  (1, 'The Rivera Family', '4210 Speedway Ave', 'Austin', 'TX', '78751');
SELECT setval('families_id_seq', (SELECT MAX(id) FROM families));

INSERT INTO parents (family_id, name, email, phone, is_primary, preferred_language) VALUES
  (1, 'Elena Rivera', 'elena.rivera@example.com', '512-555-0134', TRUE, 'English'),
  (1, 'Marcus Rivera', 'marcus.rivera@example.com', '512-555-0198', FALSE, 'Spanish');

INSERT INTO stars (family_id, first_name, grade, school_name, school_district, math_teacher, counselor_email) VALUES
  (1, 'Sofia', 7, 'Lamar Middle School', 'Austin ISD', 'Mr. Alvarez', 'counselor.lamar@austinisd.org'),
  (1, 'Leo', 4, 'Lamar Middle School', 'Austin ISD', 'Ms. Chen', 'counselor.lamar@austinisd.org');

-- todos: 3 overdue required, 2 due within 7 days of the run date, 1 later,
-- 2 completed. All belong to Sofia (star_id 1) except the two family-wide
-- ones (survey, W-9), which stay star_id NULL so ?star=<any> still surfaces
-- them.
INSERT INTO todos (family_id, star_id, title, description, link, due_date, required, completed_at) VALUES
  (1, 1, 'Submit enrollment confirmation', 'Confirm Sofia''s spot for the fall term.', 'https://nationalmathstars.org/forms/enrollment', CURRENT_DATE - 15, TRUE, NULL),
  (1, 1, 'Upload proof of grade level', 'A report card or enrollment letter showing 7th grade.', 'https://nationalmathstars.org/forms/grade-proof', CURRENT_DATE - 10, TRUE, NULL),
  (1, NULL, 'Complete family survey', 'Annual survey on goals and availability.', NULL, CURRENT_DATE - 5, TRUE, NULL),
  (1, 1, 'Register for fall competition', 'MATHCOUNTS chapter round registration.', 'https://nationalmathstars.org/forms/mathcounts-fall', CURRENT_DATE + 2, FALSE, NULL),
  (1, NULL, 'Submit W-9 for reimbursement', 'Needed before any camp reimbursement can be paid out.', NULL, CURRENT_DATE + 6, TRUE, NULL),
  (1, 1, 'Book winter camp travel', 'Reserve flights before prices rise.', NULL, CURRENT_DATE + 51, FALSE, NULL),
  (1, 1, 'RSVP to welcome call', 'Fall welcome call for new and returning families.', 'https://nationalmathstars.org/events/welcome-call', CURRENT_DATE - 55, TRUE, date_trunc('day', now()) - interval '55 days' + interval '15 hours 4 minutes'),
  (1, 1, 'Update emergency contact', 'Confirm current emergency contact info on file.', NULL, CURRENT_DATE - 20, FALSE, date_trunc('day', now()) - interval '21 days' + interval '10 hours 22 minutes');

-- Leo's todos (star_id 2): 2 overdue required, 1 due soon, 1 done. These
-- only show up when the unfiltered /api/todos call is used or ?star=2.
INSERT INTO todos (family_id, star_id, title, description, link, due_date, required, completed_at) VALUES
  (1, 2, 'Submit enrollment confirmation', 'Confirm Leo''s spot for the fall term.', 'https://nationalmathstars.org/forms/enrollment', CURRENT_DATE - 12, TRUE, NULL),
  (1, 2, 'Upload proof of grade level', 'A report card or enrollment letter showing 4th grade.', 'https://nationalmathstars.org/forms/grade-proof', CURRENT_DATE - 3, TRUE, NULL),
  (1, 2, 'Register for fall math circle', 'Sign up for the after-school math circle.', NULL, CURRENT_DATE + 4, FALSE, NULL),
  (1, 2, 'Update emergency contact', 'Confirm current emergency contact info on file.', NULL, CURRENT_DATE - 18, FALSE, date_trunc('day', now()) - interval '19 days' + interval '9 hours 10 minutes');

-- program_history: 10 rows across course/competition/camp with results.
INSERT INTO program_history (star_id, kind, title, provider, start_date, end_date, result, notes) VALUES
  (1, 'course', 'Pre-Algebra Foundations', 'Art of Problem Solving', CURRENT_DATE - 754, CURRENT_DATE - 483, 'A', 'Strong performance in number theory unit.'),
  (1, 'competition', 'MATHCOUNTS Chapter 2025', 'MATHCOUNTS', CURRENT_DATE - 594, CURRENT_DATE - 594, '5th place individual', 'First chapter-level competition.'),
  (1, 'camp', 'Summer Math Intensive 2025', 'AoPS Academy Austin', CURRENT_DATE - 466, CURRENT_DATE - 441, 'Completed, top group', 'Focused on combinatorics.'),
  (1, 'course', 'Algebra I Accelerated', 'Art of Problem Solving', CURRENT_DATE - 389, CURRENT_DATE - 119, 'A-', 'In progress as of last check-in.'),
  (1, 'competition', 'AMC 8 2025', 'MAA', CURRENT_DATE - 318, CURRENT_DATE - 318, 'Score 18/25', 'Qualified for honor roll cutoff.'),
  (1, 'competition', 'MATHCOUNTS Chapter 2026', 'MATHCOUNTS', CURRENT_DATE - 230, CURRENT_DATE - 230, '2nd place team', 'Advanced to state round.'),
  (1, 'camp', 'Spring Break Problem Solving Camp', 'National Math Stars', CURRENT_DATE - 193, CURRENT_DATE - 189, 'Completed', 'Daily problem sets, group review.'),
  (1, 'course', 'Geometry Enrichment', 'Art of Problem Solving', CURRENT_DATE - 116, CURRENT_DATE - 42, 'B+', 'Elective summer course.'),
  (1, 'competition', 'MATHCOUNTS State Round 2026', 'MATHCOUNTS', CURRENT_DATE - 160, CURRENT_DATE - 160, '12th place team', 'First state-level appearance.'),
  (1, 'course', 'Algebra II', 'Art of Problem Solving', CURRENT_DATE - 24, CURRENT_DATE + 245, NULL, 'Just started; no results yet.');

-- Leo's program_history (star_id 2): 3 rows, one each of course,
-- competition, camp. Sofia has 4 competition rows, so ?star=1 keeps
-- kind=competition at 4 while the unfiltered call rises to 5.
INSERT INTO program_history (star_id, kind, title, provider, start_date, end_date, result, notes) VALUES
  (2, 'course', 'Early Number Sense', 'Art of Problem Solving', CURRENT_DATE - 300, CURRENT_DATE - 210, 'A', 'First formal enrichment course.'),
  (2, 'competition', 'MATHCOUNTS Mini 2025', 'MATHCOUNTS', CURRENT_DATE - 190, CURRENT_DATE - 190, 'Participant', 'First competition exposure.'),
  (2, 'camp', 'Summer Math Explorers 2025', 'AoPS Academy Austin', CURRENT_DATE - 150, CURRENT_DATE - 140, 'Completed', 'Introductory problem-solving camp.');

-- budgets: one row, fiscal year 2026, $5,000 allocated.
INSERT INTO budgets (family_id, fiscal_year, allocated_cents) VALUES
  (1, 2026, 500000);

-- budget_transactions: 12 rows summing to 300000 cents (60% of allocated).
INSERT INTO budget_transactions (family_id, occurred_on, vendor, category, amount_cents, description) VALUES
  (1, CURRENT_DATE - 416, 'Art of Problem Solving', 'course', 25000, 'Fall course materials fee'),
  (1, CURRENT_DATE - 378, 'MATHCOUNTS', 'competition', 30000, 'Chapter round registration'),
  (1, CURRENT_DATE - 340, 'Staples', 'supplies', 15000, 'Notebooks and calculators'),
  (1, CURRENT_DATE - 314, 'MAA', 'competition', 20000, 'AMC 8 registration and prep materials'),
  (1, CURRENT_DATE - 258, 'AoPS Academy Austin', 'camp', 35000, 'Spring camp deposit'),
  (1, CURRENT_DATE - 236, 'MATHCOUNTS', 'competition', 18000, 'Chapter round travel'),
  (1, CURRENT_DATE - 204, 'National Math Stars', 'camp', 22000, 'Spring break camp balance'),
  (1, CURRENT_DATE - 168, 'MATHCOUNTS', 'competition', 27000, 'State round travel and lodging'),
  (1, CURRENT_DATE - 130, 'Art of Problem Solving', 'course', 19000, 'Geometry course materials'),
  (1, CURRENT_DATE - 95, 'AoPS Academy Austin', 'camp', 33000, 'Summer camp deposit'),
  (1, CURRENT_DATE - 57, 'Office Depot', 'supplies', 21000, 'Graphing calculator replacement'),
  (1, CURRENT_DATE - 31, 'Art of Problem Solving', 'course', 35000, 'Algebra II course fee');

-- events: 8 rows, mix of virtual/in_person, from 5 to 81 days out from the
-- run date. Two rsvp_deadlines fall within 7 days of the run date.
INSERT INTO events (id, title, kind, starts_at, ends_at, location, description, rsvp_deadline) VALUES
  (1, 'Fall Welcome Call', 'virtual', date_trunc('day', now()) + interval '5 days 18 hours', date_trunc('day', now()) + interval '5 days 19 hours', NULL, 'Kickoff call for the fall term.', date_trunc('day', now()) + interval '3 days 23 hours 59 minutes'),
  (2, 'Regional MATHCOUNTS Info Session', 'in_person', date_trunc('day', now()) + interval '10 days 17 hours 30 minutes', date_trunc('day', now()) + interval '10 days 19 hours', 'Austin Public Library, Central Branch', 'Info session on chapter round logistics.', date_trunc('day', now()) + interval '4 days 23 hours 59 minutes'),
  (3, 'Parent Office Hours', 'virtual', date_trunc('day', now()) + interval '20 days 12 hours', date_trunc('day', now()) + interval '20 days 13 hours', NULL, 'Drop-in Q&A with program staff.', date_trunc('day', now()) + interval '15 days 23 hours 59 minutes'),
  (4, 'Fall Math Circle Kickoff', 'in_person', date_trunc('day', now()) + interval '25 days 16 hours', date_trunc('day', now()) + interval '25 days 17 hours 30 minutes', 'Lamar Middle School, Room 204', 'First meeting of the fall math circle.', date_trunc('day', now()) + interval '18 days 23 hours 59 minutes'),
  (5, 'November Competition Prep', 'virtual', date_trunc('day', now()) + interval '41 days 18 hours', date_trunc('day', now()) + interval '41 days 19 hours 30 minutes', NULL, 'Prep session ahead of AMC 8.', date_trunc('day', now()) + interval '35 days 23 hours 59 minutes'),
  (6, 'Thanksgiving Break Social', 'in_person', date_trunc('day', now()) + interval '61 days 15 hours', date_trunc('day', now()) + interval '61 days 17 hours', 'Zilker Park Pavilion', 'Informal family social.', NULL),
  (7, 'December Awards Ceremony', 'in_person', date_trunc('day', now()) + interval '76 days 18 hours', date_trunc('day', now()) + interval '76 days 20 hours', 'Austin ISD Performing Arts Center', 'Recognizing fall competition results.', date_trunc('day', now()) + interval '67 days 23 hours 59 minutes'),
  (8, 'Winter Break Math Camp Info', 'virtual', date_trunc('day', now()) + interval '81 days 12 hours', date_trunc('day', now()) + interval '81 days 13 hours', NULL, 'Info session on winter camp options.', date_trunc('day', now()) + interval '74 days 23 hours 59 minutes');
SELECT setval('events_id_seq', (SELECT MAX(id) FROM events));

-- rsvps: family 1 RSVP'd to two events.
INSERT INTO rsvps (event_id, family_id) VALUES
  (1, 1),
  (3, 1);

-- documents: 6 rows across both stars (plus one family-wide, star_id NULL)
-- and all 4 statuses. Two rows link to todos that are seeded completed
-- above (ids 7 and 8, "RSVP to welcome call" and "Update emergency
-- contact", both Sofia's/star_id 1) via todo_id.
INSERT INTO documents (family_id, star_id, todo_id, title, kind, status, submitted_at, note) VALUES
  (1, 1, 7, 'Welcome Call RSVP Confirmation', 'form', 'accepted', now() - interval '58 days', NULL),
  (1, 1, 8, 'Emergency Contact Update Form', 'form', 'accepted', now() - interval '19 days', NULL),
  (1, 1, NULL, 'MATHCOUNTS Registration Upload', 'upload', 'under_review', now() - interval '10 days', 'Waiting on chapter coordinator confirmation.'),
  (1, 2, NULL, 'Grade Level Proof', 'upload', 'needs_attention', now() - interval '5 days', 'Photo was blurry; please re-upload a clear copy.'),
  (1, 2, NULL, 'Math Circle Participation Agreement', 'agreement', 'received', now() - interval '2 days', NULL),
  (1, NULL, NULL, 'Program Photo Release', 'agreement', 'received', now() - interval '40 days', NULL);
