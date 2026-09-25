import { Router } from "express";
import type { Pool, PoolClient } from "pg";
import { pool } from "../db.js";

const FAMILY_ID = 1;

const router = Router();

interface FamilyResponse {
  id: number;
  name: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  parents: Array<{
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    is_primary: boolean;
    preferred_language: string | null;
    role: string;
  }>;
  stars: Array<{
    id: number;
    first_name: string;
    grade: number;
    school_name: string | null;
    school_district: string | null;
    math_teacher: string | null;
    counselor_email: string | null;
  }>;
}

async function loadFamily(
  client: Pool | PoolClient,
): Promise<FamilyResponse | null> {
  const familyResult = await client.query(
    "SELECT id, name, address_line1, city, state, zip FROM families WHERE id = $1",
    [FAMILY_ID],
  );
  const family = familyResult.rows[0];
  if (!family) {
    return null;
  }

  const parentsResult = await client.query(
    "SELECT id, name, email, phone, is_primary, preferred_language, role FROM parents WHERE family_id = $1 ORDER BY id",
    [FAMILY_ID],
  );
  const starsResult = await client.query(
    "SELECT id, first_name, grade, school_name, school_district, math_teacher, counselor_email FROM stars WHERE family_id = $1 ORDER BY id",
    [FAMILY_ID],
  );

  return {
    ...family,
    parents: parentsResult.rows,
    stars: starsResult.rows,
  };
}

router.get("/", async (_req, res) => {
  const family = await loadFamily(pool);
  if (!family) {
    res.status(404).json({ error: "family not found" });
    return;
  }
  res.json(family);
});

interface StarPatch {
  id: number;
  school_name?: string;
  school_district?: string;
  grade?: number;
  math_teacher?: string;
  counselor_email?: string;
}

interface ParentPatch {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  preferred_language?: string;
}

interface FamilyPatchBody {
  address_line1?: unknown;
  city?: unknown;
  state?: unknown;
  zip?: unknown;
  stars?: unknown;
  parents?: unknown;
}

// Every field is optional and validated independently, so one bad field name
// error message points at the exact key rather than a generic "bad request".
function validatePatch(body: FamilyPatchBody): string | null {
  for (const key of ["address_line1", "city", "state", "zip"] as const) {
    const value = body[key];
    if (value !== undefined && typeof value !== "string") {
      return `${key} must be a string`;
    }
  }

  if (body.stars !== undefined) {
    if (!Array.isArray(body.stars)) {
      return "stars must be an array";
    }
    for (const star of body.stars) {
      if (typeof star !== "object" || star === null || !Number.isInteger((star as StarPatch).id)) {
        return "each star must have an integer id";
      }
      const s = star as StarPatch;
      if (s.school_name !== undefined && typeof s.school_name !== "string") {
        return "star school_name must be a string";
      }
      if (s.school_district !== undefined && typeof s.school_district !== "string") {
        return "star school_district must be a string";
      }
      if (s.grade !== undefined && !Number.isInteger(s.grade)) {
        return "star grade must be an integer";
      }
      if (s.math_teacher !== undefined && typeof s.math_teacher !== "string") {
        return "star math_teacher must be a string";
      }
      if (s.counselor_email !== undefined && typeof s.counselor_email !== "string") {
        return "star counselor_email must be a string";
      }
    }
  }

  if (body.parents !== undefined) {
    if (!Array.isArray(body.parents)) {
      return "parents must be an array";
    }
    for (const parent of body.parents) {
      if (typeof parent !== "object" || parent === null || !Number.isInteger((parent as ParentPatch).id)) {
        return "each parent must have an integer id";
      }
      const p = parent as ParentPatch;
      if (p.name !== undefined && typeof p.name !== "string") {
        return "parent name must be a string";
      }
      if (p.email !== undefined && typeof p.email !== "string") {
        return "parent email must be a string";
      }
      if (p.phone !== undefined && typeof p.phone !== "string") {
        return "parent phone must be a string";
      }
      if (p.preferred_language !== undefined && typeof p.preferred_language !== "string") {
        return "parent preferred_language must be a string";
      }
    }
  }

  return null;
}

