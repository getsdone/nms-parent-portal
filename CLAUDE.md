# Working in nms-parent-portal

Read by every agent in this repo. Process rules for a change live in
`rules.toml`. The product plan is `docs/plan.md`.

## What this is for

A parent portal prototype for National Math Stars, built in two hours on
dummy data. One family, no login, no real integrations. It must never grow
a "could" feature or real auth without a new plan.

## Environment

- Database: Neon project `red-rice-20195727`, org GetSDone. The main tree's
  `.env` holds the `main` branch URL. Each worktree cuts its own Neon branch
  from `main` and writes its own `.env`. The head deletes the Neon branch
  after the git branch merges. Never print a connection string.
- Server: Express 5. Async handler errors reach the JSON error middleware
  in `server/src/app.ts`. Any middleware mounted later in `index.ts` needs
  the error handler registered again after it.
- Data model: `docs/data-model.md` explains every table, what is computed
  at read time, and which system owns each table. `db/schema.sql` defines
  them.
- Migrations: none yet. A schema change edits `db/schema.sql` in place;
  `npm run db:apply` drops and recreates everything, then seeds. Apply to
  your own Neon branch, and the PR body says main needs `db:apply` after
  merge. The forward-only migration plan is in `docs/data-model.md`; adopt
  it before any real family data lands.
- Seed: `db/seed.sql` computes every date from `CURRENT_DATE` so tests hold
  on any day.
- Money is integer cents. Date columns are cast to text in SQL.
- Temporary files: the session scratchpad. Never `/tmp`, never a new git
  worktree outside the harness's own.

## Commands agents may run without a prompt

- `npm install`, `npm run build`, `npm test`, `npx tsx --test <file>`.
- `npm run db:apply` against your own worktree's Neon branch only.
- `git commit` with a message from a file; `git push origin HEAD:<branch>`.
- Never: `git push --force`, `git worktree remove` of a tree you did not
  create, `neonctl branches delete`, `gh pr merge`, dismissing a review.

## How a change runs

1. The head writes or updates the plan and dispatches a design-reviewer.
2. The head fixes the report, then dispatches implementers in worktrees.
3. Implementers record every deviation in their report.
4. A reviewer with no part in the design or code reads the branch by ref.
5. The head acts on the report, clears the gate, opens the PR with the
   cost section, and triages CodeRabbit threads: reply, resolve handled
   ones, list deferred ones on the tracking issue.
6. A retro proposes rules; the head applies the ones that hold.

## Dispatch

Name a model on every call. `sonnet` for a scoped route or page. `opus` for
the design review and for any review of shared infrastructure: framework
version, error middleware, seed data used by more than one page.

## Cut worktrees after the scaffold lands

A worktree branches from the head's current HEAD. Dispatch feature workers
only after the commit they build on is on `main`, or every worker spends
its first turns fast-forwarding.
