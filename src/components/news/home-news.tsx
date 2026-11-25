"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Arrow } from "@/components/icons";
import type { L, Locale } from "@/lib/i18n";
import { isUpcoming, postText, type PublicPost } from "@/lib/posts";
import { featuredPosts, urgentPosts, useLivePosts } from "@/lib/use-live-posts";
import { dateBlock, fmtPostDate, fmtPostTime, nt, postWhen, sortUpcoming } from "./news-common";

const T = {
  eyebrow: { fa: "تازه‌ها", en: "What's new" },
  title: { fa: "تازه‌ترین خبرها و رویدادهای پیش رو", en: "Latest news and upcoming events" },
  all: { fa: "همه‌ی خبرها و رویدادها", en: "All news and events" },
  upcoming: { fa: "رویدادهای پیش رو", en: "Upcoming events" },
  latest: { fa: "تازه‌ترین‌ها", en: "Latest" },
} satisfies Record<string, L>;

/** Home section: up to 3 latest posts and the next 2 events. Renders nothing at all when there is nothing published. */
export function HomeNews({ lang }: { lang: Locale }) {
  const { posts } = useLivePosts();
  const [now, setNow] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock is only known in the browser
  useEffect(() => { setNow(Date.now()); }, []);
  const { latest, upcoming } = useMemo(() => {
    // Posts already shown in the urgent banner or the featured band are not repeated here.
    const shown = new Set([...urgentPosts(posts), ...featuredPosts(posts)].map((p) => p.id));
    const rest = posts.filter((p) => !shown.has(p.id));
    return {
      latest: rest.filter((p) => p.kind !== "event").slice(0, 3),
      upcoming: now === null ? [] : rest.filter((p) => isUpcoming(p, now)).sort(sortUpcoming).slice(0, 2),
    };
  }, [posts, now]);

  if (latest.length === 0 && upcoming.length === 0) return null;
  const href = `/${lang}/news`;
  const link = (p: PublicPost) => `${href}#post=${p.id}`;
  return (
    <section className="section section--mist" aria-labelledby="hm-news-title">
      <div className="wrap">
        <div className="hm-head">
          <p className="eyebrow">{T.eyebrow[lang]}</p>
          <h2 id="hm-news-title" className="hm-display hm-section-h">{T.title[lang]}</h2>
        </div>
        <div className="hm-news">
          {upcoming.length > 0 && (
            <div>
              <h3 className="hm-panel-h">{T.upcoming[lang]}</h3>
              <ul className="nw-list">
                {upcoming.map((p) => {
                  const t = postText(p, lang);
                  const d = dateBlock(p.eventAt!, lang);
                  return (
                    <li key={p.id}>
                      <Link href={link(p)} className="nw-mini">
                        <span className="nw-date" aria-hidden="true"><b>{d.day}</b><span>{d.month}</span></span>
                        <span className="nw-mini__text">
                          <span className="nw-mini__title" dir="auto" lang={t.titleLang !== lang ? t.titleLang : undefined}>{t.title}</span>
                          <span className="muted">{fmtPostDate(p.eventAt!, lang)} · {fmtPostTime(p.eventAt!, lang)}{t.place ? <> · <span dir="auto" lang={t.placeLang !== lang ? t.placeLang : undefined}>{t.place}</span></> : null}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {latest.length > 0 && (
            <div>
              <h3 className="hm-panel-h">{T.latest[lang]}</h3>
              <ul className="nw-list">
                {latest.map((p) => {
                  const t = postText(p, lang);
                  return (
                    <li key={p.id}>
                      <Link href={link(p)} className="nw-mini">
                        <span className="nw-mini__text">
                          <span className="nw-meta"><span className="tag">{nt[p.kind][lang]}</span><span>{fmtPostDate(postWhen(p), lang)}</span></span>
                          <span className="nw-mini__title" dir="auto" lang={t.titleLang !== lang ? t.titleLang : undefined}>{t.title}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        <div className="hm-actions">
          <Link href={href} className="link-arrow">{T.all[lang]} <Arrow /></Link>
        </div>
      </div>
    </section>
  );
}
