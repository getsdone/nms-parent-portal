import type { Family } from "./types";

export type AddressField = keyof Pick<Family, "address_line1" | "city" | "state" | "zip">;

interface Props {
  family: Family;
  onChange: (field: AddressField, value: string) => void;
}

/** Inputs only; the Family info section card supplies the heading and actions. */
export default function AddressFields({ family, onChange }: Props) {
  return (
    <>
      <label className="field">
        Street
        <input
          type="text"
          autoComplete="street-address"
          value={family.address_line1}
          onChange={(e) => onChange("address_line1", e.target.value)}
        />
      </label>
      <label className="field">
        City
        <input
          type="text"
          autoComplete="address-level2"
          value={family.city}
          onChange={(e) => onChange("city", e.target.value)}
        />
      </label>
      <label className="field">
        State
        <input
          type="text"
          autoComplete="address-level1"
          value={family.state}
          onChange={(e) => onChange("state", e.target.value)}
        />
      </label>
      <label className="field">
        ZIP code
        <input
          type="text"
          autoComplete="postal-code"
          value={family.zip}
          onChange={(e) => onChange("zip", e.target.value)}
        />
      </label>
    </>
  );
}
