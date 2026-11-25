"use client";
import { useEffect, useState } from "react";
import type { Listing, ListingType } from "@/lib/market";
import { publicSupabase, keyHeaders } from "@/lib/supabase";

/**
 * Approved listings from Supabase (the public_listings view, newest first, max 200).
 * Returns [] while loading, when Supabase is not configured, and on any error, so callers can
 * fall back to the local `listings` array or to an honest empty state. Expiry filtering is left to the caller.
 */
export function useLiveListings(): Listing[] {
  const [remote, setRemote] = useState<Listing[]>([]);

  useEffect(() => {
    const sb = publicSupabase();
    if (!sb) return;
    let cancelled = false;
    fetch(`${sb.url}/rest/v1/public_listings?select=*&order=created_at.desc&limit=200`, { headers: keyHeaders(sb.anon) })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Record<string, string | null>[]) => {
        if (cancelled || !Array.isArray(rows)) return;
        setRemote(rows.map((r) => ({
          id: String(r.id), type: r.type as ListingType, category: String(r.category), title: String(r.title),
          quantity: r.quantity ?? undefined, price: r.price ?? undefined, area: String(r.area), available: r.available ?? undefined,
          details: r.details ?? undefined,
          contact: r.contact_value ? { kind: String(r.contact_kind), value: String(r.contact_value) } : undefined,
          postedAt: String(r.created_at).slice(0, 10), expiresAt: r.expires_at ? String(r.expires_at).slice(0, 10) : "2099-12-31",
        })));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return remote;
}
