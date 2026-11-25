// Supabase REST helpers (no SDK needed). Server-only values must never be exposed to the browser.
export const publicSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anon ? { url: url.replace(/\/$/, ""), anon } : null;
};

export const serverSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
};

// Headers that carry a project key. Older keys are JWTs (start with "eyJ") and are also sent as a bearer token.
// The newer sb_publishable_ / sb_secret_ keys are NOT JWTs and must go in the apikey header only.
export const keyHeaders = (key: string): Record<string, string> =>
  key.startsWith("eyJ") ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
