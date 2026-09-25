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

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

interface EventCardProps {
  event: EventRecord;
  onToggleRsvp: (event: EventRecord) => void;
  pending: boolean;
}

export default function EventCard({ event, onToggleRsvp, pending }: EventCardProps) {
  return (
    <article className="card event">
      <h3 className="list__title">{event.title}</h3>
      <p className={`badge ${event.kind === "virtual" ? "badge--virtual" : "badge--in-person"} event__kind`}>
        {event.kind === "virtual" ? "Virtual" : "In person"}
      </p>
      <p className="list__meta">{formatDateTime(event.starts_at)}</p>
      {event.location && <p className="list__meta">{event.location}</p>}
      {event.description && <p className="list__body">{event.description}</p>}
      {event.rsvp_deadline && (
        <p className="list__meta event__deadline">RSVP by {formatDateTime(event.rsvp_deadline)}</p>
      )}
      <button
        type="button"
        className={`btn btn--small ${event.rsvped ? "btn--danger" : "btn--primary"} event__action`}
        onClick={() => onToggleRsvp(event)}
        disabled={pending}
      >
        {event.rsvped ? "Cancel RSVP" : "RSVP"}
      </button>
    </article>
  );
}
