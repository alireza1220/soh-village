"use client";
import Link from "next/link";
import { Arrow } from "@/components/icons";
import { PriorityIcon } from "@/lib/admin-icons";
import type { L, Locale } from "@/lib/i18n";
import { postText } from "@/lib/posts";
import { urgentPosts, useLivePosts } from "@/lib/use-live-posts";
import { coverUrls, excerptOf, priorityLabel } from "./news-common";

const T = {
  region: { fa: "خبر فوری", en: "Urgent news" },
  read: { fa: "ادامه‌ی خبر", en: "Read more" },
} satisfies Record<string, L>;

/** Main news: a full-width alert band at the very top of the home page. Renders nothing when no urgent post is published. */
export function HomeUrgent({ lang }: { lang: Locale }) {
  const { posts } = useLivePosts();
  const list = urgentPosts(posts);
  if (list.length === 0) return null;
  return (
    <section className="hm-urgent" role="region" aria-label={T.region[lang]}>
      <ul className="wrap hm-urgent__list">
        {list.map((p) => {
          const t = postText(p, lang);
          const cover = coverUrls(p);
          const ex = excerptOf(t.body);
          return (
            <li key={p.id} className="hm-urgent__item">
              <span className="hm-urgent__icon"><PriorityIcon priority="urgent" size={28} /></span>
              <div className="hm-urgent__text">
                <p className="hm-urgent__label">{priorityLabel.urgent[lang]}</p>
                <h2 className="hm-urgent__title" dir="auto" lang={t.titleLang !== lang ? t.titleLang : undefined}>{t.title}</h2>
                {ex && <p className="hm-urgent__excerpt" dir="auto" lang={t.bodyLang !== lang ? t.bodyLang : undefined}>{ex}</p>}
                <Link href={`/${lang}/news#post=${p.id}`} className="link-arrow hm-urgent__more">{T.read[lang]} <Arrow /></Link>
              </div>
              {cover && (
                // eslint-disable-next-line @next/next/no-img-element -- remote public storage image with a fixed aspect box
                <img className="hm-urgent__img" src={cover.thumb} alt="" width={160} height={120} loading="lazy" decoding="async" />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
