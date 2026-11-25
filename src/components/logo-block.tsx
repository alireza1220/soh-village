import Link from "next/link";
import type { Locale } from "@/lib/i18n";

// Emblem: Persian wordmark over a tiny "SOH". dark (default) = white wordmark on deep teal, used in the header and footer.
// tone="light" = apple-red wordmark on white, for light backgrounds. hang (header only) lets it overlap the hero by 14px.
export function LogoBlock({ lang, tone = "dark", flat = false, label }: { lang: Locale; tone?: "dark" | "light"; flat?: boolean; label: string }) {
  const cls = `logo-block${tone === "light" ? " logo-block--light" : ""}${flat ? " logo-block--flat" : ""}`;
  return (
    <Link href={`/${lang}`} className={cls} aria-label={label}>
      <span lang="fa" dir="rtl" className="logo-block__mark" aria-hidden="true">سُه</span>
      <span className="logo-block__sub" lang="en" aria-hidden="true">SOH</span>
    </Link>
  );
}
