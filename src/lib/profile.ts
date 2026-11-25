// SHARED CONTRACT (server routes, client components, tests). Pure TypeScript: no browser-only or Node-only APIs.
// Profile data model, validation, Iranian mobile normalisation, password rules and the avatar contract.
// Owned by the architect: builders must not edit this file (report needed changes instead).
//
// Storage: one PUBLIC Supabase Storage bucket "avatars" (limit 20 KB per object, webp/jpeg only, no storage policies).
// Object path: "<auth user id>/<random>.<webp|jpg>". One avatar per user: saving a new one removes the old object.
// profiles.avatar holds ONLY the file name ("<random>.<ext>"); the public view exposes "<user id>/<file name>" as poster_avatar.

// ---------------- Avatar ----------------
export const AVATAR_BUCKET = "avatars";
export const AVATAR_SIZE = 96; // px, square, centre-cropped
export const AVATAR_MAX_BYTES = 12 * 1024; // the client re-encodes until the file is at most this big
export const AVATAR_BUCKET_LIMIT = 20 * 1024; // bucket file_size_limit; the server also checks it
export const AVATAR_QUALITIES = [0.7, 0.62, 0.54, 0.46, 0.38, 0.3] as const; // first value is the start quality
export const AVATAR_EXTS = ["webp", "jpg"] as const;
export type AvatarExt = (typeof AVATAR_EXTS)[number];
export const AVATAR_MIMES = ["image/webp", "image/jpeg"] as const;
/** A folder may hold at most this many objects (current avatar + a few abandoned uploads). Older strays are removed before signing. */
export const AVATAR_FOLDER_MAX = 4;
/** An unreferenced avatar object younger than this may belong to an upload in progress. */
export const AVATAR_ORPHAN_MIN_AGE_MS = 10 * 60_000;

/** A stored avatar's file name, e.g. "k3j9x0q2m7ab.webp". */
export const AVATAR_NAME_RE = /^[a-z0-9]{10,16}\.(webp|jpg)$/;
export const isAvatarName = (v: unknown): v is string => typeof v === "string" && AVATAR_NAME_RE.test(v);
/** What public_listings.poster_avatar looks like: "<user uuid>/<file name>". */
export const AVATAR_PATH_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-z0-9]{10,16}\.(webp|jpg)$/i;
export const isAvatarPath = (v: unknown): v is string => typeof v === "string" && AVATAR_PATH_RE.test(v);

