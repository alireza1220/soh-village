"use client";
import { useEffect, useRef, useState } from "react";
import "@/styles/market.css";
import type { Locale } from "@/lib/i18n";
import "@/styles/forms.css";
import { BOARDS, categoryLabel, typeLabel } from "@/lib/boards";
import { ListingFieldset, toFields, valuesReady, type FormValues } from "@/components/listing-form";
import Link from "next/link";
import { profileHref } from "@/lib/return-to";
import { errorText } from "@/lib/api-errors";
import type { ManagedListing } from "@/components/listing-api";
import { PhotoPicker } from "@/components/photo-picker";
import { imageUrl, isImageName } from "@/lib/listing-images";
import { pendingUploads, plural, savePhotos, type NewPhoto, type PhotoAuth, type PhotoItem, type Progress } from "@/lib/photo-upload";

export type RunResult = { ok: boolean; listing?: ManagedListing; error?: string };
export type RunAction = (action: "update" | "renew" | "delete", id: string, fields?: Record<string, unknown>) => Promise<RunResult>;

const T = {
  edit: { fa: "ویرایش", en: "Edit" },
  renew: { fa: "تمدید ۳۰ روزه", en: "Renew for 30 days" },
  del: { fa: "حذف", en: "Delete" },
  delSure: { fa: "مطمئنید؟ حذف برگشت‌پذیر نیست.", en: "Sure? Deleting cannot be undone." },
  delYes: { fa: "بله، حذف شود", en: "Yes, delete it" },
  cancel: { fa: "انصراف", en: "Cancel" },
  save: { fa: "ذخیره", en: "Save" },
  saving: { fa: "در حال ذخیره...", en: "Saving..." },
  saved: { fa: "ذخیره شد. آگهی تأییدشده دوباره بررسی می‌شود.", en: "Saved. Approved listings get rechecked." },
  renewed: { fa: "۳۰ روز تمدید شد.", en: "Renewed for 30 days." },
  deleted: { fa: "آگهی حذف شد.", en: "Listing deleted." },
  expires: { fa: "انقضا", en: "Expires" },
  renewals: { fa: "تمدیدها", en: "Renewals" },
  editNote: { fa: "با هر ویرایش، حتی فقط تغییر عکس، آگهی دوباره بررسی می‌شود.", en: "Editing (even just photos) sends an approved listing back for review." },
  waitPhotos: { fa: "عکس‌ها هنوز آماده می‌شوند...", en: "Photos are still getting ready..." },
  sendingPhoto: { fa: "عکس {i} از {n} در حال ارسال...", en: "Sending photo {i} of {n}..." },
  savingPhotos: { fa: "عکس‌ها در حال ذخیره‌اند...", en: "Saving your photos..." },
  photoPartial: { fa: "تغییرها ذخیره شد، اما {k} عکس فرستاده نشد. دوباره «ذخیره» را بزنید.", en: "Changes saved, but {k} photo(s) did not go through. Press Save to retry." },
  keepOpen: { fa: "تا پایان ارسال این صفحه را نبندید.", en: "Keep this page open until sending ends." },
  hiddenNote: { fa: "شماره‌ی شما پنهان می‌ماند. بازدیدکننده فقط پس از زدن «نمایش شماره» آن را می‌بیند. نشانی‌تان هرگز نمایش داده نمی‌شود.", en: "Your phone number stays hidden. Visitors see it only after tapping «Show phone». Your address is never shown." },
  finish: { fa: "تکمیل مشخصات", en: "Complete profile" },
  board: { fa: "بخش", en: "Section" },
  photosOf: { fa: "عکس‌های آگهی", en: "Listing photos" },
};
const STATUS: Record<string, { fa: string; en: string }> = {
  pending: { fa: "در انتظار بررسی", en: "Pending check" },
  approved: { fa: "تأییدشده", en: "Approved" },
  rejected: { fa: "ردشده", en: "Rejected" },
  removed: { fa: "حذف‌شده", en: "Removed" },
  expired: { fa: "منقضی", en: "Expired" },
};


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

const SB = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const namesOf = (l: { images?: string[] }) => (l.images ?? []).filter(isImageName);
const storedFrom = (id: string, names: string[]): PhotoItem[] =>
  names.map((name) => ({ kind: "stored", key: `s-${name}`, name, thumbUrl: imageUrl(SB, id, name, "thumb") }));
const fillN = (s: string, o: Record<string, number>, lang: Locale) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => (o[k] ?? 0).toLocaleString(lang === "fa" ? "fa-IR" : "en"));
export type PhotoAuthFn = (id: string) => Promise<PhotoAuth | null>;

