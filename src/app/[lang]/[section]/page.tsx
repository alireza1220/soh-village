import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Blocks, cardAnchors } from "@/components/blocks";
import { PhotoStrip } from "@/components/photo-strip";
import { MarketBoard } from "@/components/market-board";
import { MarketForm } from "@/components/market-form";
import Link from "next/link";
import { PostForm } from "@/components/post-form";
import { SocialForSection } from "@/components/social-embeds";
import { YoutubeForSection } from "@/components/youtube-list";
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
  const index = sections.findIndex((item) => item.slug === s.slug);
  const prev = index > 0 ? sections[index - 1] : undefined;
  const next = index >= 0 && index < sections.length - 1 ? sections[index + 1] : undefined;
  const anchors = cardAnchors(s.blocks);
  return (
    <article className="wrap pt-10 flex flex-col gap-8">
      <header className="flex flex-col gap-3 max-w-3xl">
        <span className="pill self-start">{lang === "fa" ? "روستای سُه" : "Soh village"}</span>
        <h1 className="text-[clamp(34px,5vw,52px)]">{s.title[lang]}</h1>
        <p className="text-lg muted">{s.intro[lang]}</p>
        {anchors.length >= 4 && (
          <nav className="flex flex-wrap gap-2" aria-label={lang === "fa" ? "در این صفحه" : "On this page"}>
            {anchors.map((a) => <a key={a.id} className="tag" href={`#${a.id}`}>{a.title[lang]}</a>)}
          </nav>
        )}
      </header>
      <PhotoStrip section={s.slug} lang={lang} />
      <div className="narrow w-full flex flex-col gap-8">
        {s.slug === "market" && <MarketBoard lang={lang} />}
        {s.slug === "market" && (
          <p className="text-sm"><Link className="link" href={`/${lang}/manage`}>{lang === "fa" ? "مدیریت آگهی با کد" : "Manage a listing with your code"}</Link></p>
        )}
        <Blocks blocks={s.blocks} lang={lang} />
        <YoutubeForSection section={s.slug} lang={lang} />
        <SocialForSection section={s.slug} lang={lang} />
        {s.slug === "market" && (
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl">{lang === "fa" ? "آگهی خود را بنویسید" : "Write your listing"}</h2>
            <MarketForm lang={lang} />
          </section>
        )}
        {(s.slug === "needs" || s.slug === "careers") && (
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl">{lang === "fa" ? (s.slug === "needs" ? "نیاز یا پیشنهاد خود را بنویسید" : "آگهی کاری خود را بنویسید") : s.slug === "needs" ? "Write your request or offer" : "Write your job post"}</h2>
            <PostForm kind={s.slug as "needs" | "careers"} lang={lang} />
          </section>
        )}
      </div>
      <nav className="section-pager" aria-label={lang === "fa" ? "بخش‌های دیگر" : "Other sections"}>
        {prev ? (
          <Link href={`/${lang}/${prev.slug}`} className="pager-link">
            <span className="text-sm muted">{lang === "fa" ? "بخش پیش" : "Previous"}</span>
            <span className="font-semibold">{prev.title[lang]}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/${lang}/${next.slug}`} className="pager-link pager-next">
            <span className="text-sm muted">{lang === "fa" ? "بخش بعد" : "Next"}</span>
            <span className="font-semibold">{next.title[lang]}</span>
          </Link>
        ) : <span />}
      </nav>
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
