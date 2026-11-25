import { adminGate, digitsOf, likeValue, offsetOf, PAGE_SIZE, queryOf, totalOf } from "@/lib/admin-server";
import type { AdminUser } from "@/lib/admin-types";
import { failure, json, sbHeaders, UUID, type Row } from "@/lib/server-guard";

// POST /api/admin/users  body { action: "list", q?, offset? }  ->  { ok: true, users, total }. Admins only, read only.
// Roles are never changed here (only in the Supabase dashboard).
export async function POST(req: Request) {
  const ctx = await adminGate(req);
  if (ctx instanceof Response) return ctx;
  const { sb, body: b } = ctx;
  if (b.action !== "list") return json({ error: "bad_action" }, 400);

  const q = queryOf(b.q);
  const offset = offsetOf(b.offset);
  let filter = "";
  if (q) {
    const parts = [`first_name.ilike.${likeValue(q)}`, `family_name.ilike.${likeValue(q)}`];
    const d = digitsOf(q);
    if (d.length >= 3) parts.push(`phone.like.*${d}*`);
    filter = `&or=${encodeURIComponent(`(${parts.join(",")})`)}`;
  }
  try {
    const res = await fetch(
      `${sb.url}/rest/v1/profiles?select=user_id,first_name,family_name,phone,role,created_at${filter}&order=created_at.desc&limit=${PAGE_SIZE}&offset=${offset}`,
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
    const users: AdminUser[] = rows.map((r) => ({
      userId: String(r.user_id),
      firstName: String(r.first_name ?? ""),
      familyName: String(r.family_name ?? ""),
      phone: String(r.phone ?? ""),
      role: r.role === "admin" ? "admin" : "user",
      createdAt: String(r.created_at ?? ""),
      listingCount: counts.get(String(r.user_id)) ?? 0,
    }));
    return json({ ok: true, users, total });
  } catch (e) {
    return failure("admin_users_exception", undefined, e);
  }
}
