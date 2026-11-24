import { applyAction, configGate, findRow, json, sbHeaders, type Action, type Row } from "@/lib/listing-actions";
import { publicRow } from "@/lib/listing-validation";
import { bearerFrom, verifyAccessToken } from "@/lib/server-auth";
import { serverSupabase } from "@/lib/supabase";

// The logged-in poster's own listings. Every row is matched on owner_id = the verified user id.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const sb = serverSupabase();
  if (!sb) return json({ error: "not_configured" }, 503);
  const cfg = configGate();
  if (cfg) return cfg;

  const token = bearerFrom(req);
  const user = token ? await verifyAccessToken(token) : null;
  if (!user || !UUID.test(user.id)) return json({ error: "unauthorized" }, 401);

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  if (!b || typeof b !== "object") return json({ error: "bad_json" }, 400);

  const action = b.action;
  if (action === "list") {
    try {
      const res = await fetch(
        `${sb.url}/rest/v1/listings?select=*&owner_id=eq.${user.id}&status=neq.removed&order=created_at.desc&limit=200`,
        { headers: sbHeaders(sb), cache: "no-store" },
      );
      if (!res.ok) return json({ error: "store_failed" }, 502);
      const rows = (await res.json()) as Row[];
      return json({ ok: true, listings: rows.map(publicRow) });
    } catch {
      return json({ error: "store_failed" }, 502);
    }
  }

  if (action !== "update" && action !== "renew" && action !== "delete") return json({ error: "bad_action" }, 400);
  const id = typeof b.id === "string" ? b.id : "";
  if (!UUID.test(id)) return json({ error: "not_found" }, 404);
  const row = await findRow(sb, `id=eq.${id}&owner_id=eq.${user.id}`);
  if (row === "error") return json({ error: "store_failed" }, 502);
  if (!row) return json({ error: "not_found" }, 404);
  return applyAction(sb, row, action as Action, b.fields);
}
