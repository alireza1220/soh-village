"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { Photo } from "@/lib/photos";
import { Credit } from "./credit";
import "@/styles/misc.css";

export function Gallery({ photos, lang }: { photos: Photo[]; lang: Locale }) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState<Photo | null>(null);
  const show = (p: Photo) => setOpen(p);
  // Open the dialog after React has rendered the photo into it, so the Close button exists and can take focus.
  useEffect(() => {
    if (!open || !ref.current) return;
    if (!ref.current.open) ref.current.showModal();
    closeRef.current?.focus();
  }, [open]);
  return (
    <>
      <ul className="ms-tiles">
        {photos.map((p) => (
          <li key={`${p.section}-${p.file}`} className="ms-tile">
            <button type="button" onClick={() => show(p)} className="ms-tile__btn" aria-label={(lang === "fa" ? "بزرگ‌نمایی: " : "Enlarge: ") + p.alt[lang]}>
              <Image src={`/photos/${p.file}`} alt={p.alt[lang]} width={p.width} height={p.height} className="ms-tile__img" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px" />
              {p.scope === "region" && <span className="region-badge">{lang === "fa" ? "عکس منطقه، نه سُه" : "Region photo, not Soh"}</span>}
            </button>
            <div className="ms-tile__body">
              <p>{p.caption[lang]}</p>
              <Credit p={p} lang={lang} />
            </div>
          </li>
        ))}
      </ul>
      <dialog
        ref={ref}
        onClose={() => setOpen(null)}
        onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
        className="ms-lightbox"
        aria-label={lang === "fa" ? "عکس بزرگ" : "Enlarged photo"}
      >
        {open && (
          <figure className="ms-lightbox__fig">
            <Image src={`/photos/${open.file}`} alt={open.alt[lang]} width={open.width} height={open.height} className="ms-lightbox__img" sizes="96vw" />
            <figcaption className="ms-lightbox__cap">
              {open.scope === "region" && <span className="chip">{lang === "fa" ? "عکس منطقه، نه سُه" : "Region photo, not Soh"}</span>}
              <span>{open.caption[lang]}</span>
              <Credit p={open} lang={lang} />
              <button type="button" ref={closeRef} className="btn btn--dark" onClick={() => ref.current?.close()}>{lang === "fa" ? "بستن" : "Close"}</button>
            </figcaption>
          </figure>
        )}
      </dialog>
    </>
  );
}
