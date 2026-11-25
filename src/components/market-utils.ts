import type { Locale } from "@/lib/i18n";

export const isoToday = () => new Date().toISOString().slice(0, 10);
const DAY = 86400000;
const dayNum = (iso: string) => Math.floor(Date.parse(iso + "T00:00:00Z") / DAY);

/** "today", "2 days ago" ... in the reader's language and digits; older than 6 weeks becomes a date. */
export function relativeDay(iso: string, today: string, lang: Locale): string {
  const diff = dayNum(today) - dayNum(iso);
  const loc = lang === "fa" ? "fa" : "en";
  try {
    if (!(diff >= 0)) return fmtDate(iso, lang);
    if (diff < 7) return new Intl.RelativeTimeFormat(loc, { numeric: "auto" }).format(-diff, "day");
    if (diff < 42) return new Intl.RelativeTimeFormat(loc, { numeric: "auto" }).format(-Math.floor(diff / 7), "week");
  } catch { /* fall through */ }
  return fmtDate(iso, lang);
}

/** Dates in the reader's own calendar and digits (Persian calendar for fa), fixed to UTC so server and browser agree. */
export function fmtDate(iso: string, lang: Locale): string {
  try {
    return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR-u-ca-persian" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
  } catch { return iso; }
}

export const num = (n: number, lang: Locale) => n.toLocaleString(lang === "fa" ? "fa-IR" : "en");

const toLatinDigits = (s: string) => s.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

export type ContactLink = { href: string; kind: "tel" | "telegram" | "whatsapp" };

/** Links we are sure about. Anything uncertain returns null and the reader can only copy the value. */
export function contactLink(kind: string, value: string): ContactLink | null {
  const v = toLatinDigits(value.trim());
  const digits = v.replace(/[^\d+]/g, "");
  const plain = /^\+?\d{7,15}$/.test(digits) && /^[\s\d+()\-.]+$/.test(v);
  if (kind === "phone") return plain ? { href: `tel:${digits}`, kind: "tel" } : null;
  if (kind === "telegram") {
    const m = v.match(/^(?:https?:\/\/)?(?:t\.me\/|telegram\.me\/)?@?([A-Za-z][A-Za-z0-9_]{4,31})$/);
    return m ? { href: `https://t.me/${m[1]}`, kind: "telegram" } : null;
  }
  if (kind === "whatsapp") {
    if (!plain) return null;
    let d = digits;
    if (d.startsWith("+")) d = d.slice(1);
    else if (d.startsWith("00")) d = d.slice(2);
    else if (/^09\d{9}$/.test(d)) d = "98" + d.slice(1); // Iranian mobile written locally
    else return null;
    return /^\d{8,15}$/.test(d) ? { href: `https://wa.me/${d}`, kind: "whatsapp" } : null;
  }
  return null;
}

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall back */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch { return false; }
}

const STORE = "soh-market-v1";
export function loadPrefs(): { view?: "list" | "gallery"; saved: string[] } {
  try {
    const o = JSON.parse(localStorage.getItem(STORE) || "{}");
    return { view: o.view === "gallery" ? "gallery" : o.view === "list" ? "list" : undefined, saved: Array.isArray(o.saved) ? o.saved.filter((x: unknown) => typeof x === "string").slice(0, 500) : [] };
  } catch { return { saved: [] }; }
}
export function savePrefs(p: { view: "list" | "gallery"; saved: string[] }) {
  try { localStorage.setItem(STORE, JSON.stringify(p)); } catch { /* private mode */ }
}
