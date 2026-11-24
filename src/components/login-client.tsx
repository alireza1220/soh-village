"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
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

  const field = "w-full rounded-xl border px-3 py-2 bg-[var(--surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm muted">{T.optional[lang]}</p>
      {!configured ? (
        <div className="todo"><p>{T.na[lang]}</p></div>
      ) : !ready ? (
        <p className="muted" aria-live="polite">{T.checking[lang]}</p>
      ) : session ? (
        <div className="card p-5 flex flex-col gap-3">
          <p>{T.as[lang]} <b dir="ltr" className="break-all">{session.user.email}</b></p>
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-primary" href={`/${lang}/my`}>{T.my[lang]}</Link>
            <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>{T.out[lang]}</button>
          </div>
        </div>
      ) : (
        <form className="card p-5 flex flex-col gap-3" onSubmit={submit} aria-label={T.title[lang]}>
          <label className="flex flex-col gap-1 text-sm" htmlFor="login-email">{T.email[lang]}
            <input id="login-email" type="email" dir="ltr" autoComplete="email" required className={field} style={{ borderColor: "var(--line)" }} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary self-start" disabled={busy || !email.trim()}>{busy ? T.sending[lang] : T.send[lang]}</button>
        </form>
      )}
      <div aria-live="polite" role="status">
        {msg && <p className="text-sm" style={{ color: msg.ok ? "var(--accent)" : "var(--amber)" }}>{msg.text}</p>}
      </div>
    </div>
  );
}
