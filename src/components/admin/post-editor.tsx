"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";
import { POST_KINDS, POST_LIMITS, parsePostInput, type AdminPost, type PostFields, type PostKind, type PostPriority } from "@/lib/posts";
import { uploadBlob } from "@/lib/photo-upload";
import { errorText } from "@/components/listing-api";
import { adminCall, isoToLocalInput, localInputToIso } from "./admin-api";
import { ConfirmDialog } from "./confirm-dialog";
import { CoverPicker, type CoverValue } from "./cover-picker";
import { MarkdownField, MarkdownHelp } from "./markdown-field";
import { PriorityPicker } from "./priority-picker";

export const KIND_LABEL: Record<PostKind, { fa: string; en: string }> = {
  news: { fa: "خبر", en: "News" },
  blog: { fa: "وبلاگ", en: "Blog" },
  event: { fa: "رویداد", en: "Event" },
};

const T = {
  kind: { fa: "نوع مطلب", en: "Kind" },
  fa: { fa: "فارسی", en: "Persian" },
  en: { fa: "انگلیسی", en: "English" },
  title: { fa: "عنوان", en: "Title" },
  body: { fa: "متن", en: "Text" },
  hint: { fa: "متن را با مارک‌داون بنویسید (راهنما پایین است). زبان دیگر اختیاری است.", en: "Write the text in Markdown (help below). The other language is optional." },
  coverMissing: { fa: "مطلب ذخیره شد، اما عکس آن هنوز فرستاده نشده:", en: "The post is saved, but its image is not uploaded yet:" },
  retry: { fa: "دوباره فرستادن عکس", en: "Retry the image" },
  step1: { fa: "در حال ذخیره‌ی مطلب...", en: "Saving the post..." },
  step2: { fa: "در حال گرفتن اجازه‌ی ارسال عکس...", en: "Preparing the image upload..." },
  step3: { fa: "در حال فرستادن عکس...", en: "Uploading the image..." },
  step4: { fa: "در حال ثبت عکس...", en: "Attaching the image..." },
  savedImg: { fa: "ذخیره شد، عکس هم فرستاده شد.", en: "Saved, and the image is uploaded." },
  when: { fa: "تاریخ و ساعت رویداد", en: "Event date and time" },
  whenHint: { fa: "به وقت ایران (تهران)؛ همین وقت برای بازدیدکنندگان نمایش داده می‌شود.", en: "In Iran time (Tehran); visitors see the same time." },
  place: { fa: "مکان", en: "Place" },
  published: { fa: "منتشر شود", en: "Published" },
  publishedHint: { fa: "خاموش = پیش‌نویس؛ فقط مدیران می‌بینند.", en: "Off = draft; only admins see it." },
  save: { fa: "ذخیره", en: "Save" },
  saving: { fa: "در حال ذخیره...", en: "Saving..." },
  cancel: { fa: "بستن", en: "Close" },
  del: { fa: "حذف", en: "Delete" },
  imgOnly: { fa: "عکس فرستاده شد؛ بقیه‌ی تغییرات هنوز ذخیره نشده‌اند.", en: "Image uploaded; your other edits are not saved yet." },
  saved: { fa: "ذخیره شد.", en: "Saved." },
  newTitle: { fa: "مطلب تازه", en: "New post" },
  editTitle: { fa: "ویرایش مطلب", en: "Edit post" },
  dTitle: { fa: "این مطلب حذف شود؟", en: "Delete this post?" },
  dText: { fa: "مطلب برای همیشه حذف می‌شود و برگشتی ندارد.", en: "The post is deleted for good. It cannot be undone." },
  dGo: { fa: "بله، حذف کن", en: "Yes, delete" },
};

type Draft = { kind: PostKind; titleFa: string; titleEn: string; bodyFa: string; bodyEn: string; when: string; placeFa: string; placeEn: string; published: boolean; priority: PostPriority };
const fromPost = (p: AdminPost | null): Draft => ({
  kind: p?.kind ?? "news", titleFa: p?.titleFa ?? "", titleEn: p?.titleEn ?? "", bodyFa: p?.bodyFa ?? "", bodyEn: p?.bodyEn ?? "",
  when: isoToLocalInput(p?.eventAt), placeFa: p?.placeFa ?? "", placeEn: p?.placeEn ?? "", published: p?.published ?? false, priority: p?.priority ?? "normal",
});

type Signed = { name: string; full: { url: string }; thumb: { url: string } };

