"use client";
import Link from "next/link";
import { Arrow } from "@/components/icons";
import type { L, Locale } from "@/lib/i18n";
import { postText } from "@/lib/posts";
import { latestPosts, useLivePosts } from "@/lib/use-live-posts";
import { coverUrls, excerptOf, fmtPostDate, nt, postWhen } from "./news-common";

const T = {
  eyebrow: { fa: "تازه‌ها", en: "What's new" },
  title: { fa: "تازه‌ترین خبرها و نوشته‌ها", en: "Latest news and blog posts" },
  read: { fa: "ادامه‌ی مطلب", en: "Read more" },
  all: { fa: "همه‌ی خبرها و نوشته‌ها", en: "All news and posts" },
} satisfies Record<string, L>;

/** Right below the hero: the 3 newest published news / blog posts together (newest first, whatever their kind). Nothing at all when none. */
export function HomeLatest({ lang }: { lang: Locale }) {
  const { posts } = useLivePosts();
  const list = latestPosts(posts);
  if (list.length === 0) return null;
  return (
    <section className="section hm-latest" aria-labelledby="hm-latest-title">
      <div className="wrap">
        <div className="hm-head">
          <p className="eyebrow">{T.eyebrow[lang]}</p>
          <h2 id="hm-latest-title" className="hm-display hm-section-h">{T.title[lang]}</h2>
        </div>
        <ul className="hm-featured__grid">
          {list.map((p) => {
            const t = postText(p, lang);
            const cover = coverUrls(p);
            const ex = excerptOf(t.body, 160);
            return (
              <li key={p.id}>
                <article className="hm-feat hm-feat--latest">
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element -- remote public storage image with a fixed aspect box
                    <img className="hm-feat__img" src={cover.full} alt="" width={1280} height={720} loading="lazy" decoding="async" />
                  )}
                  <div className="hm-feat__body">
                    <p className="hm-feat__meta">
                      <span className="tag">{nt[p.kind][lang]}</span>
                      <span className="muted">{fmtPostDate(postWhen(p), lang)}</span>
                    </p>
                    <h3 dir="auto" lang={t.titleLang !== lang ? t.titleLang : undefined}>{t.title}</h3>
                    {ex && <p dir="auto" lang={t.bodyLang !== lang ? t.bodyLang : undefined}>{ex}</p>}
                    <Link href={`/${lang}/news#post=${p.id}`} className="link-arrow hm-feat__more">{T.read[lang]} <Arrow /><span className="sr-only"> : {t.title}</span></Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
        <div className="hm-actions">
          <Link href={`/${lang}/news`} className="link-arrow">{T.all[lang]} <Arrow /></Link>
        </div>
      </div>
    </section>
  );
}
