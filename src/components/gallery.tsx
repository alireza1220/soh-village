"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { Photo } from "@/lib/photos";
import { Credit } from "./credit";

export function Gallery({ photos, lang }: { photos: Photo[]; lang: Locale }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<Photo | null>(null);
  const show = (p: Photo) => { setOpen(p); ref.current?.showModal(); };
  return (
    <>
      <ul className="grid gap-3 list-none p-0 m-0" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
        {photos.map((p) => (
          <li key={p.file} className="item p-2">
            <button type="button" onClick={() => show(p)} className="relative block w-full text-start cursor-zoom-in" aria-label={(lang === "fa" ? "بزرگ‌نمایی: " : "Enlarge: ") + p.alt[lang]}>
              <Image src={`/photos/${p.file}`} alt={p.alt[lang]} width={p.width} height={p.height} className="w-full h-auto rounded" sizes="(max-width: 760px) 50vw, 240px" />
              {p.scope === "region" && <span className="region-badge">{lang === "fa" ? "عکس منطقه، نه سُه" : "Region photo, not Soh"}</span>}
            </button>
            <p className="mt-2 text-sm">{p.caption[lang]}</p>
            <Credit p={p} lang={lang} />
          </li>
        ))}
      </ul>
      <dialog ref={ref} onClose={() => setOpen(null)} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
        className="m-auto p-3 rounded max-w-[min(96vw,1000px)]" style={{ background: "var(--surface)", color: "var(--fg)" }}>
        {open && (
          <figure className="m-0 flex flex-col gap-2">
            <Image src={`/photos/${open.file}`} alt={open.alt[lang]} width={open.width} height={open.height} className="w-full h-auto max-h-[80vh] object-contain" sizes="96vw" />
            <figcaption className="text-sm flex flex-col gap-1">{open.caption[lang]}<Credit p={open} lang={lang} /></figcaption>
            <button type="button" className="link self-start text-sm" onClick={() => ref.current?.close()}>{lang === "fa" ? "بستن" : "Close"}</button>
          </figure>
        )}
      </dialog>
    </>
  );
}
