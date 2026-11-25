// Client-side Supabase Auth (email + password, email link, password reset). Browser fetch + localStorage only;
// nothing runs at import time. The password is only ever sent to Supabase over HTTPS: never stored, logged or put in a URL.
import { publicSupabase } from "@/lib/supabase";
import type { ErrorCode } from "@/lib/api-errors";

export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
  user: { id: string; email: string };
};

/** An ErrorCode, or "generic" when Supabase said something we do not know (errorText() shows a generic message for it). */
export type AuthErrorCode = ErrorCode | "generic";
export type AuthFail = { ok: false; error: AuthErrorCode };

const KEY = "soh.session";
const EVENT = "soh-session";
const RECOVERY_FLAG = "soh.recovery"; // sessionStorage: this session came from a password-reset link

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

type Body = Record<string, unknown>;

/** Supabase error answer (status + body) -> one of our codes. `fallback` is used when nothing matches. */
function mapAuthError(status: number, body: Body, fallback: AuthErrorCode): AuthErrorCode {
  const code = String(body.error_code ?? "").toLowerCase();
  const msg = String(body.msg ?? body.message ?? body.error_description ?? body.error ?? "").toLowerCase();
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) return "wrong_credentials";
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) return "email_not_confirmed";
  if (code === "user_already_exists" || code === "email_exists" || msg.includes("already registered") || msg.includes("already been registered")) return "already_registered";
  if (code === "same_password" || msg.includes("different from the old password")) return "same_password";
  if (code === "weak_password" || msg.includes("weak password") || msg.includes("password should be")) return "weak_password";
  if (code === "reauthentication_needed" || code === "reauthentication_not_valid" || msg.includes("reauthentication")) return "reauth_needed";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || code === "over_sms_send_rate_limit" || status === 429 || msg.includes("rate limit") || msg.includes("security purposes")) return "rate_limited";
  if (code === "signup_disabled" || code === "email_provider_disabled" || msg.includes("signups not allowed") || msg.includes("signup is disabled")) return "signup_disabled";
  if (code === "otp_expired" || code === "flow_state_expired" || code === "flow_state_not_found" || code === "bad_jwt" || msg.includes("expired") || msg.includes("invalid or has expired")) return "link_expired";
  if (code === "email_address_invalid" || code === "validation_failed" || ((status === 400 || status === 422) && msg.includes("email"))) return "bad_email";
  return fallback;
}

