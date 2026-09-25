export type HistoryKind = "course" | "competition" | "camp";

export type HistoryEntry = {
  id: number;
  kind: HistoryKind;
  title: string;
  provider: string | null;
  start_date: string | null;
  end_date: string | null;
  result: string | null;
  notes: string | null;
};

export type StarHistory = {
  id: number;
  first_name: string;
  grade: number;
  history: HistoryEntry[];
};

export type HistoryResponse = {
  stars: StarHistory[];
};
