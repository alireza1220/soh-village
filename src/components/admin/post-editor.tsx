"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";
import { POST_KINDS, POST_LIMITS, parsePostInput, type AdminPost, type PostFields, type PostKind } from "@/lib/posts";
import { errorText } from "@/components/listing-api";
import { adminCall, isoToLocalInput, localInputToIso } from "./admin-api";
import { ConfirmDialog } from "./confirm-dialog";

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
  hint: { fa: "متن ساده است؛ یک خط خالی یعنی بند تازه. زبان دیگر اختیاری است.", en: "Plain text: a blank line starts a new paragraph. The other language is optional." },
  when: { fa: "تاریخ و ساعت رویداد", en: "Event date and time" },
  whenHint: { fa: "به وقت ایران (تهران)؛ همین وقت برای بازدیدکنندگان نمایش داده می‌شود.", en: "In Iran time (Tehran); visitors see the same time." },
  place: { fa: "مکان", en: "Place" },
  published: { fa: "منتشر شود", en: "Published" },
  publishedHint: { fa: "خاموش = پیش‌نویس؛ فقط مدیران می‌بینند.", en: "Off = draft; only admins see it." },
  save: { fa: "ذخیره", en: "Save" },
  saving: { fa: "در حال ذخیره...", en: "Saving..." },
  cancel: { fa: "بستن", en: "Close" },
  del: { fa: "حذف", en: "Delete" },
  saved: { fa: "ذخیره شد.", en: "Saved." },
  newTitle: { fa: "مطلب تازه", en: "New post" },
  editTitle: { fa: "ویرایش مطلب", en: "Edit post" },
  dTitle: { fa: "این مطلب حذف شود؟", en: "Delete this post?" },
  dText: { fa: "مطلب برای همیشه حذف می‌شود و برگشتی ندارد.", en: "The post is deleted for good. It cannot be undone." },
  dGo: { fa: "بله، حذف کن", en: "Yes, delete" },
};

type Draft = { kind: PostKind; titleFa: string; titleEn: string; bodyFa: string; bodyEn: string; when: string; placeFa: string; placeEn: string; published: boolean };
const fromPost = (p: AdminPost | null): Draft => ({
  kind: p?.kind ?? "news", titleFa: p?.titleFa ?? "", titleEn: p?.titleEn ?? "", bodyFa: p?.bodyFa ?? "", bodyEn: p?.bodyEn ?? "",
  when: isoToLocalInput(p?.eventAt), placeFa: p?.placeFa ?? "", placeEn: p?.placeEn ?? "", published: p?.published ?? false,
});

export function PostEditor({ lang, post, onSaved, onDeleted, onClose, onForbidden }: {
  lang: Locale; post: AdminPost | null; onSaved: (p: AdminPost) => void; onDeleted: (id: string) => void; onClose: () => void; onForbidden: () => void;
}) {
  const [d, setD] = useState<Draft>(() => fromPost(post));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ask, setAsk] = useState(false);
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headRef.current?.focus(); }, []); // the list is replaced by the editor: move focus with it
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((cur) => ({ ...cur, [k]: v }));
  const isEvent = d.kind === "event";

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const iso = isEvent ? localInputToIso(d.when) : null;
    const fields: PostFields = {
      kind: d.kind, titleFa: d.titleFa, titleEn: d.titleEn, bodyFa: d.bodyFa, bodyEn: d.bodyEn,
      eventAt: iso, placeFa: isEvent ? d.placeFa : null, placeEn: isEvent ? d.placeEn : null, published: d.published,
    };
    if (isEvent && d.when && !iso) { setMsg({ ok: false, text: errorText("bad_date", lang) }); return; }
    const check = parsePostInput(fields, "create");
    if (!check.ok) { setMsg({ ok: false, text: errorText(check.error, lang) }); return; }
    setBusy(true);
    setMsg(null);
    const r = await adminCall("posts", post ? { action: "update", id: post.id, fields } : { action: "create", fields });
    setBusy(false);
    if (r.ok && r.data.post) {
      const saved = r.data.post as AdminPost;
      onSaved(saved);
      setD(fromPost(saved));
      setMsg({ ok: true, text: T.saved[lang] });
    } else if (!r.ok && r.status === 403) onForbidden();
    else setMsg({ ok: false, text: errorText(r.ok ? "store_failed" : r.error, lang) });
  };

  const remove = async () => {
    if (!post) return;
    setBusy(true);
    const r = await adminCall("posts", { action: "delete", id: post.id });
    setBusy(false);
    setAsk(false);
    if (r.ok) onDeleted(post.id);
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
        <div className="field">
          <label className="label" htmlFor={`adm-b-${code}`}>{T.body[lang]}</label>
          <textarea id={`adm-b-${code}`} className="textarea" lang={code} dir={dir} rows={9} maxLength={POST_LIMITS.body} value={d[bKey]} onChange={(e) => set(bKey, e.target.value)} />
        </div>
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
      <p className="field-hint">{T.hint[lang]}</p>
      <div className="adm-langs">{langBlock("fa")}{langBlock("en")}</div>
      <p className={`adm-msg${msg && !msg.ok ? " adm-msg--bad" : ""}`} role="status" aria-live="polite">{msg?.text ?? ""}</p>
      <div className="adm-row">
        <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? T.saving[lang] : T.save[lang]}</button>
        <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>{T.cancel[lang]}</button>
        {post && <button type="button" className="btn btn--quiet-danger adm-end" onClick={() => setAsk(true)} disabled={busy}>{T.del[lang]}</button>}
      </div>
      <ConfirmDialog lang={lang} open={ask} title={T.dTitle[lang]} text={T.dText[lang]} confirmLabel={T.dGo[lang]} busy={busy} onConfirm={() => void remove()} onCancel={() => setAsk(false)} />
    </form>
  );
}
