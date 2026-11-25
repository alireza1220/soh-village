"use client";
import { useCallback, useEffect, useState } from "react";
import { imageUrl, isImageName, type ListingImage } from "@/lib/listing-images";
import type { BoardId } from "@/lib/boards";
import type { Listing, ListingType } from "@/lib/market";
import { avatarUrl, isAvatarPath } from "@/lib/profile";
import { publicSupabase, keyHeaders } from "@/lib/supabase";

export type LiveStatus = "loading" | "ready" | "error";

// Explicit columns only: the public view never carries a phone, address, family name or owner, and we never ask for more than we show.
const COLUMNS = "id,type,category,title,quantity,price,area,available,details,created_at,expires_at,images,board,poster_first_name,poster_avatar,poster_verified";

/**
 * Approved listings of one board from Supabase (the public_listings view, newest first, max 200).
 * `listings` is [] while loading, when Supabase is not configured (status "ready"), and on error (status "error"),
 * so callers can fall back to the local `listings` array or to an honest empty state. Expiry filtering is left to the caller.
 * `reload()` fetches again (retry button).
 */
export function useLiveListings(board: BoardId): { listings: Listing[]; status: LiveStatus; reload: () => void } {
  const [listings, setListings] = useState<Listing[]>([]);
  const [status, setStatus] = useState<LiveStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => { setStatus("loading"); setAttempt((n) => n + 1); }, []);

  useEffect(() => {
    const sb = publicSupabase();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- env is only known in the browser
    if (!sb) { setStatus("ready"); return; }
    let cancelled = false;
    fetch(`${sb.url}/rest/v1/public_listings?select=${COLUMNS}&board=eq.${board}&order=created_at.desc&limit=200`, { headers: keyHeaders(sb.anon) })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((rows: Record<string, unknown>[]) => {
        if (cancelled) return;
        if (!Array.isArray(rows)) throw new Error("bad");
        const s = (v: unknown) => (v == null ? undefined : String(v));
        setListings(rows.map((r) => {
          const id = String(r.id);
          const names = Array.isArray(r.images) ? (r.images as unknown[]).filter(isImageName) : [];
          const images: ListingImage[] = names.map((n) => ({ full: imageUrl(sb.url, id, n, "full"), thumb: imageUrl(sb.url, id, n, "thumb") }));
          const first = s(r.poster_first_name);
          const av = r.poster_avatar;
          return {
            id, board, type: r.type as ListingType, category: String(r.category), title: String(r.title),
            quantity: s(r.quantity), price: s(r.price), area: String(r.area), available: s(r.available), details: s(r.details),
            verified: r.poster_verified === true,
            postedAt: String(r.created_at).slice(0, 10), expiresAt: r.expires_at ? String(r.expires_at).slice(0, 10) : "2099-12-31",
            images: images.length ? images : undefined,
            poster: first ? { firstName: first, avatarUrl: isAvatarPath(av) ? avatarUrl(sb.url, av) : undefined } : undefined,
          };
        }));
        setStatus("ready");
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [attempt, board]);

  return { listings, status, reload };
}
