import { imagePath, isImageName, MAX_FILE_BYTES, MAX_IMAGES } from "@/lib/listing-images";
import { isBoard } from "@/lib/boards";
import { parseListingInput, publicRow } from "@/lib/listing-validation";
import { json, sbHeaders, type Row, type Sb } from "@/lib/server-guard";
import { listObjects, removeObjects, type StoredObject } from "@/lib/storage";

// Update / renew / delete / find for POST /api/my/listings. Server-only. The caller has already proven it owns the row.
export type { Row, Sb };
const storeFailed = () => json({ error: "store_failed" }, 502);

const DAY = 86_400_000;
const RENEW_WINDOW_MS = 7 * DAY;
const RENEW_EXTEND_MS = 30 * DAY;
const MAX_RENEWALS = 4;
const RENEW_LAST_DAYS = 12;

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
export async function applyAction(sb: Sb, row: Row, action: Action, fields: unknown, profilePhone?: string): Promise<Response> {
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
    const board = isBoard(row.board) ? row.board : "market";
    const parsed = parseListingInput(fields as Record<string, unknown>, "update", {
      board,
      currentType: String(row.type ?? ""),
      currentCategory: String(row.category ?? ""),
      profilePhone,
    });
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
