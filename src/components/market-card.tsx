"use client";
import { memo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { categoryLabel, factsOf, typeLabel, type BoardId } from "@/lib/boards";
import type { Listing, ListingPoster } from "@/lib/market";
import { Avatar } from "./avatar";
import "@/styles/boards.css";
import { CameraI, CatIcon, ChevL, ChevR, HeartI, hasCatIcon } from "./market-icons";
import { highlight } from "./market-search";
import { T } from "./market-text";
import { num, relativeDay } from "./market-utils";

export type CardProps = {
  l: Listing; board: BoardId; lang: Locale; today: string; toks: string[]; saved: boolean;
  onToggleSave: (id: string) => void; onOpen: (id: string) => void;
};

export function Hl({ text, toks }: { text: string; toks: string[] }) {
  return <>{highlight(text, toks).map((p, i) => (p.hit ? <mark key={i} className="mkb-hl">{p.s}</mark> : <span key={i}>{p.s}</span>))}</>;
}

/** Friendly tinted stand-in for ads without photos: the category icon, never a fake picture. */
export function Placeholder({ category, size = 40 }: { category: string; size?: number }) {
  return <span className="mkb-ph" data-cat={hasCatIcon(category) ? category : "other"} aria-hidden="true"><CatIcon cat={category} size={size} /></span>;
}

function SaveBtn({ l, lang, saved, onToggleSave }: Pick<CardProps, "l" | "lang" | "saved" | "onToggleSave">) {
  return (
    <button type="button" className="mkb-heart" aria-pressed={saved} aria-label={`${saved ? T.unsave[lang] : T.save[lang]}: ${l.title}`} onClick={() => onToggleSave(l.id)}>
      <HeartI filled={saved} size={22} />
    </button>
  );
}

function PhotoBadge({ n, lang }: { n: number; lang: Locale }) {
  if (n < 1) return null;
  return <span className="mkb-badge"><CameraI size={16} /><span>{num(n, lang)}</span><span className="sr-only">{n === 1 ? T.photo[lang] : T.photos[lang]}</span></span>;
}

/** Types where the poster is asking for something (shown as the dark tag). */
export const isAsk = (type: string) => type === "need" || type === "seeking";

/** Poster's first name and picture, only when the poster allowed it (Listing.poster is set only then). Never a family name or phone. */
export function PosterLine({ poster, size = 24, label }: { poster?: ListingPoster; size?: number; label?: string }) {
  if (!poster) return null;
  return (
    <p className={`brd-poster${size > 30 ? " brd-poster--lg" : ""}`}>
      <Avatar name={poster.firstName} src={poster.avatarUrl} size={size} />
      <span>{label && <span className="brd-poster__l">{label} </span>}<bdi dir="auto" className="brd-poster__n">{poster.firstName}</bdi></span>
    </p>
  );
}

/** The board's own facts without price and place (those have their own lines): amount, arrangement, start, deed ... */
function extraFacts(l: Listing, board: BoardId, lang: Locale) {
  if (board === "market") return "";
  return factsOf(board, { quantity: l.quantity, available: l.available }, lang).map((f) => `${f.label}: ${f.value}`).join(" · ");
}

function Meta({ l, lang, today }: Pick<CardProps, "l" | "lang" | "today">) {
  return <p className="mkb-meta"><span className="mkb-meta__i">{l.area}</span><span className="mkb-meta__i">{relativeDay(l.postedAt, today, lang)}</span></p>;
}

function ListRowBase(p: CardProps) {
  const { l, lang, toks } = p;
  const cover = l.images?.[0];
  const n = l.images?.length ?? 0;
  const facts = extraFacts(l, p.board, lang);
  return (
    <li className="mkb-row">
      <div className="mkb-row__media">
        {cover
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={cover.thumb} alt="" loading="lazy" decoding="async" width={400} height={400} />
          : <Placeholder category={l.category} />}
        <PhotoBadge n={n} lang={lang} />
      </div>
      <div className="mkb-row__body">
        <h3 className="mkb-title">
          <bdi dir="auto"><a href={`#ad=${l.id}`} className="mkb-stretch" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); p.onOpen(l.id); }}>
            <Hl text={l.title} toks={toks} />
          </a></bdi>
        </h3>
        {l.price ? <p className="mkb-price"><bdi dir="auto">{l.price}</bdi></p> : l.type === "sell" && p.board !== "careers" ? <p className="mkb-price mkb-price--ask">{T.noPrice[lang]}</p> : null}
        {facts && <p className="brd-facts"><bdi dir="auto">{facts}</bdi></p>}
        <Meta l={l} lang={lang} today={p.today} />
        <p className="mkb-tags">
          {(p.board !== "market" || isAsk(l.type)) && <span className={`mkb-tag${isAsk(l.type) ? " mkb-tag--need" : ""}`}>{typeLabel(l.board ?? p.board, l.type, lang)}</span>}
          <span className="mkb-tag" data-cat={hasCatIcon(l.category) ? l.category : "other"}><CatIcon cat={l.category} size={14} />{categoryLabel(l.board ?? p.board, l.category, lang, true)}</span>
        </p>
        <PosterLine poster={l.poster} />
      </div>
      <SaveBtn {...p} />
    </li>
  );
}
export const ListRow = memo(ListRowBase);

