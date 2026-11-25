"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import "@/styles/forms.css";
import { BOARDS, boardPath, type BoardId } from "@/lib/boards";
import type { Locale } from "@/lib/i18n";
import { loginHref } from "@/lib/return-to";
import { PlusI } from "@/components/market-icons";
import { useSession } from "@/components/use-session";

// The "+" in the very top bar (like YouTube's create button).
// Logged out: a short note ("create an account first") with Create account / Log in. Reading the site never needs an account.
// Logged in: the four boards (each opens its posting form, which is itself behind the login gate) and "My ads".
// The server still checks the login on every write; this only guides people.
const ORDER: BoardId[] = ["market", "needs", "property", "careers"];
const T = {
  button: { fa: "افزودن آگهی", en: "Add a post" },
  head: { fa: "چه چیزی اضافه می‌کنید؟", en: "What would you like to add?" },
  my: { fa: "آگهی‌های من", en: "My ads" },
  needTitle: { fa: "اول حساب بسازید", en: "Create an account first" },
  needText: {
    fa: "برای گذاشتن آگهی، اول باید حساب بسازید. دیدن آگهی‌ها و بقیه‌ی سایت به حساب نیاز ندارد.",
    en: "To add a post you first need an account. Reading the site never needs one.",
  },
  signup: { fa: "ساخت حساب", en: "Create account" },
  login: { fa: "ورود", en: "Log in" },
  have: { fa: "حساب دارید؟", en: "Already have an account?" },
  loading: { fa: "کمی صبر کنید…", en: "One moment…" },
};

export function CreateMenu({ lang }: { lang: Locale }) {
  const { session, ready } = useSession();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    const onFocus = (e: FocusEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); document.removeEventListener("focusin", onFocus); };
  }, [open]);

  const close = () => setOpen(false);
  // After signing up or logging in the person comes back to the page they were on.
  const here = path && path.startsWith(`/${lang}`) ? path : undefined;
  const signupHref = `${loginHref(lang, here)}${loginHref(lang, here).includes("?") ? "&" : "?"}view=signup`;

  return (
    <div className="cm" ref={root}>
      <button
        ref={btn}
        type="button"
        className="cm__btn"
        aria-expanded={open}
        aria-controls={`${id}-pop`}
        aria-label={T.button[lang]}
        title={T.button[lang]}
        onClick={() => setOpen((o) => !o)}
      >
        <PlusI size={20} />
      </button>
      {open && (
        <div className="cm__pop" id={`${id}-pop`} role="region" aria-label={T.button[lang]}>
          {!ready ? (
            <p className="cm__text">{T.loading[lang]}</p>
          ) : !session ? (
            <>
              <p className="cm__title">{T.needTitle[lang]}</p>
              <p className="cm__text">{T.needText[lang]}</p>
              <Link href={signupHref} className="btn btn--primary cm__cta" onClick={close}>{T.signup[lang]}</Link>
              <p className="cm__have">
                {T.have[lang]} <Link href={loginHref(lang, here)} className="cm__link" onClick={close}>{T.login[lang]}</Link>
              </p>
            </>
          ) : (
            <>
              <p className="cm__title">{T.head[lang]}</p>
              <ul className="cm__list">
                {ORDER.map((b) => (
                  <li key={b}>
                    <Link href={`${boardPath(lang, b)}#pg-form-title`} className="cm__item" onClick={close}>
                      <PlusI size={16} />
                      <span>{BOARDS[b].title[lang]}</span>
                    </Link>
                  </li>
                ))}
                <li className="cm__sep" role="presentation" />
                <li>
                  <Link href={`/${lang}/my`} className="cm__item" onClick={close}>{T.my[lang]}</Link>
                </li>
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
