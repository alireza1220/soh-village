"use client";
// ONE posting form for all four boards, driven by BOARDS[board] (src/lib/boards.ts). The page renders the h2 (#pg-form-title) and
// puts this inside <AuthGate>. Also exports the field blocks that the "My ads" edit form reuses so both stay identical.
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import "@/styles/forms.css";
import "@/styles/market.css";
import type { Locale } from "@/lib/i18n";
import { BOARDS, type BoardId } from "@/lib/boards";
import { CONTACT_KINDS } from "@/lib/market";
import { avatarUrl } from "@/lib/profile";
import { loginHref, profileHref } from "@/lib/return-to";
import { authToken } from "@/lib/auth";
import { publicSupabase } from "@/lib/supabase";
import { useProfile } from "@/lib/use-profile";
import { Avatar } from "@/components/avatar";
import { useSession } from "@/components/use-session";
import { PhotoPicker } from "@/components/photo-picker";
import { errorText } from "@/lib/api-errors";
import { postJson } from "@/components/listing-api";
import { plural, savePhotos, type NewPhoto, type PhotoItem, type Progress } from "@/lib/photo-upload";
import type { ListingFields } from "@/lib/api-types";

const T = {
  as: { fa: "با نام", en: "Posting as" },
  editProfile: { fa: "ویرایش مشخصات", en: "Edit profile" },
  type: { fa: "نوع آگهی", en: "Type" },
  cat: { fa: "دسته", en: "Category" },
  pick: { fa: "انتخاب کنید", en: "Choose" },
  opt: { fa: " (اختیاری)", en: " (optional)" },
  showContact: { fa: "نمایش راه تماس من در این آگهی", en: "Show my contact on this ad" },
  contactNote: { fa: "شماره‌ی موبایل پروفایل‌تان آمده است. می‌توانید عوضش کنید یا تلگرام و واتس‌اپ بگذارید.", en: "Your profile mobile is filled in. Change it, or use Telegram or WhatsApp." },
  private: { fa: "شماره‌تان دیده نمی‌شود و فقط تیم سایت آن را می‌بیند.", en: "Your number stays hidden. Only the site team sees it." },
  ckind: { fa: "راه تماس", en: "Contact method" },
  cval: { fa: "شماره یا شناسه", en: "Number or ID" },
  send: { fa: "ارسال آگهی", en: "Send ad" },
  sending: { fa: "در حال ارسال...", en: "Sending..." },
  needTitle: { fa: "عنوان را بنویسید.", en: "Write a title first." },
  needMore: { fa: "همه‌ی خانه‌های ضروری را پر کنید.", en: "Fill in the required fields." },
  sent: { fa: "دریافت شد. پس از بررسی منتشر می‌شود.", en: "Received. Published after review." },
  myAds: { fa: "آگهی‌های من", en: "My ads" },
  again: { fa: "آگهی دیگر", en: "Post another" },
  loginAgain: { fa: "دوباره وارد شوید", en: "Log in again" },
  finish: { fa: "تکمیل مشخصات", en: "Complete profile" },
  waitPhotos: { fa: "عکس‌ها هنوز آماده می‌شوند...", en: "Photos are still getting ready..." },
  sendingAd: { fa: "آگهی در حال ذخیره است...", en: "Saving your ad..." },
  sendingPhoto: { fa: "آگهی ذخیره شد. عکس {i} از {n} در حال ارسال...", en: "Ad saved. Sending photo {i} of {n}..." },
  savingPhotos: { fa: "عکس‌ها در حال ذخیره‌اند...", en: "Saving your photos..." },
  photoOk: { fa: "آگهی و {n} عکس ذخیره شد. پس از بررسی منتشر می‌شود.", en: "Your ad and {n} photo(s) are saved. Published after review." },
  photoPartial: { fa: "آگهی ذخیره شد، اما {k} عکس فرستاده نشد. دوباره امتحان کنید یا بعداً از «آگهی‌های من» عکس اضافه کنید.", en: "Your ad is saved, but {k} photo(s) did not go through. Try again, or add them later in My ads." },
  retryPhotos: { fa: "دوباره فرستادن عکس‌ها", en: "Retry photos" },
  progressLabel: { fa: "پیشرفت ارسال عکس‌ها", en: "Photo upload progress" },
  keepOpen: { fa: "تا پایان ارسال این صفحه را نبندید.", en: "Keep this page open until sending ends." },
};
const fillN = (s: string, o: Record<string, number>, lang: Locale) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => (o[k] ?? 0).toLocaleString(lang === "fa" ? "fa-IR" : "en"));

