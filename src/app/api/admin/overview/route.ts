import { adminGate, countRows } from "@/lib/admin-server";
import { LISTING_STATUSES, type AdminCounts } from "@/lib/admin-types";
import { POST_KINDS } from "@/lib/posts";
import { failure, json } from "@/lib/server-guard";

// POST /api/admin/overview  body {}  ->  { ok: true, counts: AdminCounts }. Admins only. Counts only; one cheap request each.
export async function POST(req: Request) {
  const ctx = await adminGate(req);
  if (ctx instanceof Response) return ctx;
  const { sb } = ctx;
  try {
    const jobs = [
      ...LISTING_STATUSES.map((s) => countRows(sb, "listings", `status=eq.${s}`)),
      countRows(sb, "profiles"),
      countRows(sb, "profiles", "role=eq.admin"),
      ...POST_KINDS.map((k) => countRows(sb, "posts", `kind=eq.${k}`)),
      countRows(sb, "posts", "published=eq.false"),
    ];
    const out = await Promise.all(jobs);
    const bad = out.find((x): x is Response => x instanceof Response);
    if (bad) return bad;
    const n = out as number[];
    const counts: AdminCounts = {
      listings: Object.fromEntries(LISTING_STATUSES.map((s, i) => [s, n[i]])) as AdminCounts["listings"],
      users: n[LISTING_STATUSES.length],
      admins: n[LISTING_STATUSES.length + 1],
      posts: { news: n[LISTING_STATUSES.length + 2], blog: n[LISTING_STATUSES.length + 3], event: n[LISTING_STATUSES.length + 4], drafts: n[LISTING_STATUSES.length + 5] },
    };
    return json({ ok: true, counts });
  } catch (e) {
    return failure("admin_overview_exception", undefined, e);
  }
}
