"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import "@/styles/market.css";
import type { Locale } from "@/lib/i18n";
import { CONTACT_KINDS, LISTING_CATEGORIES, LISTING_TYPES } from "@/lib/market";
import { publicSupabase } from "@/lib/supabase";
import { useSession } from "@/components/use-session";
import { getSession, refreshSession } from "@/lib/auth";
import { PhotoPicker } from "@/components/photo-picker";
import { errorText, postJson } from "@/components/listing-api";
import { plural, savePhotos, type NewPhoto, type PhotoItem, type Progress } from "@/lib/photo-upload";

const T = {
  intro: { fa: "فرم را پر کنید و آگهی را بفرستید.", en: "Fill in the form and send your listing." },
  type: { fa: "نوع آگهی", en: "Type" },
  cat: { fa: "دسته", en: "Category" },
  title: { fa: "چه می‌فروشید یا می‌خواهید؟ (مثلاً گیلاس تازه)", en: "What do you sell or want? (e.g. fresh cherries)" },
  qty: { fa: "مقدار یا حجم کار (مثلاً ۵ کیلو)", en: "Amount or job size (e.g. 5 kg)" },
  price: { fa: "قیمت یا دستمزد به تومان (یا «توافقی»)", en: "Price or pay in toman (or “negotiable”)" },
  area: { fa: "منطقه و محل تحویل", en: "Area and pickup place" },
  avail: { fa: "چه زمانی؟ (مثلاً اواسط خرداد)", en: "When? (e.g. mid-June)" },
  details: { fa: "توضیح بیشتر", en: "More details" },
  name: { fa: "نام (اختیاری)", en: "Name (optional)" },
  ckind: { fa: "راه تماس", en: "Contact method" },
  cval: { fa: "شماره یا شناسه", en: "Number or ID" },
  consent: { fa: "نمایش راه تماسم در آگهی", en: "Show my contact in the listing" },
  consentNo: { fa: "راه تماس نمایش داده نمی‌شود؛ ما پیام را به شما می‌رسانیم.", en: "Your contact stays hidden; we pass messages on." },
  result: { fa: "اگر ارسال نشد، این متن را برای ما بفرستید", en: "If sending fails, send us this text" },
  copy: { fa: "کپی متن", en: "Copy text" },
  copied: { fa: "کپی شد", en: "Copied" },
  failed: { fa: "کپی نشد؛ متن را دستی کپی کنید.", en: "Copy failed; copy it by hand." },
  required: { fa: "عنوان را بنویسید.", en: "Write a title first." },
  head: { fa: "آگهی بازارچه‌ی سُه", en: "Soh village market listing" },
  send: { fa: "ارسال آگهی", en: "Send listing" },
  sending: { fa: "در حال ارسال...", en: "Sending..." },
  sent: { fa: "دریافت شد. پس از بررسی منتشر می‌شود.", en: "Received. Published after review." },
  err: { fa: "ارسال نشد. متن را کپی و از صفحه‌ی مشارکت بفرستید.", en: "Not sent. Copy the text and send via Contribute." },
  needContact: { fa: "راه تماس لازم است. اگر تیک نمایش نخورد، فقط ما می‌بینیم.", en: "A contact is required. Unticked, only we see it." },
  slow: { fa: "چند ثانیه صبر کنید و دوباره بزنید.", en: "Wait a few seconds, then retry." },
  codeTitle: { fa: "کد مدیریت آگهی شما", en: "Your listing manage code" },
  codeWarn: { fa: "این کد را همین حالا ذخیره کنید. فقط یک بار نشان داده می‌شود و قابل بازیابی نیست.", en: "Save this code now. It is shown once and cannot be recovered." },
  codeCopy: { fa: "کپی کد", en: "Copy code" },
  codeManage: { fa: "صفحه‌ی مدیریت", en: "Manage page" },
  postingAs: { fa: "ارسال با حساب", en: "Posting as" },
  myListings: { fa: "آگهی‌های من", en: "My listings" },
  loginHint: { fa: "ورود (اختیاری) برای جمع کردن آگهی‌ها", en: "Log in (optional) to keep listings together" },
  limit: { fa: "آگهی‌های زیادی فرستاده‌اید؛ بعداً امتحان کنید.", en: "Too many listings sent; try again later." },
  waitPhotos: { fa: "عکس‌ها هنوز آماده می‌شوند...", en: "Photos are still getting ready..." },
  sendingAd: { fa: "آگهی در حال ذخیره است...", en: "Saving your ad..." },
  sendingPhoto: { fa: "آگهی ذخیره شد. عکس {i} از {n} در حال ارسال...", en: "Ad saved. Sending photo {i} of {n}..." },
  savingPhotos: { fa: "عکس‌ها در حال ذخیره‌اند...", en: "Saving your photos..." },
  photoOk: { fa: "آگهی و {n} عکس ذخیره شد. پس از بررسی منتشر می‌شود.", en: "Your ad and {n} photo(s) are saved. Published after review." },
  photoPartial: { fa: "آگهی ذخیره شد، اما {k} عکس فرستاده نشد. دوباره امتحان کنید یا بعداً با کد مدیریت از صفحه‌ی مدیریت عکس اضافه کنید.", en: "Your ad is saved, but {k} photo(s) did not go through. Try again here, or add them later with your code on the Manage page." },
  retryPhotos: { fa: "دوباره فرستادن عکس‌ها", en: "Retry photos" },
  progressLabel: { fa: "پیشرفت ارسال عکس‌ها", en: "Photo upload progress" },
  keepOpen: { fa: "تا پایان ارسال این صفحه را نبندید.", en: "Keep this page open until sending ends." },
};
const fillN = (s: string, o: Record<string, number>, lang: Locale) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => (o[k] ?? 0).toLocaleString(lang === "fa" ? "fa-IR" : "en"));

