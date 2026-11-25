"use client";
import { useCallback, useEffect, useState } from "react";
import { imageUrl, isImageName, type ListingImage } from "@/lib/listing-images";
import type { Listing, ListingType } from "@/lib/market";
import { publicSupabase, keyHeaders } from "@/lib/supabase";

export type LiveStatus = "loading" | "ready" | "error";

/**
 * Approved listings from Supabase (the public_listings view, newest first, max 200).
 * `listings` is [] while loading, when Supabase is not configured (status "ready"), and on error (status "error"),
 * so callers can fall back to the local `listings` array or to an honest empty state. Expiry filtering is left to the caller.
 * `reload()` fetches again (retry button).
 */
export function useLiveListings(): { listings: Listing[]; status: LiveStatus; reload: () => void } {
  const [listings, setListings] = useState<Listing[]>([]);
  const [status, setStatus] = useState<LiveStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => { setStatus("loading"); setAttempt((n) => n + 1); }, []);

  useEffect(() => {
    const sb = publicSupabase();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- env is only known in the browser
    if (!sb) { setStatus("ready"); return; }
    let cancelled = false;
    fetch(`${sb.url}/rest/v1/public_listings?select=*&order=created_at.desc&limit=200`, { headers: keyHeaders(sb.anon) })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((rows: Record<string, unknown>[]) => {
        if (cancelled) return;
        if (!Array.isArray(rows)) throw new Error("bad");
        const s = (v: unknown) => (v == null ? undefined : String(v));
        setListings(rows.map((r) => {
          const id = String(r.id);
          const names = Array.isArray(r.images) ? (r.images as unknown[]).filter(isImageName) : [];
          const images: ListingImage[] = names.map((n) => ({ full: imageUrl(sb.url, id, n, "full"), thumb: imageUrl(sb.url, id, n, "thumb") }));
          return {
            id, type: r.type as ListingType, category: String(r.category), title: String(r.title),
            quantity: s(r.quantity), price: s(r.price), area: String(r.area), available: s(r.available), details: s(r.details),
            contact: r.contact_value ? { kind: String(r.contact_kind), value: String(r.contact_value) } : undefined,
            postedAt: String(r.created_at).slice(0, 10), expiresAt: r.expires_at ? String(r.expires_at).slice(0, 10) : "2099-12-31",
            images: images.length ? images : undefined,
          };
        }));
        setStatus("ready");
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [attempt]);

  return { listings, status, reload };
}
