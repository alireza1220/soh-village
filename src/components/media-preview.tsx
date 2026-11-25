"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { platformName, type MediaItem } from "@/lib/media-types";
import { FacebookIcon, InstagramIcon, PlayIcon } from "./icons";
import "@/styles/misc.css";

export type SectionLink = { label: string; href: string };

const T = {
  play: { fa: "پخش ویدیو", en: "Play" },
  show: { fa: "نمایش پست", en: "Show the post" },
  video: { fa: "ویدیو", en: "Video" },
  post: { fa: "پست", en: "Post" },
  openOn: { fa: "باز کردن در", en: "Open on" },
  newTab: { fa: "(در زبانه‌ی جدید باز می‌شود)", en: "(opens in a new tab)" },
};

/** Shared preview for one third-party video or post. Nothing is loaded from the platform until the visitor asks (except the YouTube thumbnail). */
export function MediaCard({
  item, lang, sectionLinks, variant = "card", id,
}: { item: MediaItem; lang: Locale; sectionLinks?: SectionLink[]; variant?: "card" | "tile"; id?: string }) {
  const [on, setOn] = useState(false);
  const [broken, setBroken] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const t = (k: keyof typeof T) => T[k][lang];
  const yt = item.platform === "youtube";
  const fb = item.platform === "facebook";
  const tile = variant === "tile";
  useEffect(() => { if (on) frame.current?.focus(); }, [on]);

  const label = `${yt ? t("play") : t("show")}: ${item.title}`;
  let stage: React.ReactNode;
  if (yt) {
    stage = (
      <div className={`ms-embed__video mp-stage${tile ? " mp-stage--tile" : ""}${on ? " is-on" : ""}`}>
        {on ? (
          <iframe
            ref={frame}
            src={`https://www.youtube-nocookie.com/embed/${item.id}?autoplay=1&rel=0`}
            title={`${item.title} (YouTube)`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button type="button" className="mp-poster" onClick={() => setOn(true)} aria-label={label}>
            {!broken && (
              // eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail, loaded lazily on purpose
              <img src={`https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="mp-poster__img" onError={() => setBroken(true)} />
            )}
            {broken && <span className="mp-fallback">{item.title}</span>}
            <span className="mp-play" aria-hidden="true"><PlayIcon size={34} /></span>
            <span className="mp-kind" aria-hidden="true">{t("video")}</span>
          </button>
        )}
      </div>
    );
  } else if (on) {
    stage = (
      <div className="ms-embed__scroll mp-frame">
        <iframe
          ref={frame}
          src={item.embed}
          title={`${item.title} (${platformName(item.platform)})`}
          width={item.width}
          height={item.height}
          scrolling={fb ? "no" : undefined}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          referrerPolicy={fb ? undefined : "strict-origin-when-cross-origin"}
          allowFullScreen
          className={fb ? "ms-embed__frame" : "ms-embed__frame ms-embed__frame--fluid"}
          style={item.width && item.height ? { width: item.width, height: item.height } : { height: item.tall ? 640 : 460 }}
        />
      </div>
    );
  } else {
    stage = (
      <div className={`ms-embed__video mp-stage mp-stage--post${tile ? " mp-stage--tile" : ""}`}>
        <span className="mp-post__icon" aria-hidden="true">{fb ? <FacebookIcon size={44} /> : <InstagramIcon size={44} />}</span>
        <span className="mp-kind" aria-hidden="true">{t("post")} · {platformName(item.platform)}</span>
        <button type="button" className="btn btn--primary" onClick={() => setOn(true)} aria-label={label}>{t("show")}</button>
      </div>
    );
  }

  const open = (
    <a href={item.href} target="_blank" rel="noopener noreferrer">
      {t("openOn")} {platformName(item.platform)}<span className="sr-only"> {t("newTab")}</span>
    </a>
  );
  return (
    <li id={id} className={`${tile ? "ms-tile mp-tile" : "ms-embed"}${on && !yt ? " is-open" : ""}`}>
      {stage}
      <div className={tile ? "ms-tile__body" : "ms-embed__body"}>
        <h3 className="mp-title">{item.title}</h3>
        <p className="ms-sub"><bdi>{item.source}</bdi></p>
        <p>{item.note}</p>
        <p className="ms-embed__links">
          {sectionLinks?.map((s) => <Link key={s.href} href={s.href}>{s.label}</Link>)}
          {open}
        </p>
      </div>
    </li>
  );
}
