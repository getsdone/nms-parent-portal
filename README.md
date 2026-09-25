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
| Profile | View and edit address, school, district, grade, and parent contact details. |

Nudges are computed at read time from the same tables the other pages use.
Nothing is stored twice.

## Stack

- `web/` Vite, React, TypeScript, react-router. Plain semantic HTML with no
  styling; visual design was done separately.
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
npm test               # node:test against DATABASE_URL
```

## How it was built

Claude Code with the gsd-forge harness. The main thread had no file-editing
tools. It wrote the plan in `docs/plan.md`, a design reviewer checked the plan
against itself before any code, then six implementers built one page each in
their own git worktree and their own Neon database branch. A reviewer that had
no part in the design read every branch before its pull request. CodeRabbit
reviewed each pull request on GitHub. Review findings that were fixed: the
to-do toggle did not revert on a failed save, and Express 4 dropped async
errors on the floor.

## Not built, on purpose

Login and per-family authorization, the Zoho, Ramp, and QuickBooks sync,
and everything in the "could" list: advice, FAQ, resource hub, merit badges,
forums. Known gaps in what was built: no grade range check on the profile
form, empty strings are accepted as names, the budget page shows over 100
percent when spending exceeds the allocation, and a double-click race on two
RSVP buttons at once.