function GalleryCardBase(p: CardProps) {
  const { l, lang, toks } = p;
  const imgs = l.images ?? [];
  const n = imgs.length;
  const [i, setI] = useState(0);
  const touch = useRef<number | null>(null);
  const rtl = lang === "fa";
  const go = (d: number) => setI((x) => (x + d + n) % n);
  const cur = imgs[Math.min(i, n - 1)];
  return (
    <li className="mkb-gc">
      <div
        className="mkb-gc__media"
        onPointerMove={(e) => {
          if (n < 2 || e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          let f = (e.clientX - r.left) / r.width;
          if (rtl) f = 1 - f;
          setI(Math.min(n - 1, Math.max(0, Math.floor(f * n))));
        }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") setI(0); }}
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touch.current == null || n < 2) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) > 40) go((dx < 0) !== rtl ? 1 : -1);
        }}
      >
        {cur
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={cur.thumb} alt="" loading="lazy" decoding="async" width={400} height={400} />
          : <Placeholder category={l.category} size={56} />}
        {n > 1 && (
          <>
            <button type="button" className="mkb-flip mkb-flip--start" aria-label={T.prevPhoto[lang]} onClick={() => go(-1)}>{rtl ? <ChevR size={18} /> : <ChevL size={18} />}</button>
            <button type="button" className="mkb-flip mkb-flip--end" aria-label={T.nextPhoto[lang]} onClick={() => go(1)}>{rtl ? <ChevL size={18} /> : <ChevR size={18} />}</button>
            <span className="mkb-dots" aria-hidden="true">{imgs.slice(0, 10).map((_, k) => <span key={k} className={k === i ? "is-on" : ""} />)}</span>
          </>
        )}
        <PhotoBadge n={n} lang={lang} />
        <SaveBtn {...p} />
      </div>
      <div className="mkb-gc__body">
        <h3 className="mkb-title">
          <bdi dir="auto"><a href={`#ad=${l.id}`} className="mkb-stretch" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); p.onOpen(l.id); }}>
            <Hl text={l.title} toks={toks} />
          </a></bdi>
        </h3>
        <p className={`mkb-price${l.price ? "" : " mkb-price--ask"}`}><bdi dir="auto">{l.price ?? (l.type === "sell" ? T.noPrice[lang] : typeLabel(l.board ?? p.board, l.type, lang))}</bdi></p>
        <Meta l={l} lang={lang} today={p.today} />
        <PosterLine poster={l.poster} />
      </div>
    </li>
  );
}
export const GalleryCard = memo(GalleryCardBase);

export function Skeletons({ view }: { view: "list" | "gallery" }) {
  return (
    <ul className={view === "list" ? "mkb-list" : "mkb-gallery"} aria-hidden="true">
      {Array.from({ length: view === "list" ? 5 : 8 }, (_, k) => (
        <li key={k} className={view === "list" ? "mkb-row mkb-skel" : "mkb-gc mkb-skel"}>
          <div className={view === "list" ? "mkb-row__media" : "mkb-gc__media"} />
          <div className="mkb-skel__lines"><span /><span /><span /></div>
        </li>
      ))}
    </ul>
  );
}
