"use client";
import { useEffect, useState } from "react";
import { BOARD_IDS, type BoardId } from "@/lib/boards";
import { imageUrl, isImageName } from "@/lib/listing-images";
import { publicSupabase, keyHeaders } from "@/lib/supabase";
import type { LiveStatus } from "@/lib/use-live-listings";

/** What a home preview card needs from an ad. No phone, no poster name. */
export type LatestAd = {
  id: string;
  board: BoardId;
  type: string;
  category: string;
  title: string;
  price?: string;
  area: string;
  /** thumbnail URL of the first photo */
  thumb?: string;
  createdAt: string;
  /** the poster is a verified seller */
  verified: boolean;
};

const COLUMNS = "id,type,category,title,price,area,images,created_at,expires_at,board,poster_verified";
const PER_BOARD = 4;

/**
 * The newest approved, unexpired ads of every board for the home page: one small request per board (limit 4), all in one effect.
 * `ads` has a key for every board ([] when none). On error status is "error" and callers render nothing.
 */
export function useLatestListings(): { ads: Record<BoardId, LatestAd[]>; status: LiveStatus } {
  const [ads, setAds] = useState<Record<BoardId, LatestAd[]>>({ market: [], careers: [], needs: [], property: [] });
  const [status, setStatus] = useState<LiveStatus>("loading");

  useEffect(() => {
    const sb = publicSupabase();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- env is only known in the browser
    if (!sb) { setStatus("ready"); return; }
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);
    const one = (board: BoardId) =>
      fetch(`${sb.url}/rest/v1/public_listings?select=${COLUMNS}&board=eq.${board}&or=${encodeURIComponent(`(expires_at.is.null,expires_at.gte.${today})`)}&order=created_at.desc&limit=${PER_BOARD}`, { headers: keyHeaders(sb.anon) })
        .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then((rows: unknown): LatestAd[] => {
          if (!Array.isArray(rows)) throw new Error("bad");
          return (rows as Record<string, unknown>[])
            .filter((r) => !r.expires_at || String(r.expires_at).slice(0, 10) >= today)
            .map((r) => {
              const id = String(r.id);
              const first = Array.isArray(r.images) ? (r.images as unknown[]).find(isImageName) : undefined;
              return {
                id, board, type: String(r.type), category: String(r.category), title: String(r.title),
                price: r.price ? String(r.price) : undefined, area: String(r.area ?? ""),
                thumb: first ? imageUrl(sb.url, id, first, "thumb") : undefined,
                createdAt: String(r.created_at), verified: r.poster_verified === true,
              };
            });
        });
    Promise.allSettled(BOARD_IDS.map(one))
      .then((results) => {
        if (cancelled) return;
        if (results.every((r) => r.status === "rejected")) { setStatus("error"); return; }
        setAds(Object.fromEntries(BOARD_IDS.map((b, i) => { const r = results[i]; return [b, r.status === "fulfilled" ? r.value : []]; })) as Record<BoardId, LatestAd[]>);
        setStatus("ready");
      });
    return () => { cancelled = true; };
  }, []);

  return { ads, status };
}
