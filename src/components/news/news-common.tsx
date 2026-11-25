import type { L, Locale } from "@/lib/i18n";
import { SITE_TZ, postImageUrl, type PostPriority, type PublicPost } from "@/lib/posts";
import { publicSupabase } from "@/lib/supabase";

export const nt = {
  event: { fa: "رویداد", en: "Event" },
  news: { fa: "خبر", en: "News" },
  blog: { fa: "وبلاگ", en: "Blog" },
  also: { fa: "این مطلب به زبان دیگر هم هست.", en: "Also available in the other language." },
  readMore: { fa: "ادامه‌ی مطلب", en: "Read more" },
  readLess: { fa: "بستن", en: "Show less" },
  place: { fa: "مکان", en: "Place" },
} satisfies Record<string, L>;

const tz = SITE_TZ;

/** ISO instant -> date and time in the reader's calendar and digits (Persian calendar for fa), fixed to the village time zone (SITE_TZ) so server and browser agree. */
export function fmtPostDate(iso: string, lang: Locale): string {
  try {
    return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR-u-ca-persian" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: tz }).format(new Date(iso));
  } catch { return iso.slice(0, 10); }
}
export function fmtPostTime(iso: string, lang: Locale): string {
  try {
    return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(new Date(iso));
  } catch { return ""; }
}
/** Parts for the calendar-style date block. */
export function dateBlock(iso: string, lang: Locale): { day: string; month: string } {
  const loc = lang === "fa" ? "fa-IR-u-ca-persian" : "en-GB";
  try {
    const d = new Date(iso);
    return {
      day: new Intl.DateTimeFormat(loc, { day: "numeric", timeZone: tz }).format(d),
      month: new Intl.DateTimeFormat(loc, { month: "short", timeZone: tz }).format(d),
    };
  } catch { return { day: "", month: "" }; }
}

export const sortUpcoming = (a: PublicPost, b: PublicPost) => Date.parse(a.eventAt ?? "") - Date.parse(b.eventAt ?? "");
export const postWhen = (p: PublicPost) => p.publishedAt ?? p.createdAt;

/** Small label next to the priority icon. Only urgent and featured are shown. */
export const priorityLabel = {
  urgent: { fa: "فوری", en: "Urgent" },
  featured: { fa: "ویژه", en: "Featured" },
} satisfies Record<Exclude<PostPriority, "normal">, L>;

/** Cover URLs (thumbnail for lists, full for the open card) or null when the post has no cover or Supabase is not configured. */
export function coverUrls(p: PublicPost): { thumb: string; full: string } | null {
  const sb = p.cover ? publicSupabase() : null;
  if (!sb || !p.cover) return null;
  return { thumb: postImageUrl(sb.url, p.id, p.cover, "thumb"), full: postImageUrl(sb.url, p.id, p.cover, "full") };
}

/** Markdown -> one plain line: headings, emphasis, list marks, quotes, code and link syntax removed; links keep their text; images dropped. */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, "")
    .replace(/^\s*([-*_]\s*){3,}$/gm, " ")
    .replace(/(\*\*|__|~~|[*_`])/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** One-line excerpt of a Markdown body, cut at a word edge with an ellipsis. */
export function excerptOf(md: string, max = 140): string {
  const t = stripMarkdown(md);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:!?،؛]+$/, "")}…`;
}
