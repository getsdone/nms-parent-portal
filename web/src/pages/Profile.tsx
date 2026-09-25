import { useEffect, useState, type ReactNode } from "react";
import { api } from "../api";
import AddressFields, { type AddressField } from "../components/profile/AddressFields";
import ParentFields, { type ParentField } from "../components/profile/ParentFields";
import StarFields, { type StarField } from "../components/profile/StarFields";
import type { Family, Parent, Star } from "../components/profile/types";
import { isCaregiver, useStar, withParent } from "../star";

type SectionKey = `parent-${number}` | "address" | "school";

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}

function show(value: string | null | undefined): string {
  return value && value.trim() !== "" ? value : "Not on file";
}

function parentPatch(p: Parent) {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone ?? "",
    preferred_language: p.preferred_language ?? "",
  };
}

/** PATCH body for one section only, in the existing /api/family shape. */
function patchBody(section: SectionKey, draft: Family, star: Star | undefined) {
  switch (section) {
    case "address":
      return { address_line1: draft.address_line1, city: draft.city, state: draft.state, zip: draft.zip };
    case "school":
      return star
        ? {
            stars: [
              {
                id: star.id,
                school_name: star.school_name ?? "",
                school_district: star.school_district ?? "",
                grade: star.grade,
                math_teacher: star.math_teacher ?? "",
                counselor_email: star.counselor_email ?? "",
              },
            ],
          }
        : {};
    default: {
      const parent = draft.parents.find((p) => `parent-${p.id}` === section);
      return parent ? { parents: [parentPatch(parent)] } : {};
    }
  }
}

interface SectionProps {
  title: ReactNode;
  editing: boolean;
  saving: boolean;
  canEdit: boolean;
  rows: [string, string][];
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  error: string | null;
  saved: boolean;
  fields: ReactNode;
}

function InfoSection({ title, editing, saving, canEdit, rows, onEdit, onCancel, onSave, error, saved, fields }: SectionProps) {
  return (
    <section className="info-card">
      <div className="info-card__head">
        <h2 className="info-card__title">{title}</h2>
        {!editing && canEdit && (
          <button type="button" className="link-button" onClick={onEdit}>
            Edit
          </button>
        )}
        {!editing && saved && <span className="notice notice--success">Saved</span>}
      </div>
      {editing ? (
        <form
          className="info-card__form"
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <div className="info-card__fields">{fields}</div>
          <div className="form__actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="btn btn--secondary" type="button" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="info-rows">
          {rows.map(([label, value]) => (
            <div className="info-rows__row" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function parentRows(p: Parent): [string, string][] {
  return [
    ["Name", show(p.name)],
    ["Email", show(p.email)],
    ["Mobile phone", show(p.phone)],
    ["Preferred language", show(p.preferred_language)],
  ];
}

export default function Profile() {
  const { family, setFamily, familyError, star: selectedStar, actingParent } = useStar();
  const [editing, setEditing] = useState<SectionKey | null>(null);
  const [draft, setDraft] = useState<Family | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSection, setSavedSection] = useState<SectionKey | null>(null);
  const [error, setError] = useState<{ section: SectionKey; message: string } | null>(null);

  useEffect(() => {
    if (savedSection === null) return;
    const t = setTimeout(() => setSavedSection(null), 2500);
    return () => clearTimeout(t);
  }, [savedSection]);

  // Switching Stars while editing the school section would save the wrong Star's draft.
  useEffect(() => {
    setEditing((cur) => (cur === "school" ? null : cur));
  }, [selectedStar?.id]);

  if (!family) {
    return familyError ? <p className="alert">{familyError}</p> : <p className="notice">Loading...</p>;
  }

  // Read mode shows the saved family; edit mode shows the draft for the open section.
  const view = editing && draft ? draft : family;
  const star = view.stars.find((s) => s.id === selectedStar?.id);

  function startEdit(section: SectionKey) {
    setDraft(family);
    setEditing(section);
    setError(null);
    setSavedSection(null);
  }

  function cancelEdit() {
    setEditing(null);
    setDraft(null);
    setError(null);
  }

  function updateAddress(field: AddressField, value: string) {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function updateParent(id: number, field: ParentField, value: string) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            parents: prev.parents.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
          }
        : prev,
    );
  }

  function updateStar(id: number, field: StarField, value: string) {
    setDraft((prev) =>
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

  async function save(section: SectionKey) {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api<Family>(withParent("/family", actingParent?.id), {
        method: "PATCH",
        body: JSON.stringify(patchBody(section, draft, star)),
      });
      setFamily(updated);
      setEditing(null);
      setDraft(null);
      setSavedSection(section);
    } catch (err) {
      setError({ section, message: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  // A caregiver may edit only their own contact card; the API enforces the same rule with 403.
  const caregiver = isCaregiver(actingParent);
  function allowed(section: SectionKey): boolean {
    if (!caregiver) return true;
    return section === `parent-${actingParent?.id}`;
  }

  function sectionProps(section: SectionKey) {
    return {
      editing: editing === section,
      saving,
      // One section edits at a time, so a Save only ever sends that section's draft.
      canEdit: editing === null && allowed(section),
      onEdit: () => startEdit(section),
      onCancel: cancelEdit,
      onSave: () => save(section),
      error: error?.section === section ? error.message : null,
      saved: savedSection === section,
    };
  }

  return (
    <div className="page">
      <header>
        <h1 className="page__title">Family info</h1>
        <p className="page__lede">Keep this current so we can reach you.</p>
      </header>

      <section className="section">
        <h2 className="section__title">Guardians and caregivers</h2>
        {view.parents.map((p) => (
          <InfoSection
            key={p.id}
            title={
              <>
                {p.name}
                <span className={`badge badge--tiny ${p.role === "guardian" ? "badge--done" : "badge--due-soon"}`}>
                  {p.role === "guardian" ? "Guardian" : "Caregiver"}
                </span>
              </>
            }
            rows={parentRows(p)}
            fields={<ParentFields parent={p} onChange={(field, value) => updateParent(p.id, field, value)} />}
            {...sectionProps(`parent-${p.id}`)}
          />
        ))}
      </section>

      <InfoSection
        title="Home address"
        rows={[
          ["Street", show(view.address_line1)],
          ["City", show(view.city)],
          ["State", show(view.state)],
          ["ZIP code", show(view.zip)],
        ]}
        fields={<AddressFields family={view} onChange={updateAddress} />}
        {...sectionProps("address")}
      />

      {star && (
        <InfoSection
          title={`${star.first_name}’s school`}
          rows={[
            ["School", show(star.school_name)],
            ["District", show(star.school_district)],
            ["Grade", ordinal(star.grade)],
            ["Math teacher", show(star.math_teacher)],
            ["School counselor", show(star.counselor_email)],
          ]}
          fields={<StarFields star={star} onChange={(field, value) => updateStar(star.id, field, value)} />}
          {...sectionProps("school")}
        />
      )}

    </div>
  );
}
