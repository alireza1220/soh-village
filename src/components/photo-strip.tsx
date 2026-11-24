import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { photos, showShotPlaceholders, shots } from "@/lib/photos";

export function PhotoStrip({ section, lang }: { section: string; lang: Locale }) {
  const have = photos.filter((p) => p.section === section);
  const needed = showShotPlaceholders ? shots.filter((s) => s.section === section && !photos.some((p) => p.section === section && p.file.startsWith(s.id))) : [];
  if (have.length === 0 && needed.length === 0) return null;
  return (
    <ul className="grid gap-3 list-none p-0 m-0" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
      {have.map((p) => (
        <li key={p.file} className="item p-2">
          <Image src={`/photos/${p.file}`} alt={p.alt[lang]} width={p.width} height={p.height} className="w-full h-auto rounded" sizes="(max-width: 760px) 100vw, 360px" />
          <p className="mt-2 text-sm">{p.caption[lang]}</p>
          <p className="text-xs muted">{p.credit} · {p.license}</p>
        </li>
      ))}
      {needed.map((s) => (
        <li key={s.id} className="todo flex flex-col justify-center gap-1" style={{ minHeight: 140 }}>
          <b className="text-sm">{lang === "fa" ? "عکس لازم است: " : "Photo needed: "}{s.title[lang]}</b>
          <span className="text-sm muted">{s.detail[lang]}</span>
        </li>
      ))}
    </ul>
  );
}
