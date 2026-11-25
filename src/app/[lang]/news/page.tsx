import { PageBanner } from "@/components/page-banner";
import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/lib/i18n";
import { NewsClient } from "@/components/news/news-client";
import "@/styles/news.css";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const fa = lang === "fa";
  const title = fa ? "خبر و رویداد" : "News & events";
  const intro = fa ? "خبرها، نوشته‌ها و رویدادهای پیش‌روی سُه." : "News, posts and upcoming events from Soh.";
  return (
    <>
      <PageBanner compact lang={lang} title={title} intro={intro} crumbs={[{ label: fa ? "خانه" : "Home", href: `/${lang}` }, { label: title }]} />
      <div className="wrap nw-page">
        <NewsClient lang={lang} />
      </div>
    </>
  );
}
