"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { errorText, postJson } from "@/components/listing-api";
import type { Locale } from "@/lib/i18n";

export type RevealState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "shown"; phone: string }
  | { status: "error"; message: string; limited: boolean };

// Phones already revealed in this tab session, by ad id. Memory only: never in the URL or localStorage, gone on reload.
const cache = new Map<string, string>();

/**
 * "Show phone" for one ad: POST /api/listings/contact { id } (public, no login). Reopening an ad whose phone was shown does not call again.
 * Pass the ad id; the state resets when the id changes. `reveal()` is safe to call twice (a second call while loading is ignored).
 */
export function useRevealContact(id: string, lang: Locale): { state: RevealState; reveal: () => void } {
  const [st, setSt] = useState<{ id: string; s: RevealState }>({ id, s: { status: "idle" } });
  const busy = useRef<string | null>(null);
  const live = useRef(id);
  useEffect(() => { live.current = id; }, [id]);

  const cached = cache.get(id);
  const state: RevealState = cached ? { status: "shown", phone: cached } : st.id === id ? st.s : { status: "idle" };

  const reveal = useCallback(() => {
    if (cache.has(id) || busy.current === id) return;
    busy.current = id;
    setSt({ id, s: { status: "loading" } });
    postJson("/api/listings/contact", { id }).then((r) => {
      if (busy.current === id) busy.current = null;
      const c = r.data.contact as { value?: unknown } | undefined;
      const phone = r.ok && c && typeof c.value === "string" && c.value ? c.value : "";
      if (phone) cache.set(id, phone);
      if (live.current !== id && !phone) return;
      setSt({ id, s: phone ? { status: "shown", phone } : { status: "error", message: errorText(r.ok ? undefined : (r.data.error as string | undefined), lang), limited: r.status === 429 } });
    });
  }, [id, lang]);

  return { state, reveal };
}
