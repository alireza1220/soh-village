import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { sectionTitle, youtubeFor, type YtVideo } from "@/lib/youtube";

export function YoutubeList({ videos, lang }: { videos: YtVideo[]; lang: Locale }) {
  return (
    <ul className="flex flex-col gap-8 list-none p-0 m-0">
      {videos.map((v) => (
        <li key={v.id} id={`yt-${v.id}`} className="card overflow-hidden scroll-mt-24">
          <div className="relative" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${v.id}`}
              title={v.title[lang]}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
          <div className="p-4 flex flex-col gap-2">
            <h3 className="text-xl">{v.title[lang]}</h3>
            <p className="text-sm muted">{v.channel}</p>
            <p className="text-sm">{v.note[lang]}</p>
            <p className="text-sm flex flex-wrap gap-x-4 gap-y-1">
              {v.sections.map((slug) => (
                <Link key={slug} className="link" href={`/${lang}/${slug}`}>{sectionTitle(slug)[lang]}</Link>
              ))}
              <a className="link" href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer">YouTube</a>
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
    <section className="flex flex-col gap-3" aria-labelledby={`yt-${section}`}>
      <h2 id={`yt-${section}`} className="text-2xl">{lang === "fa" ? "ویدیو در یوتیوب" : "On YouTube"}</h2>
      <ul className="flex flex-col gap-2 list-none p-0 m-0">
        {videos.map((v) => (
          <li key={v.id}>
            <Link className="link font-semibold" href={`/${lang}/references#yt-${v.id}`}>{v.title[lang]}</Link>
            <span className="text-sm muted"> · {v.channel}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
