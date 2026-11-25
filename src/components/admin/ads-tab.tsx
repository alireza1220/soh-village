"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";
import { BOARD_IDS, BOARDS, type BoardId } from "@/lib/boards";
import { LISTING_STATUSES, type AdminListing, type ListingStatus } from "@/lib/admin-types";
import { errorText } from "@/components/listing-api";
import { adminCall } from "./admin-api";
import { AdRow } from "./ad-row";
import { ConfirmDialog } from "./confirm-dialog";

const T = {
  status: { fa: "وضعیت", en: "Status" },
  all: { fa: "همه", en: "All" },
  board: { fa: "بخش", en: "Board" },
  search: { fa: "جستجو", en: "Search" },
  ph: { fa: "عنوان یا توضیحات", en: "Title or details" },
  go: { fa: "جستجو", en: "Search" },
  loading: { fa: "در حال بارگذاری...", en: "Loading..." },
  empty: { fa: "آگهی‌ای پیدا نشد.", en: "No ads found." },
  more: { fa: "نمایش بیشتر", en: "Load more" },
  retry: { fa: "تلاش دوباره", en: "Try again" },
  shown: { fa: "نمایش", en: "Showing" },
  of: { fa: "از", en: "of" },
  st: { pending: { fa: "در انتظار", en: "Pending" }, approved: { fa: "تأییدشده", en: "Approved" }, rejected: { fa: "ردشده", en: "Rejected" }, removed: { fa: "برداشته‌شده", en: "Removed" } },
  done: { pending: { fa: "آگهی به انتظار برگشت.", en: "Ad is back to pending." }, approved: { fa: "آگهی تأیید شد.", en: "Ad approved." }, rejected: { fa: "آگهی رد شد.", en: "Ad rejected." }, removed: { fa: "آگهی برداشته شد.", en: "Ad removed." } },
  rmTitle: { fa: "این آگهی برداشته شود؟", en: "Remove this ad?" },
  rmText: { fa: "آگهی و عکس‌هایش برداشته می‌شود و برگشتی ندارد.", en: "This removes the ad and its photos. It cannot be undone." },
  rmGo: { fa: "بله، بردار", en: "Yes, remove" },
};

type Filter = ListingStatus | "all";