/** The text fields of a listing as form state. */
export type FormValues = {
  type: string; category: string; title: string; quantity: string; price: string; area: string; available: string; details: string;
  contactKind: string; contactValue: string; contactPublic: boolean;
};
export const emptyValues = (board: BoardId): FormValues => ({
  type: BOARDS[board].types[0].v, category: BOARDS[board].categories[0].v, title: "", quantity: "", price: "", area: "", available: "", details: "",
  contactKind: CONTACT_KINDS[0].v, contactValue: "", contactPublic: false,
});
/** Can the form be sent? (title + every required board field) */
export const valuesReady = (board: BoardId, v: FormValues) =>
  !!v.title.trim() && BOARDS[board].fields.every((f) => !f.required || !!v[f.col].trim());
/** Body for POST /api/listings (create) or the `fields` of an update. A contact is only sent when the poster ticked "show". */
export function toFields(v: FormValues, board?: BoardId): ListingFields {
  const out: ListingFields = {
    ...(board ? { board } : {}),
    type: v.type, category: v.category, title: v.title.trim(), quantity: v.quantity, price: v.price, area: v.area, available: v.available, details: v.details,
    contactPublic: v.contactPublic,
  };
  if (v.contactPublic && v.contactValue.trim()) { out.contactKind = v.contactKind; out.contactValue = v.contactValue.trim(); }
  return out;
}

