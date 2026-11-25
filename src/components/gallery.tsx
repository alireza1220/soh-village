"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { MediaItem } from "@/lib/media-types";
import type { Photo } from "@/lib/photos";
import { Credit } from "./credit";
import { MediaCard } from "./media-preview";
import "@/styles/misc.css";

export type GalleryGroup = { id: string; title: string; photos: Photo[]; media: MediaItem[] };
type Filter = "all" | "photos" | "videos";
const MEDIA_CAP = 8;

const T = {
  filter: { fa: "نمایش", en: "Show" },
  group: { fa: "فیلتر گالری", en: "Filter the gallery" },
  all: { fa: "همه", en: "All" },
  photos: { fa: "عکس‌ها", en: "Photos" },
  videos: { fa: "ویدیوها و پست‌ها", en: "Videos and posts" },
  eyebrow: { fa: "گالری", en: "Gallery" },
  none: { fa: "چیزی برای نمایش نیست.", en: "Nothing to show." },
  count: { fa: "مورد", en: "items" },
};

/** Photos, videos and posts in one gallery, grouped by section, with an All / Photos / Videos filter. */
export function Gallery({ groups, lang }: { groups: GalleryGroup[]; lang: Locale }) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState<Photo | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [more, setMore] = useState<Record<string, boolean>>({});
  const fa = lang === "fa";
  const focusAfter = useRef<string | null>(null);
  // After "Show all", the button unmounts; move focus to the first newly revealed tile.
  useEffect(() => {
    const id = focusAfter.current;
    if (!id) return;
    focusAfter.current = null;
    const list = document.getElementById(`gl-${id}`);
    const g = groups.find((x) => x.id === id);
    const target = list?.children[(g?.photos.length ?? 0) + MEDIA_CAP]?.querySelector<HTMLElement>("button, a");
    target?.focus();
  }, [more, groups]);
  // Open the dialog after React has rendered the photo into it, so the Close button exists and can take focus.
  useEffect(() => {
    if (!open || !ref.current) return;
    if (!ref.current.open) ref.current.showModal();
    closeRef.current?.focus();
  }, [open]);

  const shown = groups
    .map((g) => ({ ...g, photos: filter === "videos" ? [] : g.photos, media: filter === "photos" ? [] : g.media }))
    .filter((g) => g.photos.length + g.media.length > 0);
  const total = shown.reduce((n, g) => n + g.photos.length + g.media.length, 0);
  const num = (n: number) => (fa ? n.toLocaleString("fa-IR") : String(n));

  return (
    <>
      <div className="mp-filter" role="group" aria-label={T.group[lang]}>
        <p className="mp-filter__label" aria-hidden="true">{T.filter[lang]}</p>
        <div className="tabs">
          {(["all", "photos", "videos"] as const).map((f) => (
            <button key={f} type="button" className="tab" aria-pressed={filter === f} onClick={() => setFilter(f)}>{T[f][lang]}</button>
          ))}
        </div>
        <p className="tab-count" role="status" aria-live="polite">{num(total)} {T.count[lang]}</p>
      </div>
      {shown.length === 0 && <p className="notice">{T.none[lang]}</p>}
      {shown.map((g) => {
        const capped = g.media.length > MEDIA_CAP && !more[g.id];
        const media = capped ? g.media.slice(0, MEDIA_CAP) : g.media;
        return (
          <section key={g.id} className="ms-block" aria-labelledby={`g-${g.id}`}>
            <div className="ms-head">
              <p className="eyebrow">{T.eyebrow[lang]}</p>
              <h2 id={`g-${g.id}`}>{g.title}</h2>
            </div>
            <ul className="ms-tiles" id={`gl-${g.id}`}>
              {g.photos.map((p) => (
                <li key={`${p.section}-${p.file}`} className="ms-tile">
                  <button type="button" onClick={() => setOpen(p)} className="ms-tile__btn" aria-label={(fa ? "بزرگ‌نمایی: " : "Enlarge: ") + p.alt[lang]}>
                    <Image src={`/photos/${p.file}`} alt={p.alt[lang]} width={p.width} height={p.height} className="ms-tile__img" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px" />
                    {p.scope === "region" && <span className="region-badge">{fa ? "عکس منطقه، نه سُه" : "Region photo, not Soh"}</span>}
                  </button>
                  <div className="ms-tile__body">
                    <p>{p.caption[lang]}</p>
                    <Credit p={p} lang={lang} />
                  </div>
                </li>
              ))}
              {media.map((m) => <MediaCard key={m.id} item={m} lang={lang} variant="tile" />)}
            </ul>
            {capped && (
              <button type="button" className="btn btn--ghost mp-more" onClick={() => { focusAfter.current = g.id; setMore((s) => ({ ...s, [g.id]: true })); }}>
                {fa ? `نمایش همه‌ی ${num(g.media.length)} ویدیو و پست` : `Show all ${g.media.length} videos and posts`}
              </button>
            )}
          </section>
        );
      })}
      <dialog
        ref={ref}
        onClose={() => setOpen(null)}
        onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
        className="ms-lightbox"
        aria-label={fa ? "عکس بزرگ" : "Enlarged photo"}
      >
        {open && (
          <figure className="ms-lightbox__fig">
            <Image src={`/photos/${open.file}`} alt={open.alt[lang]} width={open.width} height={open.height} className="ms-lightbox__img" sizes="96vw" />
            <figcaption className="ms-lightbox__cap">
              {open.scope === "region" && <span className="chip">{fa ? "عکس منطقه، نه سُه" : "Region photo, not Soh"}</span>}
              <span>{open.caption[lang]}</span>
              <Credit p={open} lang={lang} />
              <button type="button" ref={closeRef} className="btn btn--dark" onClick={() => ref.current?.close()}>{fa ? "بستن" : "Close"}</button>
            </figcaption>
          </figure>
        )}
      </dialog>
    </>
  );
}
