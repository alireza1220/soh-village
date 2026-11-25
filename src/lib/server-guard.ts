import { createHash, timingSafeEqual } from "node:crypto";
import { LIMITS, type RateKind } from "@/lib/limits";
import { isComplete, profileFromRow, type Profile } from "@/lib/profile";
import { secret, secretsReady } from "@/lib/secrets";
import { bearerFrom, verifyAccessToken } from "@/lib/server-auth";
import { keyHeaders, serverSupabase } from "@/lib/supabase";

// Server-only gate shared by every write route. Order (see the contract):
//   1 config (503)  2 Bearer header present (401, nothing else touched)  3 per-IP rate gate (429)
//   4 verifyAccessToken (401)  5 per-user rate gate (429)  6 JSON body (400, done by the route)  7 profile gate (403)  8 route logic.
export type Sb = NonNullable<ReturnType<typeof serverSupabase>>;
export type Row = Record<string, unknown>;

export const json = (body: object, status = 200) => Response.json(body, { status });
export const sbHeaders = (sb: Sb) => keyHeaders(sb.key);
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 502 for a failed Supabase call. The reason (step, HTTP status, Supabase's error code and message; never keys, tokens,
// phones or emails) goes to the Vercel runtime log only, so the public response stays a plain store_failed.
export async function failure(stage: string, res?: Response, err?: unknown): Promise<Response> {
  let detail = "";
  try {
    if (res) {
      const t = (await res.text()).slice(0, 240);
      try {
        const j = JSON.parse(t) as { code?: string; message?: string; error?: string; hint?: string };
        detail = [j.code, j.message ?? j.error, j.hint].filter(Boolean).join(" | ");
      } catch {
        detail = t;
      }
    } else if (err) {
      detail = (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).slice(0, 240);
    }
  } catch {}
  console.error("store_failed", { stage, upstream: res?.status, detail });
  return json({ error: "store_failed" }, 502);
}

// Answers 503 when the production secret is missing or too short. Call right after serverSupabase().
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

// Counts the caller's calls of this kind in the last hour and refuses at the limit; only calls that pass are recorded,
// so refused or garbage requests never grow the log. A concurrent burst can overshoot the limit by a few calls (accepted).
// Fails closed (502) if the log cannot be used.
// by "ip": the row has no user id and the count is per hashed IP (rows without a user id, i.e. one per call).
// by "user": the row carries ip_hash + user_id and the count is per user id.
// Returns a Response to send back, or null to continue.
export async function rateGate(sb: Sb, who: { ipHash: string; userId?: string }, kind: RateKind, limit: number): Promise<Response | null> {
  try {
    const since = new Date(Date.now() - 3600_000).toISOString();
    const who_ = who.userId ? `user_id=eq.${who.userId}` : `ip_hash=eq.${encodeURIComponent(who.ipHash)}&user_id=is.null`;
    const count = await fetch(
      `${sb.url}/rest/v1/rate_events?select=id&${who_}&kind=eq.${kind}&created_at=gte.${encodeURIComponent(since)}`,
      { headers: { ...sbHeaders(sb), Prefer: "count=exact", Range: "0-0" }, cache: "no-store" },
    );
    if (!count.ok) return failure("rate_count", count);
    const total = Number(count.headers.get("content-range")?.split("/")[1] ?? 0);
    if (total >= limit) return json({ error: "rate_limited" }, 429);
    const row: Record<string, string> = { ip_hash: who.ipHash, kind };
    if (who.userId) row.user_id = who.userId;
    const ins = await fetch(`${sb.url}/rest/v1/rate_events`, {
      method: "POST",
      headers: { ...sbHeaders(sb), "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
      cache: "no-store",
    });
    if (!ins.ok) return failure("rate_insert", ins);
    return null;
  } catch (e) {
    return failure("rate_exception", undefined, e);
  }
}

export type AuthOk = { user: { id: string; email: string }; ipHash: string };

// Steps 1-5 of the gate. Returns a Response to send back, or the verified user. Never reads the body.
export async function authenticate(req: Request, sb: Sb, kind: RateKind): Promise<AuthOk | Response> {
  const cfg = configGate();
  if (cfg) return cfg;
  const token = bearerFrom(req);
  if (!token) return json({ error: "unauthorized" }, 401); // no DB write, no Auth call
  const ipHash = hashedIp(req);
  const ipLimited = await rateGate(sb, { ipHash }, kind, LIMITS[kind].ip);
  if (ipLimited) return ipLimited;
  const user = await verifyAccessToken(token);
  if (!user || !UUID.test(user.id)) return json({ error: "unauthorized" }, 401);
  const userLimited = await rateGate(sb, { ipHash, userId: user.id }, kind, LIMITS[kind].user);
  if (userLimited) return userLimited;
  return { user, ipHash };
}

// Reads the JSON body as an object, or answers 400 bad_json.
export async function readBody(req: Request): Promise<Record<string, unknown> | Response> {
  try {
    const b = await req.json();
    if (!b || typeof b !== "object" || Array.isArray(b)) return json({ error: "bad_json" }, 400);
    return b as Record<string, unknown>;
  } catch {
    return json({ error: "bad_json" }, 400);
  }
}

// The user's profile row, or null (none yet), or "error".
export async function loadProfile(sb: Sb, userId: string): Promise<Profile | null | "error"> {
  try {
    const res = await fetch(`${sb.url}/rest/v1/profiles?select=*&user_id=eq.${encodeURIComponent(userId)}&limit=1`, {
      headers: sbHeaders(sb),
      cache: "no-store",
    });
    if (!res.ok) return "error";
    const rows = (await res.json()) as Row[];
    return rows[0] ? profileFromRow(rows[0]) : null;
  } catch {
    return "error";
  }
}

// Step 7: no profile row, or a profile without address / phone / names = 403 profile_required (the site sends the person to the profile page).
export async function requireProfile(sb: Sb, userId: string): Promise<Profile | Response> {
  const p = await loadProfile(sb, userId);
  if (p === "error") return json({ error: "store_failed" }, 502);
  if (!p || !isComplete(p)) return json({ error: "profile_required" }, 403);
  return p;
}

// Admin gate for every /api/admin/* route: the normal login gate (kind "admin"), then the role is read from the database
// (never from the request). 403 forbidden for a valid user who is not an admin. Returns the verified admin or a Response.
export async function requireAdmin(req: Request, sb: Sb): Promise<AuthOk | Response> {
  // Static API key (env ADMIN_API_KEY, 24+ characters): "Authorization: Bearer <key>" acts as an admin without a login. For scripts and
  // scheduled jobs. Its calls have user.id "" (posts get author_id null). A wrong key is just an invalid token (401 below).
  const key = process.env.ADMIN_API_KEY ?? "";
  const given = bearerFrom(req);
  if (key.length >= 24 && given && sameSecret(given, key)) {
    const cfg = configGate();
    if (cfg) return cfg;
    return { user: { id: "", email: "api-key" }, ipHash: hashedIp(req) };
  }
  const auth = await authenticate(req, sb, "admin");
  if (auth instanceof Response) return auth;
  const p = await loadProfile(sb, auth.user.id);
  if (p === "error") return json({ error: "store_failed" }, 502);
  if (!p || p.role !== "admin") return json({ error: "forbidden" }, 403);
  return auth;
}

function sameSecret(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
