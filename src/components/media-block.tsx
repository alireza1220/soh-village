import type { Locale } from "@/lib/i18n";
import { mediaFor, mediaSectionTitle } from "@/lib/media";
import type { MediaItem } from "@/lib/media-types";
import type { Block } from "@/lib/site";
import { MediaCard } from "./media-preview";
import "@/styles/misc.css";

const CAP = 6;

/** The one "Videos and posts" block on a section page: previews, videos first, at most 6 up front. */
export function MediaBlock({ section, lang, blocks, items }: { section: string; lang: Locale; blocks?: Block[]; items?: MediaItem[] }) {
  const all = items ?? mediaFor(section, lang, blocks);
  if (all.length === 0) return null;
  const fa = lang === "fa";
  const first = all.slice(0, CAP);
  const rest = all.slice(CAP);
  const hasPost = all.some((m) => m.kind === "post");
  const hasVideo = all.some((m) => m.kind === "video");
  const id = `media-${section}`;
  const list = (xs: MediaItem[]) => (
    <ul className="mp-grid">
      {xs.map((m) => <MediaCard key={m.id} item={m} lang={lang} />)}
    </ul>
  );
  return (
    <section className="ms-block mp-block" aria-labelledby={id}>
      <div className="ms-head">
        <h2 id={id}>{fa ? "ویدیوها و پست‌ها" : "Videos and posts"}</h2>
        <p className="ms-sub">
          {hasVideo && (fa
            ? "تصویر کوچک از یوتیوب می‌آید. ویدیو فقط با زدن «پخش» بارگذاری می‌شود و یوتیوب آن‌وقت کوکی می‌گذارد. "
            : "Thumbnails come from YouTube. The video loads only when you press play, and YouTube then sets its cookies. ")}
          {hasPost && (fa ? "پست‌ها فقط با زدن «نمایش پست» بارگذاری می‌شوند. " : "Posts load only when you press “Show the post”. ")}
          {fa ? "شرح‌ها از روی عنوان است؛ ویدیوها را کامل ندیده‌ایم." : "Notes follow the titles; we have not watched these through."}
        </p>
      </div>
      {list(first)}
      {rest.length > 0 && (
        <details className="ms-details">
          <summary>{fa ? `نمایش همه‌ی ${all.length.toLocaleString("fa-IR")} مورد` : `Show all ${all.length}`}</summary>
          <div className="ms-details__body">{list(rest)}</div>
        </details>
      )}
    </section>
  );
}

/** Every video or post of a list as previews, with links to the sections they belong to (references page). */
export function MediaList({ items, lang }: { items: MediaItem[]; lang: Locale }) {
  return (
    <ul className="mp-grid">
      {items.map((m) => (
        <MediaCard
          key={m.id}
          item={m}
          lang={lang}
          id={m.kind === "video" ? `yt-${m.id}` : m.id}
          sectionLinks={m.sections.map((slug) => ({ label: mediaSectionTitle(slug)[lang], href: `/${lang}/${slug}` }))}
        />
      ))}
    </ul>
  );
}