router.patch("/", async (req, res) => {
  const body = req.body as FamilyPatchBody;
  const validationError = validatePatch(body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const stars = (body.stars ?? []) as StarPatch[];
  const parents = (body.parents ?? []) as ParentPatch[];

  // ?parent=<id> is the prototype's stand-in for a logged-in session (see
  // WP8 plan: no auth yet, the client sends who is acting). Absent, this
  // patch keeps today's unrestricted guardian behavior.
  const parentQuery = req.query.parent;
  if (parentQuery !== undefined) {
    const actingParentId = Number(parentQuery);
    if (
      typeof parentQuery !== "string" ||
      !Number.isInteger(actingParentId) ||
      actingParentId <= 0
    ) {
      res.status(400).json({ error: "parent must be a positive integer" });
      return;
    }
    const roleResult = await pool.query<{ role: string }>(
      "SELECT role FROM parents WHERE id = $1 AND family_id = $2",
      [actingParentId, FAMILY_ID],
    );
    const role = roleResult.rows[0]?.role;
    if (role === "caregiver") {
      const onlyOwnContactRow =
        body.address_line1 === undefined &&
        body.city === undefined &&
        body.state === undefined &&
        body.zip === undefined &&
        body.stars === undefined &&
        parents.length === 1 &&
        parents[0].id === actingParentId;
      if (!onlyOwnContactRow) {
        res.status(403).json({
          error: "caregivers may only edit their own contact details",
        });
        return;
      }
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Every id must belong to family 1 before any write happens, so a bad id
    // anywhere in the payload fails the whole request with nothing written.
    if (stars.length > 0) {
      const starIds = stars.map((s) => s.id);
      const owned = await client.query(
        "SELECT id FROM stars WHERE family_id = $1 AND id = ANY($2::int[])",
        [FAMILY_ID, starIds],
      );
      const ownedIds = new Set(owned.rows.map((r) => r.id));
      if (starIds.some((id) => !ownedIds.has(id))) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "star id not found for this family" });
        return;
      }
    }

    if (parents.length > 0) {
      const parentIds = parents.map((p) => p.id);
      const owned = await client.query(
        "SELECT id FROM parents WHERE family_id = $1 AND id = ANY($2::int[])",
        [FAMILY_ID, parentIds],
      );
      const ownedIds = new Set(owned.rows.map((r) => r.id));
      if (parentIds.some((id) => !ownedIds.has(id))) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "parent id not found for this family" });
        return;
      }
    }

    const addressFields: Array<[string, string]> = [];
    for (const key of ["address_line1", "city", "state", "zip"] as const) {
      const value = body[key];
      if (value !== undefined) {
        addressFields.push([key, value as string]);
      }
    }
    if (addressFields.length > 0) {
      const setClause = addressFields
        .map(([key], i) => `${key} = $${i + 2}`)
        .join(", ");
      const values = addressFields.map(([, value]) => value);
      await client.query(
        `UPDATE families SET ${setClause} WHERE id = $1`,
        [FAMILY_ID, ...values],
      );
    }

    for (const star of stars) {
      const fields: Array<[string, string | number]> = [];
      if (star.school_name !== undefined) fields.push(["school_name", star.school_name]);
      if (star.school_district !== undefined) fields.push(["school_district", star.school_district]);
      if (star.grade !== undefined) fields.push(["grade", star.grade]);
      if (star.math_teacher !== undefined) fields.push(["math_teacher", star.math_teacher]);
      if (star.counselor_email !== undefined) fields.push(["counselor_email", star.counselor_email]);
      if (fields.length === 0) continue;
      const setClause = fields.map(([key], i) => `${key} = $${i + 2}`).join(", ");
      const values = fields.map(([, value]) => value);
      await client.query(`UPDATE stars SET ${setClause} WHERE id = $1`, [star.id, ...values]);
    }

    for (const parent of parents) {
      const fields: Array<[string, string]> = [];
      if (parent.name !== undefined) fields.push(["name", parent.name]);
      if (parent.email !== undefined) fields.push(["email", parent.email]);
      if (parent.phone !== undefined) fields.push(["phone", parent.phone]);
      if (parent.preferred_language !== undefined) fields.push(["preferred_language", parent.preferred_language]);
      if (fields.length === 0) continue;
      const setClause = fields.map(([key], i) => `${key} = $${i + 2}`).join(", ");
      const values = fields.map(([, value]) => value);
      await client.query(`UPDATE parents SET ${setClause} WHERE id = $1`, [parent.id, ...values]);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const family = await loadFamily(pool);
  res.json(family);
});

export default router;
