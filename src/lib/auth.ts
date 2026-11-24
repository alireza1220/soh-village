// Client-side Supabase magic-link auth. Browser fetch + localStorage only; nothing runs at import time.
import { publicSupabase } from "@/lib/supabase";

export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
  user: { id: string; email: string };
};

const KEY = "soh.session";
const EVENT = "soh-session";

function notify() {
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

function save(s: Session | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {}
}

function load(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s || typeof s.accessToken !== "string" || typeof s.expiresAt !== "number" || !s.user?.id) return null;
    return s;
  } catch {
    return null;
  }
}

function jwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    let b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export async function sendMagicLink(email: string, redirectTo: string): Promise<{ ok: boolean; error?: string }> {
  const sb = publicSupabase();
  if (!sb) return { ok: false, error: "not_configured" };
  try {
    const res = await fetch(`${sb.url}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: "POST",
      headers: { apikey: sb.anon, "Content-Type": "application/json" },
      body: JSON.stringify({ email, create_user: true }),
    });
    if (res.ok) return { ok: true };
    return { ok: false, error: res.status === 429 ? "rate_limited" : res.status === 400 || res.status === 422 ? "bad_email" : "send_failed" };
  } catch {
    return { ok: false, error: "send_failed" };
  }
}

export function consumeSessionFromUrl(): Session | null {
  try {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash.includes("access_token=")) return null;
    const p = new URLSearchParams(hash);
    const accessToken = p.get("access_token");
    const refreshToken = p.get("refresh_token") ?? "";
    const expiresIn = Number(p.get("expires_in") ?? 3600);
    if (!accessToken) return null;
    const payload = jwtPayload(accessToken);
    const id = typeof payload?.sub === "string" ? payload.sub : "";
    if (!id) return null;
    const email = typeof payload?.email === "string" ? payload.email : "";
    const session: Session = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000,
      user: { id, email },
    };
    save(session);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    notify();
    return session;
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const s = load();
  if (!s || s.expiresAt - 30_000 <= Date.now()) return null;
  return s;
}

export async function refreshSession(): Promise<Session | null> {
  const sb = publicSupabase();
  if (typeof window === "undefined" || !sb) return null;
  const old = load();
  if (!old?.refreshToken) return null;
  try {
    const res = await fetch(`${sb.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: sb.anon, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: old.refreshToken }),
    });
    if (!res.ok) {
      // A rejected refresh token will never work again; drop the dead session.
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        save(null);
        notify();
      }
      return null;
    }
    const d = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
    if (!d.access_token) return null;
    const payload = jwtPayload(d.access_token);
    const session: Session = {
      accessToken: d.access_token,
      refreshToken: d.refresh_token ?? old.refreshToken,
      expiresAt: Date.now() + (d.expires_in ?? 3600) * 1000,
      user: {
        id: typeof payload?.sub === "string" ? payload.sub : old.user.id,
        email: typeof payload?.email === "string" ? payload.email : old.user.email,
      },
    };
    save(session);
    notify();
    return session;
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  const sb = publicSupabase();
  const s = typeof window === "undefined" ? null : load();
  if (sb && s) {
    try {
      await fetch(`${sb.url}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: sb.anon, Authorization: `Bearer ${s.accessToken}` },
      });
    } catch {}
  }
  save(null);
  notify();
}
