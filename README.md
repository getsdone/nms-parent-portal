# National Math Stars parent portal

Two-hour prototype. One family, dummy data, no login. Live at
https://web-production-8306d.up.railway.app

## What it does

| Page | What a parent can do |
| --- | --- |
| Dashboard | See what needs attention: overdue required forms, RSVP deadlines this week, items due in 7 days, events they are going to in the next 14 days, budget remaining. Each card links to the page that resolves it. |
| To-dos | Check off forms and tasks. Grouped as overdue, due soon, done. |
| Events | Browse virtual and in-person events, RSVP or cancel, see what they already RSVP'd to first. |
| Budget | Family budget for the year: allocated, spent, remaining, every transaction. |
| History | Each Star's courses, competition results, and camps, filterable by kind. |
| Family info | Read-only cards for each guardian and caregiver, the home address, and the selected Star's school, each with its own Edit. |
| Documents | What the family already sent and where each item stands. |
| Calendar | One ICS feed per family: RSVP'd events, due dates, and program dates, subscribable from the Events page. |

The header has a Star switcher. Every page scopes to the selected Star.
An "Acting as" control stands in for the signed-in user: a caregiver sees
and completes to-dos and RSVPs but cannot see the budget or edit anyone
else's details. To-dos record who completed them.

Nudges are computed at read time from the same tables the other pages use.
Nothing is stored twice.

## Stack

- `web/` Vite, React, TypeScript, react-router. Styled to the design made
  separately in Claude Design; tokens and classes live in `src/index.css`.
- `server/` Express 5 and node-postgres. One route file per page. Async
  handler errors reach one JSON error handler.
- `db/` `schema.sql`, `seed.sql`, and `apply.ts`, which drops and recreates
  everything.
- Postgres on Neon. Railway runs the server and serves the built web app.

## Where real data plugs in

The seed file stands in for three systems. Each table maps to one source:

| Tables | Source |
| --- | --- |
| families, parents, stars, todos, events, rsvps, program_history | Zoho CRM |
| budgets, budget_transactions | Ramp (spend) and QuickBooks (allocations) |

A sync job that upserts those tables replaces `db/seed.sql`. The routes and
pages do not change. Money is stored as integer cents. Dates are `date`
columns and are cast to text in SQL so the driver's timezone handling never
shifts a day.

## Run it

```
npm install
cp .env.example .env   # set DATABASE_URL
npm run db:apply
npm run dev:server     # port 3000
npm run dev:web        # Vite on 5173, proxies /api
npm test               # unit tests, then server tests against DATABASE_URL
npm run test:e2e       # Playwright, starts its own server on 4590
```

Tests: 22 unit tests for date and money helpers, run in three timezones;
33 server route tests; 21 Playwright tests that load every page, toggle a
to-do, RSVP, edit the profile, and check no page scrolls sideways at 390px.
Every test that changes data puts it back.

## How it was built

Claude Code with the gsd-forge harness. The main thread had no file-editing
tools. It wrote the plan in `docs/plan.md`, a design reviewer checked the plan
against itself before any code, then six implementers built one page each in
their own git worktree and their own Neon database branch. A reviewer that had
no part in the design read every branch before its pull request. CodeRabbit
reviewed each pull request on GitHub. Review findings that were fixed: the
to-do toggle did not revert on a failed save, and Express 4 dropped async
errors on the floor.

## Next

The ten largest gaps for daily use are GitHub issues 15 to 24, four marked
high. Multi-guardian households (#20) landed as WP8. The calendar feed
(#19) and the Documents view (#17) landed in the release branch. Budget
purchase requests (#18) is designed in `docs/plan.md` and not built. CI that
runs the tests on each pull request and applies schema changes before
Railway deploys is #26. The full design-versus-build table is in
`docs/design-gaps.md` and the data model in `docs/data-model.md`.

## Not built, on purpose

Login and per-family authorization, the Zoho, Ramp, and QuickBooks sync,
and everything in the "could" list: advice, FAQ, resource hub, merit badges,
forums. Known gaps in what was built: no grade range check on the profile
form, empty strings are accepted as names, the budget page shows over 100
percent when spending exceeds the allocation, and a double-click race on two
RSVP buttons at once.
