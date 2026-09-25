# National Math Stars parent portal: build plan

Two-hour prototype. Six required features, dummy data, live URL.

## Stack

One Node service on Railway. Express serves `/api/*` and the built Vite app.
Postgres on Neon. No auth: the server acts as family 1.

    web/      Vite + React + TypeScript, react-router. Pages call /api.
    server/   Express + pg. One route file per feature. TypeScript via tsx.
    db/       schema.sql, seed.sql, apply.ts (drops and recreates; prototype).

Tests: `node --test` against a running server with `DATABASE_URL` pointing at
a Neon branch. Neon project `red-rice-20195727` (org GetSDone). The main
tree's `.env` holds the `main` branch URL and is gitignored. Every worktree
gets its own Neon branch, cut from `main` after the scaffold seeds it:

    neonctl branches create --project-id red-rice-20195727 --name <git-branch> --output json
    neonctl connection-string --project-id red-rice-20195727 --branch <git-branch>

Write that URL to the worktree's own `.env`. The head deletes the Neon branch
after merging the git branch.

Visual design is handled outside this repo. Workers build plain, functional
markup with semantic elements and minimal CSS. No design systems, no styling
libraries, no time on looks.

Skipped: auth, Zoho/Ramp/QuickBooks sync, every "could" feature. The README
says where a sync job replaces `db/seed.sql`.

## Data model

    families            id, name, address_line1, city, state, zip
    parents             id, family_id, name, email, phone, is_primary
    stars               id, family_id, first_name, grade, school_name, school_district
    todos               id, family_id, title, description, link, due_date,
                        required bool, completed_at null
    program_history     id, star_id, kind (course|competition|camp), title,
                        provider, start_date, end_date, result, notes
    budgets             id, family_id, fiscal_year, allocated_cents
    budget_transactions id, family_id, occurred_on, vendor, category,
                        amount_cents, description
    events              id, title, kind (virtual|in_person), starts_at, ends_at,
                        location, description, rsvp_deadline
    rsvps               event_id, family_id, created_at  (pk both)

Money is integer cents. Dates are `date`, timestamps `timestamptz`.

## API

    GET   /api/family                  family + parents + stars
    PATCH /api/family                  body, all keys optional:
                                       { address_line1, city, state, zip,
                                         stars:   [{ id, school_name, school_district, grade }],
                                         parents: [{ id, name, email, phone }] }
                                       rows matched by id within family 1; unknown id -> 404
    GET   /api/todos
    PATCH /api/todos/:id               { completed: bool }
    GET   /api/history                 all stars' program_history, newest first
    GET   /api/budget                  budget row with the highest fiscal_year;
                                       { fiscal_year, allocated, spent, remaining, transactions }
    GET   /api/events                  upcoming, each with rsvped flag
    POST  /api/events/:id/rsvp
    DELETE /api/events/:id/rsvp
    GET   /api/dashboard               nudges, see below

Dashboard nudges are computed at read time, not stored:
overdue required todos; todos due within 7 days; RSVP'd events within 14 days;
events whose RSVP deadline is within 7 days and not RSVP'd; budget remaining
with percent used.

## Work packages

WP0 scaffold (sequential, on main, sonnet, no worktree)
  Root package.json with workspaces web and server. Vite app shell: nav plus
  six empty pages routed. Express app with /api/health, static serving of
  web/dist, and a stub route file per feature already registered in
  server/app.ts so later workers never touch that file. db/schema.sql,
  db/seed.sql with one family, two parents, one star, ~8 todos, ~10 history
  rows, one budget, ~12 transactions, ~8 events, 2 rsvps. db/apply.ts.
  One passing test hitting /api/health. Apply schema and seed to Neon main.

WP1 to WP5 parallel, one worktree each, sonnet
  Each fills exactly: server/routes/<x>.ts, web/src/pages/<X>.tsx,
  server/test/<x>.test.ts. May add small components under web/src/components/<x>/.
  Nothing else.
    WP1 todos      list with overdue/due-soon/done state, toggle persists
    WP2 events     list with virtual/in-person filter, RSVP toggle,
                   RSVP'd events listed first
    WP3 budget     allocated, spent, remaining, transaction table
    WP4 history    per-star list, filter by kind
    WP5 profile    view and edit family address, star school, parent contacts
                   files: server/routes/family.ts, web/src/pages/Profile.tsx,
                   server/test/family.test.ts (route file follows the API path)

WP6 dashboard (after WP1-5 merge, sonnet)
  server/routes/dashboard.ts, web/src/pages/Dashboard.tsx. Nudge cards link
  to the page that resolves them.

WP7 deploy (head, no code)
  Railway service from the repo, DATABASE_URL = Neon main. README.

## Timeline

    0:00-0:20  WP0
    0:20-1:05  WP1-5
    1:05-1:30  merge, WP6
    1:30-1:45  deploy, reviewer pass
    1:45-2:00  README, push
