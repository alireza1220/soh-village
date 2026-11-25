"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import "@/styles/market.css";
import "@/styles/forms.css";
import type { Locale } from "@/lib/i18n";
import { BOARD_IDS, BOARDS, boardPath } from "@/lib/boards";
import { avatarUrl } from "@/lib/profile";
import { authToken, signOut } from "@/lib/auth";
import { publicSupabase } from "@/lib/supabase";
import { useProfile } from "@/lib/use-profile";
import { useSession } from "@/components/use-session";
import { Avatar } from "@/components/avatar";
import { AuthGate } from "@/components/auth-gate";
import { ListingManager, type RunAction } from "@/components/listing-manager";
import { errorText, postJson, type ManagedListing } from "@/components/listing-api";

const T = {
  loading: { fa: "در حال بارگذاری...", en: "Loading..." },
  empty: { fa: "هنوز آگهی‌ای ندارید.", en: "No ads yet." },
  out: { fa: "خروج", en: "Log out" },
  deleted: { fa: "آگهی حذف شد.", en: "Ad deleted." },
  retry: { fa: "تلاش دوباره", en: "Try again" },
  profile: { fa: "مشخصات من", en: "My profile" },
  post: { fa: "یک آگهی تازه بگذارید", en: "Post a new ad" },
  again: { fa: "دوباره وارد شوید", en: "Log in again" },
};

function Inner({ lang }: { lang: Locale }) {
  const { session } = useSession();
  const { profile } = useProfile();
  const [items, setItems] = useState<ManagedListing[] | null>(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const uid = session?.user.id;

  const load = useCallback(async () => {
    if (!uid) return;
    const token = await authToken();
    const r = await postJson("/api/my/listings", { action: "list" }, token ?? undefined);
    if (r.ok && Array.isArray(r.data.listings)) { setErr(""); setItems(r.data.listings as ManagedListing[]); }
    else setErr(errorText((r.data.error as string | undefined) ?? (token ? undefined : "unauthorized"), lang));
  }, [uid, lang]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const run: RunAction = async (action, id, fields) => {
    // Photo uploads can take minutes: always take a fresh token.
    const r = await postJson("/api/my/listings", { action, id, fields }, (await authToken()) ?? undefined);
    if (r.ok) return { ok: true, listing: r.data.listing as ManagedListing | undefined };
    return { ok: false, error: (r.data.error as string) || "error" };
  };
  const photoAuth = async (id: string) => {
    const token = await authToken();
    return token ? { token, listingId: id } : null;
  };

  const sb = publicSupabase();
  const name = profile?.firstName || session?.user.email.split("@")[0] || "";
  const src = sb && uid && profile?.avatar ? avatarUrl(sb.url, `${uid}/${profile.avatar}`) : null;
  return (
    <div className="mk-stack">
      <div className="myads-head">
        <div className="myads-who">
          <Avatar name={name || "?"} src={src} size={48} />
          <div>
            <b><bdi>{name}</bdi></b>
            <Link className="link" href={`/${lang}/profile`}>{T.profile[lang]}</Link>
          </div>
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => void signOut()}>{T.out[lang]}</button>
      </div>
      <div className="myads-post">
        <h2>{T.post[lang]}</h2>
        <ul>
          {BOARD_IDS.map((b) => (
            <li key={b}><Link className="btn btn--ghost" href={`${boardPath(lang, b)}#pg-form-title`}>{BOARDS[b].title[lang]}</Link></li>
          ))}
        </ul>
      </div>
      <div aria-live="polite" role="status" className="mk-live">
        {note && <p className="mk-msg mk-msg--ok">{note}</p>}
        {err && (
          <p className="mk-msg mk-msg--warn mk-row">
            <span>{err}</span>
            <button type="button" className="btn btn--ghost" onClick={() => void load()}>{T.retry[lang]}</button>
            {err === errorText("unauthorized", lang) && <Link className="link mk-tap" href={`/${lang}/login`}>{T.again[lang]}</Link>}
          </p>
        )}
      </div>
      {items === null && !err ? (
        <p className="muted">{T.loading[lang]}</p>
      ) : items ? (
        <ListingManager lang={lang} items={items} run={run} photoAuth={photoAuth} empty={T.empty[lang]} onRemoved={() => setNote(T.deleted[lang])} />
      ) : null}
    </div>
  );
}

/** The logged-in "My ads" page: every ad of the signed-in user, on all four boards. */
export function MyListingsClient({ lang }: { lang: Locale }) {
  return (
    <AuthGate lang={lang} reason="my" next={`/${lang}/my`} requireProfile={false}>
      <Inner lang={lang} />
    </AuthGate>
  );
}
