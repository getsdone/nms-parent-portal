import type { Parent } from "./types";

interface Props {
  parent: Parent;
  onChange: (field: "name" | "email" | "phone", value: string) => void;
}

export default function ParentFields({ parent, onChange }: Props) {
  return (
    <fieldset>
      <legend>{parent.is_primary ? "Primary parent" : "Parent"}</legend>
      <label>
        Name
        <input
          type="text"
          value={parent.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={parent.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </label>
      <label>
        Phone
        <input
          type="tel"
          value={parent.phone ?? ""}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </label>
    </fieldset>
  );
}
