"use client";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { ListingManager, type RunAction } from "@/components/listing-manager";
import { errorText, postJson, type ManagedListing } from "@/components/listing-api";

const T = {
  intro: { fa: "کدی که هنگام ثبت آگهی گرفتید را وارد کنید (با خط تیره یا بدون آن). با آن می‌توانید آگهی را ویرایش، تمدید یا حذف کنید.", en: "Enter the code you received when you posted (with or without dashes). With it you can edit, renew or delete your listing." },
  code: { fa: "کد مدیریت", en: "Manage code" },
  open: { fa: "نمایش آگهی", en: "Show listing" },
  opening: { fa: "در حال بررسی...", en: "Checking..." },
  deleted: { fa: "آگهی حذف شد.", en: "The listing was deleted." },
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
  const field = "w-full rounded-xl border px-3 py-2 bg-[var(--surface)] font-mono tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

  return (
    <div className="flex flex-col gap-4">
      {!item && !done && (
        <form className="card p-5 flex flex-col gap-3" onSubmit={open} aria-label={T.code[lang]}>
          <p className="text-sm muted">{T.intro[lang]}</p>
          <label className="flex flex-col gap-1 text-sm" htmlFor="manage-code">{T.code[lang]}
            <input id="manage-code" dir="ltr" autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="XXXX-XXXX-XXXX" className={field} style={{ borderColor: "var(--line)" }} value={code} maxLength={24} onChange={(e) => setCode(e.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary self-start" disabled={busy || !code.trim()}>{busy ? T.opening[lang] : T.open[lang]}</button>
        </form>
      )}
      <div aria-live="polite" role="status">
        {err && <p className="text-sm" style={{ color: "var(--amber)" }}>{err}</p>}
        {done && <p className="text-sm" style={{ color: "var(--accent)" }}>{done}</p>}
      </div>
      {item && (
        <>
          <ListingManager lang={lang} items={[item]} run={run} onRemoved={() => { setItem(null); setDone(T.deleted[lang]); }} />
          <button type="button" className="btn btn-ghost self-start" onClick={reset}>{T.other[lang]}</button>
        </>
      )}
      {!item && done && <button type="button" className="btn btn-ghost self-start" onClick={reset}>{T.other[lang]}</button>}
    </div>
  );
}
