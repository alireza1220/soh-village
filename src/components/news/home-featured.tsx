"use client";
import Link from "next/link";
import { Arrow } from "@/components/icons";
import { PriorityIcon } from "@/lib/admin-icons";
import type { L, Locale } from "@/lib/i18n";
import { postText } from "@/lib/posts";
import { featuredPosts, useLivePosts } from "@/lib/use-live-posts";
import { coverUrls, excerptOf, nt, priorityLabel } from "./news-common";

const T = {
  eyebrow: { fa: "ویژه", en: "Featured" },
  title: { fa: "پیشنهادها و نوشته‌های ویژه", en: "Featured offers and posts" },
  read: { fa: "ادامه‌ی مطلب", en: "Read more" },
} satisfies Record<string, L>;

/** Second priority: up to 3 highlighted posts lower on the home page. Renders nothing when none is published. */
export function HomeFeatured({ lang }: { lang: Locale }) {
  const { posts } = useLivePosts();
  const list = featuredPosts(posts);
  if (list.length === 0) return null;
  return (
    <section className="section hm-featured" aria-labelledby="hm-featured-title">
      <div className="wrap">
        <div className="hm-head">
          <p className="eyebrow">{T.eyebrow[lang]}</p>
          <h2 id="hm-featured-title" className="hm-display hm-section-h">{T.title[lang]}</h2>
        </div>
        <ul className="hm-featured__grid">
          {list.map((p) => {
            const t = postText(p, lang);
            const cover = coverUrls(p);
            const ex = excerptOf(t.body, 160);
            return (
              <li key={p.id}>
                <article className="hm-feat">
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element -- remote public storage image with a fixed aspect box
                    <img className="hm-feat__img" src={cover.full} alt="" width={1280} height={720} loading="lazy" decoding="async" />
                  )}
                  <div className="hm-feat__body">
                    <p className="hm-feat__meta">
                      <span className="nw-prio" data-priority="featured"><PriorityIcon priority="featured" size={16} />{priorityLabel.featured[lang]}</span>
                      <span className="tag">{nt[p.kind][lang]}</span>
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
      </div>
    </section>
  );
}
