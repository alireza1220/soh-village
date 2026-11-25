"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "@/styles/market.css";
import "@/styles/account.css";
import type { L, Locale } from "@/lib/i18n";
import { authToken, clearRecoveryFlag, consumeAuthRedirect, forgetSession, getSession, hasRecoveryFlag, signOut, updatePassword } from "@/lib/auth";
import { publicSupabase } from "@/lib/supabase";
import { errorText } from "@/lib/api-errors";
import { passwordProblem } from "@/lib/profile";
import { afterLoginHref, fetchProfile, useNextParam } from "@/lib/use-profile";
import { PasswordField } from "@/components/password-field";

const T = {
  na: { fa: "این بخش هنوز فعال نشده است.", en: "This is not available yet." },
  checking: { fa: "یک لحظه...", en: "One moment..." },
  title: { fa: "رمز عبور جدید", en: "New password" },
  sub: { fa: "یک رمز جدید انتخاب کنید. با آن وارد می‌شوید.", en: "Choose a new password. You will be logged in with it." },
  pw: { fa: "رمز جدید", en: "New password" },
  confirm: { fa: "رمز جدید را دوباره بنویسید", en: "Type the new password again" },
  save: { fa: "ذخیره‌ی رمز", en: "Save password" },
  busy: { fa: "کمی صبر کنید...", en: "One moment..." },
  doneTitle: { fa: "رمز جدید ذخیره شد", en: "New password saved" },
  doneText: { fa: "شما وارد شده‌اید.", en: "You are logged in." },
  go: { fa: "ادامه", en: "Continue" },
  expiredTitle: { fa: "این لینک کار نمی‌کند", en: "This link does not work" },
  forgotAgain: { fa: "گرفتن لینک جدید", en: "Get a new link" },
  login: { fa: "ورود", en: "Log in" },
} satisfies Record<string, L>;

let abandonTimer: ReturnType<typeof setTimeout> | undefined;

export function ResetPasswordClient({ lang }: { lang: Locale }) {
  const router = useRouter();
  const configured = !!publicSupabase();
  const [state, setState] = useState<"checking" | "form" | "expired" | "done">("checking");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const nextParam = useNextParam();
  const done = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (abandonTimer) clearTimeout(abandonTimer);
    void Promise.resolve().then(() => {
      const r = consumeAuthRedirect();
      if (r.kind === "session") {
        setEmail(r.session.user.email);
        setError(null);
        setState("form");
      } else if (r.kind === "error") {
        setError(errorText(r.error, lang));
        setState("expired");
      } else {
        const s = getSession();
        if (s) {
          setEmail(s.user.email);
          setState("form");
        } else setState("expired");
      }
    });
    // Leaving the page without choosing a password must not leave the reset-link session logged in.
    const leave = () => {
      if (!done.current && hasRecoveryFlag()) forgetSession();
    };
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      // Deferred so React's dev double-mount does not log the person out.
      abandonTimer = setTimeout(() => {
        if (!done.current && hasRecoveryFlag()) void signOut();
      }, 400);
    };
  }, [lang]);

  useEffect(() => {
    if (state !== "checking") heading.current?.focus();
  }, [state]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    const p = passwordProblem(pw);
    if (p) return setError(errorText(p, lang));
    if (pw !== pw2) return setError(errorText("password_mismatch", lang));
    setBusy(true);
    const r = await updatePassword(pw);
    if (!r.ok) {
      setBusy(false);
      return setError(errorText(r.error, lang));
    }
    done.current = true;
    clearRecoveryFlag();
    setPw("");
    setPw2("");
    setState("done");
    setBusy(false);
  };

  const proceed = async () => {
    const token = await authToken();
    const pr = token ? await fetchProfile(token) : null;
    router.replace(afterLoginHref(lang, !!pr && pr.ok && !!pr.profile, nextParam));
  };

  return (
    <div className="mk-stack mk-narrow">
      {!configured ? (
        <div className="notice"><p>{T.na[lang]}</p></div>
      ) : state === "checking" ? (
        <p className="muted" aria-live="polite">{T.checking[lang]}</p>
      ) : state === "expired" ? (
        <div className="mk-panel acc-sent">
          <h2 className="acc-title" ref={heading} tabIndex={-1}>{T.expiredTitle[lang]}</h2>
          <p>{error ?? errorText("link_expired", lang)}</p>
          <div className="mk-actions">
            <Link className="btn btn--primary" href={`/${lang}/login?view=forgot`}>{T.forgotAgain[lang]}</Link>
          </div>
        </div>
      ) : state === "done" ? (
        <div className="mk-panel acc-sent" role="status">
          <h2 className="acc-title" ref={heading} tabIndex={-1}>{T.doneTitle[lang]}</h2>
          <p>{T.doneText[lang]}</p>
          <div>
            <button type="button" className="btn btn--primary" onClick={() => void proceed()}>{T.go[lang]}</button>
          </div>
        </div>
      ) : (
        <form className="mk-panel" onSubmit={submit} noValidate aria-labelledby="acc-reset-title">
          <h2 className="acc-title" id="acc-reset-title" ref={heading} tabIndex={-1}>{T.title[lang]}</h2>
          <p className="acc-sub">{T.sub[lang]}</p>
          <input type="text" className="acc-file" tabIndex={-1} aria-hidden="true" autoComplete="username" readOnly value={email} />
          <PasswordField id="reset-pw" label={T.pw[lang]} value={pw} onChange={setPw} lang={lang} autoComplete="new-password" strength />
          <PasswordField id="reset-pw2" label={T.confirm[lang]} value={pw2} onChange={setPw2} lang={lang} autoComplete="new-password" />
          <div>
            <button type="submit" className="btn btn--primary" aria-disabled={busy || undefined}>{busy ? T.busy[lang] : T.save[lang]}</button>
          </div>
        </form>
      )}
      <div aria-live="polite" role="status" className="mk-live">
        {state === "form" && error && <p className="mk-msg mk-msg--warn">{error}</p>}
      </div>
    </div>
  );
}
