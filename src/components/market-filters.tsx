"use client";
import type { Locale } from "@/lib/i18n";
import { BOARDS, type BoardId } from "@/lib/boards";
import { CameraI, CatIcon, CloseI, GridI, HeartI, ListI, SearchI, ShieldI } from "./market-icons";
import { SEARCH_PH, T } from "./market-text";
import { num } from "./market-utils";

export type Sort = "new" | "old" | "end";
export type View = "list" | "gallery";
export type Filters = { q: string; type: string; cat: string; photos: boolean; saved: boolean; verified: boolean; sort: Sort; view: View };
export const DEFAULTS: Filters = { q: "", type: "all", cat: "all", photos: false, saved: false, verified: false, sort: "new", view: "list" };

export function SearchBox({ lang, board, value, onChange }: { lang: Locale; board: BoardId; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mkb-search">
      <SearchI size={24} className="mkb-search__icon" />
      <input
        type="search" className="mkb-search__input" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={SEARCH_PH[board][lang]} aria-label={T.searchLabel[lang]} enterKeyHint="search" autoComplete="off" spellCheck={false}
      />
      {value && <button type="button" className="mkb-search__clear" onClick={() => onChange("")} aria-label={T.clearSearch[lang]}><CloseI size={18} /></button>}
    </div>
  );
}

export function SortSelect({ lang, f, set }: { lang: Locale; f: Filters; set: (p: Partial<Filters>) => void }) {
  return (
    <label className="mkb-sort">
      <span className="mkb-sort__l">{T.sort[lang]}</span>
      <select className="mkb-select" value={f.sort} onChange={(e) => set({ sort: e.target.value as Sort })}>
        <option value="new">{T.sortNew[lang]}</option>
        <option value="old">{T.sortOld[lang]}</option>
        <option value="end">{T.sortEnd[lang]}</option>
      </select>
    </label>
  );
}

export function FilterBar({ lang, board, f, set, catCounts, savedCount }: {
  lang: Locale; board: BoardId; f: Filters; set: (p: Partial<Filters>) => void; catCounts: Record<string, number>; savedCount: number;
}) {
  const cfg = BOARDS[board];
  const types: { v: string; label: string }[] = [{ v: "all", label: T.all[lang] }, ...cfg.types.map((o) => ({ v: o.v, label: o[lang] }))];
  return (
    <div className="mkb-filters">
      <div className="mkb-bar">
        <div className="mkb-seg" role="group" aria-label={T.type[lang]}>
          {types.map((t) => <button key={t.v} type="button" className="mkb-seg__b" aria-pressed={f.type === t.v} onClick={() => set({ type: t.v })}>{t.label}</button>)}
        </div>
        {board === "market" && <div className="mkb-bar__end">
          <div className="mkb-seg mkb-seg--icons" role="group" aria-label={T.view[lang]}>
            <button type="button" className="mkb-seg__b" aria-pressed={f.view === "list"} onClick={() => set({ view: "list" })} aria-label={T.viewList[lang]} title={T.viewList[lang]}><ListI size={20} /><span className="mkb-hide-sm">{T.viewList[lang]}</span></button>
            <button type="button" className="mkb-seg__b" aria-pressed={f.view === "gallery"} onClick={() => set({ view: "gallery" })} aria-label={T.viewGallery[lang]} title={T.viewGallery[lang]}><GridI size={20} /><span className="mkb-hide-sm">{T.viewGallery[lang]}</span></button>
          </div>
        </div>}
      </div>
      <div className="mkb-cats" role="group" aria-label={T.cats[lang]}>
        <button type="button" className="mkb-toggle" aria-pressed={f.photos} onClick={() => set({ photos: !f.photos })}><CameraI size={18} />{T.photosOnly[lang]}</button>
        <button type="button" className="mkb-toggle" aria-pressed={f.verified} onClick={() => set({ verified: !f.verified })}><ShieldI size={18} />{T.verifiedOnly[lang]}</button>
        {board === "market" && <button type="button" className="mkb-toggle" aria-pressed={f.saved} onClick={() => set({ saved: !f.saved })}><HeartI size={18} filled={f.saved} />{T.saved[lang]}{savedCount > 0 && <span className="mkb-toggle__n">{num(savedCount, lang)}</span>}</button>}
        <span className="mkb-cats__sep" aria-hidden="true" />
        <button type="button" className="mkb-cat" aria-pressed={f.cat === "all"} onClick={() => set({ cat: "all" })}><CatIcon cat="all" size={20} />{T.all[lang]}</button>
        {cfg.categories.filter((c) => catCounts[c.v] > 0 || f.cat === c.v).map((c) => (
          <button key={c.v} type="button" className="mkb-cat" data-cat={c.v} data-empty={!catCounts[c.v] && f.cat !== c.v ? "true" : undefined} aria-pressed={f.cat === c.v} onClick={() => set({ cat: f.cat === c.v ? "all" : c.v })}>
            <CatIcon cat={c.v} size={20} />{c.short[lang]}
            {catCounts[c.v] > 0 && <span className="mkb-cat__n">{num(catCounts[c.v], lang)}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
