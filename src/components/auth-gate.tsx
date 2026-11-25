"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import "@/styles/forms.css";
import type { Locale } from "@/lib/i18n";
import { publicSupabase } from "@/lib/supabase";
import { loginHref, profileHref, rememberNext } from "@/lib/return-to";
import { useSession } from "@/components/use-session";
import { useProfile } from "@/lib/use-profile";

const T = {
  off: { fa: "ورود و ثبت آگهی هنوز فعال نیست.", en: "Login and posting are not available yet." },
  wait: { fa: "در حال بارگذاری...", en: "Loading..." },
  post: { fa: "برای گذاشتن آگهی باید وارد شوید یا حساب بسازید. دیدن آگهی‌ها نیازی به ورود ندارد.", en: "To post an ad, log in or create an account. Looking at ads needs no login." },
  my: { fa: "برای دیدن آگهی‌هایتان وارد شوید یا حساب بسازید.", en: "Log in or create an account to see your ads." },
  login: { fa: "ورود", en: "Log in" },
  signup: { fa: "ساخت حساب جدید", en: "Create an account" },
  stepTitle: { fa: "یک قدم دیگر: مشخصات و نشانی", en: "One more step: your details and address" },
  step: { fa: "نام، شماره‌ی موبایل و نشانی‌تان لازم است تا بتوانید آگهی بگذارید. نشانی به کسی نمایش داده نمی‌شود و فقط مدیران سایت آن را می‌بینند.", en: "Your name, mobile number and address are needed to post. The address is never shown; only site admins can see it." },
  stepOld: { fa: "یک چیز دیگر مانده: نشانی‌تان را اضافه کنید (خصوصی می‌ماند) تا بتوانید آگهی بگذارید.", en: "One more thing: add your address (it stays private) to keep posting." },
  stepBtn: { fa: "تکمیل مشخصات", en: "Complete profile" },
  retry: { fa: "مشخصات بارگذاری نشد. صفحه را تازه کنید.", en: "Could not load your profile. Refresh the page." },
};

/** Wraps anything that needs a login (and, by default, a finished profile). Reading pages never use it. */
export function AuthGate({ lang, reason, next, requireProfile = true, children }: { lang: Locale; reason: "post" | "my"; next?: string; requireProfile?: boolean; children: ReactNode }) {
  const { session, ready } = useSession();
  const prof = useProfile();
  if (!publicSupabase()) return <p className="notice" role="status">{T.off[lang]}</p>;
  if (!ready) return <p className="gate-quiet" role="status" aria-live="polite">{T.wait[lang]}</p>;
  if (!session) {
    return (
      <div className="gate-card">
        <p>{reason === "post" ? T.post[lang] : T.my[lang]}</p>
        <div className="gate-card__btns">
          <Link className="btn btn--primary" href={loginHref(lang, next)} onClick={() => rememberNext(next)}>{T.login[lang]}</Link>
          <Link className="btn btn--ghost" href={`${loginHref(lang, next)}${loginHref(lang, next).includes("?") ? "&" : "?"}view=signup`} onClick={() => rememberNext(next)}>{T.signup[lang]}</Link>
        </div>
      </div>
    );
  }
  if (requireProfile) {
    if (prof.status === "loading" || prof.status === "off") return <p className="gate-quiet" role="status" aria-live="polite">{T.wait[lang]}</p>;
    if (prof.status === "error") return <p className="notice" role="status">{T.retry[lang]}</p>;
    if (!prof.complete) {
      return (
        <div className="gate-card">
          <h3>{T.stepTitle[lang]}</h3>
          <p>{prof.profile ? T.stepOld[lang] : T.step[lang]}</p>
          <Link className="btn btn--primary" href={profileHref(lang, next)} onClick={() => rememberNext(next)}>{T.stepBtn[lang]}</Link>
        </div>
      );
    }
  }
  return <>{children}</>;
}
