import type { Family } from "./types";

interface Props {
  family: Family;
  onChange: (field: keyof Pick<Family, "address_line1" | "city" | "state" | "zip">, value: string) => void;
}

export default function AddressFields({ family, onChange }: Props) {
  return (
    <fieldset>
      <legend>Address</legend>
      <label>
        Street address
        <input
          type="text"
          value={family.address_line1}
          onChange={(e) => onChange("address_line1", e.target.value)}
        />
      </label>
      <label>
        City
        <input
          type="text"
          value={family.city}
          onChange={(e) => onChange("city", e.target.value)}
        />
      </label>
      <label>
        State
        <input
          type="text"
          value={family.state}
          onChange={(e) => onChange("state", e.target.value)}
        />
      </label>
      <label>
        ZIP
        <input
          type="text"
          value={family.zip}
          onChange={(e) => onChange("zip", e.target.value)}
        />
      </label>
    </fieldset>
  );
}
