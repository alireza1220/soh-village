"use client";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { CONTACT_KINDS, LISTING_CATEGORIES, LISTING_TYPE_LABELS, LISTING_TYPES } from "@/lib/market";
import { errorText, type ManagedListing } from "@/components/listing-api";

export type RunResult = { ok: boolean; listing?: ManagedListing; error?: string };
export type RunAction = (action: "update" | "renew" | "delete", id: string, fields?: Record<string, unknown>) => Promise<RunResult>;

const T = {
  edit: { fa: "ویرایش", en: "Edit" },
  renew: { fa: "تمدید ۳۰ روزه", en: "Renew for 30 days" },
  del: { fa: "حذف", en: "Delete" },
  delSure: { fa: "مطمئنید؟ آگهی از بازارچه برداشته می‌شود و برگشتی ندارد.", en: "Are you sure? The listing is taken off the market and this cannot be undone." },
  delYes: { fa: "بله، حذف شود", en: "Yes, delete it" },
  cancel: { fa: "انصراف", en: "Cancel" },
  save: { fa: "ذخیره", en: "Save" },
  saving: { fa: "در حال ذخیره...", en: "Saving..." },
  saved: { fa: "ذخیره شد. اگر آگهی تأیید شده بود، دوباره بررسی می‌شود.", en: "Saved. If the listing was approved it will be checked again." },
  renewed: { fa: "تمدید شد: ۳۰ روز دیگر.", en: "Renewed for another 30 days." },
  deleted: { fa: "آگهی حذف شد.", en: "The listing was deleted." },
  expires: { fa: "انقضا", en: "Expires" },
  renewals: { fa: "تمدیدها", en: "Renewals" },
  editNote: { fa: "ویرایش آگهی تأییدشده آن را دوباره به صف بررسی می‌برد.", en: "Editing an approved listing sends it back for a check." },
  type: { fa: "نوع آگهی", en: "Type" },
  cat: { fa: "دسته", en: "Category" },
  title: { fa: "عنوان", en: "Title" },
  qty: { fa: "مقدار", en: "Amount" },
  price: { fa: "قیمت", en: "Price" },
  area: { fa: "منطقه و محل تحویل", en: "Area and pickup place" },
  avail: { fa: "چه زمانی", en: "When" },
  details: { fa: "توضیح بیشتر", en: "More details" },
  name: { fa: "نام (اختیاری)", en: "Name (optional)" },
  ckind: { fa: "راه تماس", en: "Contact method" },
  cval: { fa: "شماره یا شناسه", en: "Number or ID" },
  cpub: { fa: "اجازه می‌دهم راه تماسم نوشته شود", en: "Show my contact in the listing" },
};
const STATUS: Record<string, { fa: string; en: string }> = {
  pending: { fa: "در انتظار بررسی", en: "Pending check" },
  approved: { fa: "تأییدشده", en: "Approved" },
  rejected: { fa: "ردشده", en: "Rejected" },
  removed: { fa: "حذف‌شده", en: "Removed" },
  expired: { fa: "منقضی", en: "Expired" },
};

const field = "w-full rounded-xl border px-3 py-2 bg-[var(--surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
const brd = { borderColor: "var(--line)" } as const;
const lbl = "flex flex-col gap-1 text-sm";

const label = (list: { v: string; fa: string; en: string }[], v: string, lang: Locale) => list.find((o) => o.v === v)?.[lang] ?? v;

function effectiveStatus(l: ManagedListing): string {
  if (l.status === "approved" && l.expiresAt && new Date(l.expiresAt).getTime() < Date.now()) return "expired";
  return l.status;
}
function canRenew(l: ManagedListing): boolean {
  if (l.status !== "approved" || (l.renewals ?? 0) >= 4) return false;
  if (!l.expiresAt) return true;
  return new Date(l.expiresAt).getTime() < Date.now() + 7 * 86400_000;
}
function fmtDate(iso: string | null | undefined, lang: Locale): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  try { return d.toLocaleDateString(lang === "fa" ? "fa-IR" : "en-GB", { year: "numeric", month: "short", day: "numeric" }); } catch { return iso.slice(0, 10); }
}

