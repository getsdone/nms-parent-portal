import { Link } from "react-router-dom";
import type { TodoNudge } from "./types";

interface TodoNudgeCardProps {
  todo: TodoNudge;
}

export default function TodoNudgeCard({ todo }: TodoNudgeCardProps) {
  return (
    <article>
      <h3>
        <Link to="/todos">{todo.title}</Link>
      </h3>
      {todo.due_date && <p>Due {todo.due_date}</p>}
    </article>
  );
}
