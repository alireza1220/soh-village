// SHARED CONTRACT. "Where did the visitor want to go" before being sent to log in or finish the profile.
// Pure helpers plus a tiny localStorage memory (the e-mail link may open in another tab, so sessionStorage is not enough).
// The login redirect_to NEVER carries a query string (the Supabase redirect allow-list is exact), so `next` is remembered here.
// Owned by the architect.
import type { Locale } from "@/lib/i18n";

const KEY = "soh.next";
const TTL_MS = 60 * 60 * 1000;

/** A same-site path "/fa/..." or "/en/..." (optionally with ?query and #hash), or null. Never login / reset-password (loops). */
export function safeNext(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const p = raw.trim();
  if (p.length < 4 || p.length > 300) return null;
  if (!/^\/(fa|en)\/[\x21-\x7e]*$/.test(p) || p.includes("//") || p.includes("\\")) return null;
  const path = p.split(/[?#]/)[0];
  if (/\/(login|reset-password)\/?$/.test(path)) return null;
  return p;
}

export const loginHref = (lang: Locale, next?: string) => `/${lang}/login${safeNext(next) ? `?next=${encodeURIComponent(next!)}` : ""}`;
export const profileHref = (lang: Locale, next?: string) => `/${lang}/profile${safeNext(next) ? `?next=${encodeURIComponent(next!)}` : ""}`;

/** Remember a destination (browser only; silently does nothing when storage is blocked). */
export function rememberNext(path: string | null | undefined): void {
  const p = safeNext(path);
  if (!p) return;
  try { localStorage.setItem(KEY, JSON.stringify({ p, t: Date.now() })); } catch { /* private mode */ }
}

/** Read and clear the remembered destination (null when none, expired or unsafe). */
export function takeNext(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { p?: unknown; t?: unknown };
    if (typeof o.t !== "number" || Date.now() - o.t > TTL_MS) return null;
    return safeNext(typeof o.p === "string" ? o.p : null);
  } catch {
    return null;
  }
}
