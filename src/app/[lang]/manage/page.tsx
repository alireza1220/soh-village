import { PageBanner } from "@/components/page-banner";
import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/lib/i18n";
import { ManageClient } from "@/components/manage-client";
import "@/styles/market.css";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const title = lang === "fa" ? "مدیریت آگهی" : "Manage your listing";
  return (
    <>
      <PageBanner lang={lang} title={title} crumbs={[{ label: lang === "fa" ? "خانه" : "Home", href: `/${lang}` }, { label: title }]} />
      <div className="wrap narrow mk-page">
        <ManageClient lang={lang} />
      </div>
    </>
  );
}
