"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import "@/styles/market.css";
import type { Locale } from "@/lib/i18n";
import { CONTACT_KINDS, LISTING_CATEGORIES, LISTING_TYPES } from "@/lib/market";
import { publicSupabase } from "@/lib/supabase";
import { useSession } from "@/components/use-session";
import { getSession, refreshSession } from "@/lib/auth";

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
  result: { fa: "متن آماده برای ارسال", en: "Your message, ready to send" },
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
};

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
  const { session } = useSession();
  const opened = useRef(Date.now());
  const canSend = !!publicSupabase();
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
    try {
      // Read the session right now: a tab left open for a long time may hold an expired token.
      const live = session ? (getSession() ?? (await refreshSession())) : null;
      const res = await fetch("/api/listings", {
        method: "POST", headers: { "Content-Type": "application/json", ...(live ? { Authorization: `Bearer ${live.accessToken}` } : {}) },
        body: JSON.stringify({ type, category: cat, title, quantity: qty, price, area, available: avail, details, posterName: name, contactKind: ckind, contactValue: cval, contactPublic: consent, website, openedMs: Date.now() - opened.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) { setStatus("sent"); setMsg(T.sent[lang]); if (typeof data.manageCode === "string") setManageCode(data.manageCode); return; }
      setStatus("error");
      setMsg(data.error === "too_fast" ? T.slow[lang] : data.error === "rate_limited" ? T.limit[lang] : data.error === "contact_required" ? T.needContact[lang] : T.err[lang]);
    } catch { setStatus("error"); setMsg(T.err[lang]); }
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
        <span>{T.consent[lang]}{!consent && <span className="field-hint">{T.consentNo[lang]}</span>}</span>
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="mk-hp" />
      {canSend && (
        <p className="mk-session">
          {session ? (
            <>{T.postingAs[lang]} <b dir="ltr">{session.user.email}</b> · <Link className="link" href={`/${lang}/my`}>{T.myListings[lang]}</Link></>
          ) : (
            <Link className="link" href={`/${lang}/login`}>{T.loginHint[lang]}</Link>
          )}
        </p>
      )}
      {manageCode && (
        <div className="mk-code" role="alert">
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
        <div className="mk-stack" style={{ gap: 12 }} aria-live="polite">
          <div>
            <button type="button" className="btn btn--primary" disabled={!title.trim() || status === "sending" || status === "sent"} onClick={send}>
              {status === "sending" ? T.sending[lang] : T.send[lang]}
            </button>
          </div>
          {msg && <p className={`mk-msg ${status === "sent" ? "mk-msg--ok" : "mk-msg--warn"}`}>{msg}</p>}
        </div>
      )}
      <div className="mk-result" aria-live="polite">
        <h3>{T.result[lang]}</h3>
        {text ? (
          <>
            <textarea readOnly rows={Math.min(14, text.split("\n").length + 1)} className="textarea mk-mono" value={text} onFocus={(e) => e.currentTarget.select()} aria-label={T.result[lang]} />
            <div className="mk-row">
              <button type="button" className="btn btn--dark" onClick={copy}>{T.copy[lang]}</button>
              {note && <span className="mk-session">{note}</span>}
            </div>
          </>
        ) : (
          <p className="mk-session">{T.required[lang]}</p>
        )}
      </div>
    </form>
  );
}
