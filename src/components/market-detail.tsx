"use client";
import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/lib/i18n";
import { categoryLabel, factsOf, typeLabel, type BoardId } from "@/lib/boards";
import type { Listing } from "@/lib/market";
import { useRevealContact } from "@/lib/use-reveal-contact";
import { isAsk, Placeholder, PosterLine } from "./market-card";
import { CatIcon, ChevL, ChevR, CloseI, CopyI, HeartI, PhoneI, ShareI, ZoomI } from "./market-icons";
import { SellerCaution, SellerRibbon } from "./seller-ribbon";
import { T } from "./market-text";
import { copyText, telHref, fmtDate, num, relativeDay } from "./market-utils";

type Props = {
  l: Listing; board: BoardId; lang: Locale; today: string; saved: boolean; pos: { index: number; total: number } | null;
  onToggleSave: (id: string) => void; onClose: () => void; onNav: (d: -1 | 1) => void;
};
const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

export function MarketDetail({ l, board, lang, today, saved, pos, onToggleSave, onClose, onNav }: Props) {
  const rtl = lang === "fa";
  const uid = useId();
  const dlg = useRef<HTMLDivElement>(null);
  const lb = useRef<HTMLDivElement>(null);
  const zoomBtn = useRef<HTMLButtonElement>(null);
  const imgs = useMemo(() => l.images ?? [], [l.images]);
  const n = imgs.length;
  const [cur, setCur] = useState({ id: l.id, i: 0 });
  const i = cur.id === l.id ? Math.min(cur.i, Math.max(0, n - 1)) : 0;
  const [zoom, setZoom] = useState(false);
  const [msg, setMsg] = useState("");
  const reveal = useRevealContact(l.id, lang);
  const phoneRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (reveal.state.status === "shown") phoneRef.current?.focus(); }, [reveal.state.status]);
  const touch = useRef<number | null>(null);
  const setI = useCallback((v: number) => setCur({ id: l.id, i: v }), [l.id]);
  const step = useCallback((d: number) => { if (n > 1) setI((i + d + n) % n); }, [i, n, setI]);

  // Focus in, scroll lock, focus back out.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    document.documentElement.classList.add("scroll-lock");
    dlg.current?.querySelector<HTMLElement>(".mkb-dlg__close")?.focus();
    return () => {
      document.documentElement.classList.remove("scroll-lock");
      if (prev && document.contains(prev)) prev.focus();
    };
  }, []);
  useEffect(() => { if (zoom) lb.current?.querySelector<HTMLElement>("button")?.focus(); else if (zoomBtn.current && document.activeElement === document.body) zoomBtn.current.focus(); }, [zoom]);
  // Warm the neighbouring full-size photos.
  useEffect(() => {
    if (n < 2) return;
    for (const k of [i + 1, i - 1]) { const im = imgs[(k + n) % n]; if (im) new Image().src = im.full; }
  }, [i, n, imgs]);
  // Moving to another ad swaps the whole dialog: say which ad it is now (not on first open, the dialog label is read then).
  const first = useRef(true);
  const posIndex = pos?.index, posTotal = pos?.total;
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setMsg(posIndex != null && posTotal ? `${num(posIndex + 1, lang)} ${T.of[lang]} ${num(posTotal, lang)}: ${l.title}` : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l.id]);

  const flash = (m: string) => { setMsg(""); setTimeout(() => setMsg(m), 20); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.stopPropagation(); if (zoom) setZoom(false); else onClose(); return; }
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,select")) return;
      e.preventDefault();
      step((e.key === "ArrowRight") !== rtl ? 1 : -1);
      return;
    }
    if (e.key === "Tab") {
      const box = zoom ? lb.current : dlg.current;
      const items = box ? Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement) : [];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  const swipeProps = {
    onTouchStart: (e: React.TouchEvent) => { touch.current = e.touches[0].clientX; },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touch.current == null) return;
      const dx = e.changedTouches[0].clientX - touch.current;
      touch.current = null;
      if (Math.abs(dx) > 45) step((dx < 0) !== rtl ? 1 : -1);
    },
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}#ad=${l.id}`;
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: l.title, url }); return; } catch (e) { if ((e as Error).name === "AbortError") return; }
    }
    flash((await copyText(url)) ? T.linkCopied[lang] : url);
  };
  const copyContact = async () => { if (reveal.state.status === "shown") flash((await copyText(reveal.state.phone)) ? T.copied[lang] : reveal.state.phone); };

  const b = l.board ?? board;
  const typeName = typeLabel(b, l.type, lang);
  // Market keeps its big price; other boards name the price in their own words (pay, budget ...) as a fact.
  const facts = factsOf(b, b === "market" ? { quantity: l.quantity, area: l.area, available: l.available } : l, lang);
  const tel = reveal.state.status === "shown" ? telHref(reveal.state.phone) : null;
  const Prev = rtl ? ChevR : ChevL, Next = rtl ? ChevL : ChevR;
  const titleId = `${uid}-t`;

  return createPortal(
    <div className="mkb-modal" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dlg} className="mkb-dlg" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} dir={rtl ? "rtl" : "ltr"} lang={lang} onKeyDown={onKey}>
        <button type="button" className="mkb-dlg__close" onClick={onClose} aria-label={T.close[lang]}><CloseI size={22} /></button>
        <div className="mkb-dlg__grid">
          <div className="mkb-dlg__photos">
            {n > 0 ? (
              <>
                <div className="mkb-viewer" {...swipeProps}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img key={imgs[i].full} src={imgs[i].full} alt={`${l.title} (${num(i + 1, lang)}/${num(n, lang)})`} width={1280} height={960} decoding="async" />
                  <button ref={zoomBtn} type="button" className="mkb-viewer__zoom" onClick={() => setZoom(true)} aria-label={T.zoom[lang]}><ZoomI size={20} /></button>
                  {n > 1 && (
                    <>
                      <button type="button" className="mkb-flip mkb-flip--start mkb-flip--lg" onClick={() => step(-1)} aria-label={T.prevPhoto[lang]}><Prev size={22} /></button>
                      <button type="button" className="mkb-flip mkb-flip--end mkb-flip--lg" onClick={() => step(1)} aria-label={T.nextPhoto[lang]}><Next size={22} /></button>
                    </>
                  )}
                </div>
                <p className="mkb-count" aria-live="polite">{T.photo[lang]} {num(i + 1, lang)} {T.of[lang]} {num(n, lang)}</p>
                {n > 1 && (
                  <ul className="mkb-strip" aria-label={T.thumbs[lang]}>
                    {imgs.map((im, k) => (
                      <li key={im.thumb}>
                        <button type="button" className="mkb-strip__btn" aria-current={k === i} aria-label={`${T.photo[lang]} ${num(k + 1, lang)}`} onClick={() => setI(k)}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={im.thumb} alt="" loading="lazy" decoding="async" width={400} height={400} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="mkb-viewer mkb-viewer--none"><Placeholder category={l.category} size={72} /><span>{T.noPhoto[lang]}</span></div>
            )}
          </div>

          <div className="mkb-dlg__info">
            <SellerRibbon verified={l.verified} lang={lang} />
            <p className="mkb-tags">
              <span className={`mkb-tag${isAsk(l.type) ? " mkb-tag--need" : ""}`}>{typeName}</span>
              <span className="mkb-tag" data-cat={l.category}><CatIcon cat={l.category} size={14} />{categoryLabel(b, l.category, lang)}</span>
            </p>
            <h2 id={titleId} className="mkb-dlg__title"><bdi dir="auto">{l.title}</bdi></h2>
            {b === "market" && (l.price ? <p className="mkb-price mkb-price--big"><bdi dir="auto">{l.price}</bdi></p> : l.type === "sell" ? <p className="mkb-price mkb-price--big mkb-price--ask">{T.noPrice[lang]}</p> : null)}
            <dl className="mkb-facts">
              {facts.map((f) => (<Fragment key={f.label}><dt>{f.label}</dt><dd><bdi dir="auto">{f.value}</bdi></dd></Fragment>))}
            </dl>
            {!l.verified && <SellerCaution lang={lang} />}
            <PosterLine poster={l.poster} size={40} label={T.postedBy[lang]} lang={lang} />
            {l.details && <p className="mkb-details" dir="auto">{l.details}</p>}
            <p className="mkb-dates">{T.posted[lang]} {fmtDate(l.postedAt, lang)} ({relativeDay(l.postedAt, today, lang)}) · {T.until[lang]} {fmtDate(l.expiresAt, lang)}</p>

            <div className="mkb-contact">
              <p className="mkb-contact__h">{T.contact[lang]}</p>
              {reveal.state.status === "shown" ? (
                <>
                  <p className="mkb-contact__v" ref={phoneRef} tabIndex={-1}><span>{T.phoneShown[lang]}: </span><bdi dir="ltr">{reveal.state.phone}</bdi></p>
                  <div className="mkb-actions">
                    {tel && <a className="mkb-btn mkb-btn--solid" href={tel}><PhoneI size={18} />{T.call[lang]}</a>}
                    <button type="button" className="mkb-btn" onClick={copyContact}><CopyI size={18} />{T.copy[lang]}</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mkb-contact__note">{T.phoneHidden[lang]}</p>
                  <div className="mkb-actions">
                    <button type="button" className="mkb-btn mkb-btn--solid" onClick={reveal.reveal} aria-disabled={reveal.state.status === "loading"} aria-describedby={`${uid}-ph`}>
                      <PhoneI size={18} />{reveal.state.status === "loading" ? T.phoneLoading[lang] : reveal.state.status === "error" ? T.phoneRetry[lang] : T.showPhone[lang]}
                    </button>
                  </div>
                </>
              )}
              <p id={`${uid}-ph`} className={reveal.state.status === "error" ? "mkb-contact__err" : "sr-only"} role="status" aria-live="polite">
                {reveal.state.status === "error" ? reveal.state.message : reveal.state.status === "shown" ? `${T.phoneShown[lang]}: ${reveal.state.phone}` : reveal.state.status === "loading" ? T.phoneLoading[lang] : ""}
              </p>
            </div>

            <div className="mkb-actions">
              <button type="button" className="mkb-btn" aria-pressed={saved} onClick={() => onToggleSave(l.id)}><HeartI filled={saved} size={18} />{saved ? T.unsave[lang] : T.save[lang]}</button>
              <button type="button" className="mkb-btn" onClick={share}><ShareI size={18} />{T.share[lang]}</button>
            </div>
            <p className="mkb-toast" role="status" aria-live="polite">{msg}</p>

            {pos && pos.total > 1 && (
              <div className="mkb-adnav">
                <button type="button" className="mkb-btn" onClick={() => onNav(-1)}><Prev size={18} />{T.prevAd[lang]}</button>
                <span className="mkb-adnav__n">{num(pos.index + 1, lang)} {T.of[lang]} {num(pos.total, lang)}</span>
                <button type="button" className="mkb-btn" onClick={() => onNav(1)}>{T.nextAd[lang]}<Next size={18} /></button>
              </div>
            )}
          </div>
        </div>

        {zoom && n > 0 && (
          <div ref={lb} className="mkb-lb" tabIndex={-1} role="group" aria-label={T.zoom[lang]} {...swipeProps} onMouseDown={(e) => { if (e.target === e.currentTarget) setZoom(false); }}>
            <button type="button" className="mkb-dlg__close mkb-dlg__close--lb" onClick={() => setZoom(false)} aria-label={T.close[lang]}><CloseI size={22} /></button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgs[i].full} alt={`${l.title} (${num(i + 1, lang)}/${num(n, lang)})`} decoding="async" />
            {n > 1 && (
              <>
                <button type="button" className="mkb-flip mkb-flip--start mkb-flip--lg" onClick={() => step(-1)} aria-label={T.prevPhoto[lang]}><Prev size={22} /></button>
                <button type="button" className="mkb-flip mkb-flip--end mkb-flip--lg" onClick={() => step(1)} aria-label={T.nextPhoto[lang]}><Next size={22} /></button>
                <p className="mkb-count mkb-count--lb" aria-live="polite">{num(i + 1, lang)} / {num(n, lang)}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
