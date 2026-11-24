import { applyAction, configGate, findRow, hashedIp, json, MANAGE_PER_HOUR, rateGate, type Action } from "@/lib/listing-actions";
import { hashManageCode, normalizeManageCode } from "@/lib/manage-code";
import { publicRow } from "@/lib/listing-validation";
import { serverSupabase } from "@/lib/supabase";

// Edit / renew / delete a listing with its manage code. Wrong and malformed codes look identical (404 not_found).
export async function POST(req: Request) {
  const sb = serverSupabase();
  if (!sb) return json({ error: "not_configured" }, 503);
  const cfg = configGate();
  if (cfg) return cfg;

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  if (!b || typeof b !== "object") return json({ error: "bad_json" }, 400);

  const action = b.action;
  if (action !== "get" && action !== "update" && action !== "renew" && action !== "delete") {
    return json({ error: "bad_action" }, 400);
  }

  // Rate limit first, before any lookup, so guessing is capped per IP.
  const limited = await rateGate(sb, hashedIp(req), "manage", MANAGE_PER_HOUR);
  if (limited) return limited;

  const code = typeof b.code === "string" ? normalizeManageCode(b.code) : null;
  if (!code) return json({ error: "not_found" }, 404);
  const row = await findRow(sb, `manage_hash=eq.${hashManageCode(code)}`);
  if (row === "error") return json({ error: "store_failed" }, 502);
  if (!row) return json({ error: "not_found" }, 404);

  if (action === "get") return json({ ok: true, listing: publicRow(row) });
  return applyAction(sb, row, action as Action, b.fields);
}
