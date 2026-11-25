import "@/styles/pages.css";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { Locale } from "@/lib/i18n";
import { photos, showShotPlaceholders, shots } from "@/lib/photos";
import { Credit } from "./credit";

// Photos for a section, shown in a pale band under the page banner: a grid of square cards, then "photo needed" boxes.
// skipFirst: the first photo of the section is already the page banner, so it is not repeated here.
export function PhotoStrip({ section, lang, skipFirst }: { section: string; lang: Locale; skipFirst?: boolean }) {
  const all = photos.filter((p) => p.section === section);
  const have = skipFirst ? all.slice(1) : all;
  const needed = showShotPlaceholders ? shots.filter((s) => s.section === section && !photos.some((p) => p.scope === "soh" && p.file.startsWith(s.id))) : [];
  if (have.length === 0 && needed.length === 0) return null;
  return (
    <section className="section section--mist section--tight pg-photos" aria-labelledby="pg-photos-title">
      <div className="wrap">
        <h2 id="pg-photos-title" className="eyebrow pg-eyebrow">{lang === "fa" ? "عکس‌ها" : "Photos"}</h2>
        <ul className="pg-photos__grid">
          {have.map((p) => (
            <li key={p.file} className="pg-shot">
              <figure className="m-0">
                <div className="media" style={{ "--ar": "4 / 3" } as CSSProperties}>
                  <Image src={`/photos/${p.file}`} alt={p.alt[lang]} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px" />
                </div>
                <figcaption className="pg-shot__body">
                  <span className="pg-shot__caption">{p.caption[lang]}</span>
                  <Credit p={p} lang={lang} />
                </figcaption>
              </figure>
            </li>
          ))}
          {needed.map((s) => (
            <li key={s.id} className="pg-needed">
              <b className="pg-needed__title">{lang === "fa" ? "عکس لازم است: " : "Photo needed: "}{s.title[lang]}</b>
              <span className="pg-needed__detail">{s.detail[lang]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
