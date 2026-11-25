"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";
import type { AdminUser } from "@/lib/admin-types";
import { errorText } from "@/components/listing-api";
import { VerifiedBadge } from "@/components/verified-badge";
import { adminCall, fmtDate } from "./admin-api";
import { ConfirmDialog } from "./confirm-dialog";

const T = {
  note: { fa: "برای مدیر کردن یک نفر، نقش او را در Supabase عوض کنید (docs/ADMIN.md را ببینید).", en: "To make someone an admin, change their role in Supabase (see docs/ADMIN.md)." },
  search: { fa: "جستجو", en: "Search" },
  ph: { fa: "نام یا شماره", en: "Name or number" },
  loading: { fa: "در حال بارگذاری...", en: "Loading..." },
  empty: { fa: "کاربری پیدا نشد.", en: "No users found." },
  more: { fa: "نمایش بیشتر", en: "Load more" },
  retry: { fa: "تلاش دوباره", en: "Try again" },
  joined: { fa: "عضویت", en: "Joined" },
  ads: { fa: "آگهی", en: "Ads" },
  admin: { fa: "مدیر", en: "Admin" },
  user: { fa: "کاربر", en: "User" },
  shown: { fa: "نمایش", en: "Showing" },
  of: { fa: "از", en: "of" },
  help: { fa: "به دیدن فرد بروید، نشانی را بررسی کنید، سپس او را «فروشنده‌ی تأییدشده» کنید.", en: "Visit the person, check the address, then mark them verified." },
  address: { fa: "نشانی (فقط برای مدیران)", en: "Address (admins only)" },
  noAddress: { fa: "نشانی ندارد", en: "No address yet" },
  filter: { fa: "وضعیت تأیید", en: "Verification" },
  fAll: { fa: "همه", en: "All" },
  fYes: { fa: "تأییدشده", en: "Verified" },
  fNo: { fa: "تأییدنشده", en: "Not verified" },
  verifiedOn: { fa: "تأیید در", en: "Verified on" },
  mark: { fa: "تأیید به‌عنوان فروشنده", en: "Mark as verified seller" },
  unmark: { fa: "برداشتن تأیید", en: "Remove verification" },
  confirmTitle: { fa: "برداشتن تأیید؟", en: "Remove verification?" },
  confirmText: { fa: "نشان «فروشنده‌ی تأییدشده» از آگهی‌های این فرد برداشته می‌شود.", en: "The verified seller badge will disappear from this person's ads." },
  doneYes: { fa: "تأیید شد:", en: "Marked verified:" },
  doneNo: { fa: "تأیید برداشته شد:", en: "Verification removed:" },
};
type VFilter = "all" | "yes" | "no";

