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
    <article className="wrap pt-10 flex flex-col gap-8">
      <header className="flex flex-col gap-3 max-w-3xl">
        <span className="pill self-start">{lang === "fa" ? "روستای سُه" : "Soh village"}</span>
        <h1 className="text-[clamp(34px,5vw,52px)]">{s.title[lang]}</h1>
        <p className="text-lg muted">{s.intro[lang]}</p>
      </header>
      <PhotoStrip section={s.slug} lang={lang} />
      <div className="narrow w-full"><Blocks blocks={s.blocks} lang={lang} /></div>
    </article>
  );
}

export default function SectionPage({ params }: PageProps<"/[lang]/[section]">) {
  return (
    <Suspense fallback={<div className="wrap pt-10 muted">…</div>}>
      <Content params={params} />
    </Suspense>
  );
}
