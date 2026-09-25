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
  const [tab, setTab] = useState<"upcoming" | "going">("upcoming");

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
    return <h1 className="page__title">Events</h1>;
  }

  const filtered = events.filter((e) => filter === "all" || e.kind === filter);
  const going = filtered.filter((e) => e.rsvped);
  const shown = tab === "going" ? going : filtered;

  return (
    <div className="page">
      <header>
        <h1 className="page__title">Events</h1>
        <p className="page__lede">Virtual and in person, for Stars and families.</p>
        <a className="link" href="/api/calendar.ics">
          Subscribe to your calendar
        </a>
      </header>
      {error && <p className="alert" role="alert">{error}</p>}

      <div className="event-controls">
        <div className="tabs" role="tablist" aria-label="Which events">
          <button
            type="button"
            role="tab"
            id="events-tab-upcoming"
            aria-controls="events-panel"
            aria-selected={tab === "upcoming"}
            className="tabs__tab"
            onClick={() => setTab("upcoming")}
          >
            Upcoming
          </button>
          <button
            type="button"
            role="tab"
            id="events-tab-going"
            aria-controls="events-panel"
            aria-selected={tab === "going"}
            className="tabs__tab"
            onClick={() => setTab("going")}
          >
            Going ({going.length})
          </button>
        </div>

        <fieldset className="segmented">
          <legend>Filter</legend>
          <label className="segmented__option">
            <input
              type="radio"
              name="event-filter"
              value="all"
              checked={filter === "all"}
              onChange={() => setFilter("all")}
            />
            All
          </label>
          <label className="segmented__option">
            <input
              type="radio"
              name="event-filter"
              value="virtual"
              checked={filter === "virtual"}
              onChange={() => setFilter("virtual")}
            />
            Virtual
          </label>
          <label className="segmented__option">
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
      </div>

      <section
        id="events-panel"
        role="tabpanel"
        aria-labelledby={tab === "going" ? "events-tab-going" : "events-tab-upcoming"}
      >
        {shown.length === 0 ? (
          <p className="empty">{tab === "going" ? "No RSVPs yet." : "No upcoming events."}</p>
        ) : (
          <ul className="list">
            {shown.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onToggleRsvp={toggleRsvp}
                pending={pendingId === event.id}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
