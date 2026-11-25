import { PageBanner } from "@/components/page-banner";
import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/lib/i18n";
import { LoginClient } from "@/components/login-client";
import "@/styles/market.css";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const title = lang === "fa" ? "ورود" : "Log in";
  return (
    <>
      <PageBanner lang={lang} title={title} crumbs={[{ label: lang === "fa" ? "خانه" : "Home", href: `/${lang}` }, { label: title }]} />
      <div className="wrap narrow mk-page">
        <LoginClient lang={lang} />
      </div>
    </>
  );
}
