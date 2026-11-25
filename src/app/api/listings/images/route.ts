import { randomBytes } from "node:crypto";
import { configGate, findRow, hashedIp, json, objectFilesOf, orphansOf, rateGate } from "@/lib/listing-actions";
import { imagePath, IMAGE_EXTS, MAX_IMAGES } from "@/lib/listing-images";
import { hashManageCode, normalizeManageCode } from "@/lib/manage-code";
import { bearerFrom, verifyAccessToken } from "@/lib/server-auth";
import { listObjects, removeObjects, signUpload } from "@/lib/storage";
import { serverSupabase } from "@/lib/supabase";

// Step 2 of the photo upload: hands out signed upload URLs (one for the full photo, one for the thumbnail) for a listing the
// caller owns, by manage code ({code}) or by login ({listingId} + Authorization: Bearer). The browser uploads straight to
// Supabase Storage, then saves the ordered names with the normal "update" action (fields.images).
const IMAGES_PER_HOUR = 12; // one call may sign up to 10 photos, so this is the real budget
const FOLDER_SLACK = 4; // objects beyond 2 per allowed photo that a folder may hold (one failed half-upload or two)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const newId = () => Array.from(randomBytes(12), (b) => ID_CHARS[b % 36]).join("");

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
  if (!b || typeof b !== "object" || Array.isArray(b)) return json({ error: "bad_json" }, 400);

  const limited = await rateGate(sb, hashedIp(req), "images", IMAGES_PER_HOUR);
  if (limited) return limited;

  // Who is asking: a manage code, or a logged-in owner.
  let row;
  if (typeof b.code === "string") {
    const code = normalizeManageCode(b.code);
    if (!code) return json({ error: "not_found" }, 404);
    row = await findRow(sb, `manage_hash=eq.${hashManageCode(code)}`);
  } else {
    const token = bearerFrom(req);
    const user = token ? await verifyAccessToken(token) : null;
    if (!user || !UUID.test(user.id)) return json({ error: "unauthorized" }, 401);
    const id = typeof b.listingId === "string" ? b.listingId : "";
    if (!UUID.test(id)) return json({ error: "not_found" }, 404);
    row = await findRow(sb, `id=eq.${id}&owner_id=eq.${user.id}`);
  }
  if (row === "error") return json({ error: "store_failed" }, 502);
  if (!row) return json({ error: "not_found" }, 404);
  if (row.status !== "pending" && row.status !== "approved") return json({ error: "not_editable" }, 409);

  const items = b.items;
  if (!Array.isArray(items) || items.length < 1) return json({ error: "bad_images" }, 400);
  if (items.length > MAX_IMAGES) return json({ error: "too_many_images" }, 400);
  const exts: string[] = [];
  for (const it of items) {
    const ext = it && typeof it === "object" ? (it as { ext?: unknown }).ext : null;
    if (typeof ext !== "string" || !(IMAGE_EXTS as readonly string[]).includes(ext)) return json({ error: "bad_images" }, 400);
    exts.push(ext);
  }
  const existing = Array.isArray(row.images) ? row.images.length : 0;
  if (existing + exts.length > MAX_IMAGES) return json({ error: "too_many_images" }, 400);

  const listingId = String(row.id);
  // Uploaded-but-never-saved files count too: a folder may hold at most 2 files per allowed photo (+ slack), so nobody can
  // sign and upload over and over to fill the free storage. Old leftovers of failed uploads are cleared first.
  const cap = 2 * MAX_IMAGES + FOLDER_SLACK;
  let present = await listObjects(sb, listingId);
  if (!present) return json({ error: "upload_failed" }, 502);
  if (present.length + 2 * exts.length > cap) {
    const stale = orphansOf(present, objectFilesOf(Array.isArray(row.images) ? (row.images as string[]) : []));
    if (stale.length && (await removeObjects(sb, stale.map((o) => `${listingId}/${o.name}`)))) {
      const gone = new Set(stale.map((o) => o.name));
      present = present.filter((o) => !gone.has(o.name));
    }
    if (present.length + 2 * exts.length > cap) return json({ error: "too_many_images" }, 400);
  }
  const files = [];
  for (const ext of exts) {
    const name = `${newId()}.${ext}`;
    const [full, thumb] = await Promise.all([
      signUpload(sb, imagePath(listingId, name)),
      signUpload(sb, imagePath(listingId, name, "thumb")),
    ]);
    if (!full || !thumb) return json({ error: "upload_failed" }, 502);
    files.push({ name, full: { url: full, method: "PUT" }, thumb: { url: thumb, method: "PUT" } });
  }
  return json({ ok: true, files });
}
