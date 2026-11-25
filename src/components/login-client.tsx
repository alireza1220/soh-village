"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import "@/styles/market.css";
import type { Locale } from "@/lib/i18n";
import { consumeSessionFromUrl, sendMagicLink, signOut } from "@/lib/auth";
import { publicSupabase } from "@/lib/supabase";
import { useSession } from "@/components/use-session";
import { errorText } from "@/components/listing-api";

const T = {
  title: { fa: "ورود", en: "Log in" },
  optional: { fa: "ورود اختیاری است. بدون حساب هم می‌توانید آگهی بگذارید و با کد مدیریت آن را ویرایش کنید. با ورود، آگهی‌هایتان یک‌جا جمع می‌شود.", en: "Logging in is optional. You can post without an account and manage a listing with its code. Logging in keeps all your listings in one place." },
  na: { fa: "ورود هنوز فعال نشده است.", en: "Login is not available yet." },
  email: { fa: "ایمیل", en: "Email" },
  send: { fa: "ارسال لینک ورود", en: "Send login link" },
  sending: { fa: "در حال ارسال...", en: "Sending..." },
  sent: { fa: "لینک ورود به ایمیل شما فرستاده شد. ایمیل را باز کنید و روی لینک بزنید.", en: "A login link was sent to your email. Open it and tap the link." },
  as: { fa: "وارد شده‌اید با", en: "Logged in as" },
  my: { fa: "آگهی‌های من", en: "My listings" },
  out: { fa: "خروج", en: "Sign out" },
  checking: { fa: "...", en: "..." },
};

export function LoginClient({ lang }: { lang: Locale }) {
  const { session, ready } = useSession();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const configured = !!publicSupabase();

  useEffect(() => { consumeSessionFromUrl(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true); setMsg(null);
    const r = await sendMagicLink(email.trim(), `${window.location.origin}/${lang}/login`);
    setBusy(false);
    setMsg(r.ok ? { ok: true, text: T.sent[lang] } : { ok: false, text: errorText(r.error, lang) });
  };

  return (
    <div className="mk-stack mk-narrow">
      <p className="lede">{T.optional[lang]}</p>
      {!configured ? (
        <div className="notice"><p>{T.na[lang]}</p></div>
      ) : !ready ? (
        <p className="muted" aria-live="polite">{T.checking[lang]}</p>
      ) : session ? (
        <div className="mk-panel">
          <p style={{ margin: 0 }}>{T.as[lang]} <b dir="ltr" className="break-all">{session.user.email}</b></p>
          <div className="mk-actions">
            <Link className="btn btn--primary" href={`/${lang}/my`}>{T.my[lang]}</Link>
            <button type="button" className="btn btn--ghost" onClick={() => void signOut()}>{T.out[lang]}</button>
          </div>
        </div>
      ) : (
        <form className="mk-panel" onSubmit={submit} aria-label={T.title[lang]}>
          <div className="field">
            <label className="label" htmlFor="login-email">{T.email[lang]}</label>
            <input id="login-email" type="email" dir="ltr" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <button type="submit" className="btn btn--primary" disabled={busy || !email.trim()}>{busy ? T.sending[lang] : T.send[lang]}</button>
          </div>
        </form>
      )}
      <div aria-live="polite" role="status" className="mk-live">
        {msg && <p className={`mk-msg ${msg.ok ? "mk-msg--ok" : "mk-msg--warn"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
