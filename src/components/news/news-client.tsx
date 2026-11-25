"use client";
import { useEffect, useMemo, useState } from "react";
import type { L, Locale } from "@/lib/i18n";
import { isUpcoming } from "@/lib/posts";
import { useLivePosts } from "@/lib/use-live-posts";
import { sortUpcoming } from "./news-common";
import { PostCard } from "./post-card";

type Filter = "all" | "news" | "blog" | "event" | "past";
const T = {
  filter: { fa: "نوع مطلب", en: "Kind of post" },
  all: { fa: "همه", en: "All" },
  news: { fa: "خبرها", en: "News" },
  blog: { fa: "وبلاگ", en: "Blog" },
  event: { fa: "رویدادها", en: "Events" },
  past: { fa: "رویدادهای گذشته", en: "Past events" },
  upcoming: { fa: "رویدادهای پیش رو", en: "Upcoming events" },
  latest: { fa: "خبر و نوشته‌ها", en: "News and blog posts" },
  pastTitle: { fa: "رویدادهای گذشته", en: "Past events" },
  loading: { fa: "در حال بارگذاری…", en: "Loading…" },
  error: { fa: "بارگذاری نشد. دوباره تلاش کنید.", en: "Could not load. Please try again." },
  retry: { fa: "تلاش دوباره", en: "Try again" },
  empty: { fa: "هنوز خبر یا رویدادی منتشر نشده است. به‌زودی اینجا را ببینید.", en: "No news or events yet. Check back soon." },
  emptyFilter: { fa: "در این دسته چیزی نیست.", en: "Nothing in this category." },
  noUpcoming: { fa: "رویداد پیش رویی نیست.", en: "No upcoming events." },
} satisfies Record<string, L>;

const hashId = () => {
  const m = /^#post=([0-9a-f-]{36})$/i.exec(typeof window === "undefined" ? "" : window.location.hash);
  return m ? m[1].toLowerCase() : null;
};

export function NewsClient({ lang }: { lang: Locale }) {
  const { posts, status, reload } = useLivePosts();
  const [filter, setFilter] = useState<Filter>("all");
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock is only known in the browser
  useEffect(() => { setNow(Date.now()); }, []);

  const { upcoming, past, written } = useMemo(() => {
    const n = now ?? 0;
    const events = posts.filter((p) => p.kind === "event");
    return {
      upcoming: now === null ? [] : events.filter((p) => isUpcoming(p, n)).sort(sortUpcoming),
      past: now === null ? events : events.filter((p) => !isUpcoming(p, n)).sort((a, b) => sortUpcoming(b, a)),
      written: posts.filter((p) => p.kind !== "event"),
    };
  }, [posts, now]);

  // Deep link: #post=<uuid> opens that post, switches to a filter that shows it and scrolls to it.
  useEffect(() => {
    if (status !== "ready" || now === null) return;
    const id = hashId();
    const p = id ? posts.find((x) => x.id === id) : undefined;
    if (!p) return;
    /* eslint-disable react-hooks/set-state-in-effect -- reacting to the address bar */
    setFilter("all");
    setOpened((o) => ({ ...o, [p.id]: true }));
    /* eslint-enable react-hooks/set-state-in-effect */
    const raf = requestAnimationFrame(() => document.getElementById(`post=${p.id}`)?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(raf);
  }, [status, posts, now]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: T.all[lang] }, { id: "news", label: T.news[lang] }, { id: "blog", label: T.blog[lang] },
    { id: "event", label: T.event[lang] }, { id: "past", label: T.past[lang] },
  ];
  const show = (f: Filter) => filter === "all" || filter === f;
  const card = (p: (typeof posts)[number]) => (
    <li key={p.id}><PostCard post={p} lang={lang} open={!!opened[p.id]} onToggle={(v) => setOpened((o) => ({ ...o, [p.id]: v }))} /></li>
  );

  if (status === "loading") return <p className="nw-state" role="status">{T.loading[lang]}</p>;
  if (status === "error") {
    return (
      <div className="nw-state" role="alert">
        <p>{T.error[lang]}</p>
        <button type="button" className="btn btn--primary" onClick={reload}>{T.retry[lang]}</button>
      </div>
    );
  }
  if (posts.length === 0) return <p className="nw-state">{T.empty[lang]}</p>;

  const showUpcoming = filter === "all" || filter === "event";
  const showWritten = filter === "all" || filter === "news" || filter === "blog";
  const writtenList = written.filter((p) => filter === "all" || p.kind === filter);
  const showPast = filter === "past" || (filter === "all" && past.length > 0);
  const nothing = (!showUpcoming || upcoming.length === 0) && (!showWritten || writtenList.length === 0) && (!showPast || past.length === 0);

  return (
    <>
      <div className="nw-filters" role="group" aria-label={T.filter[lang]}>
        {filters.map((f) => (
          <button key={f.id} type="button" className="nw-chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>
      {nothing && filter !== "event" && <p className="nw-state">{T.emptyFilter[lang]}</p>}
      {showUpcoming && (filter === "event" || upcoming.length > 0) && (
        <section className="nw-section" aria-labelledby="nw-upcoming">
          <h2 id="nw-upcoming" className="nw-h">{T.upcoming[lang]}</h2>
          {upcoming.length ? <ul className="nw-list">{upcoming.map(card)}</ul> : <p className="muted">{T.noUpcoming[lang]}</p>}
        </section>
      )}
      {showWritten && writtenList.length > 0 && (
        <section className="nw-section" aria-labelledby="nw-latest">
          <h2 id="nw-latest" className="nw-h">{T.latest[lang]}</h2>
          <ul className="nw-list">{writtenList.map(card)}</ul>
        </section>
      )}
      {showPast && past.length > 0 && show(filter === "past" ? "past" : "all") && (
        <section className="nw-section" aria-labelledby="nw-past">
          <h2 id="nw-past" className="nw-h">{T.pastTitle[lang]}</h2>
          <ul className="nw-list">{past.map(card)}</ul>
        </section>
      )}
    </>
  );
}
