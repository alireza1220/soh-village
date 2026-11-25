import { connection } from "next/server";
import { publicSupabase, serverSupabase, keyHeaders } from "@/lib/supabase";

// Called once a day by Vercel Cron (vercel.json) so the free Supabase project is not paused for inactivity.
// Also tidies old data: rate log older than 2 days, and personal fields of listings removed more than 30 days ago.
export async function GET(req: Request) {
  await connection(); // always run at request time, never prerender
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("unauthorized", { status: 401 });
  const pub = publicSupabase();
  const sb = serverSupabase();
  if (!pub) return Response.json({ ok: false, reason: "not_configured" });
  try {
    const r = await fetch(`${pub.url}/rest/v1/public_listings?select=id&limit=1`, { headers: keyHeaders(pub.anon) });
    if (sb) {
      const h = { ...keyHeaders(sb.key), "Content-Type": "application/json", Prefer: "return=minimal" };
      const twoDays = new Date(Date.now() - 2 * 86_400_000).toISOString();
      const month = new Date(Date.now() - 30 * 86_400_000).toISOString();
      await fetch(`${sb.url}/rest/v1/rate_events?created_at=lt.${encodeURIComponent(twoDays)}`, { method: "DELETE", headers: h }).catch(() => {});
      await fetch(`${sb.url}/rest/v1/listings?status=eq.removed&updated_at=lt.${encodeURIComponent(month)}&or=(contact_value.not.is.null,poster_name.not.is.null,ip_hash.not.is.null,manage_hash.not.is.null)`, {
        method: "PATCH", headers: h, body: JSON.stringify({ contact_value: null, poster_name: null, ip_hash: null, manage_hash: null }),
      }).catch(() => {});
    }
    return Response.json({ ok: r.ok });
  } catch {
    return Response.json({ ok: false });
  }
}