function F({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return <div className="field"><label className="label" htmlFor={id}>{label}</label>{children}</div>;
}

type Setter = <K extends keyof FormValues>(k: K, val: FormValues[K]) => void;

/** Type, category, title, [photos slot], the board's four fields, details. `keepType`/`keepCategory` keep an older value selectable when editing. */
export function ListingFieldset({ lang, board, idp, v, set, photos, keepType, keepCategory }: {
  lang: Locale; board: BoardId; idp: string; v: FormValues; set: Setter; photos?: ReactNode; keepType?: ReactNode; keepCategory?: ReactNode;
}) {
  const b = BOARDS[board];
  return (
    <>
      <fieldset className="mk-fieldset">
        <legend>{T.type[lang]}</legend>
        <div className="mk-choices">
          {b.types.map((m) => (
            <label key={m.v} className="mk-choice">
              <input type="radio" name={`${idp}-type`} checked={v.type === m.v} onChange={() => set("type", m.v)} />
              {m[lang]}
            </label>
          ))}
          {keepType}
        </div>
      </fieldset>
      <F id={`${idp}-cat`} label={T.cat[lang]}>
        <select id={`${idp}-cat`} className="select" value={v.category} onChange={(e) => set("category", e.target.value)}>
          {b.categories.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
          {keepCategory}
        </select>
      </F>
      <F id={`${idp}-title`} label={b.titleLabel[lang]}>
        <input id={`${idp}-title`} className="input" value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={120} required placeholder={b.titleHint[lang]} />
      </F>
      {photos}
      <div className="mk-grid-2">
        {b.fields.map((f) => (
          <F key={f.col} id={`${idp}-${f.col}`} label={f.label[lang] + (f.required || /اختیاری|optional/i.test(f.label[lang]) ? "" : T.opt[lang])}>
            {f.options ? (
              <select id={`${idp}-${f.col}`} className="select" value={v[f.col]} required={f.required} onChange={(e) => set(f.col, e.target.value)}>
                <option value="">{T.pick[lang]}</option>
                {f.options.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
              </select>
            ) : (
              <input id={`${idp}-${f.col}`} className="input" value={v[f.col]} maxLength={80} placeholder={f.hint?.[lang]} onChange={(e) => set(f.col, e.target.value)} />
            )}
          </F>
        ))}
      </div>
      <F id={`${idp}-details`} label={b.detailsLabel[lang]}>
        <textarea id={`${idp}-details`} className="textarea" rows={3} value={v.details} onChange={(e) => set("details", e.target.value)} maxLength={800} />
      </F>
    </>
  );
}

/** "Show my contact on this ad" (off by default). Only when ticked the kind + number appear, prefilled with the profile mobile. */
export function ContactBlock({ lang, idp, v, set, phone }: { lang: Locale; idp: string; v: FormValues; set: Setter; phone?: string }) {
  return (
    <div className="frm-contact">
      <label className="mk-check" htmlFor={`${idp}-cpub`}>
        <input
          id={`${idp}-cpub`} type="checkbox" checked={v.contactPublic}
          onChange={(e) => {
            set("contactPublic", e.target.checked);
            if (e.target.checked && !v.contactValue.trim() && phone) { set("contactKind", "phone"); set("contactValue", phone); }
          }}
        />
        <span>{T.showContact[lang]}</span>
      </label>
      {v.contactPublic ? (
        <>
          <p className="frm-contact__private">{T.contactNote[lang]}</p>
          <div className="frm-contact__fields">
            <F id={`${idp}-ckind`} label={T.ckind[lang]}>
              <select id={`${idp}-ckind`} className="select" value={v.contactKind} onChange={(e) => set("contactKind", e.target.value)}>
                {CONTACT_KINDS.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
              </select>
            </F>
            <F id={`${idp}-cval`} label={T.cval[lang]}>
              <input id={`${idp}-cval`} dir="ltr" className="input" inputMode="tel" value={v.contactValue} maxLength={60} onChange={(e) => set("contactValue", e.target.value)} />
            </F>
          </div>
        </>
      ) : (
        <p className="frm-contact__private">{T.private[lang]}</p>
      )}
    </div>
  );
}

function FormInner({ lang, board, again }: { lang: Locale; board: BoardId; again: () => void }) {
  const b = BOARDS[board];
  const [v, setV] = useState<FormValues>(() => emptyValues(board));
  const set: Setter = (k, val) => setV((p) => ({ ...p, [k]: val }));
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errCode, setErrCode] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [phase, setPhase] = useState<"idle" | "sending" | "saving" | "done" | "partial">("idle");
  const [prog, setProg] = useState<Progress | null>(null);
  const [photoMsg, setPhotoMsg] = useState("");
  const [photoWhy, setPhotoWhy] = useState("");
  const [adId, setAdId] = useState("");
  const photosRef = useRef<PhotoItem[]>([]);
  const serverCount = useRef(0);
  const { session } = useSession();
  const { profile } = useProfile();
  const sb = publicSupabase();
  useEffect(() => { photosRef.current = photos; });
  const working = status === "sending" || phase === "sending" || phase === "saving";
  const preparing = photos.some((p) => p.kind === "new" && p.state === "preparing");
  useEffect(() => {
    if (!working) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [working]);

  // Sends the photos of an ad that already exists (also used by "Retry photos").
  const runPhotos = async (id: string) => {
    setPhase("sending"); setPhotoMsg(""); setPhotoWhy(""); setProg({ phase: "sending", index: 1, total: 1, fraction: 0 });
    const token = await authToken();
    const res = await savePhotos({
      auth: token ? { token, listingId: id } : null,
      items: photosRef.current,
      serverCount: serverCount.current,
      finalize: async (names) => {
        const fresh = (await authToken()) ?? token ?? undefined; // uploads can take minutes
        const r = await postJson("/api/my/listings", { action: "update", id, fields: { images: names } }, fresh);
        if (r.ok) serverCount.current = names.length;
        return { ok: r.ok, error: r.data.error as string | undefined };
      },
      onItem: (key, patch) => setPhotos((prev) => prev.map((i) => (i.key === key && i.kind === "new" ? ({ ...i, ...patch } as NewPhoto) : i))),
      onProgress: (p) => { setProg(p); if (p.phase === "saving") setPhase("saving"); },
    });
    const tried = photosRef.current.filter((i) => i.kind === "new" && ["ready", "uploading", "failed", "uploaded"].includes(i.state)).length;
    const lost = res.finalized ? res.failed.length : tried;
    if (res.finalized && !res.failed.length) {
      setPhase("done");
      setPhotoMsg(plural(fillN(T.photoOk[lang], { n: res.names.length }, lang), res.names.length));
    } else {
      setPhase("partial");
      const why = res.finalizeError ?? res.failed[0]?.error;
      setPhotoMsg(plural(fillN(T.photoPartial[lang], { k: lost }, lang), lost));
      setPhotoWhy(why ? errorText(why, lang) : "");
    }
    setProg(null);
  };

  const send = async () => {
    if (!valuesReady(board, v)) { setStatus("error"); setErrCode("bad_fields"); return; }
    setStatus("sending"); setErrCode("");
    const token = await authToken(); // always a fresh token: a tab left open may hold an expired one
    if (!token) { setStatus("error"); setErrCode("unauthorized"); return; }
    const r = await postJson("/api/listings", toFields(v, board), token);
    if (r.ok && typeof r.data.id === "string") {
      setStatus("sent"); setAdId(r.data.id);
      if (photosRef.current.some((p) => p.kind === "new" && p.state === "ready")) void runPhotos(r.data.id);
      return;
    }
    setStatus("error"); setErrCode((r.data.error as string) || "store_failed");
  };

  const who = profile?.firstName ?? "";
  const myAvatar = sb && session && profile?.avatar ? avatarUrl(sb.url, `${session.user.id}/${profile.avatar}`) : null;

  if (status === "sent") {
    return (
      <div className="frm-done" role="status" aria-live="polite">
        <p><b>{T.sent[lang]}</b></p>
        {(phase === "sending" || phase === "saving") && (
          <div className="ph-progress">
            <p>{phase === "saving" ? T.savingPhotos[lang] : prog ? fillN(T.sendingPhoto[lang], { i: prog.index, n: prog.total }, lang) : T.sendingAd[lang]}</p>
            <div className="ph-progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((prog?.fraction ?? 0) * 100)} aria-label={T.progressLabel[lang]}>
              <span style={{ inlineSize: `${Math.round((phase === "saving" ? 1 : prog?.fraction ?? 0) * 100)}%` }} />
            </div>
            <p className="ph-tips">{T.keepOpen[lang]}</p>
          </div>
        )}
        {photoMsg && (
          <div className={`mk-msg ${phase === "done" ? "mk-msg--ok" : "mk-msg--warn"}`}>
            <p style={{ margin: 0 }}>{photoMsg}</p>
            {photoWhy && <p style={{ margin: "6px 0 0" }}>{photoWhy}</p>}
            {phase === "partial" && <p style={{ margin: "12px 0 0" }}><button type="button" className="btn btn--primary" onClick={() => void runPhotos(adId)}>{T.retryPhotos[lang]}</button></p>}
          </div>
        )}
        {!working && (
          <div className="mk-row">
            <Link className="btn btn--primary" href={`/${lang}/my`}>{T.myAds[lang]}</Link>
            <button type="button" className="btn btn--ghost" onClick={again}>{T.again[lang]}</button>
          </div>
        )}
      </div>
    );
  }

  const canSubmit = valuesReady(board, v) && !preparing && status !== "sending";
  return (
    <form className="mk-form" onSubmit={(e) => { e.preventDefault(); if (canSubmit) void send(); }} aria-label={b.formTitle[lang]}>
      {who && (
        <p className="frm-as">
          <Avatar name={who} src={myAvatar} size={32} />
          <span>{T.as[lang]} <b>{who}</b></span>
          <Link className="link mk-tap" href={profileHref(lang)}>{T.editProfile[lang]}</Link>
        </p>
      )}
      <ListingFieldset
        lang={lang} board={board} idp={`frm-${board}`} v={v} set={set}
        photos={<PhotoPicker lang={lang} items={photos} setItems={setPhotos} id={`frm-${board}-photos`} mode={working ? "busy" : "edit"} />}
      />
      <ContactBlock lang={lang} idp={`frm-${board}`} v={v} set={set} phone={profile?.phone} />
      <div className="mk-stack" style={{ gap: 12 }}>
        <div className="mk-row">
          <button type="submit" className="btn btn--primary mk-send" disabled={!canSubmit}>{status === "sending" ? T.sending[lang] : T.send[lang]}</button>
          {!v.title.trim() && status === "idle" && <span className="mk-session">{T.needTitle[lang]}</span>}
          {v.title.trim() && !valuesReady(board, v) && status === "idle" && <span className="mk-session">{T.needMore[lang]}</span>}
          {preparing && status === "idle" && <span className="mk-session">{T.waitPhotos[lang]}</span>}
        </div>
        {status === "sending" && <p className="mk-session" aria-live="polite">{T.sendingAd[lang]}</p>}
        <div aria-live="polite" className="mk-live">
          {errCode && (
            <p className="mk-msg mk-msg--warn">
              {errorText(errCode, lang)}{" "}
              {errCode === "unauthorized" && <Link className="link mk-tap" href={loginHref(lang, `/${lang}/${board}`)}>{T.loginAgain[lang]}</Link>}
              {errCode === "profile_required" && <Link className="link mk-tap" href={profileHref(lang, `/${lang}/${board}`)}>{T.finish[lang]}</Link>}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

/** Posting form for one board. Put it inside <AuthGate reason="post">. */
export function ListingForm({ board, lang }: { board: BoardId; lang: Locale }) {
  const [n, setN] = useState(0);
  return <FormInner key={n} lang={lang} board={board} again={() => setN((x) => x + 1)} />;
}
