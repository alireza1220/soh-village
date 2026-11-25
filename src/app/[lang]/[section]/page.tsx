import "@/styles/pages.css";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Blocks, cardAnchors } from "@/components/blocks";
import { PageBanner, bannerPhoto } from "@/components/page-banner";
import { PhotoStrip } from "@/components/photo-strip";
import { MarketBoard } from "@/components/market-board";
import { AuthGate } from "@/components/auth-gate";
import { ListingForm } from "@/components/listing-form";
import { MediaBlock } from "@/components/media-block";
import { Arrow } from "@/components/icons";
import { illustrationFor } from "@/lib/illustrations";
import { photos } from "@/lib/photos";
import { BOARDS, isBoard } from "@/lib/boards";
import { hasLocale, locales } from "@/lib/i18n";
import { mediaFor, withoutPreviewed } from "@/lib/media";
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
  // Videos and posts as previews; a link in this section's own link list that is now a preview is not shown twice.
  const media = mediaFor(s.slug, lang, s.blocks);
  const blocks = withoutPreviewed(s.blocks, media);
  const anchors = cardAnchors(s.blocks);
  const board = isBoard(s.slug) ? s.slug : null;
  const hasToc = anchors.length >= 4;
  const tocAnchors = media.length > 0 ? [...anchors, { id: `media-${s.slug}`, title: { fa: "ویدیوها و پست‌ها", en: "Videos and posts" } }] : anchors;
  // A real photo of the section wins; else its illustration (labelled); else the region fallback photo.
  const hasOwnPhoto = photos.some((p) => p.section === s.slug);
  const illustration = hasOwnPhoto ? undefined : illustrationFor(s.slug);
  const photo = illustration ? undefined : bannerPhoto(s.slug);
  // The banner uses the section's own first photo; PhotoStrip then skips it so it is not shown twice.
  const bannerIsSectionPhoto = !!photo && photo.section === s.slug;
  return (
    <article>
      <PageBanner
        lang={lang}
        title={s.title[lang]}
        intro={s.intro[lang]}
        photo={photo}
        illustration={illustration}
        crumbs={[{ label: lang === "fa" ? "خانه" : "Home", href: `/${lang}` }, { label: s.title[lang] }]}
      />
      <PhotoStrip section={s.slug} lang={lang} skipFirst={bannerIsSectionPhoto} />
      <div className="section pg-content">
        <div className={`wrap pg-layout${hasToc ? " pg-layout--toc" : ""}`}>
          {hasToc && (
            <nav className="pg-toc" aria-labelledby="pg-toc-title">
              <p id="pg-toc-title" className="eyebrow pg-eyebrow">{lang === "fa" ? "در این صفحه" : "On this page"}</p>
              <ul className="pg-toc__list">
                {tocAnchors.map((a) => <li key={a.id}><a href={`#${a.id}`}>{a.title[lang]}</a></li>)}
              </ul>
            </nav>
          )}
          <div className="pg-main">
            {board && <MarketBoard lang={lang} board={board} />}
            {board && (
              <p className="brd-myads">
                <Link className="link-arrow" href={`/${lang}/my`}>
                  {lang === "fa" ? "آگهی‌های من" : "My ads"} <Arrow />
                </Link>
              </p>
            )}
            <Blocks blocks={blocks} lang={lang} />
            <MediaBlock section={s.slug} lang={lang} items={media} />
            {board && (
              <section className="pg-form" aria-labelledby="pg-form-title">
                <h2 id="pg-form-title" className="pg-form__title">{BOARDS[board].formTitle[lang]}</h2>
                <AuthGate lang={lang} reason="post" next={`/${lang}/${board}#pg-form-title`}>
                  <ListingForm board={board} lang={lang} />
                </AuthGate>
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
