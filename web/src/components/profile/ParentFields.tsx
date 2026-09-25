import type { Parent } from "./types";

export type ParentField = "name" | "email" | "phone" | "preferred_language";

interface Props {
  parent: Parent;
  onChange: (field: ParentField, value: string) => void;
}

/** Inputs only; the Family info section card supplies the heading and actions. */
export default function ParentFields({ parent, onChange }: Props) {
  return (
    <>
      <label className="field">
        Name
        <input
          type="text"
          value={parent.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </label>
      <label className="field">
        Email
        <input
          type="email"
          value={parent.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </label>
      <label className="field">
        Mobile phone
        <input
          type="tel"
          value={parent.phone ?? ""}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </label>
      <label className="field">
        Preferred language
        <input
          type="text"
          value={parent.preferred_language ?? ""}
          onChange={(e) => onChange("preferred_language", e.target.value)}
        />
      </label>
    </>
  );
}
