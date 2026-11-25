import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/home.css";
import "@/styles/news.css";
import { Credit } from "@/components/credit";
import { HeroSlideshow, type HeroSlide } from "@/components/home/hero-slideshow";
import { MarketTeaser } from "@/components/home/market-teaser";
import { YearList } from "@/components/home/year-list";
import { Arrow } from "@/components/icons";
import { VillageMap } from "@/components/map";
import { LatestAds } from "@/components/home/latest-ads";
import { HomeFeatured } from "@/components/news/home-featured";
import { HomeNews } from "@/components/news/home-news";
import { HomeUrgent } from "@/components/news/home-urgent";
import { SectionMark } from "@/components/section-mark";
import {
  entriesLabel, entryCount, findCard, hc, heroFiles, photoOf, planCards, statusLabel, yearRows,
} from "@/lib/home-content";
import { dirOf, hasLocale } from "@/lib/i18n";
import { illustrationFor, illustrationSrc } from "@/lib/illustrations";
import { LISTING_CATEGORIES, LISTING_TYPES } from "@/lib/market";
import { population, sectionBySlug, sections, siteName, stats } from "@/lib/site";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dir = dirOf(lang);
  const href = (slug: string) => `/${lang}/${slug}`;
  const sec = (slug: string) => sectionBySlug(slug);

  // Hero: only photos registered in photos.ts, so credit and licence are always known.
  const heroPhotos = heroFiles.map((f) => photoOf(f)).filter((p): p is NonNullable<typeof p> => !!p).slice(0, 4);
  const slides: HeroSlide[] = heroPhotos.map((p) => ({
    src: `/photos/${p.file}`, alt: p.alt[lang], caption: p.caption[lang], credit: <Credit p={p} lang={lang} light />,
  }));

  const opening = photoOf("opening.jpg");
  const mountain = photoOf("karkas-mountain.jpg");
  const traditionsPhoto = photoOf("nakhl-gardani-mehriz.jpg", "karkas-peak.jpg");

  // Big picture cards: History, Sights, Traditions.
  const cardDefs: { slug: string; photo?: typeof opening }[] = [
    { slug: "history", photo: opening },
    { slug: "tourism", photo: mountain },
    { slug: "traditions", photo: traditionsPhoto },
  ];
  const exploreCards = cardDefs.flatMap((d) => {
    const s = sec(d.slug);
    if (!s || !d.photo) return [];
    return [{ slug: d.slug, title: s.title[lang], count: entriesLabel(entryCount(d.slug), lang), photo: d.photo }];
  });

  // Village-year rows and featured cards (text restated from existing sourced entries in site.ts).
  const yearItems = yearRows.map((r) => ({
    id: r.id, filters: r.filters, big: r.big[lang], small: r.small[lang], title: r.title[lang], text: r.text[lang],
    source: r.source[lang], sourceLabel: hc.sourceLabel[lang], wordy: r.wordy,
    href: r.section === "population" ? "#population" : href(r.section),
  }));
  const yearFilters = [
    { id: "all", label: hc.fAll[lang] }, { id: "traditions", label: hc.fTraditions[lang] },
    { id: "seasons", label: hc.fSeasons[lang] }, { id: "visit", label: hc.fVisit[lang] },
  ];
  const tasua = findCard("traditions", "Tasua palm carrying");
  const caravanserai = (["history", "tourism"] as const).map((s) => findCard(s, "Soh Caravanserai")).find(Boolean);
  const features = [
    { key: "traditions", slug: "traditions", button: hc.cardTraditions[lang], photo: photoOf("nakhl-gardani-mehriz.jpg"), title: tasua?.title[lang] ?? sec("traditions")?.title[lang] ?? "", text: tasua?.text[lang] ?? sec("traditions")?.intro[lang] ?? "", status: tasua?.status, source: tasua?.source, ill: illustrationFor("tasua") },
    { key: "history", slug: "history", button: hc.cardHistory[lang], photo: opening, title: caravanserai?.title[lang] ?? sec("history")?.title[lang] ?? "", text: caravanserai?.text[lang] ?? sec("history")?.intro[lang] ?? "", status: caravanserai?.status, source: caravanserai?.source, ill: undefined },
  ];

  // Guide cards: History, Words and dialect, Resources.
  const guide = [
    { slug: "history", chip: { fa: "تاریخ", en: "History" }, photo: opening },
    { slug: "words", chip: { fa: "زبان", en: "Language" }, photo: undefined },
    { slug: "resources", chip: { fa: "منابع", en: "Sources" }, photo: undefined },
  ];

  const max = Math.max(...population.map((p) => p.people));
  const typeSell = LISTING_TYPES.find((o) => o.v === "sell")?.[lang] ?? "";
  const catFruit = LISTING_CATEGORIES.find((o) => o.v === "fruit")?.[lang] ?? "";

  return (
    <>
      <h1 className="sr-only">{siteName[lang]}</h1>

      {/* URGENT NEWS: main priority, very top (renders nothing when none) */}
      <HomeUrgent lang={lang} />

      {slides.length > 0 && (
        <HeroSlideshow
          slides={slides}
          numLocale={lang === "fa" ? "fa-IR" : "en-US"}
          labels={{ region: hc.heroLabel[lang], pause: hc.pause[lang], play: hc.play[lang], slide: hc.slide[lang], of: hc.slideOf[lang], goTo: hc.goTo[lang] }}
        />
      )}

      {/* WELCOME */}
      <section className="section section--sage hm-welcome" aria-labelledby="hm-welcome-title">
        <div className="wrap hm-welcome__grid">
          <div className="panel hm-welcome__panel">
            <p className="eyebrow">{hc.welcomeEyebrow[lang]}</p>
            <h2 id="hm-welcome-title" className="hm-display">{hc.welcomeTitle[lang]}</h2>
            <p>{hc.welcomeP1[lang]}</p>
            <p>{hc.welcomeP2[lang]}</p>
          </div>
          {opening && (
            <div className="hm-welcome__photo">
              <div className="media-wrap">
                <div className="media hm-welcome__media">
                  <Image src={`/photos/${opening.file}`} alt={opening.alt[lang]} fill sizes="(max-width: 1023px) 100vw, 480px" className="object-cover" />
                </div>
                <p className="hm-welcome__credit"><Credit p={opening} lang={lang} light /></p>
                <Link href={href("history")} className="btn btn--primary btn-corner">{hc.welcomeCta[lang]}</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* EXPLORE + PLAN YOUR VISIT: picture cards */}
      <section className="section" aria-labelledby="hm-explore-title">
        <div className="wrap hm-explore">
          <h2 id="hm-explore-title" className="sr-only">{hc.exploreEyebrow[lang]}</h2>
          <ul className="hm-explore__main">
            {exploreCards.map((c) => (
              <li key={c.slug}>
                <Link href={href(c.slug)} className="hm-tile hm-tile--big">
                  <Image src={`/photos/${c.photo.file}`} alt={c.photo.alt[lang]} fill sizes="(max-width: 767px) 100vw, 400px" className="hm-tile__img" />
                  <span className="hm-tile__text">
                    <span className="hm-tile__title">{c.title}</span>
                    <span className="hm-tile__meta">{c.count}</span>
                  </span>
                </Link>
                <p className="hm-credit"><Credit p={c.photo} lang={lang} /></p>
              </li>
            ))}
          </ul>
          <h3 id="hm-plan-title" className="eyebrow hm-plan__title">{hc.planEyebrow[lang]}</h3>
          <ul className="hm-explore__plan" aria-labelledby="hm-plan-title">
            {planCards.map((c) => {
              const ill = c.ill ? illustrationFor(c.ill) : undefined;
              return (
                <li key={c.slug}>
                  <Link href={href(c.slug)} className="hm-tile">
                    {ill ? (
                      <Image src={illustrationSrc(ill)} alt="" fill sizes="(max-width: 767px) 50vw, 240px" className="hm-tile__img" />
                    ) : (
                      <span className="hm-tile__mark" aria-hidden="true"><SectionMark slug={c.mark ?? c.slug} /></span>
                    )}
                    <span className="hm-tile__text">
                      <span className="hm-tile__title">{c.title[lang]}</span>
                      <span className="hm-tile__meta">{c.text[lang]}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href={href("tourism")} className="link-arrow">{hc.planViewAll[lang]} <Arrow /></Link>
        </div>
      </section>

      {/* FEATURED POSTS: second priority band (renders nothing when none) */}
      <HomeFeatured lang={lang} />

      {/* NEWS AND EVENTS (renders nothing when nothing is published) */}
      <HomeNews lang={lang} />

      {/* VILLAGE YEAR */}
      <section className="section section--mist" aria-labelledby="hm-year-title">
        <div className="wrap">
          <div className="hm-head">
            <p className="eyebrow">{hc.yearEyebrow[lang]}</p>
            <h2 id="hm-year-title" className="hm-display hm-section-h">{hc.yearTitle[lang]}</h2>
            <p className="muted hm-head__intro">{hc.yearIntro[lang]}</p>
          </div>
          <div className="hm-year">
            <div className="hm-year__features">
              {features.map((f) => (
                <article key={f.key} className="feature-card">
                  <div className="media-wrap">
                    <div className="media" style={{ "--ar": "16 / 10" } as React.CSSProperties}>
                      {f.photo ? (
                        <Image src={`/photos/${f.photo.file}`} alt={f.photo.alt[lang]} fill sizes="(max-width: 1023px) 100vw, 600px" className="object-cover" />
                      ) : f.ill ? (
                        <>
                          <Image src={illustrationSrc(f.ill)} alt={f.ill.alt[lang]} fill sizes="(max-width: 1023px) 100vw, 600px" className="object-cover" />
                        </>
                      ) : (
                        <div className="hm-card__placeholder"><SectionMark slug={f.slug} /></div>
                      )}
                    </div>
                    <Link href={href(f.slug)} className="btn btn--primary btn-corner">{f.button}</Link>
                  </div>
                  {f.photo && <p className="hm-credit"><Credit p={f.photo} lang={lang} /></p>}
                  <h3>{f.title}</h3>
                  <p className="hm-clamp">{f.text}</p>
                  {(f.status || f.source) && (
                    <p className="hm-source">
                      {statusLabel(f.status, lang) && <span className="tag">{statusLabel(f.status, lang)}</span>}
                      {f.source && <span> {hc.sourceLabel[lang]}: {f.source}</span>}
                    </p>
                  )}
                </article>
              ))}
            </div>
            <YearList
              items={yearItems} filters={yearFilters} dir={dir} label={hc.filterLabel[lang]}
              showing={hc.showing[lang]} of={hc.showingOf[lang]}
            />
          </div>
        </div>
      </section>

      {/* VILLAGE MARKET */}
      <section className="section" aria-labelledby="hm-market-title">
        <div className="wrap">
          <div className="hm-head">
            <p className="eyebrow">{hc.marketEyebrow[lang]}</p>
            <h2 id="hm-market-title" className="hm-display hm-section-h">{hc.marketTitle[lang]}</h2>
            <p className="muted hm-head__intro">{hc.marketIntro[lang]}</p>
          </div>
          <MarketTeaser
            lang={lang} href={href("market")}
            labels={{
              empty: hc.marketEmpty[lang], example: hc.marketExample[lang], exampleTitle: hc.marketExampleTitle[lang], exampleMeta: hc.marketExampleMeta[lang],
              readMore: hc.readMore[lang], area: hc.area[lang], until: hc.until[lang], typeSell, catFruit,
            }}
          />
          <div className="hm-actions">
            <Link href={href("market")} className="btn btn--primary">{hc.marketCta[lang]}</Link>
            <Link href={href("needs")} className="link-arrow">{hc.marketPost[lang]} <Arrow /></Link>
          </div>
        </div>
      </section>

      {/* WHAT IS NEW: newest ads of the four boards */}
      <LatestAds lang={lang} />

      {/* FROM THE GUIDE */}
      <section className="section section--mist" aria-labelledby="hm-guide-title">
        <div className="wrap">
          <div className="hm-head">
            <p className="eyebrow">{hc.guideEyebrow[lang]}</p>
            <h2 id="hm-guide-title" className="hm-display hm-section-h">{hc.guideTitle[lang]}</h2>
          </div>
          <ul className="hm-cards">
            {guide.map((g) => {
              const s = sec(g.slug);
              if (!s) return null;
              return (
                <li key={g.slug}>
                  <article className="post-card hm-card">
                    <div className="media hm-card__img" style={{ "--ar": "16 / 10" } as React.CSSProperties}>
                      {g.photo ? (
                        <Image src={`/photos/${g.photo.file}`} alt={g.photo.alt[lang]} fill sizes="(max-width: 767px) 100vw, 400px" className="object-cover" />
                      ) : illustrationFor(g.slug) ? (
                        <>
                          <Image src={illustrationSrc(illustrationFor(g.slug)!)} alt={illustrationFor(g.slug)!.alt[lang]} fill sizes="(max-width: 767px) 100vw, 400px" className="object-cover" />
                        </>
                      ) : (
                        <div className="hm-card__placeholder"><SectionMark slug={g.slug} /></div>
                      )}
                    </div>
                    <div className="post-card__body">
                      <p className="post-card__meta"><span className="tag">{g.chip[lang]}</span></p>
                      <h3>{s.title[lang]}</h3>
                      <p>{s.intro[lang]}</p>
                      {g.photo && <p className="hm-credit"><Credit p={g.photo} lang={lang} /></p>}
                      <Link href={href(g.slug)} className="link-arrow hm-card__more">{hc.readMore[lang]} <Arrow /></Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
          <div className="hm-actions">
            <Link href={href("references")} className="btn btn--dark">{hc.guideAll[lang]}</Link>
          </div>
          <nav aria-label={hc.allSections[lang]} className="hm-allsections">
            <p className="eyebrow">{hc.allSections[lang]}</p>
            <ul>
              {sections.map((s) => (
                <li key={s.slug}><Link href={href(s.slug)} className="chip hm-chip">{s.title[lang]}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* MAP + POPULATION */}
      <section className="section" aria-labelledby="hm-glance-title">
        <div className="wrap">
          <div className="hm-head">
            <p className="eyebrow">{hc.glanceEyebrow[lang]}</p>
            <h2 id="hm-glance-title" className="hm-display hm-section-h">{siteName[lang]}</h2>
          </div>
          <ul className="hm-stats">
            {stats.map((s) => (
              <li key={s.k.en}>
                <b>{s.v[lang]}</b>
                <span className="muted">{s.k[lang]}</span>
              </li>
            ))}
          </ul>
          <div className="split hm-glance">
            <div className="panel hm-glance__panel">
              <h3 className="hm-panel-h">{hc.mapTitle[lang]}</h3>
              <VillageMap lang={lang} />
            </div>
            <div className="panel hm-glance__panel" id="population">
              <h3 className="hm-panel-h">{hc.popTitle[lang]}</h3>
              <div className="hm-bars" role="img" aria-label={population.map((p) => `${p.year}: ${p.people}`).join(", ")}>
                {population.map((p) => (
                  <div key={p.year} className="hm-bar">
                    <div className="hm-bar__row"><b dir="ltr">{p.year}</b><span>{p.people} · {p.households} {hc.households[lang]}</span></div>
                    <div className="hm-bar__track"><div className="hm-bar__fill" style={{ width: `${Math.round((p.people / max) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
              <p className="hm-panel-note">{hc.popNote[lang]}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="section section--action hm-cta" aria-labelledby="hm-cta-title">
        <div className="wrap hm-cta__inner">
          <div>
            <h2 id="hm-cta-title" className="hm-display">{hc.ctaTitle[lang]}</h2>
            <p>{hc.ctaText[lang]}</p>
          </div>
          <Link href={href("contribute")} className="btn btn--light">{hc.ctaButton[lang]}</Link>
        </div>
      </section>
    </>
  );
}
