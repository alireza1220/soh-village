"use client";

import { useEffect, useState } from "react";
import { getSession, refreshSession, type Session } from "@/lib/auth";

// Starts as { null, false } on server and first client render (no hydration mismatch), then reads localStorage.
export function useSession(): { session: Session | null; ready: boolean } {
  const [state, setState] = useState<{ session: Session | null; ready: boolean }>({ session: null, ready: false });

  useEffect(() => {
    let alive = true;
    const read = async () => {
      let s = getSession();
      if (!s) {
        let hasRefresh = false;
        try {
          const raw = localStorage.getItem("soh.session");
          hasRefresh = !!raw && !!(JSON.parse(raw) as { refreshToken?: string }).refreshToken;
        } catch {}
        if (hasRefresh) s = await refreshSession();
      }
      if (alive) setState({ session: s, ready: true });
    };
    void read();
    const onChange = () => void read();
    window.addEventListener("soh-session", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      alive = false;
      window.removeEventListener("soh-session", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return state;
}
