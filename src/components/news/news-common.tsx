import type { L, Locale } from "@/lib/i18n";
import { SITE_TZ, type PublicPost } from "@/lib/posts";

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
