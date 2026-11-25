"use client";
import { useCallback, useEffect, useState } from "react";
import { PUBLIC_POST_COLUMNS, byPriorityThenNewest, publicPostFromRow, type PublicPost } from "@/lib/posts";
import type { LiveStatus } from "@/lib/use-live-listings";
import { publicSupabase, keyHeaders } from "@/lib/supabase";

// Several components on one page (home banner, featured band, news section) ask for the posts at the same moment:
// they share one request while it is in flight. A later call (retry, new page) fetches again.
let inflight: Promise<PublicPost[]> | null = null;
function fetchPosts(sb: { url: string; anon: string }): Promise<PublicPost[]> {
  if (inflight) return inflight;
  const get = (query: string) =>
    fetch(`${sb.url}/rest/v1/public_posts?select=${PUBLIC_POST_COLUMNS}&${query}`, { headers: keyHeaders(sb.anon) })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((rows: unknown) => { if (!Array.isArray(rows)) throw new Error("bad"); return rows as Record<string, unknown>[]; });
  // A second request makes sure an old urgent/featured post is never pushed out of the newest-100 window.
  const p = Promise.all([get("order=published_at.desc&limit=100"), get("priority=in.(urgent,featured)&order=published_at.desc&limit=20")])
    .then(([recent, flagged]) => {
      const seen = new Set<string>();
      return [...recent, ...flagged].filter((r) => { const id = String(r.id); if (seen.has(id)) return false; seen.add(id); return true; }).map(publicPostFromRow);
    })
    .finally(() => { inflight = null; });
  inflight = p;
  return p;
}

/** Main news: up to 2 published urgent posts, newest first (home banner). */
export const urgentPosts = (posts: PublicPost[], max = 2) => posts.filter((p) => p.priority === "urgent").sort(byPriorityThenNewest).slice(0, max);
/** Second priority: up to 3 featured posts, newest first (home band). */
export const featuredPosts = (posts: PublicPost[], max = 3) => posts.filter((p) => p.priority === "featured").sort(byPriorityThenNewest).slice(0, max);

/**
 * Published news, blog posts and events from Supabase (the public_posts view, newest first, max 100).
 * `posts` is [] while loading, when Supabase is not configured (status "ready"), and on error (status "error").
 * `reload()` fetches again (retry button).
 */
export function useLivePosts(): { posts: PublicPost[]; status: LiveStatus; reload: () => void } {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [status, setStatus] = useState<LiveStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => { setStatus("loading"); setAttempt((n) => n + 1); }, []);

  useEffect(() => {
    const sb = publicSupabase();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- env is only known in the browser
    if (!sb) { setStatus("ready"); return; }
    let cancelled = false;
    fetchPosts(sb)
      .then((rows) => {
        if (cancelled) return;
        setPosts(rows);
        setStatus("ready");
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [attempt]);

  return { posts, status, reload };
}
