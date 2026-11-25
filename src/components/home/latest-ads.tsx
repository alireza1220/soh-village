"use client";
import Link from "next/link";
import { Arrow } from "@/components/icons";
import { BOARD_IDS, BOARDS, categoryLabel, typeLabel, type BoardId } from "@/lib/boards";
import type { L, Locale } from "@/lib/i18n";
import { useLatestListings } from "@/lib/use-latest-listings";

const T = {
  eyebrow: { fa: "تازه‌ها", en: "What's new" },
  title: { fa: "تازه‌ها در روستا", en: "What is new in the village" },
  intro: { fa: "تازه‌ترین آگهی‌های بازارچه، نیازمندی‌ها، فرصت‌های شغلی و ملک. روی هر آگهی بزنید تا کامل ببینید.", en: "The newest ads from the market, needs, careers and property boards. Open one to see it in full." },
  loading: { fa: "در حال بارگذاری آگهی‌ها…", en: "Loading ads…" },
  none: { fa: "هنوز آگهی‌ای نیست. اولین نفر باشید.", en: "No ads yet. Be the first to post." },
  all: { fa: "همه‌ی آگهی‌ها در", en: "See all in" },
  post: { fa: "آگهی بگذارید", en: "Post an ad" },
  strip: { fa: "تازه‌ترین آگهی‌های", en: "Newest ads in" },
} satisfies Record<string, L>;

const ORDER: BoardId[] = ["market", "needs", "careers", "property"];

/** Home preview of the newest ads of the four boards. Renders nothing on error. */
export function LatestAds({ lang }: { lang: Locale }) {
  const { ads, status } = useLatestListings();
  if (status === "error") return null;
  const loading = status === "loading";
  return (
    <section className="section hm-latest" aria-labelledby="hm-latest-title">
      <div className="wrap">
        <div className="hm-head">
          <p className="eyebrow">{T.eyebrow[lang]}</p>
          <h2 id="hm-latest-title" className="hm-display hm-section-h">{T.title[lang]}</h2>
          <p className="muted hm-head__intro">{T.intro[lang]}</p>
        </div>
        {loading && <p className="sr-only" role="status">{T.loading[lang]}</p>}
        {ORDER.filter((b) => BOARD_IDS.includes(b)).map((b) => {
          const cfg = BOARDS[b];
          const list = ads[b];
          const hid = `hm-latest-${b}`;
          const base = `/${lang}/${b}`;
          return (
            <div key={b} className="hm-lb">
              <div className="hm-lb__head">
                <h3 id={hid} className="hm-panel-h">{cfg.title[lang]}</h3>
                <Link href={base} className="link-arrow">{T.all[lang]} {cfg.title[lang]} <Arrow /></Link>
              </div>
              {loading ? (
                <ul className="hm-lb__strip" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => <li key={i} className="hm-ad hm-ad--skeleton"><span className="hm-ad__ph" /><span className="hm-skel" /><span className="hm-skel hm-skel--short" /></li>)}
                </ul>
              ) : list.length === 0 ? (
                <p className="hm-lb__none">
                  {T.none[lang]}{" "}
                  <Link href={`${base}#pg-form-title`} className="link-arrow">{T.post[lang]}<span className="sr-only"> {cfg.title[lang]}</span> <Arrow /></Link>
                </p>
              ) : (
                <>
                  <ul className="hm-lb__strip" aria-labelledby={hid}>
                    {list.map((a) => {
                      const meta = [a.price, a.area].filter(Boolean).join(" · ");
                      return (
                        <li key={a.id} className="hm-ad">
                          <Link href={`${base}#ad=${a.id}`} className="hm-ad__link">
                            {a.thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element -- remote public storage thumbnail with a fixed aspect box
                              <img className="hm-ad__img" src={a.thumb} alt="" width={400} height={300} loading="lazy" decoding="async" />
                            ) : (
                              <span className="hm-ad__ph" aria-hidden="true">
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12.5V4h8.5L21 13.5 13.5 21z" /><circle cx="7.5" cy="8.5" r="1.2" /></svg>
                              </span>
                            )}
                            <span className="hm-ad__body">
                              <span className="hm-ad__chips">
                                <span className="chip">{typeLabel(b, a.type, lang)}</span>
                                <span className="chip">{categoryLabel(b, a.category, lang, true)}</span>
                              </span>
                              <bdi dir="auto" className="hm-ad__title">{a.title}</bdi>
                              {meta && <bdi dir="auto" className="muted hm-ad__meta">{meta}</bdi>}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="hm-lb__more">
                    <Link href={`${base}#pg-form-title`} className="link-arrow">{T.post[lang]}<span className="sr-only"> {cfg.title[lang]}</span> <Arrow /></Link>
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
