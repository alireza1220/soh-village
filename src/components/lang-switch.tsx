"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

/** Switch language and stay on the same page. */
export function LangSwitch({ lang }: { lang: Locale }) {
  const path = usePathname() ?? `/${lang}`;
  const other: Locale = lang === "fa" ? "en" : "fa";
  const rest = path.startsWith(`/${lang}`) ? path.slice(lang.length + 1) : "";
  const href = `/${other}${rest}`;
  return (
    <Link href={href} className="btn btn-ghost" hrefLang={other} lang={other}>
      {other === "fa" ? "فارسی" : "English"}
    </Link>
  );
}
