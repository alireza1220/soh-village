import "@/styles/pages.css";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Blocks, cardAnchors } from "@/components/blocks";
import { PageBanner, bannerPhoto } from "@/components/page-banner";
import { PhotoStrip } from "@/components/photo-strip";
import { MarketBoard } from "@/components/market-board";
import { MarketForm } from "@/components/market-form";
import { PostForm } from "@/components/post-form";
import { SocialForSection } from "@/components/social-embeds";
import { YoutubeForSection } from "@/components/youtube-list";
import { Arrow } from "@/components/icons";
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
  const hasToc = anchors.length >= 4;
  const photo = bannerPhoto(s.slug);
  // The banner uses the section's own first photo; PhotoStrip then skips it so it is not shown twice.
  const bannerIsSectionPhoto = !!photo && photo.section === s.slug;
  return (
    <article>
      <PageBanner
        lang={lang}
        title={s.title[lang]}
        intro={s.intro[lang]}
        photo={photo}
        crumbs={[{ label: lang === "fa" ? "خانه" : "Home", href: `/${lang}` }, { label: s.title[lang] }]}
      />
      <PhotoStrip section={s.slug} lang={lang} skipFirst={bannerIsSectionPhoto} />
      <div className="section pg-content">
        <div className={`wrap pg-layout${hasToc ? " pg-layout--toc" : ""}`}>
          {hasToc && (
            <nav className="pg-toc" aria-labelledby="pg-toc-title">
              <p id="pg-toc-title" className="eyebrow pg-eyebrow">{lang === "fa" ? "در این صفحه" : "On this page"}</p>
              <ul className="pg-toc__list">
                {anchors.map((a) => <li key={a.id}><a href={`#${a.id}`}>{a.title[lang]}</a></li>)}
              </ul>
            </nav>
          )}
          <div className="pg-main">
            {s.slug === "market" && <MarketBoard lang={lang} />}
            {s.slug === "market" && (
              <p>
                <Link className="link-arrow" href={`/${lang}/manage`}>
                  {lang === "fa" ? "مدیریت آگهی با کد" : "Manage a listing with your code"} <Arrow />
                </Link>
              </p>
            )}
            <Blocks blocks={s.blocks} lang={lang} />
            <YoutubeForSection section={s.slug} lang={lang} />
            <SocialForSection section={s.slug} lang={lang} />
            {s.slug === "market" && (
              <section className="pg-form" aria-labelledby="pg-form-title">
                <h2 id="pg-form-title" className="pg-form__title">{lang === "fa" ? "آگهی خود را بنویسید" : "Write your listing"}</h2>
                <MarketForm lang={lang} />
              </section>
            )}
            {(s.slug === "needs" || s.slug === "careers") && (
              <section className="pg-form" aria-labelledby="pg-form-title">
                <h2 id="pg-form-title" className="pg-form__title">{lang === "fa" ? (s.slug === "needs" ? "نیاز یا پیشنهاد خود را بنویسید" : "آگهی کاری خود را بنویسید") : s.slug === "needs" ? "Write your request or offer" : "Write your job post"}</h2>
                <PostForm kind={s.slug as "needs" | "careers"} lang={lang} />
              </section>
            )}
          </div>
        </div>
      </div>
      <section className="section section--mist section--tight pg-pager-band">
        <div className="wrap">
          <nav aria-label={lang === "fa" ? "بخش‌های دیگر" : "Other sections"}>
            <p className="eyebrow pg-eyebrow">{lang === "fa" ? "بخش‌های دیگر" : "More from the guide"}</p>
            <div className="pg-pager">
              {prev ? (
                <Link href={`/${lang}/${prev.slug}`} className="pg-pager__link" rel="prev">
                  <span className="pg-pager__label"><Arrow className="pg-flip" />{lang === "fa" ? "بخش پیش" : "Previous"}</span>
                  <span className="pg-pager__title">{prev.title[lang]}</span>
                </Link>
              ) : <span />}
              {next ? (
                <Link href={`/${lang}/${next.slug}`} className="pg-pager__link pg-pager__link--next" rel="next">
                  <span className="pg-pager__label">{lang === "fa" ? "بخش بعد" : "Next"}<Arrow /></span>
                  <span className="pg-pager__title">{next.title[lang]}</span>
                </Link>
              ) : <span />}
            </div>
          </nav>
        </div>
      </section>
    </article>
  );
}

export default function SectionPage({ params }: PageProps<"/[lang]/[section]">) {
  return (
    <Suspense fallback={<div className="pg-skeleton" aria-hidden="true" />}>
      <Content params={params} />
    </Suspense>
  );
}
