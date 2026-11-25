import { connection } from "next/server";
import { orphansOf, objectFilesOf } from "@/lib/listing-actions";
import { AVATAR_BUCKET } from "@/lib/profile";
import { listObjects, removeObjects } from "@/lib/storage";
import { publicSupabase, serverSupabase, keyHeaders } from "@/lib/supabase";

// Called once a day by Vercel Cron (vercel.json) so the free Supabase project is not paused for inactivity.
// Also tidies old data: rate log older than 6 hours, and personal fields of listings removed more than 30 days ago.
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
      const sixHours = new Date(Date.now() - 6 * 3_600_000).toISOString(); // the rate window is 1 hour; keep 6
      const month = new Date(Date.now() - 30 * 86_400_000).toISOString();
      await fetch(`${sb.url}/rest/v1/rate_events?created_at=lt.${encodeURIComponent(sixHours)}`, { method: "DELETE", headers: h }).catch(() => {});
      await fetch(`${sb.url}/rest/v1/listings?status=eq.removed&updated_at=lt.${encodeURIComponent(month)}&or=(contact_value.not.is.null,ip_hash.not.is.null)`, {
        method: "PATCH", headers: h, body: JSON.stringify({ contact_value: null, ip_hash: null }),
      }).catch(() => {});
      await sweepImages(sb, h).catch(() => {});
      await sweepAvatars(sb, h).catch(() => {});
    }
    return Response.json({ ok: r.ok });
  } catch {
    return Response.json({ ok: false });
  }
}

// Photo clean-up, at most 20 listings per run, picked at random from the candidates so a listing that keeps failing cannot starve the rest:
//  1. listings that are over (removed / rejected): all photos go;
//  2. approved listings expired more than 14 days ago (renewing stops before that, see listing-actions): all photos go;
//  3. removed / rejected listings from 3 hours to 3 days ago: anything still in the folder (a signed upload link outlives the
//     listing for about 2 hours, so a late upload could re-create files);
//  4. active listings (pending / approved): files no saved photo refers to that are older than a day (abandoned uploads).
type Sb = NonNullable<ReturnType<typeof serverSupabase>>;
const hoursAgo = (h: number) => encodeURIComponent(new Date(Date.now() - h * 3_600_000).toISOString());
const shuffle = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

async function candidates(sb: Sb, h: Record<string, string>, q: string): Promise<{ id: string; images: string[] }[]> {
  const res = await fetch(`${sb.url}/rest/v1/listings?select=id,images&${q}&limit=100`, { headers: h, cache: "no-store" });
  return res.ok ? shuffle((await res.json()) as { id: string; images: string[] }[]) : [];
}

async function sweepImages(sb: Sb, h: Record<string, string>) {
  const SWEEP_MAX = 20;
  const groups: { q: string; whole: boolean; ageMs: number }[] = [
    { q: `status=in.(removed,rejected)&images=neq.%7B%7D`, whole: true, ageMs: 0 },
    { q: `status=eq.approved&expires_at=lt.${hoursAgo(14 * 24)}&images=neq.%7B%7D`, whole: true, ageMs: 0 },
    { q: `status=in.(removed,rejected)&updated_at=lt.${hoursAgo(3)}&updated_at=gt.${hoursAgo(72)}`, whole: true, ageMs: 0 },
    { q: `status=in.(pending,approved)&images=neq.%7B%7D`, whole: false, ageMs: 86_400_000 },
  ];
  let done = 0;
  for (const g of groups) {
    for (const { id, images } of await candidates(sb, h, g.q)) {
      if (done >= SWEEP_MAX) return;
      done++;
      const present = await listObjects(sb, id);
      if (!present) continue;
      const doomed = g.whole ? present : orphansOf(present, objectFilesOf(images), g.ageMs);
      if (!doomed.length) continue;
      if (!(await removeObjects(sb, doomed.map((o) => `${id}/${o.name}`)))) continue;
      if (g.whole && images.length) {
        await fetch(`${sb.url}/rest/v1/listings?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH", headers: h, body: JSON.stringify({ images: [] }), cache: "no-store",
        }).catch(() => {});
      }
    }
  }
}

// Avatar clean-up, at most 30 folders per run: folders of users with no profile row (account deleted, or a picture picked but the
// profile never saved) whose files are all older than a day are removed. Folders of users with a profile are left to /api/profile.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function sweepAvatars(sb: Sb, h: Record<string, string>) {
  const top = await listObjects(sb, "", AVATAR_BUCKET);
  if (!top) return;
  const folders = shuffle(top.filter((o) => UUID.test(o.name))).slice(0, 30).map((o) => o.name);
  if (!folders.length) return;
  const res = await fetch(`${sb.url}/rest/v1/profiles?select=user_id&user_id=in.(${folders.join(",")})`, { headers: h, cache: "no-store" });
  if (!res.ok) return;
  const have = new Set(((await res.json()) as { user_id: string }[]).map((r) => r.user_id));
  for (const id of folders) {
    if (have.has(id)) continue;
    const files = await listObjects(sb, id, AVATAR_BUCKET);
    if (!files?.length || files.some((f) => f.ageMs === null || f.ageMs < 86_400_000)) continue;
    await removeObjects(sb, files.map((f) => `${id}/${f.name}`), AVATAR_BUCKET);
  }
}
