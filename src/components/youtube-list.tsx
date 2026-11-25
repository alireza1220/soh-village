import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import "@/styles/misc.css";
import { sectionTitle, youtubeFor, type YtVideo } from "@/lib/youtube";

export function YoutubeList({ videos, lang }: { videos: YtVideo[]; lang: Locale }) {
  return (
    <ul className="ms-embeds">
      {videos.map((v) => (
        <li key={v.id} id={`yt-${v.id}`} className="ms-embed">
          <div className="ms-embed__video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${v.id}`}
              title={v.title[lang]}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <div className="ms-embed__body">
            <h3>{v.title[lang]}</h3>
            <p className="ms-sub">{v.channel}</p>
            <p>{v.note[lang]}</p>
            <p className="ms-embed__links">
              {v.sections.map((slug) => (
                <Link key={slug} href={`/${lang}/${slug}`}>{sectionTitle(slug)[lang]}</Link>
              ))}
              <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer">YouTube</a>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function YoutubeForSection({ section, lang }: { section: string; lang: Locale }) {
  const videos = youtubeFor(section);
  if (videos.length === 0) return null;
  return (
    <section className="ms-block" aria-labelledby={`yt-${section}`}>
      <div className="ms-head"><h2 id={`yt-${section}`}>{lang === "fa" ? "ویدیو در یوتیوب" : "On YouTube"}</h2></div>
      <ul className="ms-list">
        {videos.map((v) => (
          <li key={v.id}>
            <Link className="link" href={`/${lang}/references#yt-${v.id}`}>{v.title[lang]}</Link>
            <span className="ms-sub"> · {v.channel}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
