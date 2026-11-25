"use client";
import { useState } from "react";
import "@/styles/market.css";
import type { Locale } from "@/lib/i18n";
import { ListingManager, type RunAction } from "@/components/listing-manager";
import { errorText, postJson, type ManagedListing } from "@/components/listing-api";

const T = {
  intro: { fa: "برای ویرایش، تمدید یا حذف آگهی، کد مدیریت را وارد کنید.", en: "Enter your manage code to edit, renew or delete a listing." },
  code: { fa: "کد مدیریت", en: "Manage code" },
  open: { fa: "نمایش آگهی", en: "Show listing" },
  opening: { fa: "در حال بررسی...", en: "Checking..." },
  deleted: { fa: "آگهی حذف شد.", en: "Listing deleted." },
  other: { fa: "کد دیگری وارد کنید", en: "Use another code" },
};

export function ManageClient({ lang }: { lang: Locale }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [item, setItem] = useState<ManagedListing | null>(null);
  const [done, setDone] = useState("");

  const open = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(""); setDone("");
    const r = await postJson("/api/listings/manage", { code: code.trim(), action: "get" });
    setBusy(false);
    if (r.ok && r.data.listing) setItem(r.data.listing as ManagedListing);
    else setErr(errorText(r.data.error as string | undefined, lang));
  };

  const run: RunAction = async (action, _id, fields) => {
    const r = await postJson("/api/listings/manage", { code: code.trim(), action, fields });
    if (r.ok) return { ok: true, listing: r.data.listing as ManagedListing | undefined };
    return { ok: false, error: (r.data.error as string) || "error" };
  };

  const reset = () => { setItem(null); setDone(""); setCode(""); setErr(""); };
  return (
    <div className="mk-stack">
      {!item && !done && (
        <form className="mk-panel mk-narrow" onSubmit={open} aria-label={T.code[lang]}>
          <p className="mk-form-intro">{T.intro[lang]}</p>
          <div className="field">
            <label className="label" htmlFor="manage-code">{T.code[lang]}</label>
            <input id="manage-code" dir="ltr" autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="XXXX-XXXX-XXXX" className="input mk-mono" style={{ letterSpacing: "0.08em" }} value={code} maxLength={24} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <button type="submit" className="btn btn--primary" disabled={busy || !code.trim()}>{busy ? T.opening[lang] : T.open[lang]}</button>
          </div>
        </form>
      )}
      <div aria-live="polite" role="status" className="mk-live">
        {err && <p className="mk-msg mk-msg--warn">{err}</p>}
        {done && <p className="mk-msg mk-msg--ok">{done}</p>}
      </div>
      {item && (
        <>
          <ListingManager lang={lang} items={[item]} run={run} onRemoved={() => { setItem(null); setDone(T.deleted[lang]); }} />
          <div><button type="button" className="btn btn--ghost" onClick={reset}>{T.other[lang]}</button></div>
        </>
      )}
      {!item && done && <div><button type="button" className="btn btn--ghost" onClick={reset}>{T.other[lang]}</button></div>}
    </div>
  );
}
