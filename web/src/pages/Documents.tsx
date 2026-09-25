import { useEffect, useState } from "react";
import { api } from "../api";

interface DocumentRecord {
  id: number;
  title: string;
  kind: "form" | "upload" | "agreement";
  status: "received" | "under_review" | "accepted" | "needs_attention";
  submitted_at: string;
  note: string | null;
  star_id: number | null;
  todo_id: number | null;
  star_first_name: string | null;
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

// No shared badge classes exist yet on this branch (checked web/src/index.css
// and every page/component: nothing styles a status with color). Colors are
// applied inline here rather than adding new global CSS outside this file's
// scope.
const STATUS_STYLE: Record<DocumentRecord["status"], { background: string; color: string }> = {
  accepted: { background: "#d4edda", color: "#155724" },
  under_review: { background: "#fff3cd", color: "#7a5c00" },
  received: { background: "#e2e3e5", color: "#383d41" },
  needs_attention: { background: "#f8d7da", color: "#a52a2a" },
};

const STATUS_LABEL: Record<DocumentRecord["status"], string> = {
  accepted: "Accepted",
  under_review: "Under review",
  received: "Received",
  needs_attention: "Needs attention",
};

function StatusBadge({ status }: { status: DocumentRecord["status"] }) {
  return (
    <span
      style={{
        ...STATUS_STYLE[status],
        borderRadius: "999px",
        padding: "0.15rem 0.6rem",
        fontSize: "0.85rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

type Status =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; documents: DocumentRecord[] };

export default function Documents() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    api<DocumentRecord[]>("/documents")
      .then((documents) => setStatus({ kind: "ready", documents }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setStatus({ kind: "error", message });
      });
  }, []);

  return (
    <div>
      <h1>Documents</h1>
      <p>What you have sent us and where it stands.</p>

      {status.kind === "loading" && <p>Loading…</p>}
      {status.kind === "error" && <p role="alert">{status.message}</p>}
      {status.kind === "ready" && status.documents.length === 0 && (
        <p>No documents submitted yet.</p>
      )}

      {status.kind === "ready" && status.documents.length > 0 && (
        <ul>
          {status.documents.map((doc) => (
            <li key={doc.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <strong>{doc.title}</strong>
                  <p>
                    {doc.kind} · {formatDate(doc.submitted_at)}
                    {doc.star_first_name ? ` · ${doc.star_first_name}` : ""}
                  </p>
                  {doc.note && <p>{doc.note}</p>}
                </div>
                <StatusBadge status={doc.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
