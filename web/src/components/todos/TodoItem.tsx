export interface Todo {
  id: number;
  title: string;
  description: string | null;
  link: string | null;
  due_date: string | null;
  required: boolean;
  completed_at: string | null;
  status: "done" | "overdue" | "due_soon" | "upcoming";
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, completed: boolean) => void;
}

const STATUS_BADGE: Record<Todo["status"], string> = {
  overdue: "badge badge--overdue",
  due_soon: "badge badge--due-soon",
  upcoming: "badge",
  done: "badge badge--done",
};

export default function TodoItem({ todo, onToggle }: TodoItemProps) {
  return (
    <li className={`list__row todo todo--${todo.status}`}>
      <label className="todo__label">
        <input
          className="todo__check"
          type="checkbox"
          checked={todo.status === "done"}
          onChange={(e) => onToggle(todo.id, e.target.checked)}
        />
        {todo.title}
      </label>
      {todo.description && <p className="list__body">{todo.description}</p>}
      {todo.required && <strong className="badge badge--required"> (required)</strong>}
      {todo.due_date && <span className={STATUS_BADGE[todo.status]}> — due {todo.due_date}</span>}
      {todo.link && (
        <span className="list__meta">
          {" "}
          —{" "}
          <a href={todo.link} target="_blank" rel="noreferrer">
            link
          </a>
        </span>
      )}
    </li>
  );
}
