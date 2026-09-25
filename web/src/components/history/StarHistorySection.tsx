import type { StarHistory } from "./HistoryTypes";

function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate && !endDate) return "Dates not recorded";
  if (startDate && endDate && startDate !== endDate) return `${startDate} to ${endDate}`;
  return startDate ?? endDate ?? "Dates not recorded";
}

export default function StarHistorySection({ star }: { star: StarHistory }) {
  return (
    <section>
      <h2>
        {star.first_name}, grade {star.grade}
      </h2>
      {star.history.length === 0 ? (
        <p>No program history for this filter.</p>
      ) : (
        <ul>
          {star.history.map((entry) => (
            <li key={entry.id}>
              <p>
                <strong>{entry.kind}</strong>: {entry.title}
                {entry.provider ? ` (${entry.provider})` : ""}
              </p>
              <p>{formatDateRange(entry.start_date, entry.end_date)}</p>
              {entry.result ? <p>Result: {entry.result}</p> : null}
              {entry.notes ? <p>{entry.notes}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
