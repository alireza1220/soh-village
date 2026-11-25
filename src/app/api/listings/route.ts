import { boardOf, parseListingInput } from "@/lib/listing-validation";
import { authenticate, failure, json, readBody, requireProfile, sbHeaders } from "@/lib/server-guard";
import { serverSupabase } from "@/lib/supabase";

// Creates a listing for the logged-in poster, status "pending". Nothing is public until an admin approves it in Supabase.
// Gate: Bearer token (401) > IP + user rate limits (429) > profile complete (403 profile_required).
export async function POST(req: Request) {
  const sb = serverSupabase();
  if (!sb) return json({ error: "not_configured" }, 503);
  const auth = await authenticate(req, sb, "post");
  if (auth instanceof Response) return auth;
  const b = await readBody(req);
  if (b instanceof Response) return b;
  const profile = await requireProfile(sb, auth.user.id);
  if (profile instanceof Response) return profile;

  // Old clients may still send a honeypot ("website") or "openedMs": both are ignored.
  const board = boardOf(b);
  if (!board) return json({ error: "bad_board" }, 400);
  const parsed = parseListingInput(b, "create", { board, profilePhone: profile.phone });
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  try {
    const res = await fetch(`${sb.url}/rest/v1/listings`, {
      method: "POST",
      headers: { ...sbHeaders(sb), "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ ...parsed.value, board, ip_hash: auth.ipHash, owner_id: auth.user.id }),
      cache: "no-store",
    });
    if (!res.ok) return failure("listing_insert", res);
    const rows = (await res.json()) as { id?: string }[];
    const id = rows[0]?.id;
    if (!id) return json({ error: "store_failed" }, 502);
    return json({ ok: true, id });
  } catch (e) {
    return failure("listing_exception", undefined, e);
  }
}
