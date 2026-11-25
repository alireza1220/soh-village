import { boardOf, parseListingInput } from "@/lib/listing-validation";
import { authenticate, failure, json, readBody, requireProfile, sbHeaders } from "@/lib/server-guard";
import { serverSupabase } from "@/lib/supabase";

const MAX_LIVE_ADS = 20;

// Creates a listing for the logged-in poster. It goes LIVE AT ONCE (status "approved", 30-day expiry): nobody reviews it first.
// Admins take ads down afterwards. The DB trigger listing_on_approve runs on UPDATE only, so approved_at / expires_at are set here.
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

  const now = new Date();
  try {
    // Cap on live ads per account (ads go public at once, so one account must not flood the board).
    const nowIso = encodeURIComponent(now.toISOString());
    const cnt = await fetch(
      `${sb.url}/rest/v1/listings?select=id&owner_id=eq.${auth.user.id}&status=eq.approved&or=(expires_at.is.null,expires_at.gt.${nowIso})`,
      { headers: { ...sbHeaders(sb), Prefer: "count=exact", Range: "0-0" }, cache: "no-store" },
    );
    if (!cnt.ok) return failure("listing_count", cnt);
    const live = Number(cnt.headers.get("content-range")?.split("/")[1] ?? 0);
    if (live >= MAX_LIVE_ADS) return json({ error: "too_many_listings" }, 429);
    const res = await fetch(`${sb.url}/rest/v1/listings`, {
      method: "POST",
      headers: { ...sbHeaders(sb), "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ ...parsed.value, board, ip_hash: auth.ipHash, owner_id: auth.user.id, status: "approved", approved_at: now.toISOString(), expires_at: new Date(now.getTime() + 30 * 86_400_000).toISOString() }),
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
