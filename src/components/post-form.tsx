"use client";
import { useMemo, useState } from "react";
import "@/styles/market.css";
import type { Locale } from "@/lib/i18n";

type Kind = "needs" | "careers";
type Opt = { v: string; fa: string; en: string };

const CFG: Record<Kind, { modes: Opt[]; cats: Opt[]; arrangements?: Opt[]; titleLabel: { fa: string; en: string }; subject: { fa: string; en: string } }> = {
  needs: {
    subject: { fa: "نیازمندی سُه", en: "Soh request" },
    titleLabel: { fa: "چه لازم دارید یا چه پیشنهاد می‌دهید؟", en: "What do you need or offer?" },
    modes: [
      { v: "need", fa: "نیاز دارم", en: "I need" },
      { v: "offer", fa: "پیشنهاد دارم", en: "I can offer" },
    ],
    cats: [
      { v: "stay", fa: "اقامت", en: "A place to stay" },
      { v: "transport", fa: "رفت‌وآمد", en: "Transport" },
      { v: "repair", fa: "ساخت و تعمیر", en: "Building and repair" },
      { v: "farm", fa: "باغ و کشاورزی", en: "Orchard and farm" },
      { v: "food", fa: "فرآورده‌ی محلی", en: "Local products" },
      { v: "guide", fa: "راهنمای گردشگری", en: "Local guide" },
      { v: "help", fa: "کار اداری و ترجمه", en: "Paperwork and translation" },
      { v: "service", fa: "خدمت می‌دهم", en: "Service offered" },
      { v: "seeking", fa: "دنبال کار", en: "Looking for work" },
      { v: "hiring", fa: "کارگر می‌خواهم", en: "Hiring" },
      { v: "other", fa: "دیگر", en: "Other" },
    ],
  },
  careers: {
    subject: { fa: "فرصت شغلی سُه", en: "Soh job post" },
    titleLabel: { fa: "کار یا مهارت", en: "Job or skill" },
    modes: [
      { v: "seeking", fa: "دنبال کار هستم", en: "I am looking for work" },
      { v: "hiring", fa: "کارگر یا همکار می‌خواهم", en: "I am hiring" },
    ],
    cats: [
      { v: "farm", fa: "باغ و کشاورزی", en: "Orchard and farm" },
      { v: "craft", fa: "قالی و صنایع دستی", en: "Carpets and crafts" },
      { v: "tourism", fa: "گردشگری و راهنمایی", en: "Tourism and guiding" },
      { v: "building", fa: "مرمت و ساخت‌وساز", en: "Restoration and building" },
      { v: "driving", fa: "رانندگی و حمل", en: "Driving and transport" },
      { v: "remote", fa: "کار از راه دور", en: "Remote work" },
      { v: "other", fa: "دیگر", en: "Other" },
    ],
    arrangements: [
      { v: "seasonal", fa: "فصلی", en: "Seasonal" },
      { v: "part", fa: "پاره‌وقت", en: "Part-time" },
      { v: "full", fa: "تمام‌وقت", en: "Full-time" },
      { v: "once", fa: "یک‌باره", en: "One-off" },
    ],
  },
};

const T = {
  mode: { fa: "نوع آگهی", en: "Type" },
  cat: { fa: "دسته", en: "Category" },
  arr: { fa: "نوع همکاری", en: "Arrangement" },
  details: { fa: "توضیح (مکان، زمان، شرایط)", en: "Details (place, timing, conditions)" },
  area: { fa: "منطقه (سُه، میمه، اصفهان، از راه دور ...)", en: "Area (Soh, Meymeh, Isfahan, remote ...)" },
  name: { fa: "نام (اختیاری)", en: "Name (optional)" },
  contact: { fa: "راه تماس (اختیاری)", en: "How to reach you (optional)" },
  consent: { fa: "نمایش راه تماسم در سایت", en: "Show my contact on the site" },
  consentNo: { fa: "راه تماس نمایش داده نمی‌شود؛ ما پیام را به شما می‌رسانیم.", en: "Your contact stays hidden; we pass messages on." },
  result: { fa: "متن آماده برای ارسال", en: "Your message, ready to send" },
  copy: { fa: "کپی متن", en: "Copy text" },
  copied: { fa: "کپی شد", en: "Copied" },
  failed: { fa: "کپی نشد؛ متن را دستی کپی کنید.", en: "Copy failed; copy it by hand." },
  intro: { fa: "فرم را پر کنید، متن را کپی کنید و از صفحه‌ی مشارکت بفرستید.", en: "Fill in the form, copy the text and send it via Contribute." },
  required: { fa: "عنوان را بنویسید.", en: "Write a title first." },
};