export function UsersTab({ lang, onForbidden }: { lang: Locale; onForbidden: () => void }) {
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [err, setErr] = useState("");
  const [more, setMore] = useState(false);
  const [vf, setVf] = useState<VFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ask, setAsk] = useState<AdminUser | null>(null);
  const [msg, setMsg] = useState("");
  const seq = useRef(0);

  const fetchPage = useCallback(async (offset: number) => {
    const my = ++seq.current;
    const r = await adminCall("users", { action: "list", q: applied || undefined, verified: vf === "all" ? undefined : vf === "yes", offset });
    if (my !== seq.current) return;
    if (r.ok && Array.isArray(r.data.users)) {
      const rows = r.data.users as AdminUser[];
      setItems((cur) => (offset === 0 ? rows : [...cur, ...rows.filter((x) => !cur.some((c) => c.userId === x.userId))]));
      setTotal(typeof r.data.total === "number" ? r.data.total : rows.length);
      setPhase("ready");
    } else if (!r.ok && r.status === 403) onForbidden();
    else { setErr(errorText(r.ok ? "store_failed" : r.error, lang)); setPhase("error"); }
    setMore(false);
  }, [applied, vf, lang, onForbidden]);

  useEffect(() => {
    const t = setTimeout(() => { setPhase("loading"); void fetchPage(0); }, 0);
    return () => clearTimeout(t);
  }, [fetchPage]);

  const nameOf = (u: AdminUser) => `${u.firstName} ${u.familyName}`.trim() || "—";
  const setVerified = async (u: AdminUser, verified: boolean) => {
    setBusyId(u.userId); setMsg("");
    const r = await adminCall("users", { action: "set_verified", userId: u.userId, verified });
    setBusyId(null); setAsk(null);
    if (r.ok && r.data.user && typeof r.data.user === "object") {
      const nu = r.data.user as AdminUser;
      setItems((cur) => cur.map((x) => (x.userId === nu.userId ? nu : x)));
      setMsg(`${verified ? T.doneYes[lang] : T.doneNo[lang]} ${nameOf(nu)}`);
    } else if (!r.ok && r.status === 403) onForbidden();
    else setMsg(errorText(r.ok ? "store_failed" : r.error, lang));
  };
  const submit = (e: FormEvent) => { e.preventDefault(); setApplied(q.trim()); };
  const n = new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US");
  return (
    <div className="adm-stack">
      <p className="notice">{T.note[lang]}</p>
      <form onSubmit={submit} role="search" className="field">
        <label className="label" htmlFor="adm-u-q">{T.search[lang]}</label>
        <div className="adm-inline">
          <input id="adm-u-q" className="input" type="search" value={q} placeholder={T.ph[lang]} onChange={(e) => setQ(e.target.value)} maxLength={80} />
          <button type="submit" className="btn btn--primary">{T.search[lang]}</button>
        </div>
      </form>
      <p className="adm-quiet">{T.help[lang]}</p>
      <div className="field">
        <label className="label" htmlFor="adm-u-v">{T.filter[lang]}</label>
        <select id="adm-u-v" className="select" value={vf} onChange={(e) => setVf(e.target.value as VFilter)}>
          <option value="all">{T.fAll[lang]}</option>
          <option value="yes">{T.fYes[lang]}</option>
          <option value="no">{T.fNo[lang]}</option>
        </select>
      </div>
      <p className="adm-quiet" role="status" aria-live="polite">{msg}</p>
      <p className="adm-quiet" role="status" aria-live="polite">{phase === "ready" ? `${T.shown[lang]} ${n.format(items.length)} ${T.of[lang]} ${n.format(total)}` : ""}</p>
      {phase === "loading" && <p className="adm-quiet">{T.loading[lang]}</p>}
      {phase === "error" && <div className="notice" role="alert"><p>{err}</p><button type="button" className="btn btn--primary" onClick={() => { setPhase("loading"); void fetchPage(0); }}>{T.retry[lang]}</button></div>}
      {phase === "ready" && items.length === 0 && <p className="notice">{T.empty[lang]}</p>}
      {phase !== "loading" && items.length > 0 && (
        <ul className="adm-list">
          {items.map((u) => (
            <li className="adm-card adm-user" key={u.userId}>
              <div>
                <b><bdi>{nameOf(u)}</bdi></b>
                <span className={`adm-badge ${u.role === "admin" ? "adm-badge--approved" : "adm-badge--plain"}`}>{u.role === "admin" ? T.admin[lang] : T.user[lang]}</span>
              </div>
              {u.verified && <div className="adm-verified"><VerifiedBadge lang={lang} />{u.verifiedAt && <span className="adm-quiet">{T.verifiedOn[lang]} {fmtDate(u.verifiedAt, lang)}</span>}</div>}
              <bdi dir="ltr" className="adm-phone">{u.phone || "—"}</bdi>
              <p className="adm-address">
                <b>{T.address[lang]}: </b>
                {u.address ? <bdi>{u.address}</bdi> : <span className="adm-warn">{T.noAddress[lang]}</span>}
              </p>
              <span className="adm-quiet">{T.joined[lang]}: {fmtDate(u.createdAt, lang)} · {T.ads[lang]}: {n.format(u.listingCount)}</span>
              <div className="adm-row">
                {u.verified
                  ? <button type="button" className="btn btn--ghost" disabled={busyId === u.userId} aria-label={`${T.unmark[lang]}: ${nameOf(u)}`} onClick={() => setAsk(u)}>{T.unmark[lang]}</button>
                  : <button type="button" className="btn btn--primary" disabled={busyId === u.userId} aria-label={`${T.mark[lang]}: ${nameOf(u)}`} onClick={() => void setVerified(u, true)}>{T.mark[lang]}</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {phase === "ready" && items.length < total && (
        <div><button type="button" className="btn btn--ghost" disabled={more} onClick={() => { setMore(true); void fetchPage(items.length); }}>{T.more[lang]}</button></div>
      )}
      <ConfirmDialog lang={lang} open={ask !== null} title={T.confirmTitle[lang]} text={`${ask ? nameOf(ask) + ": " : ""}${T.confirmText[lang]}`} confirmLabel={T.unmark[lang]} busy={busyId !== null}
        onConfirm={() => { if (ask) void setVerified(ask, false); }} onCancel={() => setAsk(null)} />
    </div>
  );
}
