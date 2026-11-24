"use client";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { LISTING_CATEGORIES, LISTING_TYPE_LABELS, LISTING_TYPES, listings as localListings, type Listing, type ListingType } from "@/lib/market";
import { publicSupabase } from "@/lib/supabase";

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
  exampleTitle: { fa: "نمونه‌ی یک آگهی (واقعی نیست)", en: "What a listing looks like (not a real listing)" },
  filterType: { fa: "نوع آگهی", en: "Type" },
  filterCat: { fa: "دسته", en: "Category" },
};

export function MarketBoard({ lang }: { lang: Locale }) {
  const [type, setType] = useState<ListingType | "all">("all");
  const [cat, setCat] = useState("all");
  const [remote, setRemote] = useState<Listing[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  // When Supabase is connected, approved listings come from the database (the public view); otherwise only the local file is used.
  useEffect(() => {
    const sb = publicSupabase();
    if (!sb) return;
    let cancelled = false;
    fetch(`${sb.url}/rest/v1/public_listings?select=*&order=created_at.desc&limit=200`, { headers: { apikey: sb.anon, Authorization: `Bearer ${sb.anon}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Record<string, string | null>[]) => {
        if (cancelled) return;
        setRemote(rows.map((r) => ({
          id: String(r.id), type: r.type as ListingType, category: String(r.category), title: String(r.title),
          quantity: r.quantity ?? undefined, price: r.price ?? undefined, area: String(r.area), available: r.available ?? undefined,
          details: r.details ?? undefined,
          contact: r.contact_value ? { kind: String(r.contact_kind), value: String(r.contact_value) } : undefined,
          postedAt: String(r.created_at).slice(0, 10), expiresAt: r.expires_at ? String(r.expires_at).slice(0, 10) : "2099-12-31",
        })));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const live = useMemo(() => [...remote, ...localListings].filter((l) => l.expiresAt >= today), [remote, today]);
  const shown = live.filter((l) => (type === "all" || l.type === type) && (cat === "all" || l.category === cat));
  const label = (list: { v: string; fa: string; en: string }[], v: string) => list.find((o) => o.v === v)?.[lang] ?? v;
  const typeLabel = (v: string) => label(LISTING_TYPE_LABELS, v);
  const chip = (active: boolean) => `btn ${active ? "btn-primary" : "btn-ghost"} !py-1.5 !px-3 !text-sm`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={T.filterType[lang]}>
          <button type="button" className={chip(type === "all")} onClick={() => setType("all")}>{T.all[lang]}</button>
          {LISTING_TYPES.map((o) => <button key={o.v} type="button" className={chip(type === o.v)} onClick={() => setType(o.v)}>{o[lang]}</button>)}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="muted">{T.filterCat[lang]}</span>
          <select id="market-cat" className="rounded-xl border px-3 py-1.5 bg-[var(--surface)]" style={{ borderColor: "var(--line)" }} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">{T.all[lang]}</option>
            {LISTING_CATEGORIES.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
          </select>
        </label>
      </div>

      {live.length === 0 ? (
        <>
          <p className="muted">{T.empty[lang]}</p>
          <article className="item flex flex-col gap-1 opacity-80" aria-label={T.exampleTitle[lang]}>
            <p className="text-xs font-semibold muted">{T.exampleTitle[lang]}</p>
            <h3 className="text-lg">{lang === "fa" ? "گیلاس تازه‌ی باغ" : "Fresh orchard cherries"}</h3>
            <p className="text-sm"><span className="chip">{typeLabel("sell")}</span><span className="chip">{label(LISTING_CATEGORIES, "fruit")}</span></p>
            <dl className="grid gap-x-4 text-sm" style={{ gridTemplateColumns: "max-content 1fr" }}>
              <dt className="muted">{T.qty[lang]}</dt><dd>{lang === "fa" ? "۵ کیلو" : "5 kg"}</dd>
              <dt className="muted">{T.price[lang]}</dt><dd>{lang === "fa" ? "کیلویی ۱۲۰٬۰۰۰ تومان" : "120,000 toman per kg"}</dd>
              <dt className="muted">{T.area[lang]}</dt><dd>{lang === "fa" ? "سُه، تحویل در باغ" : "Soh, pickup at the orchard"}</dd>
              <dt className="muted">{T.avail[lang]}</dt><dd>{lang === "fa" ? "اواسط خرداد" : "mid-June"}</dd>
            </dl>
          </article>
        </>
      ) : shown.length === 0 ? (
        <p className="muted">{T.noMatch[lang]}</p>
      ) : (
        <ul className="grid gap-3 list-none p-0 m-0" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
          {shown.map((l) => (
            <li key={l.id} className="item flex flex-col gap-2">
              <h3 className="text-lg">{l.title}</h3>
              <p className="text-sm"><span className="chip">{typeLabel(l.type)}</span><span className="chip">{label(LISTING_CATEGORIES, l.category)}</span></p>
              <dl className="grid gap-x-4 gap-y-0.5 text-sm" style={{ gridTemplateColumns: "max-content 1fr" }}>
                {l.quantity && (<><dt className="muted">{T.qty[lang]}</dt><dd>{l.quantity}</dd></>)}
                {l.price && (<><dt className="muted">{T.price[lang]}</dt><dd>{l.price}</dd></>)}
                <dt className="muted">{T.area[lang]}</dt><dd>{l.area}</dd>
                {l.available && (<><dt className="muted">{T.avail[lang]}</dt><dd>{l.available}</dd></>)}
              </dl>
              {l.details && <p className="text-sm">{l.details}</p>}
              <p className="text-sm">
                <b>{T.contact[lang]}: </b>
                {l.contact ? <span dir="ltr" className="select-all">{label([{ v: "phone", fa: "تلفن", en: "Phone" }, { v: "telegram", fa: "تلگرام", en: "Telegram" }, { v: "whatsapp", fa: "واتس‌اپ", en: "WhatsApp" }, { v: "other", fa: "دیگر", en: "Other" }], l.contact.kind)}: {l.contact.value}</span> : <span className="muted">{T.noContact[lang]}</span>}
              </p>
              <p className="text-xs muted">{l.postedAt} · {T.until[lang]} {l.expiresAt}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
