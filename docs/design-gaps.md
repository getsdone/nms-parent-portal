# Design versus build, 2026-09-25

Design source: `design-template.html` (scratchpad), a single-page state machine (`Component extends DCLogic`) rendering all views by boolean flags (`isTodos`, `isBudget`, etc.). Built app: `origin/design-port:web/src/{App.tsx,pages/*,components/*}`, API in `server/src/routes/*.ts`, schema in `db/schema.sql`.

| Design element | Where in design | What it does | Built today | Data needed | Effort |
|---|---|---|---|---|---|
| Nav: Home, To-dos, Events, Budget | Header nav (parent mode) | Pill nav, active state, To-dos badge shows overdue count | Partial — `App.tsx` has flat nav (Dashboard/To-dos/Events/Budget/History/Profile), no badge count on nav link | Existing `todos` table (count query) | S |
| Nav: Home, My pins, My journey, Events | Header nav (star mode) | Separate nav for the "star" (child) view | No — no star-mode UI exists at all | New concept: active-star session | L |
| "More ▾" menu | Header, parent mode only | Dropdown: "{Star}'s journey", "Pinbook", "Help and guides" | No — no dropdown; History is a flat top-nav item instead, not per-star scoped | none beyond items below | S (once items exist) |
| Star switcher (Maya / Leo pills) | Header, right side | Switches all star-scoped views to that child; red dot if that star has overdue items | No — app shows all children's data merged (Dashboard, Todos, Budget); no "active star" concept | `stars` table already supports multiple children; needs session/URL state | M |
| Account menu (avatar "AR") | Header, far right | Dropdown: Family info, Settings, Switch to Star view / Back to parent, Log out | No — no avatar, no dropdown, no auth of any kind (`FAMILY_ID = 1` hardcoded in every route) | New: auth/session, users table | L |
| Welcome nudge modal | On load, if overdue items exist | "Welcome back, Ana. N things need you." lists overdue items, links to fix each | No — no modal system anywhere in built app | Reuses `todos` overdue query | M |
| Overdue banner | Sticky, shown on non-home/non-todos pages | "N overdue items for {Star}. Finish now" | No | Reuses `todos` overdue query | S |
| Profile — "You" section | Profile view | Name, email, phone, preferred language, inline Edit/Cancel/Save | Partial — `Profile.tsx` has parents[] (name/email/phone) as a single form, no language field, no per-section edit toggle | New `language` column on `parents` | S |
| Profile — Home address | Profile view | Street/city/state/zip, inline edit | Yes — `AddressFields.tsx`, matches `families` columns | none | — |
| Profile — School section | Profile view, per star | School, district, grade, teacher, counselor; flags "looks out of date" | Partial — `StarFields.tsx` has school_name/district/grade only; no teacher, counselor, no staleness flag | New columns on `stars`: `teacher`, `counselor_email` | S |
| Profile — Second guardian | Profile view | Fixed second-guardian slot: name/relationship/phone/email | Better than design — `parents` is already an array, not a fixed 2-slot pair | none | — |
| History / "{Star}'s journey" | History view | Per-star, year-grouped timeline: courses, competitions, camps, milestones, pins, narrative result text | Partial — `History.tsx` + `StarHistorySection` already group by star and filter by kind, but schema's `program_history.kind` CHECK only allows course/competition/camp — no milestone or pin entries | Schema: widen CHECK to add `milestone`; pin entries depend on Pinbook (below) | S–M |
| Pinbook / pins ("earned", "in progress", "not started") | Pinbook view + pin modal | Badge collection per star with step checklists, tied to events | No — no schema, route, or page exists | New tables: `pin_definitions`, `pin_progress`, `pin_steps` | L |
| Help / FAQ + Guides | Help view | Collapsible FAQ list, printable guide list, "Ask Dana" contact card | No | New static content, likely a `faqs`/`guides` seed table or hardcoded content | M |
| "Idea from Dana" | Home glance grid | Suggests one unRSVP'd event tied to an in-progress pin | No — depends on Pinbook existing first | Pin-to-event association | M (after Pinbook) |
| Toasts | Global, bottom-center | Confirmation snackbar after actions (mark done, RSVP, save) | No — `Todos.tsx`/`Events.tsx` do optimistic updates with only inline `alert` text on error, no success feedback | none (UI-only) | S |
| Settings view | Reachable from account menu | Reminder toggles (email/text/event/weekly), language switch, change-password, log out | No — no preferences table, no auth | New `preferences` table, auth system | L |
| `startView` prop (parent\|star) | Design-tool preview control | Lets the designer preview either audience | N/A — a design-tool authoring control, not a shippable feature; its real-world equivalent is the star-mode nav/switcher above | — | — |

**Pattern:** the built app collapses every child into one family-wide list (todos, budget, RSVPs); the design is per-star throughout. That's the single biggest structural gap, bigger than any individual missing view.
