import type { Metadata } from "next";
import { Fraunces, Poppins, Vazirmatn } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { dirOf, hasLocale, locales } from "@/lib/i18n";
import { ui } from "@/lib/nav";
import { siteName } from "@/lib/site";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const poppins = Poppins({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const fraunces = Fraunces({ variable: "--font-serif", subsets: ["latin"], weight: ["600"], display: "swap" });
const vazir = Vazirmatn({ variable: "--font-fa", subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], display: "swap" });

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
  return (
    <html lang={lang} dir={dirOf(lang)} className={`${poppins.variable} ${fraunces.variable} ${vazir.variable}`}>
      <body lang={lang} className="min-h-screen flex flex-col">
        <a href="#main" className="skip-link">{ui.skip[lang]}</a>
        <SiteHeader lang={lang} />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
        <SiteFooter lang={lang} />
      </body>
    </html>
  );
}
