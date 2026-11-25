import { createHash } from "node:crypto";
import { imagePath, isImageName, MAX_FILE_BYTES, MAX_IMAGES } from "@/lib/listing-images";
import { parseListingInput, publicRow } from "@/lib/listing-validation";
import { secret, secretsReady } from "@/lib/secrets";
import { serverSupabase } from "@/lib/supabase";
import { keyHeaders } from "@/lib/supabase";
import { listObjects, removeObjects, type StoredObject } from "@/lib/storage";

// Shared by POST /api/listings/manage and POST /api/my/listings. Server-only.
export type Sb = NonNullable<ReturnType<typeof serverSupabase>>;
export type Row = Record<string, unknown>;

export const json = (body: object, status = 200) => Response.json(body, { status });
const storeFailed = () => json({ error: "store_failed" }, 502);

// Diagnostic 502: says which step failed and what Supabase answered (HTTP status plus its error code and message,
// which never contain keys). Also written to the Vercel runtime log. Remove once the live setup is confirmed.
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
  const upstream = res?.status;
  console.error("store_failed", { stage, upstream, detail });
  return json({ error: "store_failed", stage, upstream, detail }, 502);
}

export const MANAGE_PER_HOUR = 20;
const DAY = 86_400_000;
const RENEW_WINDOW_MS = 7 * DAY;
const RENEW_EXTEND_MS = 30 * DAY;
const MAX_RENEWALS = 4;
const RENEW_LAST_DAYS = 12;

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
    if (!ins.ok) return failure("rate_insert", ins);
    const since = new Date(Date.now() - 3600_000).toISOString();
    const count = await fetch(
      `${sb.url}/rest/v1/rate_events?select=id&ip_hash=eq.${ipHash}&kind=eq.${kind}&created_at=gte.${encodeURIComponent(since)}`,
      { headers: { ...sbHeaders(sb), Prefer: "count=exact", Range: "0-0" }, cache: "no-store" },
    );
    if (!count.ok) return failure("rate_count", count);
    const total = Number(count.headers.get("content-range")?.split("/")[1] ?? 0);
    if (total > limit) return json({ error: "rate_limited" }, 429);
    return null;
  } catch (e) {
    return failure("rate_exception", undefined, e);
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

const namesOf = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

// Size and type limits checked when photos are saved (the bucket enforces them too, this does not trust that alone).
const THUMB_MAX_BYTES = 150 * 1024;
const OK_MIME = ["image/webp", "image/jpeg"];
/** Unreferenced objects younger than this may belong to an upload that is still running, so they are left alone. */
export const ORPHAN_MIN_AGE_MS = 10 * 60_000;

/** Object file names ("<id>.<ext>", "<id>-t.<ext>") that belong to the given photo names. */
export const objectFilesOf = (names: string[]): Set<string> =>
  new Set(names.flatMap((n) => [imagePath("x", n).slice(2), imagePath("x", n, "thumb").slice(2)]));

/** Objects in a listing's folder that no saved photo refers to. Only those old enough (or of unknown age) unless minAgeMs is 0. */
export const orphansOf = (present: StoredObject[], keep: Set<string>, minAgeMs = ORPHAN_MIN_AGE_MS): StoredObject[] =>
  present.filter((o) => !keep.has(o.name) && (minAgeMs === 0 || o.ageMs === null || o.ageMs >= minAgeMs));

// Validates an ordered list of photo names: shape, no duplicates, max 10, both files of each exist in storage with a sane size and type.
async function checkImages(sb: Sb, listingId: string, input: unknown): Promise<{ names: string[]; present: StoredObject[] } | Response> {
  if (!Array.isArray(input)) return json({ error: "bad_images" }, 400);
  if (input.length > MAX_IMAGES) return json({ error: "too_many_images" }, 400);
  const names: string[] = [];
  for (const n of input) {
    if (!isImageName(n) || names.includes(n)) return json({ error: "bad_images" }, 400);
    names.push(n);
  }
  const present = await listObjects(sb, listingId);
  if (!present) return json({ error: "upload_failed" }, 502);
  if (names.length) {
    const have = new Map(present.map((o) => [o.name, o]));
    for (const n of names) {
      const full = have.get(imagePath(listingId, n).split("/")[1]);
      const thumb = have.get(imagePath(listingId, n, "thumb").split("/")[1]);
      if (!full || !thumb) return json({ error: "bad_images" }, 400);
      if (full.size > MAX_FILE_BYTES || thumb.size > THUMB_MAX_BYTES) return json({ error: "bad_images" }, 400);
      if (!OK_MIME.includes(full.mimetype) || !OK_MIME.includes(thumb.mimetype)) return json({ error: "bad_images" }, 400);
    }
  }
  return { names, present };
}

// Removes every stored photo of a listing and empties its images column. Best effort; returns true when it fully worked.
export async function purgeImages(sb: Sb, row: Row): Promise<boolean> {
  const id = String(row.id);
  const present = await listObjects(sb, id);
  if (!present) return false;
  if (!(await removeObjects(sb, present.map((o) => `${id}/${o.name}`)))) return false;
  try {
    const res = await fetch(`${sb.url}/rest/v1/listings?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...sbHeaders(sb), "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ images: [] }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
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
    await purgeImages(sb, row); // best effort; the keepalive sweep retries if this fails
    return json({ ok: true });
  }

  if (action === "update") {
    if (status === "removed" || status === "rejected") return json({ error: "not_editable" }, 409);
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) return json({ error: "bad_fields" }, 400);
    const parsed = parseListingInput(fields as Record<string, unknown>, "update");
    if (!parsed.ok) return json({ error: parsed.error }, 400);
    const patch: Row = { ...parsed.value };
    const f = fields as Record<string, unknown>;
    const oldImages = namesOf(row.images);
    let toRemove: string[] = [];
    if (f.images !== undefined) {
      const checked = await checkImages(sb, String(row.id), f.images);
      if (checked instanceof Response) return checked;
      patch.images = checked.names;
      // Everything in the folder the new list does not use: photos taken off the listing now, plus leftovers of
      // failed or abandoned uploads (those only once they are old enough not to be an upload in progress).
      const keep = objectFilesOf(checked.names);
      const wasSaved = objectFilesOf(oldImages);
      toRemove = checked.present.filter((o) => !keep.has(o.name) && (wasSaved.has(o.name) || o.ageMs === null || o.ageMs >= ORPHAN_MIN_AGE_MS)).map((o) => o.name);
    }
    if (Object.keys(patch).length === 0) return json({ ok: true, listing: publicRow(row) });
    if (status === "approved") patch.status = "pending"; // edits are re-checked
    const out = await patchRow(sb, row, patch);
    if (out === "error") return storeFailed();
    if (!out) return json({ error: "conflict" }, 409);
    if (toRemove.length) {
      const id = String(row.id);
      await removeObjects(sb, toRemove.map((n) => `${id}/${n}`));
    }
    return json({ ok: true, listing: publicRow(out) });
  }

  // renew
  const renewals = typeof row.renewals === "number" ? row.renewals : 0;
  const exp = typeof row.expires_at === "string" ? Date.parse(row.expires_at) : NaN;
  const now = Date.now();
  const inWindow = row.expires_at == null || Number.isNaN(exp) || exp <= now + RENEW_WINDOW_MS;
  // The nightly sweep deletes photos of listings expired for 14 days, so renewing stops a little before that.
  const tooOld = !Number.isNaN(exp) && exp < now - RENEW_LAST_DAYS * DAY;
  if (status !== "approved" || !inWindow || tooOld || renewals >= MAX_RENEWALS) return json({ error: "cannot_renew" }, 409);
  const out = await patchRow(sb, row, { expires_at: new Date(now + RENEW_EXTEND_MS).toISOString(), renewals: renewals + 1 });
  if (out === "error") return storeFailed();
  if (!out) return json({ error: "cannot_renew" }, 409);
  return json({ ok: true, listing: publicRow(out) });
}
