// Admin client helpers: one call to POST /api/admin/<route> with the visitor's token. The server decides who is an admin.
import { authToken } from "@/lib/auth";
import { postJson } from "@/components/listing-api";
import { SITE_TZ } from "@/lib/posts";

export type AdminResult = { ok: true; data: Record<string, unknown> } | { ok: false; status: number; error: string };

export async function adminCall(route: "overview" | "listings" | "posts" | "users", body: Record<string, unknown>): Promise<AdminResult> {
  const token = await authToken();
  if (!token) return { ok: false, status: 401, error: "unauthorized" };
  const r = await postJson(`/api/admin/${route}`, body, token);
  if (r.ok) return { ok: true, data: r.data };
  return { ok: false, status: r.status, error: typeof r.data.error === "string" ? r.data.error : r.status === 403 ? "forbidden" : "store_failed" };
}

/** Date-time for display in the reader's language (Persian calendar for fa; Gregorian for en), in the village time zone. */
export function fmtDate(iso: string | null | undefined, lang: "fa" | "en", withTime = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR-u-ca-persian" : "en-GB", withTime ? { dateStyle: "medium", timeStyle: "short", timeZone: SITE_TZ } : { dateStyle: "medium" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** Wall-clock parts of an instant in the village zone. */
function zoneParts(ms: number): { y: number; mo: number; d: number; h: number; mi: number } {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const o: Record<string, number> = {};
  for (const p of f.formatToParts(new Date(ms))) if (p.type !== "literal") o[p.type] = Number(p.value);
  return { y: o.year, mo: o.month, d: o.day, h: o.hour, mi: o.minute };
}
const asUtc = (z: ReturnType<typeof zoneParts>) => Date.UTC(z.y, z.mo - 1, z.d, z.h, z.mi);

const pad = (n: number) => String(n).padStart(2, "0");
/** ISO instant -> value for <input type="datetime-local"> in the village time zone (SITE_TZ). */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  const z = zoneParts(ms);
  return `${z.y}-${pad(z.mo)}-${pad(z.d)}T${pad(z.h)}:${pad(z.mi)}`;
}
/** datetime-local value (village time zone) -> ISO instant, or null when empty / invalid. */
export function localInputToIso(v: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);
  if (!m) return null;
  const naive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  if (Number.isNaN(naive)) return null;
  let ms = naive - (asUtc(zoneParts(naive)) - naive);
  ms = naive - (asUtc(zoneParts(ms)) - ms); // second pass settles zones whose offset changes near the instant
  const out = new Date(ms);
  return Number.isNaN(out.getTime()) ? null : out.toISOString();
}