const nowMs = () => Date.now();

function F({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div className="field"><label className="label" htmlFor={id}>{label}</label>{children}</div>;
}

export function MarketForm({ lang }: { lang: Locale }) {
  const [type, setType] = useState<string>(LISTING_TYPES[0].v);
  const [cat, setCat] = useState<string>(LISTING_CATEGORIES[0].v);
  const [title, setTitle] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [avail, setAvail] = useState("");
  const [details, setDetails] = useState("");
  const [name, setName] = useState("");
  const [ckind, setCkind] = useState<string>(CONTACT_KINDS[0].v);
  const [cval, setCval] = useState("");
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [manageCode, setManageCode] = useState("");
  const [codeNote, setCodeNote] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [phase, setPhase] = useState<"idle" | "sending" | "saving" | "done" | "partial">("idle");
  const [prog, setProg] = useState<Progress | null>(null);
  const [photoMsg, setPhotoMsg] = useState("");
  const [photoWhy, setPhotoWhy] = useState("");
  const photosRef = useRef<PhotoItem[]>([]);
  const serverCount = useRef(0);
  const codeBox = useRef<HTMLDivElement>(null);
  const { session } = useSession();
  const opened = useRef(0);
  useEffect(() => { opened.current = nowMs(); }, []);
  const canSend = !!publicSupabase();
  useEffect(() => { photosRef.current = photos; });
  const working = status === "sending" || phase === "sending" || phase === "saving";
  const preparing = photos.some((p) => p.kind === "new" && p.state === "preparing");
  useEffect(() => {
    if (!working) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [working]);
  useEffect(() => {
    if (manageCode) codeBox.current?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [manageCode]);
  const lab = (list: { v: string; fa: string; en: string }[], v: string) => list.find((o) => o.v === v)?.[lang] ?? v;
  const short = (s: string) => s.replace(/\s*[(（].*$/, "");

  const text = useMemo(() => {
    if (!title.trim()) return "";
    const L = (k: string, v: string) => (v.trim() ? [`${short(k)}: ${v.trim()}`] : []);
    return [
      T.head[lang],
      `${T.type[lang]}: ${lab(LISTING_TYPES, type)}`,
      `${T.cat[lang]}: ${lab(LISTING_CATEGORIES, cat)}`,
      `${lang === "fa" ? "عنوان" : "Title"}: ${title.trim()}`,
      ...L(T.qty[lang], qty), ...L(T.price[lang], price), ...L(T.area[lang], area), ...L(T.avail[lang], avail), ...L(T.details[lang], details), ...L(T.name[lang], name),
      ...(cval.trim() ? [`${T.ckind[lang]}: ${lab(CONTACT_KINDS, ckind)} ${cval.trim()}`] : []),
      `${lang === "fa" ? "اجازه‌ی نوشتن راه تماس" : "Permission to publish contact"}: ${consent && cval.trim() ? (lang === "fa" ? "بله" : "yes") : (lang === "fa" ? "خیر" : "no")}`,
    ].join("\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, cat, title, qty, price, area, avail, details, name, ckind, cval, consent, lang]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setNote(T.copied[lang]); } catch { setNote(T.failed[lang]); }
  };
  const send = async () => {
    if (!cval.trim()) { setStatus("error"); setMsg(T.needContact[lang]); return; }
    setStatus("sending"); setMsg("");
    const elapsed = nowMs() - opened.current;
    try {
      // Read the session right now: a tab left open for a long time may hold an expired token.
      const live = session ? (getSession() ?? (await refreshSession())) : null;
      const res = await fetch("/api/listings", {
        method: "POST", headers: { "Content-Type": "application/json", ...(live ? { Authorization: `Bearer ${live.accessToken}` } : {}) },
        body: JSON.stringify({ type, category: cat, title, quantity: qty, price, area, available: avail, details, posterName: name, contactKind: ckind, contactValue: cval, contactPublic: consent, website, openedMs: elapsed }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus("sent"); setMsg(T.sent[lang]);
        if (typeof data.manageCode === "string") {
          setManageCode(data.manageCode);
          if (photosRef.current.some((p) => p.kind === "new" && p.state === "ready")) void runPhotos(data.manageCode);
        }
        return;
      }
      setStatus("error");
      setMsg(data.error === "too_fast" ? T.slow[lang] : data.error === "rate_limited" ? T.limit[lang] : data.error === "contact_required" ? T.needContact[lang] : T.err[lang]);
    } catch { setStatus("error"); setMsg(T.err[lang]); }
  };
  // Sends the photos of an ad that already exists (also used by "Retry photos"). The manage code is never lost on the way.
  const runPhotos = async (code: string) => {
    setPhase("sending"); setPhotoMsg(""); setPhotoWhy(""); setProg({ phase: "sending", index: 1, total: 1, fraction: 0 });
    const res = await savePhotos({
      auth: { code },
      items: photosRef.current,
      serverCount: serverCount.current,
      finalize: async (names) => {
        const r = await postJson("/api/listings/manage", { code, action: "update", fields: { images: names } });
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
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(manageCode); setCodeNote(T.copied[lang]); } catch { setCodeNote(T.failed[lang]); }
  };
  return (
    <form className="mk-form" onSubmit={(e) => e.preventDefault()} aria-label={T.head[lang]}>
      <p className="mk-form-intro">{T.intro[lang]}</p>
      <fieldset className="mk-fieldset">
        <legend>{T.type[lang]}</legend>
        <div className="mk-choices">
          {LISTING_TYPES.map((m) => (
            <label key={m.v} className="mk-choice">
              <input type="radio" name="market-type" checked={type === m.v} onChange={() => setType(m.v)} />
              {m[lang]}
            </label>
          ))}
        </div>
      </fieldset>
      <F id="market-form-cat" label={T.cat[lang]}>
        <select id="market-form-cat" className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
          {LISTING_CATEGORIES.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
        </select>
      </F>
      <F id="market-title" label={T.title[lang]}>
        <input id="market-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </F>
      {canSend && <PhotoPicker lang={lang} items={photos} setItems={setPhotos} id="market-photos" mode={working ? "busy" : status === "sent" ? "sent" : "edit"} />}
      <div className="mk-grid-2">
        <F id="market-qty" label={T.qty[lang]}><input id="market-qty" className="input" value={qty} onChange={(e) => setQty(e.target.value)} maxLength={80} /></F>
        <F id="market-price" label={T.price[lang]}><input id="market-price" className="input" value={price} onChange={(e) => setPrice(e.target.value)} maxLength={80} /></F>
        <F id="market-area" label={T.area[lang]}><input id="market-area" className="input" value={area} onChange={(e) => setArea(e.target.value)} maxLength={80} /></F>
        <F id="market-avail" label={T.avail[lang]}><input id="market-avail" className="input" value={avail} onChange={(e) => setAvail(e.target.value)} maxLength={80} /></F>
      </div>
      <F id="market-details" label={T.details[lang]}>
        <textarea id="market-details" className="textarea" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={800} />
      </F>
      <div className="mk-grid-3">
        <F id="market-name" label={T.name[lang]}><input id="market-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></F>
        <F id="market-ckind" label={T.ckind[lang]}>
          <select id="market-ckind" className="select" value={ckind} onChange={(e) => setCkind(e.target.value)}>
            {CONTACT_KINDS.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
          </select>
        </F>
        <F id="market-cval" label={T.cval[lang]}><input id="market-cval" dir="ltr" className="input" value={cval} onChange={(e) => setCval(e.target.value)} maxLength={60} /></F>
      </div>
      <label className="mk-check" htmlFor="market-consent">
        <input id="market-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span className="mk-check__t">{T.consent[lang]}{!consent && <span className="field-hint">{T.consentNo[lang]}</span>}</span>
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="mk-hp" />
      {canSend && (
        <p className="mk-session">
          {session ? (
            <>{T.postingAs[lang]} <b dir="ltr">{session.user.email}</b> · <Link className="link mk-tap" href={`/${lang}/my`}>{T.myListings[lang]}</Link></>
          ) : (
            <Link className="link mk-tap" href={`/${lang}/login`}>{T.loginHint[lang]}</Link>
          )}
        </p>
      )}
      {manageCode && (
        <div className="mk-code" role="alert" ref={codeBox}>
          <h3>{T.codeTitle[lang]}</h3>
          <p dir="ltr" className="mk-code__value mk-mono">{manageCode}</p>
          <p>{T.codeWarn[lang]}</p>
          <div className="mk-row">
            <button type="button" className="btn btn--primary" onClick={copyCode}>{T.codeCopy[lang]}</button>
            <Link href={`/${lang}/manage`}>{T.codeManage[lang]}</Link>
            <span aria-live="polite">{codeNote}</span>
          </div>
        </div>
      )}
      {canSend && (
        <div className="mk-stack" style={{ gap: 12 }}>
          {status !== "sent" && (
            <div className="mk-row">
              <button type="button" className="btn btn--primary mk-send" disabled={!title.trim() || preparing || status === "sending"} onClick={send}>
                {status === "sending" ? T.sending[lang] : T.send[lang]}
              </button>
              {!title.trim() && status === "idle" && <span className="mk-session">{T.required[lang]}</span>}
              {preparing && status === "idle" && <span className="mk-session">{T.waitPhotos[lang]}</span>}
            </div>
          )}
          {(status === "sending" || phase === "sending" || phase === "saving") && (
            <div className="ph-progress">
              <p aria-live="polite">
                {phase === "saving" ? T.savingPhotos[lang] : phase === "sending" && prog ? fillN(T.sendingPhoto[lang], { i: prog.index, n: prog.total }, lang) : T.sendingAd[lang]}
              </p>
              <div className="ph-progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((prog?.fraction ?? 0) * 100)} aria-label={T.progressLabel[lang]}>
                <span style={{ inlineSize: `${Math.round((phase === "saving" ? 1 : prog?.fraction ?? 0) * 100)}%` }} />
              </div>
              <p className="ph-tips">{T.keepOpen[lang]}</p>
            </div>
          )}
          <div aria-live="polite" className="mk-live">
          {photoMsg && (
            <div className={`mk-msg ${phase === "done" ? "mk-msg--ok" : "mk-msg--warn"}`}>
              <p style={{ margin: 0 }}>{photoMsg}</p>
              {photoWhy && <p style={{ margin: "6px 0 0" }}>{photoWhy}</p>}
              {phase === "partial" && (
                <p style={{ margin: "12px 0 0" }}>
                  <button type="button" className="btn btn--primary" onClick={() => void runPhotos(manageCode)}>{T.retryPhotos[lang]}</button>
                </p>
              )}
            </div>
          )}
          {msg && <p className={`mk-msg ${status === "sent" ? "mk-msg--ok" : "mk-msg--warn"}`}>{msg}</p>}
          </div>
        </div>
      )}
      {text && (
      <details className="mk-result">
        <summary>{T.result[lang]}</summary>
          <>
            <textarea readOnly rows={Math.min(14, text.split("\n").length + 1)} className="textarea mk-mono" value={text} onFocus={(e) => e.currentTarget.select()} aria-label={T.result[lang]} />
            <div className="mk-row">
              <button type="button" className="btn btn--dark" onClick={copy}>{T.copy[lang]}</button>
              {note && <span className="mk-session">{note}</span>}
            </div>
          </>
      </details>
      )}
    </form>
  );
}
