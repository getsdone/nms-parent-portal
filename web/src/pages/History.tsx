import { useEffect, useState } from "react";
import { api } from "../api";
import type { HistoryKind, HistoryResponse } from "../components/history/HistoryTypes";
import StarHistorySection from "../components/history/StarHistorySection";
import { useStar, withStar } from "../star";

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
  const { star, ready } = useStar();
  const starId = star?.id;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setError(null);
    const query = kind ? `?kind=${kind}` : "";
    api<HistoryResponse>(withStar(`/history${query}`, starId))
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load program history.");
      });
    return () => {
      cancelled = true;
    };
  }, [kind, ready, starId]);

  return (
    <div className="page">
      <h1 className="page__title">
        {star ? `${star.first_name}’s journey` : "Program history"}
      </h1>
      <fieldset className="segmented">
        <legend>Filter</legend>
        {FILTERS.map((filter) => (
          <label key={filter.label} className="segmented__option">
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
      {error ? <p className="alert">{error}</p> : null}
      {!error && !data ? <p className="notice">Loading…</p> : null}
      {data?.stars.map((star) => (
        <StarHistorySection key={star.id} star={star} />
      ))}
    </div>
  );
}
