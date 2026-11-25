import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export type Crumb = { label: string; href?: string };

// Breadcrumb trail for inner pages. The last item is the current page. Sits on a dark banner (.page-banner).
export function Breadcrumb({ items, lang }: { items: Crumb[]; lang: Locale }) {
  return (
    <nav aria-label={lang === "fa" ? "مسیر صفحه" : "Breadcrumb"}>
      <ol className="breadcrumb">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${i}-${c.label}`}>
              {c.href && !last ? <Link href={c.href}>{c.label}</Link> : <span aria-current={last ? "page" : undefined}>{c.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
