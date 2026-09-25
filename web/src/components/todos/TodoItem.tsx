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

export default function TodoItem({ todo, onToggle }: TodoItemProps) {
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={todo.status === "done"}
          onChange={(e) => onToggle(todo.id, e.target.checked)}
        />
        {todo.title}
      </label>
      {todo.required && <strong> (required)</strong>}
      {todo.due_date && <span> — due {todo.due_date}</span>}
      {todo.link && (
        <span>
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
