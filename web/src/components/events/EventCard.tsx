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
    <article>
      <h3>{event.title}</h3>
      <p>{event.kind === "virtual" ? "Virtual" : "In person"}</p>
      <p>{formatDateTime(event.starts_at)}</p>
      {event.location && <p>{event.location}</p>}
      {event.description && <p>{event.description}</p>}
      {event.rsvp_deadline && <p>RSVP by {formatDateTime(event.rsvp_deadline)}</p>}
      <button type="button" onClick={() => onToggleRsvp(event)} disabled={pending}>
        {event.rsvped ? "Cancel RSVP" : "RSVP"}
      </button>
    </article>
  );
}
