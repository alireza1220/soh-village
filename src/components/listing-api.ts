// Shared client helpers for posting and "My ads": the API call. Error wording lives in src/lib/api-errors.ts.
import type { OwnListing } from "@/lib/api-types";

export { errorText } from "@/lib/api-errors";

/** A listing as its owner sees it. */
export type ManagedListing = OwnListing;

export type ApiResult = { ok: boolean; status: number; data: Record<string, unknown> };

/** POST JSON to the site's API with the visitor's access token (every write needs one). Never throws. */
export async function postJson(url: string, body: unknown, token?: string): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok && data.ok !== false, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "network" } };
  }
}
