"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "@/styles/market.css";
import "@/styles/account.css";
import type { L, Locale } from "@/lib/i18n";
import { consumeAuthRedirect, sendMagicLink, sendPasswordReset, signInWithPassword, signOut, signUp } from "@/lib/auth";
import { publicSupabase } from "@/lib/supabase";
import { useSession } from "@/components/use-session";
import { errorText } from "@/lib/api-errors";
import { looksLikeEmail, passwordProblem } from "@/lib/profile";
import { rememberNext, safeNext } from "@/lib/return-to";
import { afterLoginHref, useNextParam, useProfile } from "@/lib/use-profile";
import { PasswordField } from "@/components/password-field";

type View = "login" | "signup" | "link" | "forgot";

const T = {
  intro: { fa: "برای گذاشتن آگهی باید وارد شوید. دیدن آگهی‌ها نیازی به ورود ندارد.", en: "To post an ad you need to log in. Looking at ads needs no login." },
  na: { fa: "ورود هنوز فعال نشده است.", en: "Login is not available yet." },
  views: { fa: "روش ورود", en: "Log-in method" },
  login: { fa: "ورود", en: "Log in" },
  signup: { fa: "ساخت حساب", en: "Create account" },
  link: { fa: "لینک ایمیل", en: "Email link" },
  forgot: { fa: "فراموشی رمز", en: "Forgot password" },
  email: { fa: "ایمیل", en: "Email" },
  password: { fa: "رمز عبور", en: "Password" },
  newPassword: { fa: "یک رمز عبور انتخاب کنید", en: "Choose a password" },
  busy: { fa: "کمی صبر کنید...", en: "One moment..." },
  doLogin: { fa: "ورود", en: "Log in" },
  doSignup: { fa: "ساخت حساب", en: "Create account" },
  doLink: { fa: "فرستادن لینک ورود", en: "Send me a login link" },
  doForgot: { fa: "فرستادن لینک رمز جدید", en: "Send reset link" },
  linkSub: { fa: "بدون رمز: لینک ورود را به ایمیل‌تان می‌فرستیم.", en: "No password: we email you a link that logs you in." },
  forgotSub: { fa: "ایمیل‌تان را بنویسید تا لینک انتخاب رمز جدید را بفرستیم.", en: "Write your email and we send a link to choose a new password." },
  forgotLink: { fa: "رمزتان را فراموش کرده‌اید؟", en: "Forgot your password?" },
  useLink: { fa: "ورود با لینک ایمیل", en: "Log in with an email link" },
  haveAccount: { fa: "حساب دارید؟ وارد شوید", en: "Have an account? Log in" },
  back: { fa: "بازگشت به ورود", en: "Back to log in" },
  checkTitle: { fa: "ایمیل‌تان را نگاه کنید", en: "Check your email" },
  confirmA: { fa: "یک لینک تأیید به", en: "We sent a confirmation link to" },
  confirmB: { fa: "فرستادیم. روی لینک بزنید، بعد برگردید و وارد شوید.", en: ". Tap it, then come back and log in." },
  linkA: { fa: "لینک ورود را به", en: "A login link is on its way to" },
  linkB: { fa: "فرستادیم. ایمیل را باز کنید و روی لینک بزنید.", en: ". Open your email and tap the link." },
  forgotSent: { fa: "اگر با این ایمیل حسابی باشد، لینک رمز جدید برایش فرستاده شد.", en: "If this email has an account, we sent it a link to set a new password." },
  spam: { fa: "نرسید؟ پوشه‌ی اسپم را هم ببینید و چند دقیقه صبر کنید.", en: "Not there? Look in spam and wait a few minutes." },
  as: { fa: "با این ایمیل وارد شده‌اید:", en: "Logged in with:" },
  profile: { fa: "مشخصات من", en: "My profile" },
  my: { fa: "آگهی‌های من", en: "My ads" },
  out: { fa: "خروج", en: "Log out" },
  checking: { fa: "یک لحظه...", en: "One moment..." },
  going: { fa: "در حال رفتن...", en: "Taking you there..." },
} satisfies Record<string, L>;

