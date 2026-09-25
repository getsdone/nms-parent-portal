import { formatEventWhen, formatMonthDay, formatMonthShort } from "../format";

export type EventKind = "virtual" | "in_person";

export interface EventRecord {
  id: number;
  title: string;
  kind: EventKind;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  description: string | null;
  rsvp_deadline: string | null;
  rsvped: boolean;
}

interface EventCardProps {
  event: EventRecord;
  onToggleRsvp: (event: EventRecord) => void;
  pending: boolean;
}

export default function EventCard({ event, onToggleRsvp, pending }: EventCardProps) {
  const start = new Date(event.starts_at);
  return (
    <li className="list__row event">
      <span className={`date-tile${event.rsvped ? " date-tile--going" : ""}`} aria-hidden="true">
        <span className="date-tile__month">{formatMonthShort(start)}</span>
        <span className="date-tile__day">{start.getDate()}</span>
      </span>
      <div className="event__main">
        <h3 className="list__title">{event.title}</h3>
        <p className="list__meta">
          {formatEventWhen(event.starts_at)} · {event.kind === "virtual" ? "Virtual" : "In person"}
          {event.kind === "in_person" && event.location ? ` · ${event.location}` : ""}
        </p>
        {event.rsvp_deadline && !event.rsvped && (
          <span style={{ color: "var(--color-muted)" }}>
            RSVP by {formatMonthDay(new Date(event.rsvp_deadline))}
          </span>
        )}
      </div>
      {event.rsvped ? (
        <button
          type="button"
          className="pill pill--going"
          onClick={() => onToggleRsvp(event)}
          disabled={pending}
          aria-label={`Going to ${event.title}. Cancel RSVP`}
          title="Cancel RSVP"
        >
          ★ Going
        </button>
      ) : (
        <button
          type="button"
          className="btn btn--small btn--primary"
          onClick={() => onToggleRsvp(event)}
          disabled={pending}
        >
          RSVP
        </button>
      )}
    </li>
  );
}
