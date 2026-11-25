import type { Locale } from "@/lib/i18n";

const LABEL = { fa: "فروشنده‌ی تأییدشده", en: "Verified seller" };
const HINT = {
  fa: "یک مدیر سایت این فروشنده را شناسایی و تأیید کرده است.",
  en: "A site admin has checked and confirmed this seller.",
};

/** "Verified seller" badge: a check mark in a shield plus the words. `compact` hides the words on tiny cards but keeps them for screen readers. */
export function VerifiedBadge({ lang, compact = false, className }: { lang: Locale; compact?: boolean; className?: string }) {
  return (
    <span className={`vb${compact ? " vb--compact" : ""}${className ? ` ${className}` : ""}`} title={HINT[lang]}>
      <svg className="vb__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
        <path d="M8.5 12l2.5 2.5L15.5 10" />
      </svg>
      <span className={compact ? "vb__text vb__text--sr" : "vb__text"}>{LABEL[lang]}</span>
    </span>
  );
}
