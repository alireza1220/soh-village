// SHARED CONTRACT (server routes, client components, tests). Pure TypeScript: no browser-only or Node-only APIs.
// News, blog posts and events written by admins. Table public.posts (server only), public view public.public_posts (published only).
// Owned by the architect: builders must not edit this file (report needed changes instead).
import type { Locale } from "@/lib/i18n";
import { isImageName } from "@/lib/listing-images";

export const POST_KINDS = ["news", "blog", "event"] as const;
export type PostKind = (typeof POST_KINDS)[number];
export const isPostKind = (v: unknown): v is PostKind => typeof v === "string" && (POST_KINDS as readonly string[]).includes(v);

/** normal: only in the news list. featured: second priority, a band lower on the home page. urgent: main news, a banner at the very top of the home page. Any kind of post can have any priority. */
export const POST_PRIORITIES = ["normal", "featured", "urgent"] as const;
export type PostPriority = (typeof POST_PRIORITIES)[number];
export const isPostPriority = (v: unknown): v is PostPriority => typeof v === "string" && (POST_PRIORITIES as readonly string[]).includes(v);

// One cover image per post, in the PUBLIC bucket "post-images" (same pair scheme as listing photos, see listing-images.ts):
//   <post uuid>/<id>.<ext> full size, <post uuid>/<id>-t.<ext> thumbnail. posts.cover holds the file name "<id>.<ext>" or null.
// Only admins can get a signed upload URL (POST /api/admin/posts {action:"cover_sign"}).
export const POST_IMAGE_BUCKET = "post-images";
export const postImageUrl = (supabaseUrl: string, postId: string, name: string, kind: "full" | "thumb" = "full") =>
  `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${POST_IMAGE_BUCKET}/${postId}/${kind === "thumb" ? name.replace(/\.(webp|jpg)$/, "-t.$1") : name}`;

/** Bodies are MARKDOWN (rendered by src/components/markdown.tsx: headings, bold, italic, links, lists, quotes, code; no raw HTML, no inline images). */
export const POST_LIMITS = { title: 140, body: 10000, place: 120 } as const;
/** Columns of the public view, in the order the browser asks for them. Never add author_id or published here. */
export const PUBLIC_POST_COLUMNS = "id,kind,title_fa,title_en,body_fa,body_en,event_at,place_fa,place_en,published_at,created_at,priority,cover";

/** A published post as the public sees it. Dates are ISO strings. */
export type PublicPost = {
  id: string;
  kind: PostKind;
  titleFa: string;
  titleEn: string;
  bodyFa: string;
  bodyEn: string;
  /** events: when it happens (ISO) */
  eventAt: string | null;
  placeFa: string | null;
  placeEn: string | null;
  publishedAt: string | null;
  createdAt: string;
  priority: PostPriority;
  /** cover file name ("<id>.<ext>") or null; URL via postImageUrl(supabaseUrl, id, cover) */
  cover: string | null;
};

/** A post as an admin sees it: also drafts and the author. */
export type AdminPost = PublicPost & { published: boolean; authorId: string | null; updatedAt: string };

/** What the admin form sends. Create: kind + at least one title. Update: any subset. eventAt: ISO string or null. */
export type PostFields = {
  kind?: PostKind;
  titleFa?: string;
  titleEn?: string;
  bodyFa?: string;
  bodyEn?: string;
  eventAt?: string | null;
  placeFa?: string | null;
  placeEn?: string | null;
  published?: boolean;
  priority?: PostPriority;
  /** file name of an uploaded cover, or null to remove it. The server checks that the objects exist. */
  cover?: string | null;
};

/** Snake_case columns the server writes. */
export type PostRowPatch = {
  kind?: PostKind;
  title_fa?: string;
  title_en?: string;
  body_fa?: string;
  body_en?: string;
  event_at?: string | null;
  place_fa?: string | null;
  place_en?: string | null;
  published?: boolean;
  priority?: PostPriority;
  cover?: string | null;
};

export type PostError = "bad_fields" | "bad_priority" | "bad_cover" | "bad_kind" | "title_required" | "bad_date" | "event_date_required" | "too_long";

// Control characters and bidi controls are dropped from single-line fields; bodies keep newlines and tabs.
const clipLine = (v: unknown, n: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/[‪-‮⁦-⁩﻿]/g, "").replace(/\s+/g, " ").trim() : "";
const clipBody = (v: unknown) =>
  typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/[‪-‮⁦-⁩﻿]/g, "").trim() : "";
const has = (b: Record<string, unknown>, k: string) => b[k] !== undefined;

/** ISO-looking date-time -> normalised ISO string, or null when it is not a real date (year 2000 to 2100). */
export function normalizeEventDate(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = Date.parse(v);
  if (Number.isNaN(t)) return null;
  const y = new Date(t).getUTCFullYear();
  return y >= 2000 && y <= 2100 ? new Date(t).toISOString() : null;
}

/**
 * Validates the body of an admin create / update. The same function runs in the browser (before sending) and on the server.
 * ctx.current: on update, the stored row's kind and titles, so the final row still satisfies "kind event needs a date" and "at least one title".
 * Unknown keys are ignored. Returns snake_case columns ready for the DB.
 */
