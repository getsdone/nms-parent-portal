import type { Star } from "./types";

export type StarField = "school_name" | "school_district" | "grade" | "math_teacher" | "counselor_email";

interface Props {
  star: Star;
  onChange: (field: StarField, value: string) => void;
}

/** Inputs only; the Family info section card supplies the heading and actions. */
export default function StarFields({ star, onChange }: Props) {
  return (
    <>
      <label className="field">
        School
        <input
          type="text"
          value={star.school_name ?? ""}
          onChange={(e) => onChange("school_name", e.target.value)}
        />
      </label>
      <label className="field">
        District
        <input
          type="text"
          value={star.school_district ?? ""}
          onChange={(e) => onChange("school_district", e.target.value)}
        />
      </label>
      <label className="field">
        Grade
        <input
          type="number"
          value={star.grade}
          onChange={(e) => onChange("grade", e.target.value)}
        />
      </label>
      <label className="field">
        Math teacher
        <input
          type="text"
          value={star.math_teacher ?? ""}
          onChange={(e) => onChange("math_teacher", e.target.value)}
        />
      </label>
      <label className="field">
        School counselor
        <input
          type="email"
          value={star.counselor_email ?? ""}
          onChange={(e) => onChange("counselor_email", e.target.value)}
        />
      </label>
    </>
  );
}
