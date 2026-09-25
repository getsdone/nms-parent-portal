import type { Star } from "./types";

interface Props {
  star: Star;
  onChange: (field: "school_name" | "school_district" | "grade", value: string) => void;
}

export default function StarFields({ star, onChange }: Props) {
  return (
    <fieldset>
      <legend>{star.first_name}</legend>
      <label>
        Grade
        <input
          type="number"
          value={star.grade}
          onChange={(e) => onChange("grade", e.target.value)}
        />
      </label>
      <label>
        School name
        <input
          type="text"
          value={star.school_name ?? ""}
          onChange={(e) => onChange("school_name", e.target.value)}
        />
      </label>
      <label>
        School district
        <input
          type="text"
          value={star.school_district ?? ""}
          onChange={(e) => onChange("school_district", e.target.value)}
        />
      </label>
    </fieldset>
  );
}
