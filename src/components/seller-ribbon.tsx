import type { Locale } from "@/lib/i18n";
import { VerifiedBadge } from "./verified-badge";

const UNVERIFIED = { fa: "تأیید نشده توسط مدیر", en: "Not verified by admin" };
const CAUTION = {
  fa: "این آگهی بدون بررسی منتشر شده است. با احتیاط عمل کنید: در جای عمومی قرار بگذارید و پیش از دیدن کالا پولی پیش‌پرداخت نکنید.",
  en: "This ad was published without a check. Be careful: meet in a public place and do not pay in advance.",
};

/** Top ribbon of a public ad: the verified-seller badge when an admin confirmed the poster, otherwise a calm "Not verified by admin" note. */
export function SellerRibbon({ verified, lang, className }: { verified?: boolean; lang: Locale; className?: string }) {
  return (
    <p className={`sr-ribbon${className ? ` ${className}` : ""}`}>
      {verified
        ? <VerifiedBadge lang={lang} />
        : <span className="sr-ribbon__t">
            <svg className="sr-ribbon__i" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></svg>
            {UNVERIFIED[lang]}
          </span>}
    </p>
  );
}

/** Short caution under the detail dialog title; only for ads of unverified posters. */
export function SellerCaution({ lang }: { lang: Locale }) {
  return <p className="sr-caution">{CAUTION[lang]}</p>;
}