function ListingCard({ lang, item, run, onChange, onRemoved, photoAuth }: { lang: Locale; item: ManagedListing; run: RunAction; onChange: (l: ManagedListing) => void; onRemoved: (id: string) => void; photoAuth?: PhotoAuthFn }) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; code?: string } | null>(null);
  const board = item.board ?? "market";
  const bc = BOARDS[board];
  const [f, setF] = useState<FormValues>(() => ({
    type: item.type, category: item.category, title: item.title ?? "", quantity: item.quantity ?? "", price: item.price ?? "",
    area: item.area && item.area !== "—" ? item.area : "", available: item.available ?? "", details: item.details ?? "",
  }));
  const [photos, setPhotos] = useState<PhotoItem[]>(() => storedFrom(item.id, namesOf(item)));
  const [prog, setProg] = useState<Progress | null>(null);
  const photosRef = useRef(photos);
  useEffect(() => { photosRef.current = photos; });
  const preparing = photos.some((p) => p.kind === "new" && p.state === "preparing");
  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) => setF((p) => ({ ...p, [k]: v }));
  const st = effectiveStatus(item);
  const locked = item.status === "removed" || item.status === "rejected";
  const pre = `lm-${item.id}`;
  const yesRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (mode === "confirm") yesRef.current?.focus(); }, [mode]);

  const doRun = async (action: "update" | "renew" | "delete", fields?: Record<string, unknown>) => {
    setBusy(true); setMsg(null);
    const r = await run(action, item.id, fields);
    setBusy(false);
    if (!r.ok) { setMsg({ ok: false, text: errorText(r.error, lang), code: r.error }); return; }
    if (action === "delete") { setMsg({ ok: true, text: T.deleted[lang] }); setMode("view"); onRemoved(item.id); return; }
    if (r.listing) { onChange(r.listing); if (action === "update") setPhotos(storedFrom(item.id, namesOf(r.listing))); }
    setMode("view");
    setMsg({ ok: true, text: action === "renew" ? T.renewed[lang] : T.saved[lang] });
  };

  const save = async () => {
    const base: Record<string, unknown> = { ...toFields(f) };
    const names = photos.map((p) => (p.kind === "stored" ? p.name : p.uploadedName)).filter((n): n is string => !!n);
    const cur = namesOf(item);
    const changed = names.length !== cur.length || names.some((n, i) => n !== cur[i]);
    if (!pendingUploads(photos).length) return doRun("update", changed ? { ...base, images: names } : base);

    // New photos: send them first, then save the ordered list together with the other fields in one update.
    setBusy(true); setMsg(null); setProg({ phase: "sending", index: 1, total: 1, fraction: 0 });
    const auth = photoAuth ? await photoAuth(item.id) : null;
    let serverCount = cur.length;
    let latest: ManagedListing | undefined;
    let finalErr = "";
    const res = await savePhotos({
      auth,
      items: photosRef.current,
      serverCount,
      finalizeCarriesEdits: true,
      finalize: async (list) => {
        const r = await run("update", item.id, { ...base, images: list });
        if (r.ok) { serverCount = list.length; if (r.listing) { latest = r.listing; onChange(r.listing); } } else finalErr = r.error ?? "";
        return { ok: r.ok, error: r.error };
      },
      onItem: (key, patch) => setPhotos((prev) => prev.map((i) => (i.key === key && i.kind === "new" ? ({ ...i, ...patch } as NewPhoto) : i))),
      onProgress: setProg,
    });
    setProg(null); setBusy(false);
    if (res.finalized && !res.failed.length) {
      setPhotos(storedFrom(item.id, latest ? namesOf(latest) : res.names));
      setMode("view");
      setMsg({ ok: true, text: T.saved[lang] });
      return;
    }
    const why = res.finalizeError ?? res.failed[0]?.error ?? finalErr;
    const k = res.finalized ? res.failed.length : photos.filter((p) => p.kind === "new" && !!p.full).length || res.failed.length;
    setMsg({ ok: false, text: `${res.finalized ? plural(fillN(T.photoPartial[lang], { k }, lang), k) : ""} ${errorText(why, lang)}`.trim(), code: why });
  };

  return (
    <li className="mk-listing">
      <div className="mk-chips">
        <span className="mk-status" data-status={st}>{STATUS[st]?.[lang] ?? st}</span>
        <span className="chip frm-chip-board">{bc.title[lang]}</span>
        <span className="chip">{typeLabel(board, item.type, lang)}</span>
        <span className="chip">{categoryLabel(board, item.category, lang)}</span>
      </div>
      <h3>{item.title}</h3>
      <p className="mk-expiry">
        {T.expires[lang]}: {fmtDate(item.expiresAt, lang)}{(item.renewals ?? 0) > 0 && <> · {T.renewals[lang]}: {(item.renewals ?? 0).toLocaleString(lang === "fa" ? "fa-IR" : "en")}</>}
      </p>

      {mode !== "edit" && namesOf(item).length > 0 && (
        <ul className="ph-strip" aria-label={T.photosOf[lang]}>
          {namesOf(item).map((n, i) => (
            <li key={n}>
              {/* eslint-disable-next-line @next/next/no-img-element -- small remote thumbnail */}
              <img src={imageUrl(SB, item.id, n, "thumb")} alt={`${lang === "fa" ? "عکس" : "Photo"} ${(i + 1).toLocaleString(lang === "fa" ? "fa-IR" : "en")}`} loading="lazy" decoding="async" /></li>
          ))}
        </ul>
      )}

      {mode === "edit" && (
        <form className="mk-editform" onSubmit={(e) => { e.preventDefault(); void save(); }} aria-label={T.edit[lang]}>
          {item.status === "approved" && <p className="mk-msg">{T.editNote[lang]}</p>}
          <ListingFieldset
            lang={lang} board={board} idp={pre} v={f} set={set}
            keepType={!bc.types.some((o) => o.v === item.type) && (
              <label className="mk-choice"><input type="radio" name={`${pre}-type`} checked={f.type === item.type} onChange={() => set("type", item.type)} />{typeLabel(board, item.type, lang)}</label>
            )}
            keepCategory={!bc.categories.some((o) => o.v === item.category) && <option value={item.category}>{categoryLabel(board, item.category, lang)}</option>}
            photos={<PhotoPicker lang={lang} items={photos} setItems={setPhotos} id={`${pre}-photos`} mode={busy ? "busy" : "edit"} />}
          />
          <p className="frm-contact__private">{T.hiddenNote[lang]}</p>
          {prog && (
            <div className="ph-progress">
              <p>{prog.phase === "saving" ? T.savingPhotos[lang] : fillN(T.sendingPhoto[lang], { i: prog.index, n: prog.total }, lang)}</p>
              <div className="ph-progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(prog.fraction * 100)} aria-label={T.savingPhotos[lang]}>
                <span style={{ inlineSize: `${Math.round(prog.fraction * 100)}%` }} />
              </div>
              <p className="ph-tips">{T.keepOpen[lang]}</p>
            </div>
          )}
          <div className="mk-actions">
            <button type="submit" className="btn btn--primary" disabled={busy || preparing || !valuesReady(board, f)}>{busy ? T.saving[lang] : T.save[lang]}</button>
            <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => { setPhotos(storedFrom(item.id, namesOf(item))); setMode("view"); }}>{T.cancel[lang]}</button>
            {preparing && <span className="mk-session">{T.waitPhotos[lang]}</span>}
          </div>
        </form>
      )}

      {mode === "confirm" && (
        <div className="mk-confirm" role="alertdialog" aria-labelledby={`${pre}-confirm`}>
          <p id={`${pre}-confirm`}>{T.delSure[lang]}</p>
          <div className="mk-actions">
            <button type="button" ref={yesRef} className="btn btn--dark" disabled={busy} onClick={() => void doRun("delete")}>{T.delYes[lang]}</button>
            <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => setMode("view")}>{T.cancel[lang]}</button>
          </div>
        </div>
      )}

      {mode === "view" && (
        <div className="mk-actions">
          {!locked && <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => { setMsg(null); setMode("edit"); }}>{T.edit[lang]}</button>}
          {canRenew(item) && <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void doRun("renew")}>{busy ? T.saving[lang] : T.renew[lang]}</button>}
          {item.status !== "removed" && <button type="button" className="btn btn--quiet-danger" disabled={busy} onClick={() => { setMsg(null); setMode("confirm"); }}>{T.del[lang]}</button>}
        </div>
      )}

      <div aria-live="polite" role="status" className="mk-live">
        {msg && <p className={`mk-msg ${msg.ok ? "mk-msg--ok" : "mk-msg--warn"}`}>{msg.text}{msg.code === "profile_required" && <>{" "}<Link className="link mk-tap" href={profileHref(lang, `/${lang}/my`)}>{T.finish[lang]}</Link></>}</p>}
      </div>
    </li>
  );
}

