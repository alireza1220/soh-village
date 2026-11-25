import type { AdminListing, AdminPoster } from "@/lib/admin-types";
import { publicRow } from "@/lib/listing-validation";
import { toAsciiDigits } from "@/lib/profile";
import { failure, json, readBody, requireAdmin, sbHeaders, UUID, type Row, type Sb } from "@/lib/server-guard";
import { serverSupabase } from "@/lib/supabase";

// Shared helpers of the /api/admin/* routes. Server-only.
export const PAGE_SIZE = 50;
export const DAY = 86_400_000;

export type AdminCtx = { sb: Sb; user: { id: string; email: string }; body: Record<string, unknown> };

// config (503) -> login + admin role from the database (401 / 403 / 429) -> JSON body (400). The body is never read before the role check passed.
export async function adminGate(req: Request): Promise<AdminCtx | Response> {
  const sb = serverSupabase();
  if (!sb) return json({ error: "not_configured" }, 503);
  const auth = await requireAdmin(req, sb);
  if (auth instanceof Response) return auth;
  const body = await readBody(req);
  if (body instanceof Response) return body;
  return { sb, user: auth.user, body };
}

/** offset from the body: a whole number from 0 up to 100000, else 0. */
export const offsetOf = (v: unknown): number => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 100_000 ? v : 0);

/** The total after the "/" of a Content-Range header ("0-49/120" or "*\/0"). */
export const totalOf = (res: Response): number => Number(res.headers.get("content-range")?.split("/")[1] ?? 0) || 0;

/**
 * A PostgREST pattern value for ilike inside or=(...): "*text*" wrapped in double quotes, so commas, parentheses and dots in the
 * search text are plain text. % and _ and \ are escaped (they are LIKE wildcards), * and " are dropped. The caller URL-encodes the result.
 */
export function likeValue(q: string): string {
  const clean = q.replace(/[\u0000-\u001f\u007f*"]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  const pattern = clean.replace(/[\\%_]/g, "\\$&");
  return `"*${pattern.replace(/[\\"]/g, "\\$&")}*"`;
}

/** Text of a search box: a string, trimmed; "" when it is missing or not a string. */
export const queryOf = (v: unknown): string => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 80) : "");

/** Digits of a search text (Persian digits included), for matching phones. */
export const digitsOf = (q: string): string => toAsciiDigits(q).replace(/\D/g, "");

/** Counts rows with one request (count=exact, one row). Returns the number, or the 502 Response. */
export async function countRows(sb: Sb, table: "listings" | "profiles" | "posts", filter = ""): Promise<number | Response> {
  const res = await fetch(`${sb.url}/rest/v1/${table}?select=${table === "profiles" ? "user_id" : "id"}${filter ? "&" + filter : ""}`, {
    headers: { ...sbHeaders(sb), Prefer: "count=exact", Range: "0-0" },
    cache: "no-store",
  });
  if (!res.ok) return failure(`count_${table}`, res);
  return totalOf(res);
}

/** Posters of the given owner ids in ONE request. Map user id -> poster; a missing profile has no entry. */
export async function postersFor(sb: Sb, ownerIds: unknown[]): Promise<Map<string, NonNullable<AdminPoster>> | Response> {
  const ids = [...new Set(ownerIds.filter((x): x is string => typeof x === "string" && UUID.test(x)))];
  const out = new Map<string, NonNullable<AdminPoster>>();
  if (!ids.length) return out;
  const res = await fetch(`${sb.url}/rest/v1/profiles?select=user_id,first_name,family_name,phone&user_id=in.(${ids.join(",")})`, {
    headers: sbHeaders(sb),
    cache: "no-store",
  });
  if (!res.ok) return failure("admin_posters", res);
  for (const r of (await res.json()) as Row[]) {
    const userId = String(r.user_id);
    out.set(userId, { userId, firstName: String(r.first_name ?? ""), familyName: String(r.family_name ?? ""), phone: String(r.phone ?? "") });
  }
  return out;
}

/** A listing row + its poster -> AdminListing. */
export function adminListing(row: Row, posters: Map<string, NonNullable<AdminPoster>>): AdminListing {
  const owner = typeof row.owner_id === "string" ? row.owner_id : "";
  return {
    ...publicRow(row),
    poster: posters.get(owner) ?? null,
    approvedAt: typeof row.approved_at === "string" ? row.approved_at : null,
  };
}

/** PATCH one listing, only while its status is still what was read (guards against a concurrent change). Row, null (changed meanwhile) or "error". */
export async function patchListing(sb: Sb, row: Row, patch: Row): Promise<Row | null | "error"> {
  try {
    const res = await fetch(
      `${sb.url}/rest/v1/listings?id=eq.${encodeURIComponent(String(row.id))}&status=eq.${encodeURIComponent(String(row.status))}`,
      {
        method: "PATCH",
        headers: { ...sbHeaders(sb), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(patch),
        cache: "no-store",
      },
    );
    if (!res.ok) return "error";
    const rows = (await res.json()) as Row[];
    return rows[0] ?? null;
  } catch {
    return "error";
  }
}
