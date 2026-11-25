"use client";
import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { postImageUrl, type AdminPost, type PostPriority } from "@/lib/posts";
import { PriorityIcon } from "@/lib/admin-icons";
import { publicSupabase } from "@/lib/supabase";
import { errorText } from "@/components/listing-api";
import { adminCall, fmtDate } from "./admin-api";
import { KIND_LABEL, PostEditor } from "./post-editor";
import { PRIORITY_LABEL } from "./priority-picker";

const T = {
  new: { fa: "مطلب تازه", en: "New post" },
  loading: { fa: "در حال بارگذاری...", en: "Loading..." },
  empty: { fa: "هنوز مطلبی نیست.", en: "No posts yet." },
  retry: { fa: "تلاش دوباره", en: "Try again" },
  draft: { fa: "پیش‌نویس", en: "Draft" },
  pub: { fa: "منتشرشده", en: "Published" },
  edit: { fa: "ویرایش", en: "Edit" },
  untitled: { fa: "بدون عنوان", en: "Untitled" },
  deleted: { fa: "مطلب حذف شد.", en: "Post deleted." },
  when: { fa: "رویداد", en: "Event" },
  makeUrgent: { fa: "فوری کن", en: "Make urgent" },
  makeFeatured: { fa: "ویژه کن", en: "Make featured" },
  makeNormal: { fa: "برگرداندن به عادی", en: "Back to normal" },
  changed: { fa: "اولویت مطلب شد", en: "Priority is now" },
  notShown: { fa: "این مطلب منتشر نشده و تا انتشار نمایش داده نمی‌شود.", en: "It is a draft, so it will not show until published." },
  cover: { fa: "عکس دارد", en: "Has an image" },
};
const ACTIONS: { to: PostPriority; label: keyof typeof T }[] = [
  { to: "urgent", label: "makeUrgent" },
  { to: "featured", label: "makeFeatured" },
  { to: "normal", label: "makeNormal" },
];

export function PostsTab({ lang, onForbidden }: { lang: Locale; onForbidden: () => void }) {
  const [items, setItems] = useState<AdminPost[]>([]);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState<AdminPost | "new" | null>(null);
  // The editor's key is fixed when editing starts, so saving a new post (which then has an id) does not remount it and lose "Saved.".
  const [editKey, setEditKey] = useState("");
  const [back, setBack] = useState("adm-post-new"); // where focus returns when the editor closes
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const sb = publicSupabase();
  const setPriority = async (p: AdminPost, to: PostPriority) => {
    setRowBusy(p.id);
    const r = await adminCall("posts", { action: "update", id: p.id, fields: { priority: to } });
    setRowBusy(null);
    if (r.ok && r.data.post) {
      const np = r.data.post as AdminPost;
      setItems((cur) => cur.map((x) => (x.id === np.id ? np : x)));
      setNote(`${T.changed[lang]} ${PRIORITY_LABEL[np.priority][lang]}.${np.priority === "urgent" && !np.published ? ` ${T.notShown[lang]}` : ""}`);
    } else if (!r.ok && r.status === 403) onForbidden();
    else setNote(errorText(r.ok ? "store_failed" : r.error, lang));
    // the pressed button is replaced by another set: keep focus on the row's stable Edit button
    requestAnimationFrame(() => document.getElementById(`adm-post-edit-${p.id}`)?.focus());
  };
  const start = (p: AdminPost | "new") => { setNote(""); setEditKey(p === "new" ? "new" : p.id); setBack(p === "new" ? "adm-post-new" : `adm-post-edit-${p.id}`); setEditing(p); };

  const load = useCallback(async () => {
    const r = await adminCall("posts", { action: "list" });
    if (r.ok && Array.isArray(r.data.posts)) { setItems(r.data.posts as AdminPost[]); setPhase("ready"); }
    else if (!r.ok && r.status === 403) onForbidden();
    else { setErr(errorText(r.ok ? "store_failed" : r.error, lang)); setPhase("error"); }
  }, [lang, onForbidden]);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (editing) return;
    const t = setTimeout(() => (document.getElementById(back) ?? document.getElementById("adm-post-new"))?.focus(), 0);
    return () => clearTimeout(t);
  }, [editing, back, phase]);

  if (editing) {
    return (
      <PostEditor
        key={editKey}
        lang={lang}
        post={editing === "new" ? null : editing}
        onSaved={(p) => { setItems((cur) => (cur.some((x) => x.id === p.id) ? cur.map((x) => (x.id === p.id ? p : x)) : [p, ...cur])); setEditing(p); }}
        onDeleted={(id) => { setItems((cur) => cur.filter((x) => x.id !== id)); setBack("adm-post-new"); setEditing(null); setNote(T.deleted[lang]); }}
        onClose={() => setEditing(null)}
        onForbidden={onForbidden}
      />
    );
  }
  return (
    <div className="adm-stack">
      <div><button type="button" className="btn btn--primary" id="adm-post-new" onClick={() => start("new")}>{T.new[lang]}</button></div>
      <p className="adm-quiet" role="status" aria-live="polite">{note}</p>
      {phase === "loading" && <p className="adm-quiet">{T.loading[lang]}</p>}
      {phase === "error" && <div className="notice" role="alert"><p>{err}</p><button type="button" className="btn btn--primary" onClick={() => { setPhase("loading"); void load(); }}>{T.retry[lang]}</button></div>}
      {phase === "ready" && items.length === 0 && <p className="notice">{T.empty[lang]}</p>}
      {phase === "ready" && items.length > 0 && (
        <ul className="adm-list">
          {items.map((p) => {
            const title = (lang === "fa" ? p.titleFa || p.titleEn : p.titleEn || p.titleFa) || T.untitled[lang];
            return (
              <li className="adm-card adm-post" data-priority={p.priority} key={p.id}>
                <div className="adm-card__top">
                  {p.priority !== "normal" && (
                    <span className={`adm-prio-chip adm-prio-chip--${p.priority}`}><PriorityIcon priority={p.priority} size={16} /><span>{PRIORITY_LABEL[p.priority][lang]}</span></span>
                  )}
                  <span className="chip">{KIND_LABEL[p.kind][lang]}</span>
                  <span className={`adm-badge ${p.published ? "adm-badge--approved" : "adm-badge--pending"}`}>{p.published ? T.pub[lang] : T.draft[lang]}</span>
                  {p.eventAt && <span className="adm-quiet">{T.when[lang]}: {fmtDate(p.eventAt, lang, true)}</span>}
                </div>
                <div className="adm-post__main">
                  {p.cover && sb && (
                    // eslint-disable-next-line @next/next/no-img-element -- small public thumbnail
                    <img className="adm-post__thumb" src={postImageUrl(sb.url, p.id, p.cover, "thumb")} alt="" loading="lazy" decoding="async" />
                  )}
                  <h3 className="adm-card__title" id={`adm-post-title-${p.id}`}><bdi>{title}</bdi></h3>
                </div>
                <div className="adm-row">
                  <button type="button" id={`adm-post-edit-${p.id}`} className="btn btn--ghost" aria-describedby={`adm-post-title-${p.id}`} onClick={() => start(p)}>{T.edit[lang]}</button>
                  {ACTIONS.filter((a) => a.to !== p.priority).map((a) => (
                    <button key={a.to} type="button" className="btn btn--ghost" aria-describedby={`adm-post-title-${p.id}`} disabled={rowBusy !== null} onClick={() => void setPriority(p, a.to)}>
                      <PriorityIcon priority={a.to} size={16} /> {T[a.label][lang]}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
