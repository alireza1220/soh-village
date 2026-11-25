import { randomBytes } from "node:crypto";
import { imagePath, MAX_FILE_BYTES, type ImageExt } from "@/lib/listing-images";
import { POST_IMAGE_BUCKET } from "@/lib/posts";
import { json, type Sb } from "@/lib/server-guard";
import { listObjects, removeObjects, signUpload, type StoredObject } from "@/lib/storage";

// Server-only helpers for the ONE cover image of a post (public bucket "post-images"; objects "<post id>/<name>" and "<post id>/<name>-t").
const THUMB_MAX_BYTES = 150 * 1024;
const OK_MIME = ["image/webp", "image/jpeg"];
/** Unreferenced objects younger than this may belong to an upload that is still running, so they are left alone. */
export const COVER_ORPHAN_MIN_AGE_MS = 10 * 60_000;
/** A post folder holds at most this many objects: the saved cover pair plus a few stray half-uploads. */
const FOLDER_CAP = 6;
const ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
export const newCoverName = (ext: ImageExt) => `${Array.from(randomBytes(12), (b) => ID_CHARS[b % 36]).join("")}.${ext}`;

/** The two object file names ("<id>.<ext>", "<id>-t.<ext>") of a cover name. */
const filesOf = (name: string | null): string[] => (name ? [imagePath("x", name).slice(2), imagePath("x", name, "thumb").slice(2)] : []);

const coverPath = (postId: string, file: string) => `${postId}/${file}`;

/** Signed upload URLs for a new cover, after cleaning old strays when the folder is full. Response on failure. */
export async function signCover(sb: Sb, postId: string, currentCover: string | null, ext: ImageExt) {
  let present = await listObjects(sb, postId, POST_IMAGE_BUCKET);
  if (!present) return json({ error: "upload_failed" }, 502);
  if (present.length + 2 > FOLDER_CAP) {
    const keep = new Set(filesOf(currentCover));
    const stale = present.filter((o) => !keep.has(o.name) && (o.ageMs === null || o.ageMs >= COVER_ORPHAN_MIN_AGE_MS));
    if (stale.length && (await removeObjects(sb, stale.map((o) => coverPath(postId, o.name)), POST_IMAGE_BUCKET))) {
      const gone = new Set(stale.map((o) => o.name));
      present = present.filter((o) => !gone.has(o.name));
    }
    if (present.length + 2 > FOLDER_CAP) return json({ error: "cover_busy" }, 400);
  }
  const name = newCoverName(ext);
  const [full, thumb] = await Promise.all([
    signUpload(sb, imagePath(postId, name), POST_IMAGE_BUCKET),
    signUpload(sb, imagePath(postId, name, "thumb"), POST_IMAGE_BUCKET),
  ]);
  if (!full || !thumb) return json({ error: "upload_failed" }, 502);
  return json({ ok: true, name, full: { url: full, method: "PUT" }, thumb: { url: thumb, method: "PUT" } });
}

/** Both objects of the cover exist with a sane size and type. Returns what the folder holds, or a 400 / 502 Response. */
export async function checkCover(sb: Sb, postId: string, name: string): Promise<StoredObject[] | Response> {
  const present = await listObjects(sb, postId, POST_IMAGE_BUCKET);
  if (!present) return json({ error: "upload_failed" }, 502);
  const [f, t] = filesOf(name).map((n) => present.find((o) => o.name === n));
  if (!f || !t) return json({ error: "bad_cover" }, 400);
  if (f.size > MAX_FILE_BYTES || t.size > THUMB_MAX_BYTES) return json({ error: "bad_cover" }, 400);
  if (!OK_MIME.includes(f.mimetype) || !OK_MIME.includes(t.mimetype)) return json({ error: "bad_cover" }, 400);
  return present;
}

/**
 * After the row now points at newCover (a name, or null for no cover): removes the previous cover's two objects and every
 * other leftover old enough not to be an upload in progress. Best effort.
 */
export async function cleanCoverFolder(sb: Sb, postId: string, newCover: string | null, previousCover: string | null, present?: StoredObject[]): Promise<void> {
  const list = present ?? (await listObjects(sb, postId, POST_IMAGE_BUCKET));
  if (!list) return;
  const keep = new Set(filesOf(newCover));
  const prev = new Set(filesOf(previousCover));
  const doomed = list.filter((o) => !keep.has(o.name) && (prev.has(o.name) || o.ageMs === null || o.ageMs >= COVER_ORPHAN_MIN_AGE_MS));
  await removeObjects(sb, doomed.map((o) => coverPath(postId, o.name)), POST_IMAGE_BUCKET);
}

/** Removes every object of a post (when the post is deleted). Best effort. */
export async function purgePostImages(sb: Sb, postId: string): Promise<void> {
  const list = await listObjects(sb, postId, POST_IMAGE_BUCKET);
  if (list?.length) await removeObjects(sb, list.map((o) => coverPath(postId, o.name)), POST_IMAGE_BUCKET);
}
