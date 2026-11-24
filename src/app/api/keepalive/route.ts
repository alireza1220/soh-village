import { connection } from "next/server";
import { serverSupabase } from "@/lib/supabase";

// Called once a day by Vercel Cron (vercel.json) so the free Supabase project is not paused for inactivity.
export async function GET(req: Request) {
  await connection(); // always run at request time, never prerender
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("unauthorized", { status: 401 });
  const sb = serverSupabase();
  if (!sb) return Response.json({ ok: false, reason: "not_configured" });
  try {
    const r = await fetch(`${sb.url}/rest/v1/public_listings?select=id&limit=1`, { headers: { apikey: sb.key, Authorization: `Bearer ${sb.key}` } });
    return Response.json({ ok: r.ok });
  } catch {
    return Response.json({ ok: false });
  }
}
