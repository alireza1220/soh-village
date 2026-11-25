"use client";
import { useId } from "react";
import type { Locale } from "@/lib/i18n";
import { postText, type PublicPost } from "@/lib/posts";
import { dateBlock, fmtPostDate, fmtPostTime, nt, postWhen } from "./news-common";

/** One post as an expandable card. The body is plain text in paragraphs: never HTML, links are not auto-linked. */
export function PostCard({ post, lang, open, onToggle }: { post: PublicPost; lang: Locale; open: boolean; onToggle: (open: boolean) => void }) {
  const t = postText(post, lang);
  const bodyId = useId();
  const [dt, tm] = post.eventAt ? [dateBlock(post.eventAt, lang), fmtPostTime(post.eventAt, lang)] : [null, ""];
  const paragraphs = t.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const kindLabel = nt[post.kind][lang];
  return (
    <article className="nw-card" id={`post=${post.id}`} data-kind={post.kind}>
      {dt && (
        <div className="nw-date" aria-hidden="true">
          <b>{dt.day}</b><span>{dt.month}</span>
        </div>
      )}
      <div className="nw-card__main">
        <p className="nw-meta">
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
              {paragraphs.map((p, i) => <p key={i} dir="auto" lang={t.bodyLang !== lang ? t.bodyLang : undefined}>{p}</p>)}
            </div>
            <button type="button" className="btn btn--ghost nw-toggle" aria-expanded={open} aria-controls={bodyId} onClick={() => onToggle(!open)}>
              {open ? nt.readLess[lang] : nt.readMore[lang]}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