async function authFetch(path: string, init: { method: string; body?: unknown; token?: string }): Promise<{ status: number; data: Body } | "network" | "not_configured"> {
  const sb = publicSupabase();
  if (!sb) return "not_configured";
  try {
    const res = await fetch(`${sb.url}${path}`, {
      method: init.method,
      headers: { apikey: sb.anon, "Content-Type": "application/json", ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const data = (await res.json().catch(() => ({}))) as Body;
    return { status: res.status, data: data && typeof data === "object" ? data : {} };
  } catch {
    return "network";
  }
}

function sessionFrom(d: Body, oldRefresh = ""): Session | null {
  const accessToken = typeof d.access_token === "string" ? d.access_token : "";
  if (!accessToken) return null;
  const payload = jwtPayload(accessToken);
  const u = (d.user && typeof d.user === "object" ? d.user : {}) as Body;
  const id = typeof u.id === "string" ? u.id : typeof payload?.sub === "string" ? payload.sub : "";
  if (!id) return null;
  const email = typeof u.email === "string" ? u.email : typeof payload?.email === "string" ? payload.email : "";
  const expiresIn = Number(d.expires_in ?? 3600);
  return {
    accessToken,
    refreshToken: typeof d.refresh_token === "string" ? d.refresh_token : oldRefresh,
    expiresAt: Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000,
    user: { id, email },
  };
}

function setRecoveryFlag(on: boolean) {
  try {
    if (on) sessionStorage.setItem(RECOVERY_FLAG, "1");
    else sessionStorage.removeItem(RECOVERY_FLAG);
  } catch {}
}
/** True when the current session came from a password-reset link (so abandoning the reset page should log out again). */
export function hasRecoveryFlag(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_FLAG) === "1";
  } catch {
    return false;
  }
}
export function clearRecoveryFlag() {
  setRecoveryFlag(false);
}

// ---------------- sign up / in ----------------

/** Confirm email OFF: Supabase returns a session. Confirm email ON: no session, the person must open the mail first. */
export async function signUp(email: string, password: string, redirectTo: string): Promise<{ ok: true; session: Session | null } | AuthFail> {
  const r = await authFetch(`/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`, { method: "POST", body: { email, password } });
  if (r === "network" || r === "not_configured") return { ok: false, error: r };
  if (r.status >= 200 && r.status < 300) {
    const session = sessionFrom(r.data);
    if (session) {
      save(session);
      notify();
      return { ok: true, session };
    }
    // A repeat signup with Confirm email ON looks the same on purpose (identities: []): the UI cannot tell and says the same thing.
    return { ok: true, session: null };
  }
  return { ok: false, error: mapAuthError(r.status, r.data, "generic") };
}

export async function signInWithPassword(email: string, password: string): Promise<{ ok: true; session: Session } | AuthFail> {
  const r = await authFetch("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } });
  if (r === "network" || r === "not_configured") return { ok: false, error: r };
  if (r.status >= 200 && r.status < 300) {
    const session = sessionFrom(r.data);
    if (session) {
      save(session);
      notify();
      return { ok: true, session };
    }
    return { ok: false, error: "generic" };
  }
  return { ok: false, error: mapAuthError(r.status, r.data, r.status === 400 || r.status === 401 ? "wrong_credentials" : "generic") };
}

export async function sendMagicLink(email: string, redirectTo: string): Promise<{ ok: boolean; error?: AuthErrorCode }> {
  const r = await authFetch(`/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`, { method: "POST", body: { email, create_user: true } });
  if (r === "network" || r === "not_configured") return { ok: false, error: r };
  if (r.status >= 200 && r.status < 300) return { ok: true };
  return { ok: false, error: mapAuthError(r.status, r.data, "send_failed") };
}

/** Always reports success when Supabase answers 200 (it does not reveal whether the address has an account). */
export async function sendPasswordReset(email: string, redirectTo: string): Promise<{ ok: boolean; error?: AuthErrorCode }> {
  const r = await authFetch(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, { method: "POST", body: { email } });
  if (r === "network" || r === "not_configured") return { ok: false, error: r };
  if (r.status >= 200 && r.status < 300) return { ok: true };
  return { ok: false, error: mapAuthError(r.status, r.data, "send_failed") };
}

/** Set or change the password of the logged-in person. Saves nothing locally. */
export async function updatePassword(newPassword: string): Promise<{ ok: true } | AuthFail> {
  const token = await authToken();
  if (!token) return { ok: false, error: "unauthorized" };
  const r = await authFetch("/auth/v1/user", { method: "PUT", body: { password: newPassword }, token });
  if (r === "network" || r === "not_configured") return { ok: false, error: r };
  if (r.status >= 200 && r.status < 300) return { ok: true };
  if (r.status === 401) return { ok: false, error: "unauthorized" };
  return { ok: false, error: mapAuthError(r.status, r.data, "generic") };
}

// ---------------- links from e-mail ----------------

export type AuthRedirect =
  | { kind: "none" }
  | { kind: "session"; session: Session; type: "recovery" | "other" }
  | { kind: "error"; error: AuthErrorCode };

/** Reads #access_token=...&type=... or #error=... from the address (e-mail links), saves the session and removes the hash. */
export function consumeAuthRedirect(): AuthRedirect {
  try {
    if (typeof window === "undefined") return { kind: "none" };
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return { kind: "none" };
    const p = new URLSearchParams(hash);
    const strip = () => window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if (p.get("error") || p.get("error_code")) {
      strip();
      const code = (p.get("error_code") ?? "").toLowerCase();
      const known = code === "otp_expired" || code === "access_denied" || (p.get("error") ?? "") === "access_denied";
      return { kind: "error", error: known ? "link_expired" : mapAuthError(0, { error_code: code, error_description: p.get("error_description") ?? "" }, "link_expired") };
    }
    if (!hash.includes("access_token=")) return { kind: "none" };
    const session = sessionFrom({
      access_token: p.get("access_token") ?? "",
      refresh_token: p.get("refresh_token") ?? "",
      expires_in: Number(p.get("expires_in") ?? 3600),
    });
    strip();
    if (!session) return { kind: "error", error: "link_expired" };
    const recovery = p.get("type") === "recovery";
    save(session);
    setRecoveryFlag(recovery);
    notify();
    return { kind: "session", session, type: recovery ? "recovery" : "other" };
  } catch {
    return { kind: "none" };
  }
}

// ---------------- session ----------------

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const s = load();
  if (!s || s.expiresAt - 30_000 <= Date.now()) return null;
  return s;
}

let refreshing: Promise<Session | null> | null = null;

/** One refresh at a time (refresh tokens are single-use, so parallel callers share the same request). */
export function refreshSession(): Promise<Session | null> {
  if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null; });
  return refreshing;
}

async function doRefresh(): Promise<Session | null> {
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
    const d = (await res.json()) as Body;
    const session = sessionFrom(d, old.refreshToken);
    if (!session) return null;
    if (!session.user.email) session.user.email = old.user.email;
    save(session);
    notify();
    return session;
  } catch {
    return null;
  }
}

/** THE way client code gets a fresh access token before any write. */
export async function authToken(): Promise<string | null> {
  return (getSession() ?? (await refreshSession()))?.accessToken ?? null;
}

/** Drops the saved session on this device at once (no network). */
export function forgetSession() {
  save(null);
  setRecoveryFlag(false);
  notify();
}

export async function signOut(): Promise<void> {
  const sb = publicSupabase();
  const s = typeof window === "undefined" ? null : load();
  save(null);
  setRecoveryFlag(false);
  notify();
  if (sb && s) {
    try {
      await fetch(`${sb.url}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: sb.anon, Authorization: `Bearer ${s.accessToken}` },
      });
    } catch {}
  }
}
