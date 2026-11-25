"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import "@/styles/market.css";
import "@/styles/forms.css";
import "@/styles/admin.css";
import type { Locale } from "@/lib/i18n";
import { publicSupabase } from "@/lib/supabase";
import { loginHref, rememberNext } from "@/lib/return-to";
import { useSession } from "@/components/use-session";
import { useProfile } from "@/lib/use-profile";
import type { ListingStatus } from "@/lib/admin-types";
import { OverviewTab } from "./overview-tab";
import { AdsTab } from "./ads-tab";
import { PostsTab } from "./posts-tab";
import { UsersTab } from "./users-tab";

const TABS = ["overview", "ads", "posts", "users"] as const;
type Tab = (typeof TABS)[number];
const T = {
  tabs: { fa: "بخش‌های مدیریت", en: "Admin sections" },
  overview: { fa: "نمای کلی", en: "Overview" },
  ads: { fa: "آگهی‌ها", en: "Ads" },
  posts: { fa: "مطالب", en: "Posts" },
  users: { fa: "کاربران", en: "Users" },
  off: { fa: "این بخش هنوز فعال نیست.", en: "This area is not available yet." },
  wait: { fa: "در حال بارگذاری...", en: "Loading..." },
  login: { fa: "برای ورود به بخش مدیریت، اول وارد شوید.", en: "Log in to open the admin area." },
  loginBtn: { fa: "ورود", en: "Log in" },
  noTitle: { fa: "فقط برای مدیران", en: "Admins only" },
  no: { fa: "این صفحه فقط برای مدیران سایت است. اگر فکر می‌کنید باید دسترسی داشته باشید، با مالک سایت صحبت کنید.", en: "This page is only for site admins. If you think you should have access, talk to the site owner." },
  err: { fa: "بارگذاری اطلاعات حساب شما انجام نشد.", en: "Could not load your account details." },
  retry: { fa: "تلاش دوباره", en: "Try again" },
  home: { fa: "بازگشت به خانه", en: "Back to home" },
};

const fromHash = (): Tab => {
  const h = typeof window === "undefined" ? "" : window.location.hash.replace("#", "");
  return (TABS as readonly string[]).includes(h) ? (h as Tab) : "overview";
};

export function AdminApp({ lang }: { lang: Locale }) {
  const { session, ready } = useSession();
  const prof = useProfile();
  const [tab, setTab] = useState<Tab>(fromHash);
  const [visited, setVisited] = useState<Tab[]>(() => [fromHash()]);
  const [adsKey, setAdsKey] = useState(0);
  const [adsStatus, setAdsStatus] = useState<ListingStatus | "all">("approved");
  const [forbidden, setForbidden] = useState(false);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Panels stay mounted once opened (hidden, not unmounted) so an open post draft survives a tab switch.
  const show = useCallback((t: Tab) => {
    setTab(t);
    setVisited((v) => (v.includes(t) ? v : [...v, t]));
  }, []);
  useEffect(() => {
    const on = () => show(fromHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, [show]);
  const go = useCallback((t: Tab) => {
    show(t);
    try { window.history.replaceState(null, "", `#${t}`); } catch { /* ignore */ }
  }, [show]);
  const onForbidden = useCallback(() => setForbidden(true), []);

  const self = `/${lang}/admin`;
  if (!publicSupabase()) return <p className="notice" role="status">{T.off[lang]}</p>;
  if (!ready) return <p className="adm-quiet" role="status" aria-live="polite">{T.wait[lang]}</p>;
  if (!session) {
    return (
      <div className="gate-card">
        <p>{T.login[lang]}</p>
        <Link className="btn btn--primary" href={loginHref(lang, self)} onClick={() => rememberNext(self)}>{T.loginBtn[lang]}</Link>
      </div>
    );
  }
  if (!forbidden && (prof.status === "loading" || prof.status === "off")) return <p className="adm-quiet" role="status" aria-live="polite">{T.wait[lang]}</p>;
  if (!forbidden && prof.status === "error") {
    return (
      <div className="notice" role="alert">
        <p>{T.err[lang]}</p>
        <button type="button" className="btn btn--primary" onClick={() => void prof.reload()}>{T.retry[lang]}</button>
      </div>
    );
  }
  // The shell shows only for a confirmed admin; everything else (no profile, normal user, a 403 from the server) is the denied card.
  if (forbidden || (prof.status !== "ready" && prof.status !== "none") || prof.profile?.role !== "admin") {
    return (
      <div className="gate-card">
        <h2>{T.noTitle[lang]}</h2>
        <p>{T.no[lang]}</p>
        <Link className="btn btn--ghost" href={`/${lang}`}>{T.home[lang]}</Link>
      </div>
    );
  }

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const rtl = lang === "fa";
    let n = -1;
    if (e.key === "ArrowRight") n = i + (rtl ? -1 : 1);
    else if (e.key === "ArrowLeft") n = i + (rtl ? 1 : -1);
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = TABS.length - 1;
    if (n < 0) { if (e.key === "ArrowRight" || e.key === "ArrowLeft") n = (n + TABS.length * 2) % TABS.length; else return; }
    n = (n + TABS.length) % TABS.length;
    e.preventDefault();
    go(TABS[n]);
    refs.current[TABS[n]]?.focus();
  };

  return (
    <div className="adm">
      <div className="adm-tabs" role="tablist" aria-label={T.tabs[lang]}>
        {TABS.map((t, i) => (
          <button
            key={t}
            ref={(el) => { refs.current[t] = el; }}
            type="button"
            role="tab"
            id={`adm-tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`adm-panel-${t}`}
            tabIndex={tab === t ? 0 : -1}
            className="adm-tab"
            onClick={() => go(t)}
            onKeyDown={(e) => onKey(e, i)}
          >{T[t][lang]}</button>
        ))}
      </div>
      {TABS.filter((t) => visited.includes(t)).map((t) => (
        <div key={t} id={`adm-panel-${t}`} role="tabpanel" aria-labelledby={`adm-tab-${t}`} className="adm-panel" hidden={tab !== t}>
          {t === "overview" && <OverviewTab lang={lang} onForbidden={onForbidden} onOpenPending={() => { setAdsStatus("pending"); setAdsKey((k) => k + 1); go("ads"); }} />}
          {t === "ads" && <AdsTab key={adsKey} lang={lang} initialStatus={adsStatus} onForbidden={onForbidden} />}
          {t === "posts" && <PostsTab lang={lang} onForbidden={onForbidden} />}
          {t === "users" && <UsersTab lang={lang} onForbidden={onForbidden} />}
        </div>
      ))}
    </div>
  );
}
