import { firstName } from "../../star";
import { daysFromToday, formatMonthDay, parseDateOnly, plural } from "../format";

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  link: string | null;
  due_date: string | null;
  required: boolean;
  completed_at: string | null;
  completed_by: number | null;
  completed_by_name: string | null;
  status: "done" | "overdue" | "due_soon" | "upcoming";
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, completed: boolean) => void;
}

function dueText(todo: Todo): string | null {
  if (!todo.due_date) return null;
  const days = daysFromToday(todo.due_date);
  if (todo.status === "overdue") return days < 0 ? `${plural(-days, "day")} late` : "Due today";
  if (todo.status === "due_soon") return days <= 0 ? "Due today" : `Due in ${plural(days, "day")}`;
  return `Due ${formatMonthDay(parseDateOnly(todo.due_date))}`;
}

export default function TodoItem({ todo, onToggle }: TodoItemProps) {
  const due = dueText(todo);
  return (
    <li className={`list__row todo todo--${todo.status}`}>
      <input
        id={`todo-${todo.id}`}
        className="todo__check"
        type="checkbox"
        checked={todo.status === "done"}
        onChange={(e) => onToggle(todo.id, e.target.checked)}
      />
      <div className="todo__main">
        <label className="todo__label" htmlFor={`todo-${todo.id}`}>
          {todo.title}
          {todo.required && <span className="badge badge--required badge--tiny">Required</span>}
        </label>
        {due && <p className="todo__due">{due}</p>}
        {todo.status === "done" && todo.completed_by_name && (
          <p className="todo__due">
            Done by {firstName(todo.completed_by_name)}
            {todo.completed_at && ` · ${formatMonthDay(new Date(todo.completed_at))}`}
          </p>
        )}
        {todo.description && <p className="list__body">{todo.description}</p>}
      </div>
      {todo.link && (
        <a className="pill" href={todo.link} target="_blank" rel="noreferrer">
          Open
        </a>
      )}
    </li>
  );
}
