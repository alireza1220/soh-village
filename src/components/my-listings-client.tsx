"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { useSession } from "@/components/use-session";
import { signOut } from "@/lib/auth";
import { ListingManager, type RunAction } from "@/components/listing-manager";
import { errorText, postJson, type ManagedListing } from "@/components/listing-api";

const T = {
  need: { fa: "برای دیدن آگهی‌هایتان وارد شوید.", en: "Log in to see your listings." },
  login: { fa: "رفتن به صفحه‌ی ورود", en: "Go to login" },
  loading: { fa: "در حال بارگذاری...", en: "Loading..." },
  empty: { fa: "هنوز آگهی‌ای با این حساب ندارید.", en: "You have no listings on this account yet." },
  out: { fa: "خروج", en: "Sign out" },
  deleted: { fa: "آگهی حذف شد.", en: "The listing was deleted." },
  retry: { fa: "تلاش دوباره", en: "Try again" },
};

export function MyListingsClient({ lang }: { lang: Locale }) {
  const { session, ready } = useSession();
  const token = session?.accessToken;
  const [items, setItems] = useState<ManagedListing[] | null>(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setErr("");
    const r = await postJson("/api/my/listings", { action: "list" }, token);
    if (r.ok && Array.isArray(r.data.listings)) setItems(r.data.listings as ManagedListing[]);
    else setErr(errorText(r.data.error as string | undefined, lang));
  }, [token, lang]);

  useEffect(() => { void load(); }, [load]);

  const run: RunAction = async (action, id, fields) => {
    const r = await postJson("/api/my/listings", { action, id, fields }, token);
    if (r.ok) return { ok: true, listing: r.data.listing as ManagedListing | undefined };
    return { ok: false, error: (r.data.error as string) || "error" };
  };

  if (!ready) return <p className="muted" aria-live="polite">{T.loading[lang]}</p>;
  if (!session) {
    return (
      <div className="todo flex flex-col gap-3">
        <p>{T.need[lang]}</p>
        <Link className="btn btn-primary self-start" href={`/${lang}/login`}>{T.login[lang]}</Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm muted" dir="ltr">{session.user.email}</p>
        <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>{T.out[lang]}</button>
      </div>
      <div aria-live="polite" role="status">
        {note && <p className="text-sm" style={{ color: "var(--accent)" }}>{note}</p>}
        {err && (
          <p className="text-sm flex flex-wrap items-center gap-3" style={{ color: "var(--amber)" }}>
            {err} <button type="button" className="btn btn-ghost" onClick={() => void load()}>{T.retry[lang]}</button>
          </p>
        )}
      </div>
      {items === null && !err ? (
        <p className="muted">{T.loading[lang]}</p>
      ) : items ? (
        <ListingManager lang={lang} items={items} run={run} empty={T.empty[lang]} onRemoved={() => setNote(T.deleted[lang])} />
      ) : null}
    </div>
  );
}
