import { useEffect, useState } from "react";
import { api } from "../api";
import AddressFields from "../components/profile/AddressFields";
import ParentFields from "../components/profile/ParentFields";
import StarFields from "../components/profile/StarFields";
import type { Family } from "../components/profile/types";

export default function Profile() {
  const [family, setFamily] = useState<Family | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Family>("/family")
      .then(setFamily)
      .catch((err: Error) => {
        setError(err.message);
        setStatus("error");
      });
  }, []);

  function updateAddress(field: keyof Pick<Family, "address_line1" | "city" | "state" | "zip">, value: string) {
    setFamily((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function updateParent(id: number, field: "name" | "email" | "phone", value: string) {
    setFamily((prev) =>
      prev
        ? {
            ...prev,
            parents: prev.parents.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
          }
        : prev,
    );
  }

  function updateStar(id: number, field: "school_name" | "school_district" | "grade", value: string) {
    setFamily((prev) =>
      prev
        ? {
            ...prev,
            stars: prev.stars.map((s) =>
              s.id === id ? { ...s, [field]: field === "grade" ? Number(value) : value } : s,
            ),
          }
        : prev,
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!family) return;
    setStatus("saving");
    setError(null);
    try {
      const updated = await api<Family>("/family", {
        method: "PATCH",
        body: JSON.stringify({
          address_line1: family.address_line1,
          city: family.city,
          state: family.state,
          zip: family.zip,
          parents: family.parents.map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone ?? "",
          })),
          stars: family.stars.map((s) => ({
            id: s.id,
            school_name: s.school_name ?? "",
            school_district: s.school_district ?? "",
            grade: s.grade,
          })),
        }),
      });
      setFamily(updated);
      setStatus("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setStatus("error");
    }
  }

  if (!family) {
    return status === "error" ? <p className="alert">{error}</p> : <p className="notice">Loading...</p>;
  }

  return (
    <div className="page">
      <h1 className="page__title">Profile</h1>
      <form className="form" onSubmit={handleSubmit}>
        <AddressFields family={family} onChange={updateAddress} />
        {family.parents.map((parent) => (
          <ParentFields
            key={parent.id}
            parent={parent}
            onChange={(field, value) => updateParent(parent.id, field, value)}
          />
        ))}
        {family.stars.map((star) => (
          <StarFields
            key={star.id}
            star={star}
            onChange={(field, value) => updateStar(star.id, field, value)}
          />
        ))}
        <div className="form__actions">
          <button className="btn btn--primary" type="submit" disabled={status === "saving"}>
            Save
          </button>
          {status === "saved" && <p className="notice notice--success">Saved</p>}
          {status === "error" && error && <p className="alert">{error}</p>}
        </div>
      </form>
    </div>
  );
}
