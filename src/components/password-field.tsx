"use client";
import { useState } from "react";
import "@/styles/account.css";
import type { L, Locale } from "@/lib/i18n";
import { PASSWORD_MIN, passwordStrength } from "@/lib/profile";

const T = {
  show: { fa: "نمایش", en: "Show" },
  hide: { fa: "پنهان", en: "Hide" },
  showLong: { fa: "نمایش رمز عبور", en: "Show password" },
  hint: { fa: `دست‌کم ${PASSWORD_MIN.toLocaleString("fa-IR")} حرف یا عدد`, en: `At least ${PASSWORD_MIN} characters` },
  s0: { fa: "هنوز کوتاه است", en: "Still too short" },
  s1: { fa: "کافی است", en: "Long enough" },
  s2: { fa: "قوی", en: "Strong" },
} satisfies Record<string, L>;

/** Password input with a real show/hide button and an optional plain strength hint (text + bars, never colour alone). */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  lang,
  autoComplete,
  strength = false,
  error,
  describedBy,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  lang: Locale;
  autoComplete: "current-password" | "new-password";
  strength?: boolean;
  error?: string | null;
  describedBy?: string;
}) {
  const [shown, setShown] = useState(false);
  const level = passwordStrength(value);
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const desc = [strength ? hintId : "", error ? errId : "", describedBy ?? ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}</label>
      <div className="acc-pw">
        <input
          id={id}
          className="input"
          type={shown ? "text" : "password"}
          dir="ltr"
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={desc}
        />
        <button type="button" className="acc-pw__toggle" aria-pressed={shown} aria-label={T.showLong[lang]} onClick={() => setShown((v) => !v)}>
          {shown ? T.hide[lang] : T.show[lang]}
        </button>
      </div>
      {strength && (
        <p id={hintId} className="acc-meter">
          <span className="acc-meter__bars" aria-hidden="true">
            {[1, 2].map((n) => (
              <span key={n} className="acc-meter__bar" data-on={value.length > 0 && level >= n} />
            ))}
          </span>
          <span>{value.length === 0 ? T.hint[lang] : level === 0 ? `${T.s0[lang]} · ${T.hint[lang]}` : level === 1 ? T.s1[lang] : T.s2[lang]}</span>
        </p>
      )}
      {error && <p id={errId} className="mk-msg mk-msg--warn">{error}</p>}
    </div>
  );
}
