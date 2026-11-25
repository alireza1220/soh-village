import { adminGate, adminListing, DAY, likeValue, offsetOf, PAGE_SIZE, patchListing, postersFor, queryOf, totalOf } from "@/lib/admin-server";
import { isListingStatus } from "@/lib/admin-types";
import { isBoard } from "@/lib/boards";
import { findRow, purgeImages } from "@/lib/listing-actions";
import { parseListingInput } from "@/lib/listing-validation";
import { failure, json, sbHeaders, UUID, type Row, type Sb } from "@/lib/server-guard";

// POST /api/admin/listings  (admins only; see src/lib/admin-types.ts)
//   list: status (default "pending", or "all"), board, q (title / details), offset; 50 per page, newest first.
//   set_status: approve / reject / remove / put back to pending. update: fix the text fields (photos are not touched here).
export async function POST(req: Request) {
  const ctx = await adminGate(req);
  if (ctx instanceof Response) return ctx;
  const { sb, body: b } = ctx;
  try {
    if (b.action === "list") return await list(ctx);
    if (b.action !== "set_status" && b.action !== "update") return json({ error: "bad_action" }, 400);

    const id = typeof b.id === "string" ? b.id : "";
    if (!UUID.test(id)) return json({ error: "not_found" }, 404);
    if (b.action === "set_status" && !isListingStatus(b.status)) return json({ error: "bad_status" }, 400);
    const row = await findRow(sb, `id=eq.${id}`);
    if (row === "error") return failure("admin_listing_find");
    if (!row) return json({ error: "not_found" }, 404);

    const posters = await postersFor(sb, [row.owner_id]);
    if (posters instanceof Response) return posters;
    const answer = (r: Row) => json({ ok: true, listing: adminListing(r, posters) });

    if (b.action === "set_status") {
      const status = b.status as string;
      if (row.status === status) {
        if (status === "removed") await purgeImages(sb, row); // a retry of a remove that left photos behind
        return answer(row);
      }
      const patch: Row = { status };
      if (status === "approved") {
        // Like the DB trigger: only the FIRST approval starts the clock; a re-approval after an edit must not renew the ad.
        const now = Date.now();
        if (typeof row.approved_at !== "string") {
          patch.approved_at = new Date(now).toISOString();
          patch.expires_at = new Date(now + 30 * DAY).toISOString();
        } else {
          const old = typeof row.expires_at === "string" ? Date.parse(row.expires_at) : NaN;
          if (Number.isNaN(old) || old <= now) patch.expires_at = new Date(now + 30 * DAY).toISOString(); // an expired ad does not stay dead
        }
      }
      const out = await patchListing(sb, row, patch);
      if (out === "error") return failure("admin_listing_status");
      if (!out) return json({ error: "conflict" }, 409);
      if (status === "removed") await purgeImages(sb, row); // best effort; the nightly sweep retries
      return answer(status === "removed" ? { ...out, images: [] } : out);
    }

    // update: the admin fixes text fields. Contact fields are ignored (the phone always comes from the poster's profile). Photos are left alone.
    if (!b.fields || typeof b.fields !== "object" || Array.isArray(b.fields)) return json({ error: "bad_fields" }, 400);
    const fields = { ...(b.fields as Record<string, unknown>) };
    delete fields.images;
    const parsed = parseListingInput(fields, "update", {
      board: isBoard(row.board) ? row.board : "market",
      currentType: String(row.type ?? ""),
      currentCategory: String(row.category ?? ""),
    });
    if (!parsed.ok) return json({ error: parsed.error }, 400);
    if (Object.keys(parsed.value).length === 0) return answer(row);
    const out = await patchListing(sb, row, { ...parsed.value });
    if (out === "error") return failure("admin_listing_update");
    if (!out) return json({ error: "conflict" }, 409);
    return answer(out);
  } catch (e) {
    return failure("admin_listings_exception", undefined, e);
  }
}

async function list({ sb, body: b }: { sb: Sb; body: Record<string, unknown> }): Promise<Response> {
  const status = b.status === undefined ? "pending" : b.status;
  if (status !== "all" && !isListingStatus(status)) return json({ error: "bad_status" }, 400);
  if (b.board !== undefined && b.board !== null && b.board !== "all" && !isBoard(b.board)) return json({ error: "bad_board" }, 400);
  let filter = "";
  if (status !== "all") filter += `&status=eq.${status}`;
  if (isBoard(b.board)) filter += `&board=eq.${b.board}`;
  const q = queryOf(b.q);
  if (q) filter += `&or=${encodeURIComponent(`(title.ilike.${likeValue(q)},details.ilike.${likeValue(q)})`)}`;
  const res = await fetch(
    `${sb.url}/rest/v1/listings?select=*${filter}&order=created_at.desc&limit=${PAGE_SIZE}&offset=${offsetOf(b.offset)}`,
    { headers: { ...sbHeaders(sb), Prefer: "count=exact" }, cache: "no-store" },
  );
  if (!res.ok) return failure("admin_listings_list", res);
  const total = totalOf(res);
  const rows = (await res.json()) as Row[];
  const posters = await postersFor(sb, rows.map((r) => r.owner_id));
  if (posters instanceof Response) return posters;
  return json({ ok: true, listings: rows.map((r) => adminListing(r, posters)), total });
}
