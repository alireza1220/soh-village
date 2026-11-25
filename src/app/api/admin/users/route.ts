import { adminGate, adminUserFromRow, digitsOf, likeValue, offsetOf, PAGE_SIZE, queryOf, totalOf } from "@/lib/admin-server";
import type { AdminUser } from "@/lib/admin-types";
import { failure, json, sbHeaders, UUID, type Row, type Sb } from "@/lib/server-guard";

// POST /api/admin/users (admins only)
//   { action: "list", q?, offset?, verified? }  ->  { ok: true, users, total }   (users carry the private address: only admins get here)
//   { action: "set_verified", userId, verified }  ->  { ok: true, user }          (profiles.verified + verified_at; 404 without a profile)
// Roles are never changed here (only in the Supabase dashboard).
const COLS = "user_id,first_name,family_name,phone,address,verified,verified_at,role,created_at";

async function setVerified(sb: Sb, b: Record<string, unknown>): Promise<Response> {
  const userId = typeof b.userId === "string" ? b.userId : "";
  if (!UUID.test(userId)) return json({ error: "not_found" }, 404);
  if (typeof b.verified !== "boolean") return json({ error: "bad_fields" }, 400);
  try {
    // Verifying again must not overwrite the original verified_at: only write on a real change.
    const cond = b.verified ? "&or=(verified.eq.false,verified_at.is.null)" : "";
    const res = await fetch(`${sb.url}/rest/v1/profiles?user_id=eq.${userId}${cond}&select=${COLS}`, {
      method: "PATCH",
      headers: { ...sbHeaders(sb), "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ verified: b.verified, verified_at: b.verified ? new Date().toISOString() : null }),
      cache: "no-store",
    });
    if (!res.ok) return failure("admin_users_verify", res);
    let rows = (await res.json()) as Row[];
    if (!rows[0] && b.verified) {
      const gr = await fetch(`${sb.url}/rest/v1/profiles?user_id=eq.${userId}&select=${COLS}&limit=1`, { headers: sbHeaders(sb), cache: "no-store" });
      if (!gr.ok) return failure("admin_users_verify", gr);
      rows = (await gr.json()) as Row[];
    }
    if (!rows[0]) return json({ error: "not_found" }, 404);
    const lr = await fetch(`${sb.url}/rest/v1/listings?select=owner_id&owner_id=eq.${userId}&status=neq.removed&limit=1`, {
      headers: { ...sbHeaders(sb), Prefer: "count=exact" },
      cache: "no-store",
    });
    if (!lr.ok) return failure("admin_users_counts", lr);
    return json({ ok: true, user: adminUserFromRow(rows[0], totalOf(lr)) });
  } catch (e) {
    return failure("admin_users_exception", undefined, e);
  }
}
export async function POST(req: Request) {
  const ctx = await adminGate(req);
  if (ctx instanceof Response) return ctx;
  const { sb, body: b } = ctx;
  if (b.action === "set_verified") return setVerified(sb, b);
  if (b.action !== "list") return json({ error: "bad_action" }, 400);
  if (b.verified !== undefined && typeof b.verified !== "boolean") return json({ error: "bad_fields" }, 400);

  const q = queryOf(b.q);
  const offset = offsetOf(b.offset);
  let filter = "";
  if (q) {
    const parts = [`first_name.ilike.${likeValue(q)}`, `family_name.ilike.${likeValue(q)}`];
    const d = digitsOf(q);
    if (d.length >= 3) parts.push(`phone.like.*${d}*`);
    filter = `&or=${encodeURIComponent(`(${parts.join(",")})`)}`;
  }
  if (typeof b.verified === "boolean") filter += `&verified=eq.${b.verified}`;
  try {
    const res = await fetch(
      `${sb.url}/rest/v1/profiles?select=${COLS}${filter}&order=created_at.desc&limit=${PAGE_SIZE}&offset=${offset}`,
      { headers: { ...sbHeaders(sb), Prefer: "count=exact" }, cache: "no-store" },
    );
    if (!res.ok) return failure("admin_users_list", res);
    const total = totalOf(res);
    const rows = (await res.json()) as Row[];
    // One exact head count per user on this page (removed ads do not count); a single big fetch would be capped by max-rows.
    const ids = rows.map((r) => String(r.user_id)).filter((x) => UUID.test(x));
    const counts = new Map<string, number>();
    const results = await Promise.all(ids.map(async (id) => {
      const lr = await fetch(`${sb.url}/rest/v1/listings?select=owner_id&owner_id=eq.${id}&status=neq.removed&limit=1`, {
        headers: { ...sbHeaders(sb), Prefer: "count=exact" },
        cache: "no-store",
      });
      return { id, lr };
    }));
    for (const { id, lr } of results) {
      if (!lr.ok) return failure("admin_users_counts", lr);
      counts.set(id, totalOf(lr));
    }
    const users: AdminUser[] = rows.map((r) => adminUserFromRow(r, counts.get(String(r.user_id)) ?? 0));
    return json({ ok: true, users, total });
  } catch (e) {
    return failure("admin_users_exception", undefined, e);
  }
}
