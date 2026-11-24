import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { photos, showShotPlaceholders, shots } from "@/lib/photos";
import { Credit } from "./credit";

// Photos for a section: the first is a wide feature image, the rest sit in a grid, then "photo needed" boxes.
export function PhotoStrip({ section, lang }: { section: string; lang: Locale }) {
  const have = photos.filter((p) => p.section === section);
  const needed = showShotPlaceholders ? shots.filter((s) => s.section === section && !photos.some((p) => p.scope === "soh" && p.file.startsWith(s.id))) : [];
  if (have.length === 0 && needed.length === 0) return null;
  const [first, ...rest] = have;
  return (
    <div className="flex flex-col gap-4">
      {first && (
        <figure className="card hero-photo relative m-0 overflow-hidden" style={{ aspectRatio: `${first.width} / ${first.height}` }}>
          <Image src={`/photos/${first.file}`} alt={first.alt[lang]} fill sizes="(max-width: 1120px) 100vw, 1120px" className="object-cover" priority />
          {first.scope === "region" && <span className="region-badge region-badge-top">{lang === "fa" ? "عکس منطقه، نه سُه" : "Region photo, not Soh"}</span>}
          <figcaption className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 p-4 text-white">
            <span className="text-sm md:text-base">{first.caption[lang]}</span>
            <Credit p={first} lang={lang} light />
          </figcaption>
        </figure>
      )}
      {(rest.length > 0 || needed.length > 0) && (
        <ul className="grid gap-3 list-none p-0 m-0" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          {rest.map((p) => (
            <li key={p.file} className="card overflow-hidden">
              <Image src={`/photos/${p.file}`} alt={p.alt[lang]} width={p.width} height={p.height} className="w-full h-auto" sizes="(max-width: 760px) 100vw, 360px" />
              <div className="p-3 flex flex-col gap-1">
                <p className="text-sm">{p.caption[lang]}</p>
                <Credit p={p} lang={lang} />
              </div>
            </li>
          ))}
          {needed.map((s) => (
            <li key={s.id} className="todo flex flex-col justify-center gap-1" style={{ minHeight: 120 }}>
              <b className="text-sm">{lang === "fa" ? "عکس لازم است: " : "Photo needed: "}{s.title[lang]}</b>
              <span className="text-sm muted">{s.detail[lang]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
