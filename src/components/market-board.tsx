"use client";
import { useMemo, useState } from "react";
import "@/styles/market.css";
import type { Locale } from "@/lib/i18n";
import { LISTING_CATEGORIES, LISTING_TYPE_LABELS, LISTING_TYPES, listings as localListings, type ListingType } from "@/lib/market";
import { useLiveListings } from "@/lib/use-live-listings";

const T = {
  all: { fa: "همه", en: "All" },
  empty: { fa: "هنوز آگهی‌ای منتشر نشده است. اولین نفر باشید: فرم پایین را پر کنید.", en: "No listings published yet. Be the first: fill in the form below." },
  noMatch: { fa: "آگهی‌ای با این فیلتر نیست.", en: "No listings match this filter." },
  price: { fa: "قیمت", en: "Price" },
  qty: { fa: "مقدار", en: "Amount" },
  area: { fa: "منطقه", en: "Area" },
  avail: { fa: "زمان", en: "When" },
  contact: { fa: "تماس", en: "Contact" },
  noContact: { fa: "راه تماس نوشته نشده؛ از طریق صفحه‌ی مشارکت بپرسید.", en: "No contact shown; ask through the Contribute page." },
  until: { fa: "تا", en: "Until" },
  showing: { fa: "نمایش", en: "Showing" },
  of: { fa: "از", en: "of" },
  posted: { fa: "ثبت", en: "Posted" },
  exampleTitle: { fa: "نمونه‌ی یک آگهی (واقعی نیست)", en: "What a listing looks like (not a real listing)" },
  filterType: { fa: "نوع آگهی", en: "Type" },
  filterCat: { fa: "دسته", en: "Category" },
};

export function MarketBoard({ lang }: { lang: Locale }) {
  const [type, setType] = useState<ListingType | "all">("all");
  const [cat, setCat] = useState("all");
  const remote = useLiveListings();
  const today = new Date().toISOString().slice(0, 10);

  // When Supabase is connected, approved listings come from the database (the public view); otherwise only the local file is used.
  const live = useMemo(() => [...remote, ...localListings].filter((l) => l.expiresAt >= today), [remote, today]);
  const shown = live.filter((l) => (type === "all" || l.type === type) && (cat === "all" || l.category === cat));
  const label = (list: { v: string; fa: string; en: string }[], v: string) => list.find((o) => o.v === v)?.[lang] ?? v;
  const typeLabel = (v: string) => label(LISTING_TYPE_LABELS, v);
  const tab = (active: boolean) => `tab${active ? " is-active" : ""}`;
  const num = (n: number) => n.toLocaleString(lang === "fa" ? "fa-IR" : "en");

  return (
    <div className="mk-stack">
      <div className="mk-filters">
        <div className="mk-filter-row">
          <span className="mk-filter-label" id="mk-type-label">{T.filterType[lang]}</span>
          <div className="tabs" role="group" aria-labelledby="mk-type-label">
            <button type="button" className={tab(type === "all")} aria-pressed={type === "all"} onClick={() => setType("all")}>{T.all[lang]}</button>
            {LISTING_TYPES.map((o) => <button key={o.v} type="button" className={tab(type === o.v)} aria-pressed={type === o.v} onClick={() => setType(o.v)}>{o[lang]}</button>)}
          </div>
        </div>
        <div className="mk-filter-row">
          <label className="mk-filter-label" htmlFor="market-cat">{T.filterCat[lang]}</label>
          <select id="market-cat" className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">{T.all[lang]}</option>
            {LISTING_CATEGORIES.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
          </select>
        </div>
      </div>

      {live.length === 0 ? (
        <>
          <p className="muted mk-empty">{T.empty[lang]}</p>
          <article className="mk-card mk-example" aria-label={T.exampleTitle[lang]}>
            <p className="mk-example-label">{T.exampleTitle[lang]}</p>
            <h3>{lang === "fa" ? "گیلاس تازه‌ی باغ" : "Fresh orchard cherries"}</h3>
            <p className="mk-chips"><span className="chip">{typeLabel("sell")}</span><span className="chip">{label(LISTING_CATEGORIES, "fruit")}</span></p>
            <dl className="mk-facts">
              <dt>{T.qty[lang]}</dt><dd>{lang === "fa" ? "۵ کیلو" : "5 kg"}</dd>
              <dt>{T.price[lang]}</dt><dd>{lang === "fa" ? "کیلویی ۱۲۰٬۰۰۰ تومان" : "120,000 toman per kg"}</dd>
              <dt>{T.area[lang]}</dt><dd>{lang === "fa" ? "سُه، تحویل در باغ" : "Soh, pickup at the orchard"}</dd>
              <dt>{T.avail[lang]}</dt><dd>{lang === "fa" ? "اواسط خرداد" : "mid-June"}</dd>
            </dl>
          </article>
        </>
      ) : shown.length === 0 ? (
        <p className="muted mk-empty" role="status">{T.noMatch[lang]}</p>
      ) : (
        <>
          <p className="mk-count" role="status">{T.showing[lang]} {num(shown.length)} {T.of[lang]} {num(live.length)}</p>
          <ul className="mk-grid">
            {shown.map((l) => (
              <li key={l.id} className="mk-card">
                <h3>{l.title}</h3>
                <p className="mk-chips"><span className="chip">{typeLabel(l.type)}</span><span className="chip">{label(LISTING_CATEGORIES, l.category)}</span></p>
                <dl className="mk-facts">
                  {l.quantity && (<><dt>{T.qty[lang]}</dt><dd>{l.quantity}</dd></>)}
                  {l.price && (<><dt>{T.price[lang]}</dt><dd>{l.price}</dd></>)}
                  <dt>{T.area[lang]}</dt><dd>{l.area}</dd>
                  {l.available && (<><dt>{T.avail[lang]}</dt><dd>{l.available}</dd></>)}
                </dl>
                {l.details && <p style={{ margin: 0, fontSize: 15 }}>{l.details}</p>}
                <p className="mk-contact">
                  <b>{T.contact[lang]}: </b>
                  {l.contact ? <span dir="ltr" className="select-all">{label([{ v: "phone", fa: "تلفن", en: "Phone" }, { v: "telegram", fa: "تلگرام", en: "Telegram" }, { v: "whatsapp", fa: "واتس‌اپ", en: "WhatsApp" }, { v: "other", fa: "دیگر", en: "Other" }], l.contact.kind)}: {l.contact.value}</span> : <span className="mk-nocontact">{T.noContact[lang]}</span>}
                </p>
                <p className="mk-expiry">{T.posted[lang]} <span dir="ltr">{l.postedAt}</span> · {T.until[lang]} <span dir="ltr">{l.expiresAt}</span></p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
