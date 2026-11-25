"use client";
// The signed-in person's profile, shared by the header, the gates and the profile page.
// One module-level cache for the current user, broadcast with the window event "soh-profile".
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useSession } from "@/components/use-session";
import { authToken } from "@/lib/auth";
import { postJson } from "@/components/listing-api";
import { isComplete, type Profile } from "@/lib/profile";
import { profileHref, safeNext, takeNext } from "@/lib/return-to";
import type { Locale } from "@/lib/i18n";

export type ProfileStatus = "off" | "loading" | "none" | "ready" | "error";
type Snap = { userId: string | null; status: ProfileStatus; profile: Profile | null };

const EVENT = "soh-profile";
let snap: Snap = { userId: null, status: "off", profile: null };
let inflight: { userId: string; p: Promise<void> } | null = null;

const SERVER_SNAP: Snap = { userId: null, status: "off", profile: null };
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};
const getSnap = () => snap;
const getServerSnap = () => SERVER_SNAP;

const emit = () => {
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {}
};
const put = (next: Snap) => {
  snap = next;
  emit();
};

/** GET the profile with a given token (used right after login, before the hook has caught up). */
export async function fetchProfile(token: string): Promise<{ ok: true; profile: Profile | null } | { ok: false }> {
  const r = await postJson("/api/profile", { action: "get" }, token);
  if (!r.ok) return { ok: false };
  const p = r.data.profile as Profile | null | undefined;
  return { ok: true, profile: p && isComplete(p) ? p : null };
}

function load(userId: string): Promise<void> {
  if (inflight && inflight.userId === userId) return inflight.p;
  const p = (async () => {
    const token = await authToken();
    if (!token) {
      if (snap.userId === userId) put({ userId, status: "error", profile: null });
      return;
    }
    const r = await fetchProfile(token);
    if (snap.userId !== userId) return; // the person logged out or switched meanwhile
    if (!r.ok) put({ userId, status: "error", profile: snap.profile });
    else put({ userId, status: r.profile ? "ready" : "none", profile: r.profile });
  })().finally(() => {
    if (inflight && inflight.userId === userId) inflight = null;
  });
  inflight = { userId, p };
  return p;
}

export type UseProfile = {
  status: ProfileStatus;
  profile: Profile | null;
  /** true when the profile exists and is complete */
  complete: boolean;
  reload: () => Promise<void>;
  /** put a freshly saved profile into the shared cache (null = none) */
  set: (p: Profile | null) => void;
};

export function useProfile(): UseProfile {
  const { session, ready } = useSession();
  const uid = session?.user.id ?? null;
  // useSyncExternalStore: a change that lands between render and subscribing is never missed (a gate that hydrates late would stay on "loading").
  const cur = useSyncExternalStore(subscribe, getSnap, getServerSnap);

  useEffect(() => {
    if (!ready) return;
    if (!uid) {
      if (snap.userId !== null || snap.status !== "off") put({ userId: null, status: "off", profile: null });
      return;
    }
    if (snap.userId !== uid) {
      put({ userId: uid, status: "loading", profile: null });
      void load(uid);
    }
  }, [ready, uid]);

  const reload = useCallback(async () => {
    if (!uid) return;
    if (snap.userId !== uid) put({ userId: uid, status: "loading", profile: null });
    else if (snap.status === "error") put({ ...snap, status: "loading" });
    await load(uid);
  }, [uid]);

  const set = useCallback(
    (p: Profile | null) => {
      if (uid) put({ userId: uid, status: p ? "ready" : "none", profile: p });
    },
    [uid],
  );

  let status: ProfileStatus;
  let profile: Profile | null = null;
  if (!ready) status = "loading";
  else if (!uid) status = "off";
  else if (cur.userId !== uid) status = "loading";
  else {
    status = cur.status;
    profile = cur.profile;
  }
  return { status, profile, complete: status === "ready", reload, set };
}

/** Where to send someone who just logged in (or finished a reset). Takes the remembered destination only when the profile is complete. */
export function afterLoginHref(lang: Locale, complete: boolean, nextParam: string | null | undefined): string {
  const next = safeNext(nextParam);
  if (!complete) return profileHref(lang, next ?? undefined);
  return next ?? takeNext() ?? `/${lang}/my`;
}

const noop = () => () => {};
const readSearch = () => window.location.search;
/** The safe ?next= destination from the address ("" on the server and before hydration, then the real value). */
export function useNextParam(): string | null {
  const search = useSyncExternalStore(noop, readSearch, () => "");
  return safeNext(new URLSearchParams(search).get("next"));
}
