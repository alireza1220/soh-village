import { createHash } from "node:crypto";
import { CONTACT_KINDS, LISTING_CATEGORIES, LISTING_TYPES } from "@/lib/market";
import { serverSupabase } from "@/lib/supabase";

// Receives a market listing and stores it as "pending". Nothing is public until an admin approves it in Supabase.
const MAX_PER_HOUR = 5;
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const json = (body: object, status = 200) => Response.json(body, { status });

export async function POST(req: Request) {
  const sb = serverSupabase();
  if (!sb) return json({ error: "not_configured" }, 503);

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  // Spam checks: a hidden field real people never fill, and a form that was open for at least 3 seconds.
  if (clip(b.website, 50)) return json({ ok: true }); // pretend success to bots
  const openedFor = Number(b.openedMs);
  if (!Number.isFinite(openedFor) || openedFor < 3000) return json({ error: "too_fast" }, 400);

  const type = clip(b.type, 20);
  const category = clip(b.category, 20);
  const title = clip(b.title, 120);
  const area = clip(b.area, 80);
  if (!LISTING_TYPES.some((t) => t.v === type)) return json({ error: "bad_type" }, 400);
  if (!LISTING_CATEGORIES.some((c) => c.v === category)) return json({ error: "bad_category" }, 400);
  if (!title) return json({ error: "title_required" }, 400);

  const contactKind = clip(b.contactKind, 20);
  const contactValue = clip(b.contactValue, 60);
  if (contactValue && !CONTACT_KINDS.some((c) => c.v === contactKind)) return json({ error: "bad_contact" }, 400);
  if (!contactValue) {
    // Without a way to reach the poster the listing is useless; ask for one (it stays private unless they agree).
    return json({ error: "contact_required" }, 400);
  }

  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = createHash("sha256").update(fwd + (process.env.IP_HASH_SALT ?? "soh")).digest("hex").slice(0, 32);

  const headers = { apikey: sb.key, Authorization: `Bearer ${sb.key}` };
  const since = new Date(Date.now() - 3600_000).toISOString();
  try {
    const count = await fetch(`${sb.url}/rest/v1/listings?select=id&ip_hash=eq.${ipHash}&created_at=gte.${encodeURIComponent(since)}`, {
      headers: { ...headers, Prefer: "count=exact", Range: "0-0" },
    });
    const total = Number(count.headers.get("content-range")?.split("/")[1] ?? 0);
    if (total >= MAX_PER_HOUR) return json({ error: "rate_limited" }, 429);

    const res = await fetch(`${sb.url}/rest/v1/listings`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        type, category, title, area: area || "—",
        quantity: clip(b.quantity, 80) || null,
        price: clip(b.price, 80) || null,
        available: clip(b.available, 80) || null,
        details: clip(b.details, 800) || null,
        poster_name: clip(b.posterName, 60) || null,
        contact_kind: contactKind,
        contact_value: contactValue,
        contact_public: b.contactPublic === true,
        ip_hash: ipHash,
      }),
    });
    if (!res.ok) return json({ error: "store_failed" }, 502);
  } catch {
    return json({ error: "store_failed" }, 502);
  }
  return json({ ok: true });
}
