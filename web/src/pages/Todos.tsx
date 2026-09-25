import { useEffect, useState } from "react";
import { api } from "../api";
import TodoItem, { type Todo } from "../components/todos/TodoItem";

export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

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

  const done = todos.filter((t) => t.status === "done");
  const open = todos.filter((t) => t.status !== "done");
  const percentDone = todos.length === 0 ? 0 : (done.length / todos.length) * 100;

  return (
    <div className="page">
      <header>
        <h1 className="page__title">To-dos</h1>
        {todos.length > 0 && (
          <p className="page__lede">
            {done.length} of {todos.length} done this year
          </p>
        )}
      </header>
      {error && <p className="alert" role="alert">{error}</p>}

      <div className="section">
        {todos.length > 0 && (
          <div
            className="thin-bar"
            role="progressbar"
            aria-label="To-dos done this year"
            aria-valuemin={0}
            aria-valuemax={todos.length}
            aria-valuenow={done.length}
          >
            <span className="thin-bar__fill" style={{ width: `${percentDone}%` }} />
          </div>
        )}
        {open.length === 0 ? (
          <p className="empty">Nothing left to do.</p>
        ) : (
          <ul className="list">
            {open.map((t) => (
              <TodoItem key={t.id} todo={t} onToggle={handleToggle} />
            ))}
          </ul>
        )}
      </div>

      {done.length > 0 && (
        <div className="section">
          <button
            type="button"
            className="link-button"
            aria-expanded={showDone}
            onClick={() => setShowDone((v) => !v)}
          >
            {showDone ? "Hide" : "Show"} {done.length} completed
          </button>
          {showDone && (
            <ul className="list">
              {done.map((t) => (
                <TodoItem key={t.id} todo={t} onToggle={handleToggle} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
