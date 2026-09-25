import { useEffect, useState } from "react";
import { api } from "../api";
import TodoItem, { type Todo } from "../components/todos/TodoItem";

export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Todo[]>("/todos")
      .then(setTodos)
      .catch((err) => setError(err.message));
  }, []);

  async function handleToggle(id: number, completed: boolean) {
    // Optimistic update; PATCH's response (the source of truth for the
    // recomputed status) overwrites this if it lands.
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: completed ? "done" : "upcoming",
              completed_at: completed ? new Date().toISOString() : null,
            }
          : t,
      ),
    );
    try {
      const updated = await api<Todo>(`/todos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const overdue = todos.filter((t) => t.status === "overdue");
  const dueSoonOrUpcoming = todos.filter(
    (t) => t.status === "due_soon" || t.status === "upcoming",
  );
  const done = todos.filter((t) => t.status === "done");

  return (
    <div>
      <h1>To-dos</h1>
      {error && <p role="alert">{error}</p>}

      <section>
        <h2>Overdue</h2>
        {overdue.length === 0 ? (
          <p>Nothing overdue.</p>
        ) : (
          <ul>
            {overdue.map((t) => (
              <TodoItem key={t.id} todo={t} onToggle={handleToggle} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Due soon and upcoming</h2>
        {dueSoonOrUpcoming.length === 0 ? (
          <p>Nothing due soon.</p>
        ) : (
          <ul>
            {dueSoonOrUpcoming.map((t) => (
              <TodoItem key={t.id} todo={t} onToggle={handleToggle} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Done</h2>
        {done.length === 0 ? (
          <p>Nothing done yet.</p>
        ) : (
          <ul>
            {done.map((t) => (
              <TodoItem key={t.id} todo={t} onToggle={handleToggle} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
