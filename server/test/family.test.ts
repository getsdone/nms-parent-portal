import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { app } from "../src/app.js";

async function withServer<T>(fn: (baseUrl: string) => Promise<T>): Promise<T> {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

interface FamilyBody {
  id: number;
  city: string;
  parents: { id: number; name: string; preferred_language: string | null; role: string }[];
  stars: { id: number; math_teacher: string | null; counselor_email: string | null }[];
}

test("GET /api/family returns family, parents, and stars for family 1", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/family`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as FamilyBody;
    assert.equal(body.id, 1);
    assert.equal(body.parents.length, 3);
    assert.equal(body.stars.length, 2);

    for (const parent of body.parents) {
      assert.ok("preferred_language" in parent);
    }
    for (const star of body.stars) {
      assert.ok("math_teacher" in star);
      assert.ok("counselor_email" in star);
    }

    const guardians = body.parents.filter((p) => p.role === "guardian");
    const caregivers = body.parents.filter((p) => p.role === "caregiver");
    assert.equal(guardians.length, 2);
    assert.equal(caregivers.length, 1);
    assert.equal(caregivers[0].name, "Rosa Alvarez");
  });
});

test("PATCH /api/family?parent=<caregiver> rejects an address change with 403", async () => {
  await withServer(async (baseUrl) => {
    const familyRes = await fetch(`${baseUrl}/api/family`);
    const family = (await familyRes.json()) as FamilyBody;
    const caregiver = family.parents.find((p) => p.role === "caregiver")!;

    const res = await fetch(`${baseUrl}/api/family?parent=${caregiver.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city: "Round Rock" }),
    });
    assert.equal(res.status, 403);
    const body = (await res.json()) as { error: string };
    assert.equal(body.error, "caregivers may only edit their own contact details");
  });
});

test("PATCH /api/family?parent=<caregiver> allows editing their own phone, then restores it", async () => {
  await withServer(async (baseUrl) => {
    const familyRes = await fetch(`${baseUrl}/api/family`);
    const family = (await familyRes.json()) as FamilyBody;
    const caregiver = family.parents.find((p) => p.role === "caregiver")! as FamilyBody["parents"][number] & {
      phone: string | null;
    };
    const originalPhone = caregiver.phone;

    const patchRes = await fetch(`${baseUrl}/api/family?parent=${caregiver.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parents: [{ id: caregiver.id, phone: "512-555-9999" }] }),
    });
    assert.equal(patchRes.status, 200);
    const patched = (await patchRes.json()) as {
      parents: { id: number; phone: string | null }[];
    };
    assert.equal(
      patched.parents.find((p) => p.id === caregiver.id)?.phone,
      "512-555-9999",
    );

    const restoreRes = await fetch(`${baseUrl}/api/family?parent=${caregiver.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parents: [{ id: caregiver.id, phone: originalPhone }] }),
    });
    assert.equal(restoreRes.status, 200);
    const restored = (await restoreRes.json()) as {
      parents: { id: number; phone: string | null }[];
    };
    assert.equal(
      restored.parents.find((p) => p.id === caregiver.id)?.phone,
      originalPhone,
    );
  });
});

test("PATCH /api/family updates a star's math_teacher then restores it", async () => {
  await withServer(async (baseUrl) => {
    const getRes = await fetch(`${baseUrl}/api/family`);
    const original = (await getRes.json()) as FamilyBody;
    const [star] = original.stars;
    const originalTeacher = star.math_teacher;

    const patchRes = await fetch(`${baseUrl}/api/family`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars: [{ id: star.id, math_teacher: "Ms. Testcase" }] }),
    });
    assert.equal(patchRes.status, 200);
    const patched = (await patchRes.json()) as FamilyBody;
    assert.equal(patched.stars.find((s) => s.id === star.id)?.math_teacher, "Ms. Testcase");

    const restoreRes = await fetch(`${baseUrl}/api/family`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars: [{ id: star.id, math_teacher: originalTeacher }] }),
    });
    assert.equal(restoreRes.status, 200);
    const restored = (await restoreRes.json()) as FamilyBody;
    assert.equal(restored.stars.find((s) => s.id === star.id)?.math_teacher, originalTeacher);
  });
});

test("PATCH /api/family updates city then restores it", async () => {
  await withServer(async (baseUrl) => {
    const getRes = await fetch(`${baseUrl}/api/family`);
    const original = (await getRes.json()) as FamilyBody;
    const originalCity = original.city;

    const patchRes = await fetch(`${baseUrl}/api/family`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city: "Round Rock" }),
    });
    assert.equal(patchRes.status, 200);
    const patched = (await patchRes.json()) as FamilyBody;
    assert.equal(patched.city, "Round Rock");

    const restoreRes = await fetch(`${baseUrl}/api/family`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city: originalCity }),
    });
    assert.equal(restoreRes.status, 200);
    const restored = (await restoreRes.json()) as FamilyBody;
    assert.equal(restored.city, originalCity);
  });
});

test("PATCH /api/family with a star id from another family returns 404 and changes nothing", async () => {
  await withServer(async (baseUrl) => {
    const beforeRes = await fetch(`${baseUrl}/api/family`);
    const before = await beforeRes.json();

    const patchRes = await fetch(`${baseUrl}/api/family`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: "Should Not Apply",
        stars: [{ id: 9999, grade: 8 }],
      }),
    });
    assert.equal(patchRes.status, 404);

    const afterRes = await fetch(`${baseUrl}/api/family`);
    const after = await afterRes.json();
    assert.deepEqual(after, before);
  });
});
