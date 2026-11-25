"use client";
import { useId } from "react";
import { Markdown } from "@/components/markdown";
import type { Locale } from "@/lib/i18n";
import { PriorityIcon } from "@/lib/admin-icons";
import { postText, type PublicPost } from "@/lib/posts";
import { coverUrls, dateBlock, fmtPostDate, fmtPostTime, nt, postWhen, priorityLabel } from "./news-common";

/** One post as an expandable card. The body is Markdown rendered by the safe <Markdown> component: never raw HTML. */
export function PostCard({ post, lang, open, onToggle }: { post: PublicPost; lang: Locale; open: boolean; onToggle: (open: boolean) => void }) {
  const t = postText(post, lang);
  const bodyId = useId();
  const [dt, tm] = post.eventAt ? [dateBlock(post.eventAt, lang), fmtPostTime(post.eventAt, lang)] : [null, ""];
  const kindLabel = nt[post.kind][lang];
  const cover = coverUrls(post);
  const pr = post.priority === "normal" ? null : post.priority;
  return (
    <article className="nw-card" id={`post=${post.id}`} data-kind={post.kind} data-priority={post.priority}>
      {dt && (
        <div className="nw-date" aria-hidden="true">
          <b>{dt.day}</b><span>{dt.month}</span>
        </div>
      )}
      <div className="nw-card__main">
        {cover && open && (
          // eslint-disable-next-line @next/next/no-img-element -- remote public storage image with a fixed aspect box
          <img className="nw-cover" src={cover.full} alt="" width={1280} height={720} loading="lazy" decoding="async" />
        )}
        <p className="nw-meta">
          {pr && (
            <span className="nw-prio" data-priority={pr}>
              <PriorityIcon priority={pr} size={16} />{priorityLabel[pr][lang]}
            </span>
          )}
          <span className="tag">{kindLabel}</span>
          {post.eventAt ? (
            <span>{fmtPostDate(post.eventAt, lang)}{tm ? ` · ${tm}` : ""}</span>
          ) : (
            <span>{fmtPostDate(postWhen(post), lang)}</span>
          )}
          {t.place && <span>{nt.place[lang]}: <span lang={t.placeLang !== lang ? t.placeLang : undefined} dir="auto">{t.place}</span></span>}
        </p>
        <h3 className="nw-card__title" dir="auto" lang={t.titleLang !== lang ? t.titleLang : undefined}>{t.title}</h3>
        {t.fellBack && <p className="nw-hint">{nt.also[lang]}</p>}
        {t.body && (
          <>
            <div id={bodyId} className="nw-body" hidden={!open}>
              {open && <Markdown text={t.body} lang={t.bodyLang} />}
            </div>
            <button type="button" className="btn btn--ghost nw-toggle" aria-expanded={open} aria-controls={bodyId} onClick={() => onToggle(!open)}>
              {open ? nt.readLess[lang] : nt.readMore[lang]}
            </button>
          </>
        )}
      </div>
      {cover && !open && (
        // eslint-disable-next-line @next/next/no-img-element -- remote public storage image with a fixed aspect box
        <img className="nw-thumb" src={cover.thumb} alt="" width={400} height={300} loading="lazy" decoding="async" />
      )}
    </article>
  );
}
