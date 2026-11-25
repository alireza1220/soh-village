// Server-only. Verifies a Supabase access token by asking the Supabase Auth server.
export function bearerFrom(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(\S+)$/i.exec(h.trim());
  return m ? m[1] : null;
}

export async function verifyAccessToken(token: string): Promise<{ id: string; email: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !token) return null;
  // Cheap shape check (token-like characters only, under 4 KB) before calling the Auth server.
  if (token.length > 4096 || !/^[\w.@+=~-]+$/.test(token)) return null;
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const u = (await res.json()) as { id?: unknown; email?: unknown; is_anonymous?: unknown };
    if (typeof u.id !== "string" || !u.id) return null;
    // Anonymous sign-ins (if ever switched on in Supabase) must not pass the "log in first" gate: a real e-mail is required.
    const email = typeof u.email === "string" ? u.email : "";
    if (u.is_anonymous === true || !email) return null;
    return { id: u.id, email };
  } catch {
    return null;
  }
}
