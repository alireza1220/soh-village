"use client";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import "@/styles/market.css";
import "@/styles/market-board.css";
import type { Locale } from "@/lib/i18n";
import { BOARDS, categoryLabel, typeLabel, type BoardId } from "@/lib/boards";
import { listings as localListings, type Listing } from "@/lib/market";
import { useLiveListings } from "@/lib/use-live-listings";
import { GalleryCard, ListRow, Skeletons } from "./market-card";
import { MarketDetail } from "./market-detail";
import { DEFAULTS, FilterBar, SearchBox, SortSelect, type Filters } from "./market-filters";
import { CatIcon, CloseI, PlusI, RefreshI } from "./market-icons";
import { indexListing, matches, tokens } from "./market-search";
import { T } from "./market-text";
import { isoToday, loadPrefs, num, savePrefs } from "./market-utils";

const PAGE = 24;

function parseUrl(board: BoardId): { f: Filters; ad: string | null } {
  const p = new URLSearchParams(window.location.search);
  const type = p.get("type");
  const sort = p.get("sort");
  const view = p.get("view");
  const cat = p.get("cat") ?? "all";
  const types = BOARDS[board].types.map((t) => t.v) as string[];
  const cats = BOARDS[board].categories.map((c) => c.v) as string[];
  const m = window.location.hash.match(/^#ad=([\w-]{1,64})$/);
  return {
    f: {
      q: (p.get("q") ?? "").slice(0, 100),
      type: type && types.includes(type) ? type : "all",
      cat: cats.includes(cat) ? cat : "all",
      photos: p.get("photos") === "1",
      saved: p.get("saved") === "1",
      sort: sort === "old" || sort === "end" ? sort : "new",
      view: view === "gallery" ? "gallery" : view === "list" ? "list" : DEFAULTS.view,
    },
    ad: m ? m[1] : null,
  };
}
function buildUrl(f: Filters, ad: string | null, viewExplicit: boolean) {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.type !== "all") p.set("type", f.type);
  if (f.cat !== "all") p.set("cat", f.cat);
  if (f.photos) p.set("photos", "1");
  if (f.saved) p.set("saved", "1");
  if (f.sort !== "new") p.set("sort", f.sort);
  if (viewExplicit && f.view !== "list") p.set("view", f.view);
  const qs = p.toString();
  return window.location.pathname + (qs ? `?${qs}` : "") + (ad ? `#ad=${ad}` : "");
}

