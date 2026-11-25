import { randomBytes } from "node:crypto";
import {
  AVATAR_BUCKET,
  AVATAR_BUCKET_LIMIT,
  AVATAR_EXTS,
  AVATAR_FOLDER_MAX,
  AVATAR_MIMES,
  AVATAR_ORPHAN_MIN_AGE_MS,
  avatarObjectPath,
  parseProfileInput,
  profileFromRow,
  type Profile,
  type ProfileRowPatch,
} from "@/lib/profile";
import { authenticate, failure, json, loadProfile, readBody, sbHeaders, type Sb } from "@/lib/server-guard";
import { listObjects, removeObjects, signUpload, type StoredObject } from "@/lib/storage";
import { serverSupabase } from "@/lib/supabase";

// The logged-in user's own profile (table public.profiles, server only) and avatar signing. Everything is keyed on the
// VERIFIED user id; there is no way to name another user. get and avatar_sign need only login; save needs login too
// (it is how a new user creates the profile that every other write route asks for).
const ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const newId = () => Array.from(randomBytes(12), (b) => ID_CHARS[b % 36]).join("");
const avatarMimes: readonly string[] = AVATAR_MIMES;

/** Objects of the user's folder that are not the kept avatar and old enough not to be an upload in progress. */
const strays = (present: StoredObject[], keep: string | null) =>
  present.filter((o) => o.name !== keep && (o.ageMs === null || o.ageMs >= AVATAR_ORPHAN_MIN_AGE_MS));

async function saveProfile(sb: Sb, userId: string, fields: unknown): Promise<Response> {
  const current = await loadProfile(sb, userId);
  if (current === "error") return json({ error: "store_failed" }, 502);
  const parsed = parseProfileInput(fields, current ? "update" : "create");
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const patch: ProfileRowPatch = parsed.value;
  const oldAvatar = current?.avatar ?? null;
  const avatarGiven = patch.avatar !== undefined;
  const avatarChanged = avatarGiven && patch.avatar !== oldAvatar;

  // A new avatar must exist in the user's own folder, within the size limit and with an allowed type.
  if (avatarChanged && patch.avatar) {
    const present = await listObjects(sb, userId, AVATAR_BUCKET);
    if (!present) return json({ error: "upload_failed" }, 502);
    const obj = present.find((o) => o.name === patch.avatar);
    if (!obj || obj.size < 1 || obj.size > AVATAR_BUCKET_LIMIT || !avatarMimes.includes(obj.mimetype)) return json({ error: "bad_avatar" }, 400);
  }

  let saved: Profile;
  try {
    if (!current) {
      const res = await fetch(`${sb.url}/rest/v1/profiles`, {
        method: "POST",
        headers: { ...sbHeaders(sb), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ user_id: userId, ...patch }),
        cache: "no-store",
      });
      if (!res.ok) return failure("profile_insert", res);
      const rows = (await res.json()) as Record<string, unknown>[];
      if (!rows[0]) return json({ error: "store_failed" }, 502);
      saved = profileFromRow(rows[0]);
    } else if (Object.keys(patch).length === 0) {
      return json({ ok: true, profile: current });
    } else {
      const res = await fetch(`${sb.url}/rest/v1/profiles?user_id=eq.${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { ...sbHeaders(sb), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(patch),
        cache: "no-store",
      });
      if (!res.ok) return failure("profile_update", res);
      const rows = (await res.json()) as Record<string, unknown>[];
      if (!rows[0]) return json({ error: "store_failed" }, 502);
      saved = profileFromRow(rows[0]);
    }
  } catch (e) {
    return failure("profile_exception", undefined, e);
  }

  // After the row is saved: drop the replaced / removed avatar and any older leftovers of abandoned uploads (best effort).
  if (avatarGiven) {
    try {
      const present = await listObjects(sb, userId, AVATAR_BUCKET);
      if (present) {
        const doomed = new Set(strays(present, saved.avatar).map((o) => o.name));
        if (oldAvatar && oldAvatar !== saved.avatar) doomed.add(oldAvatar);
        const names = [...doomed].filter((n) => present.some((o) => o.name === n));
        if (names.length) await removeObjects(sb, names.map((n) => avatarObjectPath(userId, n)), AVATAR_BUCKET);
      }
    } catch {}
  }
  return json({ ok: true, profile: saved });
}

async function signAvatar(sb: Sb, userId: string, ext: unknown): Promise<Response> {
  if (typeof ext !== "string" || !(AVATAR_EXTS as readonly string[]).includes(ext)) return json({ error: "bad_avatar" }, 400);
  let present = await listObjects(sb, userId, AVATAR_BUCKET);
  if (!present) return json({ error: "upload_failed" }, 502);
  if (present.length >= AVATAR_FOLDER_MAX) {
    const current = await loadProfile(sb, userId);
    if (current === "error") return json({ error: "store_failed" }, 502);
    const stale = strays(present, current?.avatar ?? null);
    if (stale.length && (await removeObjects(sb, stale.map((o) => avatarObjectPath(userId, o.name)), AVATAR_BUCKET))) {
      const gone = new Set(stale.map((o) => o.name));
      present = present.filter((o) => !gone.has(o.name));
    }
    if (present.length >= AVATAR_FOLDER_MAX) return json({ error: "bad_avatar" }, 400);
  }
  const name = `${newId()}.${ext}`;
  const url = await signUpload(sb, avatarObjectPath(userId, name), AVATAR_BUCKET);
  if (!url) return json({ error: "upload_failed" }, 502);
  return json({ ok: true, name, upload: { url, method: "PUT" } });
}

export async function POST(req: Request) {
  const sb = serverSupabase();
  if (!sb) return json({ error: "not_configured" }, 503);
  // The rate kind depends on the action, so the body is read first but its errors are only reported after the login gate.
  const b = await readBody(req.clone());
  const action = b instanceof Response ? undefined : b.action;
  const auth = await authenticate(req, sb, action === "avatar_sign" ? "avatar" : "profile");
  if (auth instanceof Response) return auth;
  if (b instanceof Response) return b;
  const { user } = auth;

  if (action === "get") {
    const p = await loadProfile(sb, user.id);
    if (p === "error") return json({ error: "store_failed" }, 502);
    return json({ ok: true, profile: p });
  }
  if (action === "save") return saveProfile(sb, user.id, b.fields);
  if (action === "avatar_sign") return signAvatar(sb, user.id, b.ext);
  return json({ error: "bad_action" }, 400);
}
