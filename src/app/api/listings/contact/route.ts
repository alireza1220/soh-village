import { configGate, failure, hashedIp, rateGate, readBody, sbHeaders, UUID, type Row } from "@/lib/server-guard";
import { LIMITS } from "@/lib/limits";
import { normalizePhone } from "@/lib/profile";
import { serverSupabase } from "@/lib/supabase";

// POST /api/listings/contact  body { id }  (PUBLIC, no login, rate limited per IP, kind "reveal")
// "Show phone": hands out the poster's CURRENT profile phone for an approved, unexpired ad. Nothing else is ever returned
// (never the address, name or any other field). Unknown, non-public or malformed ids all answer 404 not_found.
const noStore = { "Cache-Control": "no-store" };
const reply = (body: object, status = 200) => Response.json(body, { status, headers: noStore });

export async function POST(req: Request) {
  const sb = serverSupabase();
  if (!sb) return reply({ error: "not_configured" }, 503);
  const cfg = configGate();
  if (cfg) return reply({ error: "not_configured" }, 503);
  const limited = await rateGate(sb, { ipHash: hashedIp(req) }, "reveal", LIMITS.reveal.ip);
  if (limited) return Response.json(await limited.json(), { status: limited.status, headers: noStore });
  const b = await readBody(req);
  if (b instanceof Response) return reply({ error: "bad_json" }, 400);
  const id = typeof b.id === "string" ? b.id : "";
  if (!UUID.test(id)) return reply({ error: "not_found" }, 404);
  try {
    const now = encodeURIComponent(new Date().toISOString());
    const lres = await fetch(
      `${sb.url}/rest/v1/listings?select=owner_id,contact_kind,contact_value&id=eq.${id}&status=eq.approved&or=(expires_at.is.null,expires_at.gt.${now})&limit=1`,
      { headers: sbHeaders(sb), cache: "no-store" },
    );
    if (!lres.ok) return failure("reveal_listing", lres);
    const row = ((await lres.json()) as Row[])[0];
    if (!row) return reply({ error: "not_found" }, 404);
    let phone = "";
    if (typeof row.owner_id === "string" && UUID.test(row.owner_id)) {
      const pres = await fetch(`${sb.url}/rest/v1/profiles?select=phone&user_id=eq.${row.owner_id}&limit=1`, {
        headers: sbHeaders(sb),
        cache: "no-store",
      });
      if (!pres.ok) return failure("reveal_profile", pres);
      const p = ((await pres.json()) as Row[])[0];
      if (p && typeof p.phone === "string") phone = p.phone;
    }
    if (!phone && row.contact_kind === "phone" && typeof row.contact_value === "string") phone = normalizePhone(row.contact_value) ?? "";
    if (!phone) return reply({ error: "not_found" }, 404);
    return reply({ ok: true, contact: { kind: "phone", value: phone } });
  } catch (e) {
    return failure("reveal_exception", undefined, e);
  }
}
