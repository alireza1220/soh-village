import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/lib/i18n";
import { ManageClient } from "@/components/manage-client";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <article className="wrap narrow pt-10 flex flex-col gap-6">
      <h1 className="text-[clamp(34px,5vw,52px)]">{lang === "fa" ? "مدیریت آگهی با کد" : "Manage a listing with your code"}</h1>
      <ManageClient lang={lang} />
    </article>
  );
}