export function parsePostInput(
  fields: unknown,
  mode: "create" | "update",
  ctx: { kind?: PostKind; titleFa?: string; titleEn?: string; eventAt?: string | null } = {},
): { ok: true; value: PostRowPatch } | { ok: false; error: PostError } {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return { ok: false, error: "bad_fields" };
  const b = fields as Record<string, unknown>;
  const create = mode === "create";
  const v: PostRowPatch = {};
  const fail = (error: PostError) => ({ ok: false as const, error });

  if (create || has(b, "kind")) {
    if (!isPostKind(b.kind)) return fail("bad_kind");
    v.kind = b.kind;
  }
  for (const [key, col, max] of [["titleFa", "title_fa", POST_LIMITS.title], ["titleEn", "title_en", POST_LIMITS.title]] as const) {
    if (create || has(b, key)) {
      const s = clipLine(b[key], max);
      if (s.length > max) return fail("too_long");
      v[col] = s;
    }
  }
  for (const [key, col] of [["bodyFa", "body_fa"], ["bodyEn", "body_en"]] as const) {
    if (create || has(b, key)) {
      const s = clipBody(b[key]);
      if (s.length > POST_LIMITS.body) return fail("too_long");
      v[col] = s;
    }
  }
  for (const [key, col] of [["placeFa", "place_fa"], ["placeEn", "place_en"]] as const) {
    if (create || has(b, key)) {
      const s = b[key] === null ? "" : clipLine(b[key], POST_LIMITS.place);
      if (s.length > POST_LIMITS.place) return fail("too_long");
      v[col] = s || null;
    }
  }
  if (create || has(b, "eventAt")) {
    if (b.eventAt === null || b.eventAt === undefined || b.eventAt === "") v.event_at = null;
    else {
      const d = normalizeEventDate(b.eventAt);
      if (!d) return fail("bad_date");
      v.event_at = d;
    }
  }
  if (has(b, "priority")) {
    if (!isPostPriority(b.priority)) return fail("bad_priority");
    v.priority = b.priority;
  }
  if (has(b, "cover")) {
    if (b.cover !== null && !isImageName(b.cover)) return fail("bad_cover");
    v.cover = b.cover as string | null;
  }
  if (has(b, "published")) {
    if (typeof b.published !== "boolean") return fail("bad_fields");
    v.published = b.published;
  }

  // The final row must satisfy the table's checks.
  const kind = v.kind ?? ctx.kind;
  const titleFa = v.title_fa ?? ctx.titleFa ?? "";
  const titleEn = v.title_en ?? ctx.titleEn ?? "";
  if (!titleFa && !titleEn) return fail("title_required");
  const eventAt = v.event_at !== undefined ? v.event_at : (ctx.eventAt ?? null);
  if (kind === "event" && !eventAt) return fail("event_date_required");
  if (kind !== "event" && v.event_at) v.event_at = null; // only events carry a date
  return { ok: true, value: v };
}

const s = (v: unknown) => (typeof v === "string" ? v : "");
const sn = (v: unknown) => (typeof v === "string" && v ? v : null);

/** Row of public_posts (or of posts) -> PublicPost. */
export function publicPostFromRow(r: Record<string, unknown>): PublicPost {
  return {
    id: String(r.id),
    kind: isPostKind(r.kind) ? r.kind : "news",
    titleFa: s(r.title_fa),
    titleEn: s(r.title_en),
    bodyFa: s(r.body_fa),
    bodyEn: s(r.body_en),
    eventAt: sn(r.event_at),
    placeFa: sn(r.place_fa),
    placeEn: sn(r.place_en),
    publishedAt: sn(r.published_at),
    createdAt: s(r.created_at),
    priority: isPostPriority(r.priority) ? r.priority : "normal",
    cover: isImageName(r.cover) ? r.cover : null,
  };
}

/** Row of posts (select=*) -> AdminPost. */
export function adminPostFromRow(r: Record<string, unknown>): AdminPost {
  return { ...publicPostFromRow(r), published: r.published === true, authorId: sn(r.author_id), updatedAt: s(r.updated_at) };
}

/** The post's text in the reader's language, falling back to the other language when one is missing. */
export function postText(p: PublicPost, lang: Locale): {
  title: string; body: string; place: string | null; fellBack: boolean; titleLang: Locale; bodyLang: Locale; placeLang: Locale;
} {
  const fa = lang === "fa";
  const other: Locale = fa ? "en" : "fa";
  const title = (fa ? p.titleFa : p.titleEn) || (fa ? p.titleEn : p.titleFa);
  const wantBody = fa ? p.bodyFa : p.bodyEn;
  const body = wantBody || (fa ? p.bodyEn : p.bodyFa);
  const wantPlace = fa ? p.placeFa : p.placeEn;
  const place = wantPlace || (fa ? p.placeEn : p.placeFa);
  const fellBack = !(fa ? p.titleFa : p.titleEn) || (!!body && !wantBody);
  return {
    title, body, place, fellBack,
    titleLang: (fa ? p.titleFa : p.titleEn) ? lang : other,
    bodyLang: wantBody ? lang : other,
    placeLang: wantPlace ? lang : other,
  };
}

/** The village's own time zone: event times are typed, stored and shown in it, whatever the device's zone is. */
export const SITE_TZ = "Asia/Tehran";

/** Upcoming = event today or later (compared by instant; an event stays "upcoming" until 6 hours after it starts). */
export const isUpcoming = (p: PublicPost, nowMs: number) => p.kind === "event" && !!p.eventAt && Date.parse(p.eventAt) + 6 * 3600_000 >= nowMs;

/** Order for lists: urgent first, then featured, then normal; inside a group newest first. */
export const PRIORITY_RANK: Record<PostPriority, number> = { urgent: 0, featured: 1, normal: 2 };
export const byPriorityThenNewest = (a: PublicPost, b: PublicPost) =>
  PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || Date.parse(b.publishedAt ?? b.createdAt) - Date.parse(a.publishedAt ?? a.createdAt);
