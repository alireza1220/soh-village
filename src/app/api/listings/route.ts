import { configGate, hashedIp, json, rateGate, sbHeaders } from "@/lib/listing-actions";
import { parseListingInput } from "@/lib/listing-validation";
import { generateManageCode, hashManageCode, normalizeManageCode } from "@/lib/manage-code";
import { bearerFrom, verifyAccessToken } from "@/lib/server-auth";
import { serverSupabase } from "@/lib/supabase";

// Receives a market listing and stores it as "pending". Nothing is public until an admin approves it in Supabase.
// The poster gets a manage code once; only its salted hash is stored.
const MAX_PER_HOUR = 5;
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

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

  // Spam checks: a hidden field real people never fill, and a form that was open for at least 3 seconds.
  if (clip(b.website, 50)) return json({ ok: true }); // pretend success to bots
  const openedFor = Number(b.openedMs);
  if (!Number.isFinite(openedFor) || openedFor < 3000) return json({ error: "too_fast" }, 400);

  const parsed = parseListingInput(b, "create");
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  // Rate limit first (insert, then count), so garbage tokens cannot drive unlimited Auth calls.
  const ipHash = hashedIp(req);
  const limited = await rateGate(sb, ipHash, "post", MAX_PER_HOUR);
  if (limited) return limited;

  // Optional login: a valid token links the listing to the account; a bad token just posts anonymously.
  const token = bearerFrom(req);
  const user = token ? await verifyAccessToken(token) : null;

  const manageCode = generateManageCode();
  const normalized = normalizeManageCode(manageCode);
  if (!normalized) return json({ error: "store_failed" }, 502);

  try {
    const res = await fetch(`${sb.url}/rest/v1/listings`, {
      method: "POST",
      headers: { ...sbHeaders(sb), "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        ...parsed.value,
        ip_hash: ipHash,
        manage_hash: hashManageCode(normalized),
        owner_id: user?.id ?? null,
      }),
      cache: "no-store",
    });
    if (!res.ok) return json({ error: "store_failed" }, 502);
    const rows = (await res.json()) as { id?: string }[];
    const id = rows[0]?.id;
    if (!id) return json({ error: "store_failed" }, 502);
    return json({ ok: true, id, manageCode });
  } catch {
    return json({ error: "store_failed" }, 502);
  }
}
