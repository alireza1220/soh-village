import type { Metadata } from "next";
import { Inter, Space_Grotesk, Vazirmatn } from "next/font/google";
import { notFound } from "next/navigation";
import Link from "next/link";
import "../globals.css";
import { dirOf, hasLocale, locales } from "@/lib/i18n";
import { sections, siteName } from "@/lib/site";

const inter = Inter({ variable: "--font-body", subsets: ["latin"] });
const grotesk = Space_Grotesk({ variable: "--font-head", subsets: ["latin"] });
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
  return (
    <html lang={lang} dir={dirOf(lang)} className={`${inter.variable} ${grotesk.variable} ${vazir.variable}`}>
      <body lang={lang} className="min-h-screen flex flex-col">
        <header className="wrap w-full py-4 flex flex-wrap items-center gap-x-4 gap-y-2 justify-between">
          <Link href={`/${lang}`} className="font-bold text-lg" style={{ fontFamily: "var(--font-head), var(--font-fa)" }}>
            {siteName[lang]}
          </Link>
          <Link href={`/${other}`} className="link text-sm" hrefLang={other} lang={other}>
            {other === "fa" ? "فارسی" : "English"}
          </Link>
          <nav className="nav w-full flex flex-wrap gap-1" aria-label={lang === "fa" ? "بخش‌ها" : "Sections"}>
            {sections.map((s) => (
              <Link key={s.slug} href={`/${lang}/${s.slug}`}>{s.title[lang]}</Link>
            ))}
            <Link href={`/${lang}/photos`}>{lang === "fa" ? "عکس‌ها" : "Photos"}</Link>
            <Link href={`/${lang}/contact`}>{lang === "fa" ? "تماس" : "Contact"}</Link>
          </nav>
        </header>
        <main className="wrap w-full flex-1 pb-14">{children}</main>
        <footer className="wrap w-full pb-10 text-sm muted">
          {lang === "fa"
            ? "پیش‌نویس ساخته‌شده از منابع عمومی اینترنت. برچسب‌ها نشان می‌دهند هر مطلب چقدر پشتوانه دارد."
            : "A draft built from public web sources. Labels show how well each fact is backed."}
        </footer>
      </body>
    </html>
  );
}