/** Object path inside the bucket. */
export const avatarObjectPath = (userId: string, name: string) => `${userId}/${name}`;
/** Public URL from an object path "<user id>/<file name>" (the poster_avatar value). supabaseUrl = NEXT_PUBLIC_SUPABASE_URL. */
export const avatarUrl = (supabaseUrl: string, path: string) =>
  `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;

// ---------------- Profile ----------------
export const NAME_MAX = 40;
export const ADDRESS_MIN = 5;
export const ADDRESS_MAX = 200;

/** The signed-in person's own profile as the API returns it. */
export type Profile = {
  firstName: string;
  familyName: string;
  /** normalised 09XXXXXXXXX */
  phone: string;
  /** file name only ("<random>.<ext>") or null; the object lives at "<user id>/<avatar>" */
  avatar: string | null;
  /** show my first name and avatar on my public ads (default true). The family name and the phone are never public. */
  showOnAds: boolean;
  /** Home address. Required to post. NEVER public: not in any public view or response; only admins see it (to verify sellers). "" = not given yet. */
  address: string;
  /** "Verified seller": an admin confirmed this person (e.g. visited them). Set only by admins; no profile route can write it. */
  verified: boolean;
  /** "admin" only when an owner set profiles.role = 'admin' in Supabase. Read-only for the site: no route ever writes it. */
  role: Role;
};

export type Role = "user" | "admin";

/** Columns of public.profiles that the server writes (snake_case). */
export type ProfileRowPatch = {
  first_name?: string;
  family_name?: string;
  phone?: string;
  avatar?: string | null;
  show_on_ads?: boolean;
  address?: string;
};

/** DB row (select=*) -> Profile. */
export function profileFromRow(row: Record<string, unknown>): Profile {
  return {
    firstName: String(row.first_name ?? ""),
    familyName: String(row.family_name ?? ""),
    phone: String(row.phone ?? ""),
    avatar: isAvatarName(row.avatar) ? row.avatar : null,
    showOnAds: row.show_on_ads !== false,
    address: typeof row.address === "string" ? row.address : "",
    verified: row.verified === true,
    role: row.role === "admin" ? "admin" : "user",
  };
}

const PERSIAN_DIGITS = /[۰-۹]/g;
const ARABIC_DIGITS = /[٠-٩]/g;
/** Persian and Arabic-Indic digits -> ASCII. */
export const toAsciiDigits = (s: string) =>
  s.replace(PERSIAN_DIGITS, (d) => String(d.charCodeAt(0) - 0x06f0)).replace(ARABIC_DIGITS, (d) => String(d.charCodeAt(0) - 0x0660));

/**
 * Iranian mobile -> "09XXXXXXXXX" or null when it is not one.
 * Accepts Persian/Arabic digits, spaces, dashes, dots, brackets, zero-width joiners, and the prefixes
 * 09..., 9..., +989..., 00989..., 989... (e.g. "+98 912 123-4567", "۰۹۱۲ ۱۲۳ ۴۵۶۷").
 * The number is NOT verified by SMS; this is only a format check.
 */
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let s = toAsciiDigits(input).replace(/[\s\-().‌‍‎‏‪-‮]/g, "");
  if (s.startsWith("+98")) s = "0" + s.slice(3);
  else if (s.startsWith("0098")) s = "0" + s.slice(4);
  else if (s.startsWith("98") && s.length === 12) s = "0" + s.slice(2);
  else if (s.length === 10 && s.startsWith("9")) s = "0" + s;
  return /^09\d{9}$/.test(s) ? s : null;
}

/** Address text: trimmed, whitespace collapsed, control and bidi characters dropped. May be longer than ADDRESS_MAX (the caller checks). */
export const cleanAddress = (v: unknown): string =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/[\u200b\u200e\u200f\u202a-\u202e\u2060-\u2069\ufeff]/g, "").replace(/\s+/g, " ").trim() : "";

/** Trim, collapse inner whitespace, drop control characters. */
export const cleanName = (v: unknown): string =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/[\u200b\u200e\u200f\u202a-\u202e\u2060-\u2069\ufeff]/g, "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX) : "";

export type ProfileError = "first_name_required" | "family_name_required" | "bad_phone" | "address_required" | "bad_address" | "bad_avatar" | "bad_fields";

/**
 * Validates the body of POST /api/profile {action:"save", fields}.
 * mode "create": firstName, familyName, phone and address are all required (there is no row yet).
 * mode "update": every field is optional, but a field that is present must be valid. avatar: file name or null (= remove).
 * Unknown keys are ignored. Returns snake_case columns ready for the DB.
 */
export function parseProfileInput(
  fields: unknown,
  mode: "create" | "update",
): { ok: true; value: ProfileRowPatch } | { ok: false; error: ProfileError } {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return { ok: false, error: "bad_fields" };
  const b = fields as Record<string, unknown>;
  const create = mode === "create";
  const v: ProfileRowPatch = {};
  if (create || b.firstName !== undefined) {
    const n = cleanName(b.firstName);
    if (!n) return { ok: false, error: "first_name_required" };
    v.first_name = n;
  }
  if (create || b.familyName !== undefined) {
    const n = cleanName(b.familyName);
    if (!n) return { ok: false, error: "family_name_required" };
    v.family_name = n;
  }
  if (create || b.phone !== undefined) {
    const p = normalizePhone(b.phone);
    if (!p) return { ok: false, error: "bad_phone" };
    v.phone = p;
  }
  if (create || b.address !== undefined) {
    const a = cleanAddress(b.address);
    if (!a) return { ok: false, error: "address_required" };
    const n = Array.from(a).length;
    if (n < ADDRESS_MIN || n > ADDRESS_MAX) return { ok: false, error: "bad_address" };
    v.address = a;
  }
  if (b.showOnAds !== undefined) {
    if (typeof b.showOnAds !== "boolean") return { ok: false, error: "bad_fields" };
    v.show_on_ads = b.showOnAds;
  }
  if (b.avatar !== undefined) {
    if (b.avatar !== null && !isAvatarName(b.avatar)) return { ok: false, error: "bad_avatar" };
    v.avatar = b.avatar as string | null;
  }
  return { ok: true, value: v };
}

/** A profile is complete when it has first name, family name, phone AND address. Posting needs a complete profile (older profiles without an address must add one). */
export const isComplete = (p: Profile | null | undefined): p is Profile => !!p && !!p.firstName && !!p.familyName && !!p.phone && !!p.address;

/** First letter for the initials circle (first name; Persian and Latin both work). */
export const initialOf = (name: string): string => {
  const ch = Array.from(name.trim())[0];
  return ch ? ch.toLocaleUpperCase() : "?";
};

// ---------------- Password ----------------
// Supabase's own minimum must ALSO be set to 8 (Authentication > Providers > Email), see docs/LOGIN-SETUP.md.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72; // bcrypt ignores everything past 72 bytes; Supabase rejects longer

/** UI-side check before calling Supabase. Returns an error code from api-errors.ts or null. */
export function passwordProblem(pw: string): "password_short" | "password_long" | null {
  if (pw.length < PASSWORD_MIN) return "password_short";
  if (new TextEncoder().encode(pw).length > PASSWORD_MAX) return "password_long";
  return null;
}

/** Deliberately simple hint: 0 = too short, 1 = ok, 2 = good (12+ characters, or letters with digits or symbols). */
export function passwordStrength(pw: string): 0 | 1 | 2 {
  if (pw.length < PASSWORD_MIN) return 0;
  if (pw.length >= 12) return 2;
  const classes = [/\p{L}/u, /\d/, /[^\p{L}\d\s]/u].filter((r) => r.test(pw)).length;
  return classes >= 2 ? 2 : 1;
}

/** Same simple e-mail shape check the browser uses; Supabase has the final say. */
export const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