function F({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div className="field"><label className="label" htmlFor={id}>{label}</label>{children}</div>;
}

export function PostForm({ kind, lang }: { kind: Kind; lang: Locale }) {
  const c = CFG[kind];
  const [mode, setMode] = useState(c.modes[0].v);
  const [cat, setCat] = useState(c.cats[0].v);
  const [arr, setArr] = useState(c.arrangements?.[0].v ?? "");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [area, setArea] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState("");
  const label = (list: Opt[], v: string) => list.find((o) => o.v === v)?.[lang] ?? v;

  const text = useMemo(() => {
    if (!title.trim()) return "";
    const lines = [
      `${c.subject[lang]}`,
      `${T.mode[lang]}: ${label(c.modes, mode)}`,
      `${T.cat[lang]}: ${label(c.cats, cat)}`,
      ...(c.arrangements ? [`${T.arr[lang]}: ${label(c.arrangements, arr)}`] : []),
      `${c.titleLabel[lang]}: ${title.trim()}`,
      ...(details.trim() ? [`${T.details[lang]}: ${details.trim()}`] : []),
      ...(area.trim() ? [`${T.area[lang].split(" (")[0]}: ${area.trim()}`] : []),
      ...(name.trim() ? [`${T.name[lang].replace(/ \(.*\)/, "")}: ${name.trim()}`] : []),
      ...(contact.trim() ? [`${T.contact[lang].replace(/ \(.*\)/, "")}: ${contact.trim()}`] : []),
      consent && contact.trim() ? (lang === "fa" ? "اجازه‌ی نوشتن راه تماس: بله" : "Permission to publish contact: yes") : (lang === "fa" ? "اجازه‌ی نوشتن راه تماس: خیر" : "Permission to publish contact: no"),
    ];
    return lines.join("\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cat, arr, title, details, area, name, contact, consent, lang]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setNote(T.copied[lang]);
    } catch {
      setNote(T.failed[lang]);
    }
  };

  return (
    <form className="mk-form" onSubmit={(e) => e.preventDefault()} aria-label={c.subject[lang]}>
      <p className="mk-form-intro">{T.intro[lang]}</p>
      <fieldset className="mk-fieldset">
        <legend>{T.mode[lang]}</legend>
        <div className="mk-choices">
          {c.modes.map((m) => (
            <label key={m.v} className="mk-choice">
              <input type="radio" name={`${kind}-mode`} checked={mode === m.v} onChange={() => setMode(m.v)} />
              {m[lang]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mk-grid-2">
        <F id={`${kind}-cat`} label={T.cat[lang]}>
          <select id={`${kind}-cat`} className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
            {c.cats.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
          </select>
        </F>
        {c.arrangements && (
          <F id={`${kind}-arr`} label={T.arr[lang]}>
            <select id={`${kind}-arr`} className="select" value={arr} onChange={(e) => setArr(e.target.value)}>
              {c.arrangements.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
            </select>
          </F>
        )}
      </div>
      <F id={`${kind}-title`} label={c.titleLabel[lang]}>
        <input id={`${kind}-title`} className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </F>
      <F id={`${kind}-details`} label={T.details[lang]}>
        <textarea id={`${kind}-details`} className="textarea" rows={4} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={800} />
      </F>
      <div className="mk-grid-2">
        <F id={`${kind}-area`} label={T.area[lang]}>
          <input id={`${kind}-area`} className="input" value={area} onChange={(e) => setArea(e.target.value)} maxLength={80} />
        </F>
        <F id={`${kind}-name`} label={T.name[lang]}>
          <input id={`${kind}-name`} className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </F>
      </div>
      <F id={`${kind}-contact`} label={T.contact[lang]}>
        <input id={`${kind}-contact`} className="input" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={80} inputMode="text" />
      </F>
      <label className="mk-check" htmlFor={`${kind}-consent`}>
        <input id={`${kind}-consent`} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{T.consent[lang]}{!consent && <span className="field-hint">{T.consentNo[lang]}</span>}</span>
      </label>
      <div className="mk-result" aria-live="polite">
        <h3>{T.result[lang]}</h3>
        {text ? (
          <>
            <textarea readOnly rows={Math.min(12, text.split("\n").length + 1)} className="textarea mk-mono" value={text} onFocus={(e) => e.currentTarget.select()} aria-label={T.result[lang]} />
            <div className="mk-row">
              <button type="button" className="btn btn--primary" onClick={copy}>{T.copy[lang]}</button>
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
