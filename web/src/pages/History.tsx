import { useEffect, useState } from "react";
import { api } from "../api";
import type { HistoryKind, HistoryResponse } from "../components/history/HistoryTypes";
import StarHistorySection from "../components/history/StarHistorySection";

const FILTERS: { label: string; kind: HistoryKind | null }[] = [
  { label: "All", kind: null },
  { label: "Courses", kind: "course" },
  { label: "Competitions", kind: "competition" },
  { label: "Camps", kind: "camp" },
];

export default function History() {
  const [kind, setKind] = useState<HistoryKind | null>(null);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    const query = kind ? `?kind=${kind}` : "";
    api<HistoryResponse>(`/history${query}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load program history.");
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  return (
    <div>
      <h1>Program history</h1>
      <fieldset>
        <legend>Filter</legend>
        {FILTERS.map((filter) => (
          <label key={filter.label}>
            <input
              type="radio"
              name="history-kind"
              checked={kind === filter.kind}
              onChange={() => setKind(filter.kind)}
            />
            {filter.label}
          </label>
        ))}
      </fieldset>
      {error ? <p>{error}</p> : null}
      {!error && !data ? <p>Loading…</p> : null}
      {data?.stars.map((star) => (
        <StarHistorySection key={star.id} star={star} />
      ))}
    </div>
  );
}
