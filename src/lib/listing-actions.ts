import { createHash } from "node:crypto";
import { parseListingInput, publicRow } from "@/lib/listing-validation";
import { secret, secretsReady } from "@/lib/secrets";
import { serverSupabase } from "@/lib/supabase";
import { keyHeaders } from "@/lib/supabase";

// Shared by POST /api/listings/manage and POST /api/my/listings. Server-only.
export type Sb = NonNullable<ReturnType<typeof serverSupabase>>;
export type Row = Record<string, unknown>;

export const json = (body: object, status = 200) => Response.json(body, { status });
const notFound = () => json({ error: "not_found" }, 404);
const storeFailed = () => json({ error: "store_failed" }, 502);

export const MANAGE_PER_HOUR = 20;
const DAY = 86_400_000;
const RENEW_WINDOW_MS = 7 * DAY;
const RENEW_EXTEND_MS = 30 * DAY;
const MAX_RENEWALS = 4;

export const sbHeaders = (sb: Sb) => keyHeaders(sb.key);

// Answers 503 when production secrets are missing or too short. Call right after serverSupabase().
export function configGate(): Response | null {
  return secretsReady() ? null : json({ error: "not_configured" }, 503);
}

// Best guess of the caller's IP. Vercel sets x-vercel-forwarded-for / x-real-ip itself (a caller cannot forge them).
// If a CDN or proxy is ever put in front of Vercel, re-base this on that proxy's header (see docs/SECRETS.md).
function clientIp(req: Request): string {
  const h = req.headers;
  const raw = h.get("x-vercel-forwarded-for") || h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0] || "";
  return raw.trim() || "unknown";
}

// IPv6 users own a whole /64, so hash only its first 64 bits; IPv4 stays as is.
function bucketIp(ip: string): string {
  if (!ip.includes(":")) return ip;
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  if (mapped) return mapped[1];
  const [head, tail = ""] = ip.split("::");
  const h = head ? head.split(":") : [];
  if (ip.includes("::")) {
    const t = tail ? tail.split(":") : [];
    const fill = Math.max(0, 8 - h.length - t.length);
    return [...h, ...Array(fill).fill("0"), ...t].slice(0, 4).map((g) => g.toLowerCase().replace(/^0+(?=.)/, "")).join(":");
  }
  return h.slice(0, 4).map((g) => g.toLowerCase().replace(/^0+(?=.)/, "")).join(":");
}

export function hashedIp(req: Request): string {
  return createHash("sha256").update(bucketIp(clientIp(req)) + secret("IP_HASH_SALT")).digest("hex").slice(0, 32);
}

// Records this call, then counts this IP's calls in the last hour and refuses past the limit.
// Insert-first keeps the limit correct under concurrent bursts. Refused calls are recorded too.
// Returns a Response to send back, or null to continue. Fails closed if the log cannot be used.
export async function rateGate(sb: Sb, ipHash: string, kind: string, limit: number): Promise<Response | null> {
  try {
    const ins = await fetch(`${sb.url}/rest/v1/rate_events`, {
      method: "POST",
      headers: { ...sbHeaders(sb), "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ ip_hash: ipHash, kind }),
      cache: "no-store",
    });
    if (!ins.ok) return storeFailed();
    const since = new Date(Date.now() - 3600_000).toISOString();
    const count = await fetch(
      `${sb.url}/rest/v1/rate_events?select=id&ip_hash=eq.${ipHash}&kind=eq.${kind}&created_at=gte.${encodeURIComponent(since)}`,
      { headers: { ...sbHeaders(sb), Prefer: "count=exact", Range: "0-0" }, cache: "no-store" },
    );
    if (!count.ok) return storeFailed();
    const total = Number(count.headers.get("content-range")?.split("/")[1] ?? 0);
    if (total > limit) return json({ error: "rate_limited" }, 429);
    return null;
  } catch {
    return storeFailed();
  }
}

// Finds one row by a PostgREST filter. Returns the row, null (no match) or "error".
export async function findRow(sb: Sb, filter: string): Promise<Row | null | "error"> {
  try {
    const res = await fetch(`${sb.url}/rest/v1/listings?select=*&${filter}&limit=1`, {
      headers: sbHeaders(sb),
      cache: "no-store",
    });
    if (!res.ok) return "error";
    const rows = (await res.json()) as Row[];
    return rows[0] ?? null;
  } catch {
    return "error";
  }
}

// PATCH one row, only while its status is still what we read (guards against a concurrent change).
async function patchRow(sb: Sb, row: Row, patch: Row): Promise<Row | null | "error"> {
  try {
    const res = await fetch(
      `${sb.url}/rest/v1/listings?id=eq.${encodeURIComponent(String(row.id))}&status=eq.${encodeURIComponent(String(row.status))}`,
      {
        method: "PATCH",
        headers: { ...sbHeaders(sb), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(patch),
        cache: "no-store",
      },
    );
    if (!res.ok) return "error";
    const rows = (await res.json()) as Row[];
    return rows[0] ?? null;
  } catch {
    return "error";
  }
}

export type Action = "update" | "renew" | "delete";

// Applies update / renew / delete to a row the caller has already proven they own.
export async function applyAction(sb: Sb, row: Row, action: Action, fields: unknown): Promise<Response> {
  const status = String(row.status);

  if (action === "delete") {
    if (status === "removed") return json({ ok: true });
    const out = await patchRow(sb, row, { status: "removed" });
    if (out === "error") return storeFailed();
    if (!out) return json({ error: "conflict" }, 409);
    return json({ ok: true });
  }

  if (action === "update") {
    if (status === "removed" || status === "rejected") return json({ error: "not_editable" }, 409);
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) return json({ error: "bad_fields" }, 400);
    const parsed = parseListingInput(fields as Record<string, unknown>, "update");
    if (!parsed.ok) return json({ error: parsed.error }, 400);
    const patch: Row = { ...parsed.value };
    if (Object.keys(patch).length === 0) return json({ ok: true, listing: publicRow(row) });
    if (status === "approved") patch.status = "pending"; // edits are re-checked
    const out = await patchRow(sb, row, patch);
    if (out === "error") return storeFailed();
    if (!out) return json({ error: "conflict" }, 409);
    return json({ ok: true, listing: publicRow(out) });
  }

  // renew
  const renewals = typeof row.renewals === "number" ? row.renewals : 0;
  const exp = typeof row.expires_at === "string" ? Date.parse(row.expires_at) : NaN;
  const now = Date.now();
  const inWindow = row.expires_at == null || Number.isNaN(exp) || exp <= now + RENEW_WINDOW_MS;
  if (status !== "approved" || !inWindow || renewals >= MAX_RENEWALS) return json({ error: "cannot_renew" }, 409);
  const out = await patchRow(sb, row, { expires_at: new Date(now + RENEW_EXTEND_MS).toISOString(), renewals: renewals + 1 });
  if (out === "error") return storeFailed();
  if (!out) return json({ error: "cannot_renew" }, 409);
  return json({ ok: true, listing: publicRow(out) });
}
