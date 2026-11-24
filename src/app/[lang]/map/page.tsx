import { notFound } from "next/navigation";
import { VillageMap } from "@/components/map";
import { hasLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function MapPage({ params }: PageProps<"/[lang]/map">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <article className="flex flex-col gap-5 pt-6">
      <h1 className="text-3xl font-bold">{lang === "fa" ? "نقشه" : "Map"}</h1>
      <VillageMap lang={lang} />
    </article>
  );
}