export function PostEditor({ lang, post, onSaved, onDeleted, onClose, onForbidden }: {
  lang: Locale; post: AdminPost | null; onSaved: (p: AdminPost) => void; onDeleted: (id: string) => void; onClose: () => void; onForbidden: () => void;
}) {
  const [cur, setCur] = useState<AdminPost | null>(post); // the latest saved copy (a new post gets its id on the first Save)
  const [d, setD] = useState<Draft>(() => fromPost(post));
  const [cover, setCover] = useState<CoverValue>({ stored: post?.cover ?? null, fresh: null });
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [coverFail, setCoverFail] = useState<string | null>(null); // post saved, image step failed: message
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ask, setAsk] = useState(false);
  const headRef = useRef<HTMLHeadingElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { headRef.current?.focus(); }, []); // the list is replaced by the editor: move focus with it
  useEffect(() => { if (coverFail && !busy) retryRef.current?.focus(); }, [coverFail, busy]);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((cur0) => ({ ...cur0, [k]: v }));
  const isEvent = d.kind === "event";

  const fail = (r: { ok: false; status: number; error: string }) => {
    if (r.status === 403) { onForbidden(); return; }
    setMsg({ ok: false, text: errorText(r.error, lang) });
  };

  /** Sends the cover step for a saved post: upload a new image, or remove the old one. Returns the post as saved, or null with coverFail set. */
  const finishCover = async (base: AdminPost): Promise<AdminPost | null> => {
    if (!cover.fresh && !(cover.stored === null && base.cover)) return base;
    if (!cover.fresh) {
      setStep(T.step4[lang]);
      const r = await adminCall("posts", { action: "update", id: base.id, fields: { cover: null } });
      if (r.ok && r.data.post) { const p = r.data.post as AdminPost; setCover({ stored: null, fresh: null }); return p; }
      if (!r.ok && r.status === 403) { onForbidden(); return null; }
      setCoverFail(errorText(r.ok ? "store_failed" : r.error, lang));
      return null;
    }
    const img = cover.fresh;
    setStep(T.step2[lang]);
    const sg = await adminCall("posts", { action: "cover_sign", id: base.id, ext: img.ext });
    if (!sg.ok) { if (sg.status === 403) onForbidden(); else setCoverFail(errorText(sg.error, lang)); return null; }
    const signed = sg.data as unknown as Signed;
    if (!signed.full?.url || !signed.thumb?.url || !signed.name) { setCoverFail(errorText("upload_failed", lang)); return null; }
    setStep(T.step3[lang]);
    const e1 = await uploadBlob(signed.thumb.url, img.thumb, () => {});
    const e2 = e1 ? e1 : await uploadBlob(signed.full.url, img.full, () => {});
    if (e1 || e2) { setCoverFail(errorText(e1 || e2 || "upload_failed", lang)); return null; }
    setStep(T.step4[lang]);
    const r = await adminCall("posts", { action: "update", id: base.id, fields: { cover: signed.name } });
    if (r.ok && r.data.post) {
      const p = r.data.post as AdminPost;
      URL.revokeObjectURL(img.previewUrl);
      setCover({ stored: p.cover, fresh: null });
      return p;
    }
    if (!r.ok && r.status === 403) { onForbidden(); return null; }
    setCoverFail(errorText(r.ok ? "bad_cover" : r.error, lang));
    return null;
  };

  const runCover = async (base: AdminPost, resetDraft: boolean) => {
    setCoverFail(null);
    const p = await finishCover(base);
    setStep("");
    if (p) {
      setCur(p);
      onSaved(p);
      if (resetDraft) setD(fromPost(p));
      setMsg({ ok: true, text: !resetDraft ? T.imgOnly[lang] : cover.fresh ? T.savedImg[lang] : T.saved[lang] });
    } else {
      setMsg(null);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const iso = isEvent ? localInputToIso(d.when) : null;
    const fields: PostFields = {
      kind: d.kind, titleFa: d.titleFa, titleEn: d.titleEn, bodyFa: d.bodyFa, bodyEn: d.bodyEn,
      eventAt: iso, placeFa: isEvent ? d.placeFa : null, placeEn: isEvent ? d.placeEn : null, published: d.published, priority: d.priority,
    };
    if (isEvent && d.when && !iso) { setMsg({ ok: false, text: errorText("bad_date", lang) }); return; }
    const check = parsePostInput(fields, "create");
    if (!check.ok) { setMsg({ ok: false, text: errorText(check.error, lang) }); return; }
    setBusy(true);
    setMsg(null);
    setCoverFail(null);
    setStep(T.step1[lang]);
    const r = await adminCall("posts", cur ? { action: "update", id: cur.id, fields } : { action: "create", fields });
    if (!(r.ok && r.data.post)) {
      setBusy(false);
      setStep("");
      fail(r.ok ? { ok: false, status: 502, error: "store_failed" } : r);
      return;
    }
    const saved = r.data.post as AdminPost;
    setCur(saved);
    onSaved(saved);
    if (cover.fresh || (cover.stored === null && saved.cover)) await runCover(saved, true);
    else { setD(fromPost(saved)); setStep(""); setMsg({ ok: true, text: T.saved[lang] }); }
    setBusy(false);
  };

  const retryCover = async () => {
    if (!cur) return;
    setBusy(true);
    setMsg(null);
    await runCover(cur, false);
    setBusy(false);
  };

  const remove = async () => {
    if (!cur) return;
    setBusy(true);
    const r = await adminCall("posts", { action: "delete", id: cur.id });
    setBusy(false);
    setAsk(false);
    if (r.ok) onDeleted(cur.id);
    else if (r.status === 403) onForbidden();
    else setMsg({ ok: false, text: errorText(r.error, lang) });
  };

  const langBlock = (code: "fa" | "en") => {
    const fa = code === "fa";
    const dir = fa ? "rtl" : "ltr";
    const tKey = fa ? "titleFa" : "titleEn";
    const bKey = fa ? "bodyFa" : "bodyEn";
    const pKey = fa ? "placeFa" : "placeEn";
    return (
      <fieldset className="adm-lang">
        <legend>{T[code][lang]}</legend>
        <div className="field">
          <label className="label" htmlFor={`adm-t-${code}`}>{T.title[lang]}</label>
          <input id={`adm-t-${code}`} className="input" type="text" lang={code} dir={dir} maxLength={POST_LIMITS.title} value={d[tKey]} onChange={(e) => set(tKey, e.target.value)} />
        </div>
        <MarkdownField lang={lang} code={code} id={`adm-b-${code}`} label={T.body[lang]} value={d[bKey]} onChange={(v) => set(bKey, v)} maxLength={POST_LIMITS.body} />
        {isEvent && (
          <div className="field">
            <label className="label" htmlFor={`adm-p-${code}`}>{T.place[lang]}</label>
            <input id={`adm-p-${code}`} className="input" type="text" lang={code} dir={dir} maxLength={POST_LIMITS.place} value={d[pKey]} onChange={(e) => set(pKey, e.target.value)} />
          </div>
        )}
      </fieldset>
    );
  };

  return (
    <form className="adm-editor" onSubmit={save} noValidate>
      <h2 className="adm-h" ref={headRef} tabIndex={-1}>{post ? T.editTitle[lang] : T.newTitle[lang]}</h2>
      <div className="adm-editor__meta">
        <div className="field">
          <label className="label" htmlFor="adm-kind">{T.kind[lang]}</label>
          <select id="adm-kind" className="select" value={d.kind} onChange={(e) => set("kind", e.target.value as PostKind)}>
            {POST_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k][lang]}</option>)}
          </select>
        </div>
        {isEvent && (
          <div className="field">
            <label className="label" htmlFor="adm-when">{T.when[lang]}</label>
            <input id="adm-when" className="input" type="datetime-local" dir="ltr" value={d.when} onChange={(e) => set("when", e.target.value)} aria-describedby="adm-when-h" />
            <span id="adm-when-h" className="field-hint">{T.whenHint[lang]}</span>
          </div>
        )}
        <div className="field">
          <label className="adm-switch">
            <input type="checkbox" role="switch" checked={d.published} onChange={(e) => set("published", e.target.checked)} aria-describedby="adm-pub-h" />
            <span className="adm-switch__track" aria-hidden="true" />
            <span>{T.published[lang]}</span>
          </label>
          <span id="adm-pub-h" className="field-hint">{T.publishedHint[lang]}</span>
        </div>
      </div>
      <PriorityPicker lang={lang} value={d.priority} onChange={(p) => set("priority", p)} published={d.published} disabled={busy} />
      <CoverPicker lang={lang} postId={cur?.id ?? null} value={cover} onChange={setCover} disabled={busy} />
      {coverFail && (
        <div className="notice adm-cover-fail" role="alert">
          <p>{T.coverMissing[lang]} {coverFail}</p>
          <button type="button" ref={retryRef} className="btn btn--primary" onClick={() => void retryCover()} disabled={busy}>{T.retry[lang]}</button>
        </div>
      )}
      <p className="field-hint">{T.hint[lang]}</p>
      <MarkdownHelp lang={lang} />
      <div className="adm-langs">{langBlock("fa")}{langBlock("en")}</div>
      <p className="adm-quiet" role="status" aria-live="polite">{busy ? step : ""}</p>
      <p className={`adm-msg${msg && !msg.ok ? " adm-msg--bad" : ""}`} role="status" aria-live="polite">{msg?.text ?? ""}</p>
      <div className="adm-row">
        <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? T.saving[lang] : T.save[lang]}</button>
        <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>{T.cancel[lang]}</button>
        {cur && <button type="button" className="btn btn--quiet-danger adm-end" onClick={() => setAsk(true)} disabled={busy}>{T.del[lang]}</button>}
      </div>
      <ConfirmDialog lang={lang} open={ask} title={T.dTitle[lang]} text={T.dText[lang]} confirmLabel={T.dGo[lang]} busy={busy} onConfirm={() => void remove()} onCancel={() => setAsk(false)} />
    </form>
  );
}
