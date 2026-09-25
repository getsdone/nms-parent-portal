import { useEffect, useState } from "react";
import { api } from "../api";
import EventCard, { type EventRecord } from "../components/events/EventCard";

type Filter = "all" | "virtual" | "in_person";

export default function Events() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    api<EventRecord[]>("/events")
      .then(setEvents)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggleRsvp(event: EventRecord) {
    const nextRsvped = !event.rsvped;
    setPendingId(event.id);
    // Optimistic update: flip immediately, roll back if the request fails.
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, rsvped: nextRsvped } : e)),
    );
    try {
      const updated = await api<EventRecord>(`/events/${event.id}/rsvp`, {
        method: nextRsvped ? "POST" : "DELETE",
      });
      setEvents((prev) => prev.map((e) => (e.id === event.id ? updated : e)));
    } catch (err) {
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, rsvped: event.rsvped } : e)),
      );
      setError((err as Error).message);
    } finally {
      setPendingId(null);
    }
  }

  if (loading) {
    return <h1>Events</h1>;
  }

  const filtered = events.filter((e) => filter === "all" || e.kind === filter);
  const going = filtered.filter((e) => e.rsvped);
  const upcoming = filtered.filter((e) => !e.rsvped);

  return (
    <div>
      <h1>Events</h1>
      <a className="link" href="/api/calendar.ics">
        Subscribe to your calendar
      </a>
      {error && <p role="alert">{error}</p>}

      <fieldset>
        <legend>Filter</legend>
        <label>
          <input
            type="radio"
            name="event-filter"
            value="all"
            checked={filter === "all"}
            onChange={() => setFilter("all")}
          />
          All
        </label>
        <label>
          <input
            type="radio"
            name="event-filter"
            value="virtual"
            checked={filter === "virtual"}
            onChange={() => setFilter("virtual")}
          />
          Virtual
        </label>
        <label>
          <input
            type="radio"
            name="event-filter"
            value="in_person"
            checked={filter === "in_person"}
            onChange={() => setFilter("in_person")}
          />
          In person
        </label>
      </fieldset>

      <section>
        <h2>You&rsquo;re going</h2>
        {going.length === 0 ? (
          <p>No RSVPs yet.</p>
        ) : (
          going.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onToggleRsvp={toggleRsvp}
              pending={pendingId === event.id}
            />
          ))
        )}
      </section>

      <section>
        <h2>Upcoming</h2>
        {upcoming.length === 0 ? (
          <p>No other upcoming events.</p>
        ) : (
          upcoming.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onToggleRsvp={toggleRsvp}
              pending={pendingId === event.id}
            />
          ))
        )}
      </section>
    </div>
  );
}