export function MarketBoard({ lang, board }: { lang: Locale; board: BoardId }) {
  const cfg = BOARDS[board];
  const { listings: remote, status, reload } = useLiveListings(board);
  const [f, setF] = useState<Filters>(DEFAULTS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [today, setToday] = useState("");
  const [gone, setGone] = useState(false);
  const [more, setMore] = useState({ sig: "", n: PAGE });
  const pushedAd = useRef(false);
  const viewExplicit = useRef(false);
  const fRef = useRef(f);
  const openIdRef = useRef<string | null>(null);
  useEffect(() => { fRef.current = f; openIdRef.current = openId; });

  // Read the URL and saved prefs once the page is in the browser; follow Back/Forward after that.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- the URL and localStorage only exist in the browser, so state is read after mount */
    const prefs = loadPrefs();
    const u = parseUrl(board);
    viewExplicit.current = new URLSearchParams(window.location.search).has("view");
    setSaved(prefs.saved);
    setF({ ...u.f, view: viewExplicit.current ? u.f.view : prefs.view ?? "list" });
    setOpenId(u.ad);
    setToday(isoToday());
    /* eslint-enable react-hooks/set-state-in-effect */
    const onPop = () => {
      const n = parseUrl(board);
      viewExplicit.current = new URLSearchParams(window.location.search).has("view");
      setF((old) => ({ ...n.f, view: viewExplicit.current ? n.f.view : old.view }));
      if (!n.ad) pushedAd.current = false;
      setOpenId(n.ad);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [board]);

  const writeUrl = useCallback((next: Filters, ad: string | null, mode: "push" | "replace") => {
    const url = buildUrl(next, ad, viewExplicit.current);
    if (url === window.location.pathname + window.location.search + window.location.hash) return;
    try { (mode === "push" ? window.history.pushState : window.history.replaceState).call(window.history, null, "", url); } catch { /* sandboxed */ }
  }, []);

  const set = useCallback((p: Partial<Filters>) => {
    const next = { ...fRef.current, ...p };
    if (p.view) { viewExplicit.current = true; savePrefs({ view: p.view, saved: loadPrefs().saved }); }
    setF(next);
    writeUrl(next, openIdRef.current, "q" in p ? "replace" : "push");
  }, [writeUrl]);

  const toggleSave = useCallback((id: string) => {
    setSaved((old) => {
      const next = old.includes(id) ? old.filter((x) => x !== id) : [id, ...old];
      savePrefs({ view: fRef.current.view, saved: next });
      return next;
    });
  }, []);

  const all: Listing[] = useMemo(() => (today ? [...remote, ...(board === "market" ? localListings : [])].filter((l) => l.expiresAt >= today) : []), [remote, today, board]);
  const index = useMemo(() => all.map(indexListing), [all]);
  const dq = useDeferredValue(f.q);
  const toks = useMemo(() => tokens(dq), [dq]);
  const savedSet = useMemo(() => new Set(saved), [saved]);

  const base = useMemo(() => index.filter((ix) => {
    const l = ix.l;
    return (f.type === "all" || l.type === f.type) && (!f.photos || (l.images?.length ?? 0) > 0) && (!f.saved || savedSet.has(l.id)) && matches(ix, toks);
  }), [index, f.type, f.photos, f.saved, savedSet, toks]);
  const catCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const ix of base) c[ix.l.category] = (c[ix.l.category] ?? 0) + 1;
    return c;
  }, [base]);
  const shown = useMemo(() => {
    const out = base.filter((ix) => f.cat === "all" || ix.l.category === f.cat).map((ix) => ix.l);
    if (f.sort === "old") out.sort((a, b) => (a.postedAt < b.postedAt ? -1 : a.postedAt > b.postedAt ? 1 : 0));
    else if (f.sort === "end") out.sort((a, b) => (a.expiresAt < b.expiresAt ? -1 : a.expiresAt > b.expiresAt ? 1 : 0));
    else out.sort((a, b) => (a.postedAt < b.postedAt ? 1 : a.postedAt > b.postedAt ? -1 : 0));
    return out;
  }, [base, f.cat, f.sort]);

  const sig = `${dq}|${f.type}|${f.cat}|${f.photos}|${f.saved}|${f.sort}`;
  const limit = more.sig === sig ? more.n : PAGE;
  const visible = shown.slice(0, limit);

  // Detail layer
  const openAd = useCallback((id: string) => {
    const url = buildUrl(fRef.current, id, viewExplicit.current);
    try { window.history.pushState(null, "", url); pushedAd.current = true; } catch { /* sandboxed */ }
    setOpenId(id);
  }, []);
  const closeAd = useCallback(() => {
    if (pushedAd.current) { pushedAd.current = false; window.history.back(); return; }
    writeUrl(fRef.current, null, "replace");
    setOpenId(null);
  }, [writeUrl]);
  const open = openId ? all.find((l) => l.id === openId) ?? null : null;
  const openPos = open ? shown.findIndex((l) => l.id === open.id) : -1;
  const navAd = useCallback((d: -1 | 1) => {
    if (openPos < 0 || !shown.length) return;
    const id = shown[(openPos + d + shown.length) % shown.length].id;
    writeUrl(fRef.current, id, "replace");
    setOpenId(id);
  }, [openPos, shown, writeUrl]);
  // A shared link to an ad that is gone (or expired): say so, drop the hash.
  useEffect(() => {
    if (openId && status !== "loading" && today && !all.some((l) => l.id === openId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacts to loaded data
      setGone(true); setOpenId(null); pushedAd.current = false; writeUrl(fRef.current, null, "replace");
    }
  }, [openId, status, today, all, writeUrl]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (open) setGone(false); }, [open]);

  const loading = status === "loading" || !today;
  const active = f.q.trim() !== "" || f.type !== "all" || f.cat !== "all" || f.photos || f.saved;
  const clearAll = () => set({ q: "", type: "all", cat: "all", photos: false, saved: false });
  const countText = (n: number) => (lang === "fa" ? `${num(n, lang)} آگهی` : `${num(n, lang)} ${n === 1 ? "ad" : "ads"}`);
  const filteredCount = (n: number, total: number) => (lang === "fa" ? `${num(n, lang)} از ${num(total, lang)} آگهی` : `${num(n, lang)} of ${num(total, lang)} ${total === 1 ? "ad" : "ads"}`);
  const typeName = (v: string) => typeLabel(board, v, lang);

  const chips: { key: string; label: string; patch: Partial<Filters> }[] = [];
  if (f.q.trim()) chips.push({ key: "q", label: `«${f.q.trim()}»`, patch: { q: "" } });
  if (f.type !== "all") chips.push({ key: "type", label: typeName(f.type), patch: { type: "all" } });
  if (f.cat !== "all") chips.push({ key: "cat", label: categoryLabel(board, f.cat, lang, true), patch: { cat: "all" } });
  if (f.photos) chips.push({ key: "photos", label: T.photosOnly[lang], patch: { photos: false } });
  if (f.saved) chips.push({ key: "saved", label: T.saved[lang], patch: { saved: false } });

  const view = f.view;
  const cardProps = { lang, board, today, toks, onToggleSave: toggleSave, onOpen: openAd };
  const postBtn = <a className="mkb-post" href="#pg-form-title"><PlusI size={20} />{cfg.postCta[lang]}</a>;

  return (
    <div className="mkb" data-view={view} data-board={board}>
      <div className="mkb-top" role="search" aria-label={T.searchLabel[lang]}>
        <p className="mkb-intro">{cfg.intro[lang]}</p>
        <div className="mkb-top__row">
          <SearchBox lang={lang} board={board} value={f.q} onChange={(v) => set({ q: v })} />
          {postBtn}
        </div>
      </div>

      <noscript><p className="mk-msg mk-msg--warn">{T.noJs[lang]} <a href={`/${lang}/contribute`}>{T.noJsLink[lang]}</a></p></noscript>

      <FilterBar lang={lang} board={board} f={f} set={set} catCounts={catCounts} savedCount={saved.length} />

      <div className="mkb-summary">
        <p className="mkb-summary__count" role="status" aria-live="polite">
          {loading ? T.loading[lang] : active ? filteredCount(shown.length, all.length) : countText(all.length)}
        </p>
        {chips.length > 0 && (
          <ul className="mkb-chips">
            {chips.map((c) => (
              <li key={c.key}><button type="button" className="mkb-chip" aria-label={`${T.removeFilter[lang]}: ${c.label}`} onClick={() => set(c.patch)}>{c.label}<CloseI size={14} aria-hidden="true" /></button></li>
            ))}
            <li><button type="button" className="mkb-linkbtn" onClick={clearAll}>{T.clearAll[lang]}</button></li>
          </ul>
        )}
        <SortSelect lang={lang} f={f} set={set} />
      </div>

      {gone && <p className="mk-msg mk-msg--warn" role="status">{T.gone[lang]}</p>}

      {loading ? (
        <Skeletons view={view} />
      ) : status === "error" && all.length === 0 ? (
        <div className="mkb-state mkb-state--err" role="alert">
          <h3>{T.errTitle[lang]}</h3>
          <p>{T.errText[lang]}</p>
          <button type="button" className="mkb-post mkb-post--plain" onClick={reload}><RefreshI size={20} />{T.retry[lang]}</button>
        </div>
      ) : all.length === 0 ? (
        <div className="mkb-state">
          <span className="mkb-state__icon"><CatIcon cat={cfg.categories[0].v} size={44} /></span>
          <h3>{cfg.empty.title[lang]}</h3>
          <p>{cfg.empty.text[lang]}</p>
          {postBtn}
        </div>
      ) : shown.length === 0 ? (
        <div className="mkb-state">
          <span className="mkb-state__icon"><CatIcon cat="other" size={44} /></span>
          <h3>{T.noMatchTitle[lang]}</h3>
          <p>{f.saved && saved.length === 0 ? T.noSaved[lang] : T.noMatchTips[lang]}</p>
          {active && <button type="button" className="mkb-post mkb-post--plain" onClick={clearAll}>{T.clearAll[lang]}</button>}
        </div>
      ) : (
        <>
          <h2 className="sr-only">{T.listTitle[lang]}</h2>
          <ul className={view === "list" ? "mkb-list" : "mkb-gallery"}>
            {visible.map((l) => view === "list"
              ? <ListRow key={l.id} l={l} saved={savedSet.has(l.id)} {...cardProps} />
              : <GalleryCard key={l.id} l={l} saved={savedSet.has(l.id)} {...cardProps} />)}
          </ul>
          {shown.length > visible.length && (
            <div className="mkb-more">
              <button type="button" className="mkb-post mkb-post--plain" onClick={() => setMore({ sig, n: limit + PAGE })}>
                {T.showMore[lang]} ({num(shown.length - visible.length, lang)} {T.remaining[lang]})
              </button>
            </div>
          )}
        </>
      )}

      {status === "error" && all.length > 0 && <p className="mk-msg mk-msg--warn" role="alert">{T.errTitle[lang]}. <button type="button" className="mkb-linkbtn" onClick={reload}>{T.retry[lang]}</button></p>}
      <p className="mkb-source">{T.source[lang]}</p>

      {open && (
        <MarketDetail
          l={open} board={board} lang={lang} today={today} saved={savedSet.has(open.id)} onToggleSave={toggleSave} onClose={closeAd} onNav={navAd}
          pos={openPos >= 0 ? { index: openPos, total: shown.length } : null}
        />
      )}
    </div>
  );
}
