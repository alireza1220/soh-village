"use client";
// Photo picker: 0-10 photos, mixing photos already on the listing (stored) and new ones from this device.
// Controlled by the parent through items / setItems. Each new photo is resized and re-encoded here, one at a time.
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import "@/styles/photos.css";
import type { Locale } from "@/lib/i18n";
import { MAX_IMAGES } from "@/lib/listing-images";
import { PhotoError, processImage } from "@/lib/image-resize";
import { processedPatch, type NewPhoto, type PhotoItem } from "@/lib/photo-upload";
import { errorText } from "@/components/listing-api";

export type PickerMode = "edit" | "busy" | "sent";

const T = {
  label: { fa: "عکس‌ها (اختیاری)", en: "Photos (optional)" },
  add: { fa: "افزودن عکس", en: "Add photos" },
  addMore: { fa: "عکس بیشتر", en: "Add more" },
  sub: { fa: "تا ۱۰ عکس", en: "Up to 10" },
  big: { fa: "از گالری انتخاب کنید یا همین حالا عکس بگیرید", en: "Choose from your gallery or take a photo now" },
  drop: { fa: "یا عکس‌ها را بکشید و اینجا رها کنید", en: "or drop photos here" },
  cover: { fa: "عکس اصلی", en: "Cover" },
  earlier: { fa: "یک قدم جلوتر", en: "Move earlier" },
  later: { fa: "یک قدم عقب‌تر", en: "Move later" },
  remove: { fa: "حذف عکس", en: "Remove photo" },
  removed: { fa: "عکس حذف شد.", en: "Photo removed." },
  undo: { fa: "برگرداندن", en: "Undo" },
  tips: { fa: "در نور خوب و از کل جنس عکس بگیرید. عکس آدم‌ها یا مدارک نگذارید.", en: "Good light, one item per photo, show the whole thing. No faces or ID documents." },
  privacy: { fa: "مکان و مشخصات دوربین از عکس پاک می‌شود و حجمش هم خودکار کم می‌شود.", en: "Location and camera details are removed, and photos are shrunk automatically." },
  first: { fa: "عکس اول، عکس اصلی آگهی است.", en: "The first photo is the cover." },
  preparing: { fa: "در حال آماده‌سازی…", en: "Preparing..." },
  notSent: { fa: "فرستاده نشد", en: "Not sent" },
  sent: { fa: "فرستاده شد", en: "Sent" },
  notAdded: { fa: "اضافه نمی‌شود", en: "Not added" },
  tooMany: { fa: "فقط {n} عکس اول اضافه شد؛ حداکثر ۱۰ عکس.", en: "Only the first {n} were added. The limit is 10." },
  full: { fa: "به ۱۰ عکس رسیده‌اید؛ بیشتر نمی‌شود.", en: "You already have 10 photos." },
  ready: { fa: "عکس آماده شد.", en: "Photo ready." },
  moved: { fa: "عکس شد شماره‌ی {n}.", en: "Photo is now number {n}." },
  alt: { fa: "عکس {n}", en: "Photo {n}" },
};
const SHORT_ERR: Record<string, { fa: string; en: string }> = {
  not_image: { fa: "این فایل عکس نیست", en: "Not a photo" },
  unreadable: { fa: "این عکس باز نشد؛ عکس دیگری بگذارید", en: "Can't open this photo; try another" },
  too_big_original: { fa: "بیشتر از ۳۰ مگابایت", en: "Over 30 MB" },
  encode_failed: { fa: "آماده نشد", en: "Could not prepare" },
};
const fill = (s: string, n: number, lang: Locale) => s.replace("{n}", n.toLocaleString(lang === "fa" ? "fa-IR" : "en"));
const num = (n: number, lang: Locale) => n.toLocaleString(lang === "fa" ? "fa-IR" : "en");
let seq = 0;
const newKey = () => `p${Date.now().toString(36)}${(seq++).toString(36)}`;

