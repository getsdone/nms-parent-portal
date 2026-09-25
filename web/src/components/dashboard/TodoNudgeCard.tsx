import { Link } from "react-router-dom";
import type { TodoNudge } from "./types";
import { formatMonthDay, parseDateOnly } from "../format";

interface TodoNudgeCardProps {
  todo: TodoNudge;
}

export default function TodoNudgeCard({ todo }: TodoNudgeCardProps) {
  return (
    <article className="nudge">
      <h3 className="nudge__title">
        <Link to="/todos">{todo.title}</Link>
      </h3>
      {todo.due_date && (
        <p className="nudge__meta">Due {formatMonthDay(parseDateOnly(todo.due_date))}</p>
      )}
    </article>
  );
}
