/** Thin fetch wrapper: JSON in, JSON out, throws on non-2xx responses. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    // The API answers errors with { error: "..." }; show that reason when present.
    let reason = "";
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body.error === "string") reason = ` (${body.error})`;
    } catch {
      // Not JSON; the status code alone has to do.
    }
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status}${reason}`);
  }
  return res.json() as Promise<T>;
}
