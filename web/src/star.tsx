import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Family, Star } from "./components/profile/types";

const STORAGE_KEY = "nms.star";

interface StarContextValue {
  /** The selected Star, or null until /api/family loads (or if it has no Stars). */
  star: Star | null;
  stars: Star[];
  setStar: (id: number) => void;
  family: Family | null;
  /** Replace the cached family, e.g. with a PATCH /api/family response. */
  setFamily: (family: Family) => void;
  familyError: string | null;
  /**
   * True once /api/family has answered, either way. Pages wait for this so
   * they fetch once with ?star= instead of once without and again with it.
   */
  ready: boolean;
}

const StarContext = createContext<StarContextValue | null>(null);

function readStoredId(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const id = raw === null ? NaN : Number(raw);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}

export function StarProvider({ children }: { children: ReactNode }) {
  const [family, setFamily] = useState<Family | null>(null);
  const [familyError, setFamilyError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(readStoredId);

  useEffect(() => {
    api<Family>("/family")
      .then(setFamily)
      .catch((err) => setFamilyError(err instanceof Error ? err.message : String(err)));
  }, []);

  const setStar = useCallback((id: number) => {
    setSelectedId(id);
    try {
      localStorage.setItem(STORAGE_KEY, String(id));
    } catch {
      // Blocked storage: the choice lasts for this visit only.
    }
  }, []);

  const stars = family?.stars ?? [];
  // A stored id that no longer matches a Star falls back to the first one.
  const star = stars.find((s) => s.id === selectedId) ?? stars[0] ?? null;
  const ready = family !== null || familyError !== null;

  return (
    <StarContext.Provider value={{ star, stars, setStar, family, setFamily, familyError, ready }}>
      {children}
    </StarContext.Provider>
  );
}

export function useStar(): StarContextValue {
  const ctx = useContext(StarContext);
  if (!ctx) throw new Error("useStar must be used inside <StarProvider>");
  return ctx;
}

/**
 * Adds star=<id> to an API path. With no Star known, the path is unchanged
 * and the API returns every Star's rows.
 */
export function withStar(path: string, starId: number | null | undefined): string {
  if (starId == null) return path;
  return `${path}${path.includes("?") ? "&" : "?"}star=${starId}`;
}
