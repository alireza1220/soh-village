import { PageBanner } from "@/components/page-banner";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale, locales } from "@/lib/i18n";
import { AdminApp } from "@/components/admin/admin-app";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const title = lang === "fa" ? "مدیریت" : "Admin";
  return (
    <>
      <PageBanner compact lang={lang} title={title} crumbs={[{ label: lang === "fa" ? "خانه" : "Home", href: `/${lang}` }, { label: title }]} />
      <div className="wrap mk-page">
        <AdminApp lang={lang} />
      </div>
    </>
  );
}
