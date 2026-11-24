"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { CONTACT_KINDS, LISTING_CATEGORIES, LISTING_TYPES } from "@/lib/market";
import { publicSupabase } from "@/lib/supabase";
import { useSession } from "@/components/use-session";
import { getSession, refreshSession } from "@/lib/auth";

const T = {
  intro: { fa: "فرم را پر کنید، متن آماده را کپی کنید و از راهی که در صفحه‌ی مشارکت آمده بفرستید. اگر عکس دارید، همراه متن بفرستید. سایت پولی نگه نمی‌دارد: قیمت و پرداخت را خودتان با خریدار توافق می‌کنید.", en: "Fill in the form, copy the finished text and send it by the way shown on the Contribute page. Send a photo with it if you have one. The site holds no money: you agree the price and payment with the other person yourself." },
  type: { fa: "نوع آگهی", en: "Type" },
  cat: { fa: "دسته", en: "Category" },
  title: { fa: "چه می‌فروشید یا چه می‌خواهید؟ (مثلاً گیلاس تازه، نان محلی، نگهداری باغ)", en: "What are you selling or looking for? (e.g. fresh cherries, village bread, garden care)" },
  qty: { fa: "مقدار یا حجم کار (مثلاً ۵ کیلو، دو روز در هفته)", en: "Amount or size of the job (e.g. 5 kg, two days a week)" },
  price: { fa: "قیمت یا دستمزد به تومان (یا «توافقی»)", en: "Price or pay in toman (or “negotiable”)" },
  area: { fa: "منطقه و محل تحویل", en: "Area and pickup place" },
  avail: { fa: "چه زمانی؟ (مثلاً اواسط خرداد تا تیر)", en: "When? (e.g. mid-June to July)" },
  details: { fa: "توضیح بیشتر", en: "More details" },
  name: { fa: "نام (اختیاری)", en: "Name (optional)" },
  ckind: { fa: "راه تماس", en: "Contact method" },
  cval: { fa: "شماره یا شناسه", en: "Number or ID" },
  consent: { fa: "اجازه می‌دهم راه تماسم در آگهی نوشته شود", en: "I allow my contact to be shown in the listing" },
  consentNo: { fa: "راه تماس نوشته نمی‌شود؛ علاقه‌مندان از ما می‌خواهند شما را خبر کنیم.", en: "Your contact will not be shown; interested people ask us to pass the message on." },
  result: { fa: "متن آماده برای ارسال", en: "Your message, ready to send" },
  copy: { fa: "کپی متن", en: "Copy text" },
  copied: { fa: "کپی شد", en: "Copied" },
  failed: { fa: "کپی نشد؛ متن را انتخاب و کپی کنید.", en: "Copy failed; select the text and copy it." },
  required: { fa: "عنوان را بنویسید تا متن ساخته شود.", en: "Write a title and the message will appear." },
  head: { fa: "آگهی بازارچه‌ی سُه", en: "Soh village market listing" },
  send: { fa: "ارسال آگهی", en: "Send listing" },
  sending: { fa: "در حال ارسال...", en: "Sending..." },
  sent: { fa: "دریافت شد. پس از بررسی در بازارچه می‌آید.", en: "Received. It will appear in the market after a check." },
  err: { fa: "ارسال نشد. متن را کپی کنید و از راه صفحه‌ی مشارکت بفرستید.", en: "Could not send. Copy the text and send it through the Contribute page." },
  needContact: { fa: "برای ارسال، راه تماس (شماره یا شناسه) لازم است. اگر نمی‌خواهید نوشته شود، تیک اجازه را نزنید؛ فقط ما می‌بینیم.", en: "To send, a way to reach you is required. If you do not want it shown, leave the permission box unticked; only we see it." },
  slow: { fa: "چند ثانیه صبر کنید و دوباره بزنید.", en: "Wait a few seconds and try again." },
  codeTitle: { fa: "کد مدیریت آگهی شما", en: "Your listing manage code" },
  codeWarn: { fa: "این کد را همین حالا ذخیره کنید. فقط یک بار نشان داده می‌شود. با آن می‌توانید آگهی را ویرایش، تمدید یا حذف کنید؛ ما نمی‌توانیم آن را بازیابی کنیم.", en: "Save this code now. It is shown only once. With it you can edit, renew or delete your listing; we cannot recover it." },
  codeCopy: { fa: "کپی کد", en: "Copy code" },
  codeManage: { fa: "رفتن به صفحه‌ی مدیریت آگهی", en: "Go to the manage page" },
  postingAs: { fa: "ارسال با حساب", en: "Posting as" },
  myListings: { fa: "آگهی‌های من", en: "My listings" },
  loginHint: { fa: "برای نگه‌داشتن آگهی‌هایتان در یک‌جا وارد شوید (اختیاری)", en: "Log in to keep your listings in one place (optional)" },
  limit: { fa: "امروز آگهی‌های زیادی فرستاده‌اید؛ بعداً دوباره امتحان کنید.", en: "Too many listings sent; try again later." },
};

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
  const field = "w-full rounded-xl border px-3 py-2 bg-[var(--surface)]";
  const brd = { borderColor: "var(--line)" } as const;
  const lbl = "flex flex-col gap-1 text-sm";
  return (
    <form className="card p-5 md:p-6 flex flex-col gap-4" onSubmit={(e) => e.preventDefault()} aria-label={T.head[lang]}>
      <p className="text-sm muted">{T.intro[lang]}</p>
      <fieldset className="flex flex-wrap gap-2 border-0 p-0 m-0">
        <legend className="text-sm muted mb-1">{T.type[lang]}</legend>
        {LISTING_TYPES.map((m) => (
          <label key={m.v} className={`btn ${type === m.v ? "btn-primary" : "btn-ghost"} cursor-pointer`}>
            <input type="radio" className="sr-only" name="market-type" checked={type === m.v} onChange={() => setType(m.v)} />
            {m[lang]}
          </label>
        ))}
      </fieldset>
      <label className={lbl}>{T.cat[lang]}
        <select id="market-form-cat" className={field} style={brd} value={cat} onChange={(e) => setCat(e.target.value)}>
          {LISTING_CATEGORIES.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
        </select>
      </label>
      <label className={lbl}>{T.title[lang]}
        <input id="market-title" className={field} style={brd} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={lbl}>{T.qty[lang]}<input id="market-qty" className={field} style={brd} value={qty} onChange={(e) => setQty(e.target.value)} maxLength={80} /></label>
        <label className={lbl}>{T.price[lang]}<input id="market-price" className={field} style={brd} value={price} onChange={(e) => setPrice(e.target.value)} maxLength={80} /></label>
        <label className={lbl}>{T.area[lang]}<input id="market-area" className={field} style={brd} value={area} onChange={(e) => setArea(e.target.value)} maxLength={80} /></label>
        <label className={lbl}>{T.avail[lang]}<input id="market-avail" className={field} style={brd} value={avail} onChange={(e) => setAvail(e.target.value)} maxLength={80} /></label>
      </div>
      <label className={lbl}>{T.details[lang]}
        <textarea id="market-details" className={field} style={brd} rows={3} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={800} />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className={lbl}>{T.name[lang]}<input id="market-name" className={field} style={brd} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></label>
        <label className={lbl}>{T.ckind[lang]}
          <select id="market-ckind" className={field} style={brd} value={ckind} onChange={(e) => setCkind(e.target.value)}>
            {CONTACT_KINDS.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
          </select>
        </label>
        <label className={lbl}>{T.cval[lang]}<input id="market-cval" dir="ltr" className={field} style={brd} value={cval} onChange={(e) => setCval(e.target.value)} maxLength={60} /></label>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input id="market-consent" type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{T.consent[lang]}{!consent && <span className="block muted">{T.consentNo[lang]}</span>}</span>
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
      {canSend && (
        <p className="text-sm muted">
          {session ? (
            <>{T.postingAs[lang]} <b dir="ltr">{session.user.email}</b> · <Link className="link" href={`/${lang}/my`}>{T.myListings[lang]}</Link></>
          ) : (
            <Link className="link" href={`/${lang}/login`}>{T.loginHint[lang]}</Link>
          )}
        </p>
      )}
      {manageCode && (
        <div className="todo flex flex-col gap-3" role="alert">
          <b>{T.codeTitle[lang]}</b>
          <p dir="ltr" className="font-mono text-2xl tracking-widest break-all select-all" style={{ textAlign: "center" }}>{manageCode}</p>
          <p className="text-sm">{T.codeWarn[lang]}</p>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={copyCode}>{T.codeCopy[lang]}</button>
            <Link className="link text-sm" href={`/${lang}/manage`}>{T.codeManage[lang]}</Link>
            <span className="text-sm muted" aria-live="polite">{codeNote}</span>
          </div>
        </div>
      )}
      {canSend && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <button type="button" className="btn btn-primary self-start" disabled={!title.trim() || status === "sending" || status === "sent"} onClick={send}>
            {status === "sending" ? T.sending[lang] : T.send[lang]}
          </button>
          {msg && <p className={`text-sm ${status === "sent" ? "" : "muted"}`} style={status === "sent" ? { color: "var(--accent)" } : undefined}>{msg}</p>}
        </div>
      )}
      <div className="flex flex-col gap-2" aria-live="polite">
        <b className="text-sm">{T.result[lang]}</b>
        {text ? (
          <>
            <textarea readOnly rows={Math.min(14, text.split("\n").length + 1)} className={`${field} font-mono text-sm`} style={brd} value={text} onFocus={(e) => e.currentTarget.select()} aria-label={T.result[lang]} />
            <div className="flex items-center gap-3">
              <button type="button" className="btn btn-primary" onClick={copy}>{T.copy[lang]}</button>
              {note && <span className="text-sm muted">{note}</span>}
            </div>
          </>
        ) : (
          <p className="text-sm muted">{T.required[lang]}</p>
        )}
      </div>
    </form>
  );
}