const Svg = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
);
const CameraIcon = () => <Svg><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="3.5" /></Svg>;
const ChevIcon = () => <Svg className="ph-flip"><path d="M15 5l-7 7 7 7" /></Svg>;
const ChevIconEnd = () => <Svg className="ph-flip"><path d="M9 5l7 7-7 7" /></Svg>;
const CloseIcon = () => <Svg><path d="M6 6l12 12M18 6L6 18" /></Svg>;
const WarnIcon = () => <Svg><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17.5v.01" /></Svg>;
const CheckIcon = () => <Svg><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;

export function PhotoPicker({ lang, items, setItems, mode = "edit", id }: { lang: Locale; items: PhotoItem[]; setItems: Dispatch<SetStateAction<PhotoItem[]>>; mode?: PickerMode; id: string }) {
  const itemsRef = useRef(items);
  const queue = useRef<{ key: string; file: File }[]>([]);
  const running = useRef(false);
  const [say, setSay] = useState("");
  const [notice, setNotice] = useState("");
  const [over, setOver] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ item: PhotoItem; index: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const sayFlip = useRef(false);
  const announce = useCallback((m: string) => { sayFlip.current = !sayFlip.current; setSay(m + (sayFlip.current ? "\u200b" : "")); }, []);
  // Put keyboard focus on a control after the one that had it went away or was disabled.
  const focusLater = useCallback((sel: string) => {
    requestAnimationFrame(() => { (rootRef.current?.querySelector(sel) as HTMLElement | null)?.focus(); });
  }, []);
  const editable = mode === "edit";
  const count = items.length;
  const full = count >= MAX_IMAGES;

  useEffect(() => { itemsRef.current = items; });
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => () => {
    // free the preview URLs when the picker goes away
    itemsRef.current.forEach((i) => { if (i.kind === "new" && i.previewUrl) URL.revokeObjectURL(i.previewUrl); });
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  const dropUndo = useCallback((u: { item: PhotoItem } | null) => {
    if (u && u.item.kind === "new" && u.item.previewUrl) URL.revokeObjectURL(u.item.previewUrl);
  }, []);

  const pump = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    while (queue.current.length) {
      const { key, file } = queue.current.shift()!;
      if (!mounted.current) { queue.current.length = 0; break; }
      if (!itemsRef.current.some((i) => i.key === key)) continue;
      try {
        const p = await processImage(file);
        if (!mounted.current || !itemsRef.current.some((i) => i.key === key)) { URL.revokeObjectURL(p.previewUrl); continue; }
        setItems((prev) => prev.map((i) => (i.key === key && i.kind === "new" ? { ...i, ...processedPatch(p) } : i)));
        announce(T.ready[lang]);
      } catch (e) {
        const code = e instanceof PhotoError ? e.code : "unreadable";
        setItems((prev) => prev.map((i) => (i.key === key && i.kind === "new" ? { ...i, state: "error", error: code } : i)));
        announce(errorText(code, lang));
      }
      await new Promise((r) => setTimeout(r, 0)); // let the browser breathe between photos
    }
    running.current = false;
  }, [lang, setItems, announce]);

  const addFiles = (list: FileList | File[]) => {
    const files = Array.from(list);
    if (!files.length || !editable) return;
    const room = MAX_IMAGES - itemsRef.current.length;
    if (room <= 0) { setNotice(T.full[lang]); announce(T.full[lang]); return; }
    const take = files.slice(0, room);
    if (files.length > take.length) { const m = fill(T.tooMany[lang], take.length, lang); setNotice(m); announce(m); } else setNotice("");
    const fresh: NewPhoto[] = take.map((f) => ({ kind: "new", key: newKey(), fileName: f.name, state: "preparing" }));
    itemsRef.current = [...itemsRef.current, ...fresh];
    setItems((prev) => [...prev, ...fresh]);
    fresh.forEach((n, i) => queue.current.push({ key: n.key, file: take[i] }));
    void pump();
    if (take.length >= room) focusLater(".ph-tile [data-act]");
  };

  const move = (key: string, to: number) => {
    setItems((prev) => {
      const from = prev.findIndex((i) => i.key === key);
      if (from < 0 || to < 0 || to >= prev.length || from === to) return prev;
      const next = prev.slice();
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
    announce(fill(T.moved[lang], to + 1, lang));
    // the button that was pressed becomes disabled at either end: keep focus on the one that still works
    const last = itemsRef.current.length - 1;
    const act = to === 0 ? "later" : to >= last ? "earlier" : null;
    if (act) focusLater(`[data-key="${key}"] [data-act="${act}"]`);
  };

  const remove = (key: string) => {
    const index = items.findIndex((i) => i.key === key);
    if (index < 0) return;
    const item = items[index];
    setItems((prev) => prev.filter((i) => i.key !== key));
    setNotice("");
    const nextKey = (items[index + 1] ?? items[index - 1])?.key;
    focusLater(nextKey ? `[data-key="${nextKey}"] [data-act="remove"], [data-key="${nextKey}"] [data-act="later"]` : ".ph-input, .ph-undo button");
    if (item.kind === "new" && item.state === "preparing") return; // nothing to bring back
    dropUndo(undo);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const u = { item, index };
    setUndo(u);
    undoTimer.current = setTimeout(() => { dropUndo(u); setUndo((cur) => (cur === u ? null : cur)); }, 7000);
  };
  const doUndo = () => {
    if (!undo) return;
    const u = undo;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo(null);
    if (itemsRef.current.length >= MAX_IMAGES) { dropUndo(u); setNotice(T.full[lang]); announce(T.full[lang]); return; }
    setItems((prev) => { const next = prev.slice(); next.splice(Math.min(u.index, next.length), 0, u.item); return next; });
  };

  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
  const canRemove = (it: PhotoItem) => mode === "edit" || (mode === "sent" && it.kind === "new" && (it.state === "failed" || it.state === "error"));

  const addTile = !full && editable && (
    <li className={`ph-cell ${count === 0 ? "ph-cell--wide" : ""}`}>
      <label className={`ph-add ${count === 0 ? "ph-add--big" : ""}`}>
        <input ref={inputRef} className="ph-input" type="file" accept="image/*" multiple id={`${id}-file`} onChange={(e) => { addFiles(e.target.files ?? []); e.target.value = ""; }} />
        <CameraIcon />
        <span className="ph-add__t">{count === 0 ? T.add[lang] : T.addMore[lang]}</span>
        <span className="ph-add__s">{count === 0 ? T.big[lang] : T.sub[lang]}</span>
        {count === 0 && <span className="ph-add__d">{T.sub[lang]} · {T.drop[lang]}</span>}
      </label>
    </li>
  );

  return (
    <div
      ref={rootRef}
      className={`ph ${over ? "ph--over" : ""}`}
      onDragOver={(e) => { if (editable && hasFiles(e)) { e.preventDefault(); setOver(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); }}
      onDrop={(e) => { if (editable && hasFiles(e)) { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); } }}
    >
      <div className="ph-head">
        <h3 className="ph-title" id={`${id}-title`}>{T.label[lang]}</h3>
        <span className="ph-count">{lang === "fa" ? `${num(count, lang)} از ${num(MAX_IMAGES, lang)}` : `${count} / ${MAX_IMAGES}`}</span>
      </div>
      <ul className="ph-grid" aria-labelledby={`${id}-title`}>
        {items.map((it, idx) => {
          const n = idx + 1;
          const isNew = it.kind === "new";
          const src = it.kind === "stored" ? it.thumbUrl : it.previewUrl;
          const st = isNew ? it.state : "ready";
          const bad = isNew && (st === "error");
          return (
            <li
              key={it.key}
              className={`ph-cell ph-tile ${dragKey === it.key ? "is-drag" : ""}`}
              data-state={st}
              data-key={it.key}
              draggable={editable && count > 1 && (!isNew || st !== "preparing")}
              onDragStart={(e) => { setDragKey(it.key); e.dataTransfer.setData("text/x-ph", it.key); e.dataTransfer.effectAllowed = "move"; }}
              onDragEnd={() => setDragKey(null)}
              onDragOver={(e) => { if (dragKey && !hasFiles(e)) e.preventDefault(); }}
              onDrop={(e) => { if (dragKey && !hasFiles(e)) { e.preventDefault(); e.stopPropagation(); move(dragKey, idx); setDragKey(null); } }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview or a small remote thumbnail */}
              {src ? <img className="ph-img" src={src} alt={fill(T.alt[lang], n, lang)} draggable={false} decoding="async" /> : <div className="ph-img ph-img--empty" />}
              {idx === 0 && !bad && <span className="ph-badge">{T.cover[lang]}</span>}

              {st === "preparing" && <div className="ph-over-note" aria-hidden="true"><span className="ph-spin" aria-hidden="true" /><span>{T.preparing[lang]}</span></div>}
              {st === "uploading" && (
                <div className="ph-over-note ph-over-note--bar" aria-hidden="true">
                  <span>{num(Math.round(((it as NewPhoto).progress ?? 0) * 100), lang)}{lang === "fa" ? "٪" : "%"}</span>
                  <span className="ph-prog"><span style={{ inlineSize: `${Math.round(((it as NewPhoto).progress ?? 0) * 100)}%` }} /></span>
                </div>
              )}
              {st === "failed" && <div className="ph-over-note ph-over-note--warn"><WarnIcon /><span>{T.notSent[lang]}</span></div>}
              {bad && (
                <div className="ph-over-note ph-over-note--err">
                  <WarnIcon />
                  <span>{(SHORT_ERR[(it as NewPhoto).error ?? ""] ?? SHORT_ERR.unreadable)[lang]}</span>
                  <span className="ph-dim">{T.notAdded[lang]}</span>
                </div>
              )}
              {st === "uploaded" && <span className="ph-done" title={T.sent[lang]}><CheckIcon /><span className="sr-only">{T.sent[lang]}</span></span>}

              {canRemove(it) && (
                <button type="button" className="ph-btn ph-remove" data-act="remove" onClick={() => remove(it.key)} aria-label={`${T.remove[lang]} ${n}`}><CloseIcon /></button>
              )}
              {editable && !bad && st !== "preparing" && (
                <div className="ph-bar">
                  <button type="button" className="ph-btn" data-act="earlier" disabled={idx === 0} onClick={() => move(it.key, idx - 1)} aria-label={`${T.earlier[lang]}: ${fill(T.alt[lang], n, lang)}`}><ChevIcon /></button>
                  <button type="button" className="ph-btn" data-act="later" disabled={idx === count - 1} onClick={() => move(it.key, idx + 1)} aria-label={`${T.later[lang]}: ${fill(T.alt[lang], n, lang)}`}><ChevIconEnd /></button>
                  {isNew && it.bytes ? <span className="ph-size">{lang === "fa" ? `${num(Math.max(1, Math.round(it.bytes / 1024)), lang)} کیلوبایت` : <bdi dir="ltr">{Math.max(1, Math.round(it.bytes / 1024))} KB</bdi>}</span> : null}
                </div>
              )}
            </li>
          );
        })}
        {addTile}
      </ul>
      {count > 1 && <p className="ph-hint">{T.first[lang]}</p>}
      <div className="ph-live" aria-live="polite" role="status">
        {notice && <p className="mk-msg mk-msg--warn">{notice}</p>}
        {undo && editable && (
          <p className="ph-undo">
            <span>{T.removed[lang]}</span>
            <button type="button" className="btn btn--ghost" onClick={doUndo}>{T.undo[lang]}</button>
          </p>
        )}
      </div>
      <p className="ph-tips">{T.tips[lang]}</p>
      <p className="ph-tips">{T.privacy[lang]}</p>
      <span className="sr-only" aria-live="polite">{say}</span>
    </div>
  );
}
