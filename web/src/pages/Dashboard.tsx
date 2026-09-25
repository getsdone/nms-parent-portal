import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { DashboardData, TodoNudge } from "../components/dashboard/types";
import type { Family } from "../components/profile/types";
import TodoNudgeCard from "../components/dashboard/TodoNudgeCard";
import EventNudgeCard, { formatDateTime } from "../components/dashboard/EventNudgeCard";
import { daysFromToday, formatCents, formatEventWhen, plural } from "../components/format";

function Greeting({ family }: { family: Family | null }) {
  const primary = family?.parents.find((p) => p.is_primary) ?? family?.parents[0];
  const parentFirst = primary?.name.trim().split(/\s+/)[0];
  const starFirst = family?.stars[0]?.first_name;
  return (
    <header className="greeting">
      <h1 className="page__title">{parentFirst ? `Hi, ${parentFirst}.` : "Hi."}</h1>
      <p className="page__lede">
        Here&rsquo;s what matters{starFirst ? ` for ${starFirst}` : ""} today.
      </p>
    </header>
  );
}

function OverdueHero({ todo, total }: { todo: TodoNudge; total: number }) {
  const late = todo.due_date ? -daysFromToday(todo.due_date) : null;
  return (
    <section className="hero-overdue" aria-labelledby="hero-overdue-title">
      <p className="hero-overdue__label">Overdue · 1 of {total}</p>
      <h2 id="hero-overdue-title" className="hero-overdue__title">
        {todo.title}
      </h2>
      {late !== null && late > 0 && (
        <p className="hero-overdue__meta">{plural(late, "day")} late</p>
      )}
      <div className="hero-overdue__actions">
        {todo.link ? (
          <a className="btn btn--primary" href={todo.link} target="_blank" rel="noreferrer">
            Do it now
          </a>
        ) : (
          <Link className="btn btn--primary" to="/todos">
            Do it now
          </Link>
        )}
        <Link className="btn btn--ghost" to="/todos">
          See all to-dos
        </Link>
      </div>
    </section>
  );
}

function SummaryRow({ to, label, value, detail }: { to: string; label: string; value: string; detail?: string }) {
  return (
    <li>
      <Link className="summary__row" to={to}>
        <span className="summary__text">
          <span className="summary__label">{label}</span>
          <span className="summary__value">{value}</span>
          {detail && <span className="summary__detail">{detail}</span>}
        </span>
        <span className="summary__chevron" aria-hidden="true">
          ›
        </span>
      </Link>
    </li>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DashboardData>("/dashboard")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
    // The greeting falls back to "Hi." if this fails; the dashboard still renders.
    api<Family>("/family")
      .then(setFamily)
      .catch(() => setFamily(null));
  }, []);

  if (error) {
    return (
      <div className="page">
        <Greeting family={family} />
        <p className="alert" role="alert">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <Greeting family={family} />;
  }

  const [heroTodo, ...otherOverdue] = data.overdue_todos;
  const nextGoing = data.upcoming_rsvps[0];
  const nextDeadline = nextGoing ? undefined : data.rsvp_deadlines[0];
  const remainingDeadlines = data.rsvp_deadlines.filter((d) => d !== nextDeadline);
  const remainingRsvps = data.upcoming_rsvps.filter((r) => r !== nextGoing);
  const needsAttentionCount = otherOverdue.length + remainingDeadlines.length;
  const comingUpCount = data.due_soon_todos.length + remainingRsvps.length;
  const budget = data.budget;

  return (
    <div className="page">
      <Greeting family={family} />

      {heroTodo ? (
        <OverdueHero todo={heroTodo} total={data.overdue_todos.length} />
      ) : (
        data.rsvp_deadlines.length === 0 && <p className="empty">Nothing needs your attention.</p>
      )}

      <ul className="summary">
        {budget.fiscal_year === null ? (
          <SummaryRow to="/budget" label="Budget" value="No budget set up yet" />
        ) : (
          <SummaryRow
            to="/budget"
            label="Budget"
            value={`${formatCents(budget.remaining_cents)} left`}
            detail={`of ${formatCents(budget.allocated_cents)}`}
          />
        )}
        {nextGoing && (
          <SummaryRow
            to="/events"
            label="Next event"
            value={nextGoing.title}
            detail={`${formatEventWhen(nextGoing.starts_at)} · You’re going`}
          />
        )}
        {nextDeadline && (
          <SummaryRow
            to="/events"
            label="Next event"
            value={nextDeadline.title}
            detail={`${formatEventWhen(nextDeadline.starts_at)} · RSVP by ${formatDateTime(nextDeadline.rsvp_deadline)}`}
          />
        )}
      </ul>

      {needsAttentionCount > 0 && (
        <section className="section section--attention">
          <h2 className="section__title">Needs your attention</h2>
          {otherOverdue.map((todo) => (
            <TodoNudgeCard key={`todo-${todo.id}`} todo={todo} />
          ))}
          {remainingDeadlines.map((deadline) => (
            <EventNudgeCard
              key={`deadline-${deadline.id}`}
              title={deadline.title}
              detail={`RSVP by ${formatDateTime(deadline.rsvp_deadline)}`}
            />
          ))}
        </section>
      )}

      <section className="section">
        <h2 className="section__title">Coming up</h2>
        {comingUpCount === 0 ? (
          <p className="empty">Nothing else coming up.</p>
        ) : (
          <>
            {data.due_soon_todos.map((todo) => (
              <TodoNudgeCard key={`todo-${todo.id}`} todo={todo} />
            ))}
            {remainingRsvps.map((rsvp) => (
              <EventNudgeCard
                key={`rsvp-${rsvp.id}`}
                title={rsvp.title}
                detail={`Starts ${formatDateTime(rsvp.starts_at)}`}
              />
            ))}
          </>
        )}
      </section>
    </div>
  );
}
