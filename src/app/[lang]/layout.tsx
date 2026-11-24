import type { Metadata } from "next";
import { Fraunces, Inter, Vazirmatn } from "next/font/google";
import { notFound } from "next/navigation";
import Link from "next/link";
import "../globals.css";
import { dirOf, hasLocale, locales } from "@/lib/i18n";
import { sections, siteName } from "@/lib/site";
import { AuthLink } from "@/components/auth-link";

const inter = Inter({ variable: "--font-body", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-serif", subsets: ["latin"] });
const vazir = Vazirmatn({ variable: "--font-fa", subsets: ["arabic", "latin"] });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return {
    title: siteName[lang],
    description: lang === "fa" ? "روستای سُه، استان اصفهان: تاریخ، گردشگری، اقامت و بیشتر." : "Soh village, Isfahan: history, tourism, where to stay and more.",
  };
}

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const other = lang === "fa" ? "en" : "fa";
  const main = sections.slice(0, 5);
  const more = [
    ...sections.slice(5).map((s) => ({ href: `/${lang}/${s.slug}`, label: s.title[lang] })),
    { href: `/${lang}/map`, label: lang === "fa" ? "نقشه" : "Map" },
    { href: `/${lang}/photos`, label: lang === "fa" ? "عکس‌ها" : "Photos" },
  ];
  const all = [...main.map((s) => ({ href: `/${lang}/${s.slug}`, label: s.title[lang] })), ...more];
  const contributeLabel = lang === "fa" ? "مشارکت" : "Contribute";
  return (
    <html lang={lang} dir={dirOf(lang)} className={`${inter.variable} ${fraunces.variable} ${vazir.variable}`}>
      <body lang={lang} className="min-h-screen flex flex-col">
        <header className="site-header">
          <div className="wrap flex items-center justify-between gap-3 py-3">
            <Link href={`/${lang}`} className="flex items-center gap-2.5">
              <span lang="fa" className="fa-display text-3xl font-bold leading-none" style={{ color: "var(--apple)" }}>سُه</span>
              <span className="font-semibold hidden sm:inline">{siteName[lang]}</span>
            </Link>
            <nav className="nav hidden lg:flex items-center gap-1" aria-label={lang === "fa" ? "بخش‌ها" : "Sections"}>
              {main.map((s) => <Link key={s.slug} href={`/${lang}/${s.slug}`}>{s.title[lang]}</Link>)}
              <details className="relative">
                <summary className="cursor-pointer list-none px-3 py-1.5 rounded-lg text-[15px] muted hover:bg-[var(--chip)]">{lang === "fa" ? "بیشتر" : "More"} ▾</summary>
                <div className="menu card absolute end-0 mt-2 flex flex-col p-2 min-w-48 z-30">
                  {more.map((m) => <Link key={m.href} href={m.href}>{m.label}</Link>)}
                </div>
              </details>
            </nav>
            <div className="flex items-center gap-2">
              <Link href={`/${other}`} className="btn btn-ghost" hrefLang={other} lang={other}>{other === "fa" ? "فارسی" : "English"}</Link>
              <AuthLink lang={lang} className="btn btn-ghost hidden sm:inline-flex" />
              <Link href={`/${lang}/contribute`} className="btn btn-primary hidden sm:inline-flex">{contributeLabel}</Link>
              <details className="relative lg:hidden">
                <summary className="btn btn-ghost cursor-pointer list-none" aria-label={lang === "fa" ? "منو" : "Menu"}>☰</summary>
                <div className="menu card absolute end-0 mt-2 flex flex-col p-2 min-w-56 z-30 max-h-[70vh] overflow-auto">
                  {all.map((m) => <Link key={m.href} href={m.href}>{m.label}</Link>)}
                  <Link href={`/${lang}/contribute`}>{contributeLabel}</Link>
                  <AuthLink lang={lang} className="" />
                </div>
              </details>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-16 border-t" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <div className="wrap py-10 grid gap-8" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
            <div className="flex flex-col gap-2">
              <span lang="fa" className="fa-display text-4xl font-bold leading-none" style={{ color: "var(--apple)" }}>سُه</span>
              <p className="text-sm muted max-w-xs">{lang === "fa" ? "پیش‌نویس ساخته‌شده از منابع عمومی اینترنت. برچسب‌ها نشان می‌دهند هر مطلب چقدر پشتوانه دارد." : "A draft built from public web sources. Labels show how well each fact is backed."}</p>
            </div>
            <ul className="list-none p-0 m-0 flex flex-col gap-1 text-sm">
              {all.map((m) => <li key={m.href}><Link className="muted hover:underline" href={m.href}>{m.label}</Link></li>)}
            </ul>
            <ul className="list-none p-0 m-0 flex flex-col gap-1 text-sm">
              <li><Link className="muted hover:underline" href={`/${lang}/contribute`}>{contributeLabel}</Link></li>
              <li><AuthLink lang={lang} className="muted hover:underline" /></li>
              <li><Link className="muted hover:underline" href={`/${lang}/manage`}>{lang === "fa" ? "مدیریت آگهی با کد" : "Manage a listing with your code"}</Link></li>
              <li><Link className="muted hover:underline" href={`/${lang}/credits`}>{lang === "fa" ? "منبع عکس‌ها و مجوزها" : "Photo credits and licences"}</Link></li>
            </ul>
          </div>
        </footer>
      </body>
    </html>
  );
}