export function AdsTab({ lang, initialStatus, onForbidden }: { lang: Locale; initialStatus: Filter; onForbidden: () => void }) {
  const [status, setStatus] = useState<Filter>(initialStatus);
  const [board, setBoard] = useState<BoardId | "all">("all");
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [items, setItems] = useState<AdminListing[]>([]);
  const [total, setTotal] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [more, setMore] = useState(false);
  const [msg, setMsg] = useState("");
  const [busyId, setBusyId] = useState("");
  const [ask, setAsk] = useState<AdminListing | null>(null);
  const seq = useRef(0);

  const fetchPage = useCallback(async (offset: number) => {
    const my = ++seq.current;
    setMsg("");
    const body: Record<string, unknown> = { action: "list", status, offset };
    if (board !== "all") body.board = board;
    if (applied) body.q = applied;
    const r = await adminCall("listings", body);
    if (my !== seq.current) return;
    if (r.ok && Array.isArray(r.data.listings)) {
      const rows = r.data.listings as AdminListing[];
      setItems((cur) => (offset === 0 ? rows : [...cur, ...rows.filter((x) => !cur.some((c) => c.id === x.id))]));
      setTotal(typeof r.data.total === "number" ? r.data.total : rows.length);
      setPhase("ready");
    } else if (!r.ok && r.status === 403) onForbidden();
    else { setMsg(errorText(r.ok ? "store_failed" : r.error, lang)); setPhase("error"); }
    setMore(false);
  }, [status, board, applied, lang, onForbidden]);

  useEffect(() => {
    const t = setTimeout(() => { setPhase("loading"); void fetchPage(0); }, 0);
    return () => clearTimeout(t);
  }, [fetchPage]);

  const setTo = async (ad: AdminListing, s: ListingStatus) => {
    setBusyId(ad.id);
    const r = await adminCall("listings", { action: "set_status", id: ad.id, status: s });
    setBusyId("");
    setAsk(null);
    // The pressed button may be gone now (Approve after approving, Remove after removing): keep keyboard focus on the ad's heading.
    setTimeout(() => (document.getElementById(`adm-ad-h-${ad.id}`) ?? document.getElementById("adm-f-status"))?.focus(), 0);
    if (r.ok && r.data.listing) {
      const fresh = r.data.listing as AdminListing;
      setItems((cur) => cur.map((x) => (x.id === fresh.id ? fresh : x)));
      setMsg(T.done[s][lang]);
    } else if (!r.ok && r.status === 403) onForbidden();
    else setMsg(errorText(r.ok ? "store_failed" : r.error, lang));
  };
  const onSet = (ad: AdminListing, s: ListingStatus) => (s === "removed" ? setAsk(ad) : void setTo(ad, s));
  const submit = (e: FormEvent) => { e.preventDefault(); setApplied(q.trim()); };
  const n = new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US");

  return (
    <div className="adm-stack">
      <form className="adm-filters" onSubmit={submit} role="search">
        <div className="field">
          <label className="label" htmlFor="adm-f-status">{T.status[lang]}</label>
          <select id="adm-f-status" className="select" value={status} onChange={(e) => setStatus(e.target.value as Filter)}>
            {LISTING_STATUSES.map((s) => <option key={s} value={s}>{T.st[s][lang]}</option>)}
            <option value="all">{T.all[lang]}</option>
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="adm-f-board">{T.board[lang]}</label>
          <select id="adm-f-board" className="select" value={board} onChange={(e) => setBoard(e.target.value as BoardId | "all")}>
            <option value="all">{T.all[lang]}</option>
            {BOARD_IDS.map((b) => <option key={b} value={b}>{BOARDS[b].title[lang]}</option>)}
          </select>
        </div>
        <div className="field adm-filters__q">
          <label className="label" htmlFor="adm-f-q">{T.search[lang]}</label>
          <div className="adm-inline">
            <input id="adm-f-q" className="input" type="search" value={q} placeholder={T.ph[lang]} onChange={(e) => setQ(e.target.value)} maxLength={80} />
            <button type="submit" className="btn btn--primary">{T.go[lang]}</button>
          </div>
        </div>
      </form>
      <p className="adm-quiet" role="status" aria-live="polite">{phase === "error" ? "" : msg || (phase === "ready" ? `${T.shown[lang]} ${n.format(items.length)} ${T.of[lang]} ${n.format(total)}` : "")}</p>
      {phase === "loading" && <p className="adm-quiet">{T.loading[lang]}</p>}
      {phase === "error" && <div className="notice" role="alert"><p>{msg}</p><button type="button" className="btn btn--primary" onClick={() => { setPhase("loading"); void fetchPage(0); }}>{T.retry[lang]}</button></div>}
      {phase === "ready" && items.length === 0 && <p className="notice">{T.empty[lang]}</p>}
      {items.length > 0 && phase !== "loading" && (
        <ul className="adm-list">{items.map((ad) => <AdRow key={ad.id} lang={lang} ad={ad} busy={busyId === ad.id} onSet={onSet} />)}</ul>
      )}
      {phase === "ready" && items.length < total && (
        <div><button type="button" className="btn btn--ghost" disabled={more} onClick={() => { setMore(true); void fetchPage(items.length); }}>{T.more[lang]}</button></div>
      )}
      <ConfirmDialog lang={lang} open={!!ask} title={T.rmTitle[lang]} text={T.rmText[lang]} confirmLabel={T.rmGo[lang]} busy={!!busyId} onConfirm={() => ask && void setTo(ask, "removed")} onCancel={() => setAsk(null)} />
    </div>
  );
}
