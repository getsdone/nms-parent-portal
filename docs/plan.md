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

## WP7: star context, family info, nudge banner (added after the design review)

The design scopes the portal to one Star at a time, chosen by a switcher in
the header, and presents the profile as "Family info" with read-only rows
and an Edit control per section. The build had one Star and one edit form.

### Data model changes

    stars     + math_teacher TEXT, counselor_email TEXT
    parents   + preferred_language TEXT
    todos     + star_id INTEGER NULL REFERENCES stars(id) ON DELETE CASCADE
              null means the whole family

Seed: a second Star (Leo, grade 4, same school) with 4 todos (2 overdue
required, 1 due soon, 1 done) and 3 program_history rows. Existing todos
get star_id = 1 except the two family-wide ones (survey, W-9). Second
parent stays as the "Second guardian". Budget stays family-level; the
schema has no per-star budget and the page says "Family budget".

### API changes

    GET /api/todos?star=<id>       rows where star_id = id OR star_id IS NULL
    GET /api/dashboard?star=<id>   same filter for the todo nudges; events
                                   and budget unchanged
    GET /api/family                stars gain math_teacher, counselor_email;
                                   parents gain preferred_language
    PATCH /api/family              accepts those fields, same rules
    GET /api/history?star=<id>     already per star; add the filter

`star` absent means all Stars. Seeding Leo changes the family-wide counts,
so the existing todos, dashboard and history tests pass `?star=1` to keep
their expected numbers, the family test expects two Stars, and each file
gains one unfiltered assertion covering both Stars. Leo's history rows are
one course, one competition, one camp. In family.ts the three new columns
thread through StarPatch, ParentPatch, validatePatch, both UPDATE loops, and
loadFamily's SELECTs.

### Frontend

- Header: one pill per Star (initial in a circle plus first name), active
  one navy. Selection lives in localStorage and a React context; every
  page reads it and passes ?star=.
- Nav "To-dos" shows a coral count badge of overdue required todos for the
  selected Star, from /api/dashboard.
- Non-home pages show a coral banner "N overdue items for <Star>. Finish
  now" linking to /todos when N > 0.
- Profile becomes "Family info": sections You, Home address, <Star>'s
  school, Second guardian. Each section is read-only label/value rows with
  an Edit link that swaps the section to its existing form fields and a
  Save. School section shows only the selected Star.
- History page title becomes "<Star>'s journey"; To-dos subtitle "For
  <Star> · <done> of <total> done this year"; Dashboard "Here's what
  matters for <Star> today."

Out of scope, stated: account menu, Settings, Star view, Pinbook, Help and
guides, "Idea from" advice rows, second-guardian invite.

## WP8: multi-guardian households and caregiver role (issue #20)

Today a to-do belongs to the family, so any parent who completes it clears
it for everyone. That holds. What is missing: who did it, a caregiver with
limited rights, and a UI that treats guardians as a list.

### Data model

    parents  + role TEXT NOT NULL DEFAULT 'guardian'
               CHECK (role IN ('guardian', 'caregiver'))
    todos    + completed_by INTEGER NULL REFERENCES parents(id) ON DELETE SET NULL

Seed: both existing parents are guardians; add one caregiver (a grandparent
who drives to camp) with phone only. Two completed todos get completed_by.

### Acting parent, without auth

The prototype has no login. The header gets an "Acting as" control listing
the family's parents; the choice lives in localStorage and every write
sends it. The real system replaces this with the session's user.

    PATCH /api/todos/:id      body { completed, parent_id }; records
                              completed_by = parent_id on completion, null on undo
    POST /api/events/:id/rsvp unchanged (RSVP is per family)
    GET /api/todos            rows gain completed_by_name
    GET /api/family           parents gain role
    PATCH /api/family         a caregiver may not change address, school, or
                              other parents; the server rejects with 403 when
                              the acting parent_id (query ?parent=) is a caregiver

### Rights

| | Guardian | Caregiver |
| --- | --- | --- |
| See and complete to-dos | yes | yes |
| RSVP | yes | yes |
| See budget | yes | no (nav item hidden, route returns 403) |
| Edit family info | yes | own contact row only |

### Frontend

- Family info: "You" becomes "Guardians and caregivers", one card per parent
  with a role badge, Edit on each. The second-guardian card goes away.
- To-do rows show "Done by <first name> · <Mon D>" when completed_by is set.
- Header: "Acting as" select. When a caregiver is selected, Budget leaves the
  nav and Family info shows only that person's card as editable.
