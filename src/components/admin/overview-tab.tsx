"use client";
import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { AdminCounts } from "@/lib/admin-types";
import { errorText } from "@/components/listing-api";
import { adminCall } from "./admin-api";

const T = {
  loading: { fa: "در حال بارگذاری...", en: "Loading..." },
  retry: { fa: "تلاش دوباره", en: "Try again" },
  pending: { fa: "آگهی قدیمی در انتظار (دیگر بررسی لازم نیست؛ بازگردانید تا منتشر شود)", en: "Legacy ads still pending (no review is needed now; restore them to publish)" },
  review: { fa: "دیدن آگهی‌ها", en: "Show ads" },
  live: { fa: "آگهی منتشرشده. آگهی‌ها بی‌درنگ منتشر می‌شوند؛ هر وقت لازم بود از زبانه‌ی آگهی‌ها پایینشان بیاورید.", en: "ads live. Ads go public at once; take one down from the Ads tab when needed." },
  approved: { fa: "منتشرشده", en: "Live" },
  archived: { fa: "بایگانی‌شده", en: "Archived" },
  rejected: { fa: "پایین‌آورده‌شده", en: "Taken down" },
  removed: { fa: "برداشته‌شده", en: "Removed" },
  users: { fa: "کاربران", en: "Users" },
  admins: { fa: "مدیران", en: "Admins" },
  news: { fa: "خبرها", en: "News" },
  blog: { fa: "وبلاگ‌ها", en: "Blog posts" },
  event: { fa: "رویدادها", en: "Events" },
  drafts: { fa: "پیش‌نویس‌ها", en: "Drafts" },
  h1: { fa: "آگهی‌ها", en: "Ads" },
  h2: { fa: "مطالب و کاربران", en: "Posts and people" },
};

export function OverviewTab({ lang, onOpenPending, onForbidden }: { lang: Locale; onOpenPending: () => void; onForbidden: () => void }) {
  const [counts, setCounts] = useState<AdminCounts | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    const r = await adminCall("overview", {});
    if (r.ok && r.data.counts) { setErr(""); setCounts(r.data.counts as AdminCounts); return; }
    if (!r.ok && r.status === 403) { onForbidden(); return; }
    setErr(errorText(r.ok ? "store_failed" : r.error, lang));
  }, [lang, onForbidden]);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  if (err) return <div className="notice" role="alert"><p>{err}</p><button type="button" className="btn btn--primary" onClick={() => void load()}>{T.retry[lang]}</button></div>;
  if (!counts) return <p className="adm-quiet" role="status">{T.loading[lang]}</p>;
  const n = new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US");
  const card = (label: string, v: number) => (
    <li className="adm-stat" key={label}><span className="adm-stat__n">{n.format(v)}</span><span className="adm-stat__l">{label}</span></li>
  );
  const p = counts.listings.pending ?? 0;
  const live = counts.listings.approved ?? 0;
  return (
    <div className="adm-stack">
      <section className={`adm-pending${p > 0 ? " adm-pending--on" : ""}`} aria-labelledby="adm-pend">
        <div>
          <span className="adm-stat__n">{n.format(p > 0 ? p : live)}</span>
          <h2 id="adm-pend">{p > 0 ? T.pending[lang] : T.live[lang]}</h2>
        </div>
        {p > 0 && <button type="button" className="btn btn--primary" onClick={onOpenPending}>{T.review[lang]}</button>}
      </section>
      <h2 className="adm-h">{T.h1[lang]}</h2>
      <ul className="adm-stats">{card(T.approved[lang], live)}{card(T.archived[lang], counts.listings.archived ?? 0)}{card(T.rejected[lang], counts.listings.rejected)}{card(T.removed[lang], counts.listings.removed)}</ul>
      <h2 className="adm-h">{T.h2[lang]}</h2>
      <ul className="adm-stats">
        {card(T.users[lang], counts.users)}{card(T.admins[lang], counts.admins)}
        {card(T.news[lang], counts.posts.news)}{card(T.blog[lang], counts.posts.blog)}{card(T.event[lang], counts.posts.event)}{card(T.drafts[lang], counts.posts.drafts)}
      </ul>
    </div>
  );
}
