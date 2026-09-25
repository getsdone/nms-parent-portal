import { useEffect, useState } from "react";
import { api } from "../api";
import type { DashboardData } from "../components/dashboard/types";
import TodoNudgeCard from "../components/dashboard/TodoNudgeCard";
import EventNudgeCard, { formatDateTime } from "../components/dashboard/EventNudgeCard";
import BudgetSummaryLine from "../components/dashboard/BudgetSummaryLine";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DashboardData>("/dashboard")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  if (error) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p role="alert">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <h1>Dashboard</h1>;
  }

  const needsAttentionCount = data.overdue_todos.length + data.rsvp_deadlines.length;
  const comingUpCount = data.due_soon_todos.length + data.upcoming_rsvps.length;

  return (
    <div>
      <h1>Dashboard</h1>

      <section>
        <h2>Needs your attention</h2>
        {needsAttentionCount === 0 ? (
          <p>Nothing needs your attention.</p>
        ) : (
          <>
            {data.overdue_todos.map((todo) => (
              <TodoNudgeCard key={`todo-${todo.id}`} todo={todo} />
            ))}
            {data.rsvp_deadlines.map((deadline) => (
              <EventNudgeCard
                key={`deadline-${deadline.id}`}
                title={deadline.title}
                detail={`RSVP by ${formatDateTime(deadline.rsvp_deadline)}`}
              />
            ))}
          </>
        )}
      </section>

      <section>
        <h2>Coming up</h2>
        {comingUpCount === 0 ? (
          <p>Nothing coming up.</p>
        ) : (
          <>
            {data.due_soon_todos.map((todo) => (
              <TodoNudgeCard key={`todo-${todo.id}`} todo={todo} />
            ))}
            {data.upcoming_rsvps.map((rsvp) => (
              <EventNudgeCard
                key={`rsvp-${rsvp.id}`}
                title={rsvp.title}
                detail={`Starts ${formatDateTime(rsvp.starts_at)}`}
              />
            ))}
          </>
        )}
      </section>

      <section>
        <h2>Budget</h2>
        <BudgetSummaryLine budget={data.budget} />
      </section>
    </div>
  );
}
