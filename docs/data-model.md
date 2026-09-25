# Data model

Postgres on Neon. Source of truth is `db/schema.sql`. This page explains
the tables; the file defines them. Money is integer cents. Dates are `date`
columns cast to text in SQL. Timestamps are `timestamptz`.

## Tables

| Table | One row is | Key columns | Source system |
| --- | --- | --- | --- |
| families | one household | name, address_line1, city, state, zip | Zoho CRM |
| parents | one guardian or caregiver in a family | family_id, name, email, phone, is_primary, preferred_language, role (guardian, caregiver) | Zoho CRM |
| stars | one enrolled student | family_id, first_name, grade, school_name, school_district, math_teacher, counselor_email | Zoho CRM |
| todos | one action a family owes | family_id, star_id (null = whole family), title, description, link, due_date, required, completed_at, completed_by (parent) | Zoho CRM |
| program_history | one course, competition, or camp a Star took | star_id, kind (course, competition, camp), title, provider, start_date, end_date, result, notes | Zoho CRM |
| budgets | one family's allocation for one fiscal year | family_id, fiscal_year, allocated_cents; unique per family and year | QuickBooks |
| budget_transactions | one spend against the family budget | family_id, occurred_on, vendor, category, amount_cents, description | Ramp |
| events | one virtual or in-person event | title, kind (virtual, in_person), starts_at, ends_at, location, description, rsvp_deadline | Zoho CRM |
| rsvps | one family's yes to one event | event_id, family_id; primary key on both | portal-owned |

Columns added by WP7 (star_id, math_teacher, counselor_email,
preferred_language) and WP8 (parents.role, todos.completed_by) land with
those pull requests.

## Relationships

families 1 to many parents, stars, todos, budgets, budget_transactions,
rsvps. stars 1 to many program_history and todos. events 1 to many rsvps.
Every child row cascades on delete.

## What is computed, never stored

Todo status (overdue, due soon, upcoming, done), dashboard nudges, budget
spent and remaining, and the RSVP flag on an event. All come from queries
against the tables above at read time, using CURRENT_DATE and now().

## What is portal-owned versus synced

Only rsvps and todos.completed_at originate in the portal. Everything else
is a copy of a record in Zoho, Ramp, or QuickBooks. A sync job that upserts
those tables replaces `db/seed.sql`. Writes the portal makes to synced
tables (address, contacts, school) need to flow back to Zoho in that same
job; the prototype writes them locally only.

## Migrations

There are none yet. `npm run db:apply` runs `db/schema.sql`, which starts
with DROP TABLE, then `db/seed.sql`. Every schema change so far edited
`schema.sql` in place and reapplied. That is right for a prototype whose
data is disposable and wrong the day real family data lands.

Before the first real sync, switch to forward-only migrations:

1. Add `db/migrations/0001_initial.sql` holding today's schema without the
   DROP lines, and a `schema_migrations(version text primary key, applied_at
   timestamptz)` table.
2. Replace `db/apply.ts` with a runner that applies each unapplied file in
   name order inside one transaction and records it. About thirty lines of
   node-postgres; no library needed at this size.
3. Each later change is a new numbered file. Never edit an applied file.
   Seed data moves to `db/seed.sql` run only by an explicit `db:seed`.
4. Neon branches stay the test bed: cut a branch from main, run the
   migration there, run the suite, then apply to main.

Until then, the rule in CLAUDE.md holds: change `schema.sql`, reapply to your
own Neon branch, and say in the PR that main needs `db:apply` after merge.