export function LoginClient({ lang }: { lang: Locale }) {
  const router = useRouter();
  const { session, ready } = useSession();
  const prof = useProfile();
  const configured = !!publicSupabase();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [sent, setSent] = useState<null | "confirm" | "link" | "forgot">(null);
  const [badField, setBadField] = useState<null | "email" | "password">(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const nextParam = useNextParam();
  const [arrived, setArrived] = useState(false); // logged in during this visit (or via an e-mail link)
  const routed = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusHeading = useRef(false);

  useEffect(() => {
    const n = safeNext(new URLSearchParams(window.location.search).get("next"));
    if (n) rememberNext(n);
    // Deferred one tick: reading the e-mail link is an outside-world sync, not render state.
    const wanted = new URLSearchParams(window.location.search).get("view");
    void Promise.resolve().then(() => {
      if (wanted === "signup" || wanted === "forgot" || wanted === "link") setView(wanted);
      const r = consumeAuthRedirect();
      if (r.kind === "session") setArrived(true);
      else if (r.kind === "error") setMsg(errorText(r.error, lang));
    });
  }, [lang]);

  // After any login: complete profile -> where they wanted to go; otherwise -> the profile step.
  useEffect(() => {
    if (routed.current || !session || !ready) return;
    if (!arrived && !nextParam) return;
    if (prof.status === "loading" || prof.status === "off") return;
    routed.current = true;
    router.replace(afterLoginHref(lang, prof.status === "ready", nextParam));
  }, [session, ready, arrived, nextParam, prof.status, lang, router]);

  useEffect(() => {
    if (focusHeading.current) {
      focusHeading.current = false;
      heading.current?.focus();
    }
  }, [view, sent]);

  const go = (v: View) => {
    focusHeading.current = true;
    setView(v);
    setSent(null);
    setMsg(null);
    setBadField(null);
    setPwErr(null);
    setPassword("");
  };

  const focusId = (id: string) => window.setTimeout(() => document.getElementById(id)?.focus(), 0);
  const fail = (code: string | undefined) => {
    setBadField(null);
    setPwErr(null);
    if (code === "bad_email") { setBadField("email"); focusId("login-email"); }
    if (code === "password_required" || code === "password_short" || code === "password_long") {
      setPwErr(errorText(code, lang));
      focusId("login-password");
      return setMsg(null);
    }
    setMsg(errorText(code, lang));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const mail = email.trim();
    setMsg(null);
    setBadField(null);
    setPwErr(null);
    if (!looksLikeEmail(mail)) return fail("bad_email");
    const origin = window.location.origin;
    if (view === "login") {
      if (!password) return fail("password_required");
      setBusy(true);
      const r = await signInWithPassword(mail, password);
      setBusy(false);
      if (!r.ok) return fail(r.error);
      setPassword("");
      setArrived(true);
    } else if (view === "signup") {
      const p = passwordProblem(password);
      if (p) return fail(p);
      setBusy(true);
      const r = await signUp(mail, password, `${origin}/${lang}/login`);
      setBusy(false);
      if (!r.ok) return fail(r.error);
      setPassword("");
      if (r.session) setArrived(true);
      else {
        focusHeading.current = true;
        setSent("confirm");
      }
    } else if (view === "link") {
      setBusy(true);
      const r = await sendMagicLink(mail, `${origin}/${lang}/login`);
      setBusy(false);
      if (!r.ok) return fail(r.error);
      focusHeading.current = true;
      setSent("link");
    } else {
      setBusy(true);
      const r = await sendPasswordReset(mail, `${origin}/${lang}/reset-password`);
      setBusy(false);
      if (!r.ok) return fail(r.error);
      focusHeading.current = true;
      setSent("forgot");
    }
  };

  const mailLine = (a: L, b: L) => (
    <p>
      {a[lang]} <bdi dir="ltr" className="break-all acc-email"><b>{email.trim()}</b></bdi>{lang === "fa" ? " " : ""}{b[lang]}
    </p>
  );

  let body: React.ReactNode;
  if (!configured) {
    body = <div className="notice"><p>{T.na[lang]}</p></div>;
  } else if (!ready) {
    body = <p className="muted" aria-live="polite">{T.checking[lang]}</p>;
  } else if (session && (arrived || nextParam)) {
    body = <p className="muted" aria-live="polite">{T.going[lang]}</p>;
  } else if (session) {
    body = (
      <div className="mk-panel">
        <p style={{ margin: 0 }}>{T.as[lang]} <bdi dir="ltr" className="break-all acc-email"><b>{session.user.email}</b></bdi></p>
        <div className="mk-actions">
          <Link className="btn btn--primary" href={`/${lang}/profile`}>{T.profile[lang]}</Link>
          <Link className="btn btn--ghost" href={`/${lang}/my`}>{T.my[lang]}</Link>
          <button type="button" className="btn btn--ghost" onClick={() => void signOut()}>{T.out[lang]}</button>
        </div>
      </div>
    );
  } else if (sent) {
    body = (
      <div className="mk-panel acc-sent">
        <h2 className="acc-title" ref={heading} tabIndex={-1}>{T.checkTitle[lang]}</h2>
        {sent === "confirm" && mailLine(T.confirmA, T.confirmB)}
        {sent === "link" && mailLine(T.linkA, T.linkB)}
        {sent === "forgot" && <p>{T.forgotSent[lang]}</p>}
        <p className="acc-sub">{T.spam[lang]}</p>
        <div>
          <button type="button" className="btn btn--ghost" onClick={() => go("login")}>{T.back[lang]}</button>
        </div>
      </div>
    );
  } else {
    const title = view === "login" ? T.login : view === "signup" ? T.signup : view === "link" ? T.link : T.forgot;
    const submitLabel = view === "login" ? T.doLogin : view === "signup" ? T.doSignup : view === "link" ? T.doLink : T.doForgot;
    const usePassword = view === "login" || view === "signup";
    body = (
      <>
        {view !== "forgot" && (
          <ul className="acc-views" aria-label={T.views[lang]}>
            {(["login", "signup", "link"] as const).map((v) => (
              <li key={v}>
                <button type="button" className="acc-view" aria-current={view === v ? "true" : undefined} onClick={() => go(v)}>
                  {(v === "login" ? T.login : v === "signup" ? T.signup : T.link)[lang]}
                </button>
              </li>
            ))}
          </ul>
        )}
        <form className="mk-panel" onSubmit={submit} noValidate aria-labelledby="acc-form-title">
          <h2 className="acc-title" id="acc-form-title" ref={heading} tabIndex={-1}>{title[lang]}</h2>
          {view === "link" && <p className="acc-sub">{T.linkSub[lang]}</p>}
          {view === "forgot" && <p className="acc-sub">{T.forgotSub[lang]}</p>}
          <div className="field">
            <label className="label" htmlFor="login-email">{T.email[lang]}</label>
            <input id="login-email" type="email" inputMode="email" dir="ltr" autoComplete={usePassword ? "username" : "email"} autoCapitalize="none" autoCorrect="off" spellCheck={false} required className="input" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={badField === "email" ? true : undefined} aria-describedby={badField === "email" ? "login-msg" : undefined} />
          </div>
          {usePassword && (
            <PasswordField
              id="login-password"
              label={view === "signup" ? T.newPassword[lang] : T.password[lang]}
              value={password}
              onChange={setPassword}
              lang={lang}
              autoComplete={view === "signup" ? "new-password" : "current-password"}
              strength={view === "signup"}
              error={pwErr}
            />
          )}
          <div>
            <button type="submit" className="btn btn--primary" aria-disabled={busy || undefined}>{busy ? T.busy[lang] : submitLabel[lang]}</button>
          </div>
          <div className="acc-links">
            {view === "login" && (
              <>
                <button type="button" className="acc-linkbtn" onClick={() => go("forgot")}>{T.forgotLink[lang]}</button>
                <button type="button" className="acc-linkbtn" onClick={() => go("link")}>{T.useLink[lang]}</button>
              </>
            )}
            {view === "signup" && <button type="button" className="acc-linkbtn" onClick={() => go("login")}>{T.haveAccount[lang]}</button>}
            {(view === "link" || view === "forgot") && <button type="button" className="acc-linkbtn" onClick={() => go("login")}>{T.back[lang]}</button>}
          </div>
        </form>
      </>
    );
  }

  return (
    <div className="mk-stack mk-narrow">
      {!session && <p className="lede">{T.intro[lang]}</p>}
      {body}
      <div aria-live="polite" role="status" className="mk-live">
        {msg && <p id="login-msg" className="mk-msg mk-msg--warn">{msg}</p>}
      </div>
    </div>
  );
}
