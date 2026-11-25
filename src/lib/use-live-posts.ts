"use client";
import { useCallback, useEffect, useState } from "react";
import { PUBLIC_POST_COLUMNS, publicPostFromRow, type PublicPost } from "@/lib/posts";
import type { LiveStatus } from "@/lib/use-live-listings";
import { publicSupabase, keyHeaders } from "@/lib/supabase";

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
    fetch(`${sb.url}/rest/v1/public_posts?select=${PUBLIC_POST_COLUMNS}&order=published_at.desc&limit=100`, { headers: keyHeaders(sb.anon) })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((rows: Record<string, unknown>[]) => {
        if (cancelled) return;
        if (!Array.isArray(rows)) throw new Error("bad");
        setPosts(rows.map(publicPostFromRow));
        setStatus("ready");
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [attempt]);

  return { posts, status, reload };
}
