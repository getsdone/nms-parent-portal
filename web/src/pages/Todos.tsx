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
    const previousTodo = todos.find((t) => t.id === id);
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
      if (previousTodo) {
        setTodos((prev) =>
          prev.map((t) => (t.id === id ? previousTodo : t)),
        );
      }
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const overdue = todos.filter((t) => t.status === "overdue");
  const dueSoonOrUpcoming = todos.filter(
    (t) => t.status === "due_soon" || t.status === "upcoming",
  );
  const done = todos.filter((t) => t.status === "done");

  return (
    <div className="page">
      <h1 className="page__title">To-dos</h1>
      {error && <p className="alert" role="alert">{error}</p>}

      <section className="section">
        <h2 className="section__title">Overdue</h2>
        {overdue.length === 0 ? (
          <p className="empty">Nothing overdue.</p>
        ) : (
          <ul className="list">
            {overdue.map((t) => (
              <TodoItem key={t.id} todo={t} onToggle={handleToggle} />
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2 className="section__title">Due soon and upcoming</h2>
        {dueSoonOrUpcoming.length === 0 ? (
          <p className="empty">Nothing due soon.</p>
        ) : (
          <ul className="list">
            {dueSoonOrUpcoming.map((t) => (
              <TodoItem key={t.id} todo={t} onToggle={handleToggle} />
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2 className="section__title">Done</h2>
        {done.length === 0 ? (
          <p className="empty">Nothing done yet.</p>
        ) : (
          <ul className="list">
            {done.map((t) => (
              <TodoItem key={t.id} todo={t} onToggle={handleToggle} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