function ListingCard({ lang, item, run, onChange, onRemoved }: { lang: Locale; item: ManagedListing; run: RunAction; onChange: (l: ManagedListing) => void; onRemoved: (id: string) => void }) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState(() => ({
    type: item.type, category: item.category, title: item.title ?? "", quantity: item.quantity ?? "", price: item.price ?? "",
    area: item.area && item.area !== "—" ? item.area : "", available: item.available ?? "", details: item.details ?? "",
    posterName: item.posterName ?? "", contactKind: item.contactKind ?? CONTACT_KINDS[0].v, contactValue: item.contactValue ?? "", contactPublic: !!item.contactPublic,
  }));
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const st = effectiveStatus(item);
  const locked = item.status === "removed" || item.status === "rejected";
  const pre = `lm-${item.id}`;

  const doRun = async (action: "update" | "renew" | "delete", fields?: Record<string, unknown>) => {
    setBusy(true); setMsg(null);
    const r = await run(action, item.id, fields);
    setBusy(false);
    if (!r.ok) { setMsg({ ok: false, text: errorText(r.error, lang) }); return; }
    if (action === "delete") { setMsg({ ok: true, text: T.deleted[lang] }); setMode("view"); onRemoved(item.id); return; }
    if (r.listing) onChange(r.listing);
    setMode("view");
    setMsg({ ok: true, text: action === "renew" ? T.renewed[lang] : T.saved[lang] });
  };

  const save = () => {
    const fields: Record<string, unknown> = { ...f };
    if (!String(f.contactValue).trim()) delete fields.contactValue;
    return doRun("update", fields);
  };

  return (
    <li className="item flex flex-col gap-3 list-none">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip" data-status={st}>{STATUS[st]?.[lang] ?? st}</span>
        <span className="chip">{label(LISTING_TYPE_LABELS, item.type, lang)}</span>
        <span className="chip">{label(LISTING_CATEGORIES, item.category, lang)}</span>
      </div>
      <h3 className="text-lg font-semibold break-words">{item.title}</h3>
      <p className="text-sm muted">
        {T.expires[lang]}: {fmtDate(item.expiresAt, lang)} · {T.renewals[lang]}: {(item.renewals ?? 0).toLocaleString(lang === "fa" ? "fa-IR" : "en")}
      </p>

      {mode === "edit" && (
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void save(); }} aria-label={T.edit[lang]}>
          {item.status === "approved" && <p className="text-sm muted">{T.editNote[lang]}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl} htmlFor={`${pre}-type`}>{T.type[lang]}
              <select id={`${pre}-type`} className={field} style={brd} value={f.type} onChange={(e) => set("type", e.target.value)}>
                {(LISTING_TYPES.some((o) => o.v === f.type) ? LISTING_TYPES : [...LISTING_TYPES, ...LISTING_TYPE_LABELS.filter((o) => o.v === f.type)]).map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
              </select>
            </label>
            <label className={lbl} htmlFor={`${pre}-cat`}>{T.cat[lang]}
              <select id={`${pre}-cat`} className={field} style={brd} value={f.category} onChange={(e) => set("category", e.target.value)}>
                {LISTING_CATEGORIES.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
              </select>
            </label>
          </div>
          <label className={lbl} htmlFor={`${pre}-title`}>{T.title[lang]}
            <input id={`${pre}-title`} className={field} style={brd} value={f.title} maxLength={120} required onChange={(e) => set("title", e.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl} htmlFor={`${pre}-qty`}>{T.qty[lang]}<input id={`${pre}-qty`} className={field} style={brd} value={f.quantity} maxLength={80} onChange={(e) => set("quantity", e.target.value)} /></label>
            <label className={lbl} htmlFor={`${pre}-price`}>{T.price[lang]}<input id={`${pre}-price`} className={field} style={brd} value={f.price} maxLength={80} onChange={(e) => set("price", e.target.value)} /></label>
            <label className={lbl} htmlFor={`${pre}-area`}>{T.area[lang]}<input id={`${pre}-area`} className={field} style={brd} value={f.area} maxLength={80} onChange={(e) => set("area", e.target.value)} /></label>
            <label className={lbl} htmlFor={`${pre}-avail`}>{T.avail[lang]}<input id={`${pre}-avail`} className={field} style={brd} value={f.available} maxLength={80} onChange={(e) => set("available", e.target.value)} /></label>
          </div>
          <label className={lbl} htmlFor={`${pre}-details`}>{T.details[lang]}
            <textarea id={`${pre}-details`} className={field} style={brd} rows={3} value={f.details} maxLength={800} onChange={(e) => set("details", e.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={lbl} htmlFor={`${pre}-name`}>{T.name[lang]}<input id={`${pre}-name`} className={field} style={brd} value={f.posterName} maxLength={60} onChange={(e) => set("posterName", e.target.value)} /></label>
            <label className={lbl} htmlFor={`${pre}-ckind`}>{T.ckind[lang]}
              <select id={`${pre}-ckind`} className={field} style={brd} value={f.contactKind} onChange={(e) => set("contactKind", e.target.value)}>
                {CONTACT_KINDS.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
              </select>
            </label>
            <label className={lbl} htmlFor={`${pre}-cval`}>{T.cval[lang]}<input id={`${pre}-cval`} dir="ltr" className={field} style={brd} value={f.contactValue} maxLength={60} onChange={(e) => set("contactValue", e.target.value)} /></label>
          </div>
          <label className="flex items-start gap-2 text-sm" htmlFor={`${pre}-cpub`}>
            <input id={`${pre}-cpub`} type="checkbox" className="mt-1" checked={f.contactPublic} onChange={(e) => set("contactPublic", e.target.checked)} />
            <span>{T.cpub[lang]}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn btn-primary" disabled={busy || !f.title.trim()}>{busy ? T.saving[lang] : T.save[lang]}</button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setMode("view")}>{T.cancel[lang]}</button>
          </div>
        </form>
      )}

      {mode === "confirm" && (
        <div className="todo flex flex-col gap-3" role="alertdialog" aria-labelledby={`${pre}-confirm`}>
          <p id={`${pre}-confirm`} className="text-sm">{T.delSure[lang]}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void doRun("delete")}>{T.delYes[lang]}</button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setMode("view")}>{T.cancel[lang]}</button>
          </div>
        </div>
      )}

      {mode === "view" && (
        <div className="flex flex-wrap gap-2">
          {!locked && <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setMsg(null); setMode("edit"); }}>{T.edit[lang]}</button>}
          {canRenew(item) && <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void doRun("renew")}>{busy ? T.saving[lang] : T.renew[lang]}</button>}
          {item.status !== "removed" && <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setMsg(null); setMode("confirm"); }}>{T.del[lang]}</button>}
        </div>
      )}

      <div aria-live="polite" role="status">
        {msg && <p className="text-sm" style={msg.ok ? { color: "var(--accent)" } : { color: "var(--amber)" }}>{msg.text}</p>}
      </div>
    </li>
  );
}

export function ListingManager({ lang, items, run, onRemoved, empty }: { lang: Locale; items: ManagedListing[]; run: RunAction; onRemoved?: (id: string) => void; empty?: string }) {
  // Local copy so edits show at once; parents re-key this component when they reload the list.
  const [list, setList] = useState(items);
  const [gone, setGone] = useState<string[]>([]);
  const shown = list.filter((l) => !gone.includes(l.id));
  if (!shown.length) return <p className="muted">{empty ?? (lang === "fa" ? "آگهی‌ای نیست." : "No listings.")}</p>;
  return (
    <ul className="flex flex-col gap-3 p-0 m-0">
      {shown.map((l) => (
        <ListingCard
          key={l.id}
          lang={lang}
          item={l}
          run={run}
          onChange={(n) => setList((p) => p.map((x) => (x.id === n.id ? n : x)))}
          onRemoved={(id) => { setGone((g) => [...g, id]); onRemoved?.(id); }}
        />
      ))}
    </ul>
  );
}
