import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Blocks } from "@/components/blocks";
import { PhotoStrip } from "@/components/photo-strip";
import { hasLocale, locales } from "@/lib/i18n";
import { sectionBySlug, sections } from "@/lib/site";

export function generateStaticParams() {
  return locales.flatMap((lang) => sections.map((s) => ({ lang, section: s.slug })));
}

async function Content({ params }: { params: PageProps<"/[lang]/[section]">["params"] }) {
  const { lang, section } = await params;
  if (!hasLocale(lang)) notFound();
  const s = sectionBySlug(section);
  if (!s) notFound();
  return (
    <article className="flex flex-col gap-5 pt-6">
      <h1 className="text-3xl font-bold">{s.title[lang]}</h1>
      <p className="text-lg muted">{s.intro[lang]}</p>
      <PhotoStrip section={s.slug} lang={lang} />
      <Blocks blocks={s.blocks} lang={lang} />
    </article>
  );
}

export default function SectionPage({ params }: PageProps<"/[lang]/[section]">) {
  return (
    <Suspense fallback={<div className="pt-6 muted">…</div>}>
      <Content params={params} />
    </Suspense>
  );
}
