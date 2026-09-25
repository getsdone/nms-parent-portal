import { Link } from "react-router-dom";

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

interface EventNudgeCardProps {
  title: string;
  /** Label shown under the title, e.g. "RSVP by ..." or "Starts ...". */
  detail: string;
}

export default function EventNudgeCard({ title, detail }: EventNudgeCardProps) {
  return (
    <article className="nudge">
      <h3 className="nudge__title">
        <Link to="/events">{title}</Link>
      </h3>
      <p className="nudge__meta">{detail}</p>
    </article>
  );
}

export { formatDateTime };
