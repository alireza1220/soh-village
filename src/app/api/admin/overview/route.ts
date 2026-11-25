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
      listings: { pending: n[0], approved: n[1], rejected: n[2], removed: n[3] },
      users: n[4],
      admins: n[5],
      posts: { news: n[6], blog: n[7], event: n[8], drafts: n[9] },
    };
    return json({ ok: true, counts });
  } catch (e) {
    return failure("admin_overview_exception", undefined, e);
  }
}
