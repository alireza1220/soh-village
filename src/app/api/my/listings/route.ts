import { applyAction, findRow, type Action } from "@/lib/listing-actions";
import { publicRow } from "@/lib/listing-validation";
import { authenticate, failure, json, readBody, requireProfile, sbHeaders, UUID, type Row } from "@/lib/server-guard";
import { serverSupabase } from "@/lib/supabase";

// The logged-in poster's own listings. Every row is matched on owner_id = the verified user id (another user's id answers 404).
// list and delete need only login; update and renew also need a complete profile (403 profile_required).
export async function POST(req: Request) {
  const sb = serverSupabase();
  if (!sb) return json({ error: "not_configured" }, 503);
  const auth = await authenticate(req, sb, "manage");
  if (auth instanceof Response) return auth;
  const b = await readBody(req);
  if (b instanceof Response) return b;
  const { user } = auth;

  const action = b.action;
  if (action === "list") {
    try {
      const res = await fetch(
        `${sb.url}/rest/v1/listings?select=*&owner_id=eq.${user.id}&status=neq.removed&order=created_at.desc&limit=200`,
        { headers: sbHeaders(sb), cache: "no-store" },
      );
      if (!res.ok) return failure("my_list", res);
      const rows = (await res.json()) as Row[];
      return json({ ok: true, listings: rows.map(publicRow) });
    } catch (e) {
      return failure("my_list_exception", undefined, e);
    }
  }

  if (action !== "update" && action !== "renew" && action !== "delete") return json({ error: "bad_action" }, 400);
  let profilePhone: string | undefined;
  if (action !== "delete") {
    const profile = await requireProfile(sb, user.id);
    if (profile instanceof Response) return profile;
    profilePhone = profile.phone;
  }
  const id = typeof b.id === "string" ? b.id : "";
  if (!UUID.test(id)) return json({ error: "not_found" }, 404);
  const row = await findRow(sb, `id=eq.${id}&owner_id=eq.${user.id}`);
  if (row === "error") return json({ error: "store_failed" }, 502);
  if (!row) return json({ error: "not_found" }, 404);
  return applyAction(sb, row, action as Action, b.fields, profilePhone);
}