export function ListingManager({ lang, items, run, onRemoved, empty, photoAuth }: { lang: Locale; items: ManagedListing[]; run: RunAction; onRemoved?: (id: string) => void; empty?: string; photoAuth?: PhotoAuthFn }) {
  // Local copy so edits show at once; parents re-key this component when they reload the list.
  const [list, setList] = useState(items);
  const [gone, setGone] = useState<string[]>([]);
  const [removedNote, setRemovedNote] = useState(false);
  const focusRef = useRef<HTMLDivElement>(null);
  const shown = list.filter((l) => !gone.includes(l.id));
  const note = <p className="mk-msg mk-msg--ok" role="status">{removedNote ? T.deleted[lang] : ""}</p>;
  if (!shown.length) return <div ref={focusRef} tabIndex={-1} className="myads-focus">{note}<p className="muted">{empty ?? (lang === "fa" ? "آگهی‌ای نیست." : "No listings.")}</p></div>;
  return (
    <div ref={focusRef} tabIndex={-1} className="myads-focus">
    {note}
    <ul className="mk-list">
      {shown.map((l) => (
        <ListingCard
          key={l.id}
          lang={lang}
          item={l}
          run={run}
          photoAuth={photoAuth}
          onChange={(n) => setList((p) => p.map((x) => (x.id === n.id ? n : x)))}
          onRemoved={(id) => { setGone((g) => [...g, id]); setRemovedNote(true); onRemoved?.(id); window.setTimeout(() => focusRef.current?.focus(), 0); }}
        />
      ))}
    </ul>
    </div>
  );
}
