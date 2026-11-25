"use client";
import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent } from "react";

export type YearItem = {
  id: string; filters: string[]; big: string; small: string; title: string; text: string; source: string; sourceLabel: string; href: string; wordy?: boolean;
};
export type YearFilterDef = { id: string; label: string };

export function YearList({ items, filters, dir, label, showing, of }: {
  items: YearItem[]; filters: YearFilterDef[]; dir: "ltr" | "rtl"; label: string; showing: string; of: string;
}) {
  const [active, setActive] = useState(0);
  const nl = dir === "rtl" ? "fa-IR" : "en-US";
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const f = filters[active];
  const shown = f.id === "all" ? items : items.filter((i) => i.filters.includes(f.id));

  const move = (to: number) => {
    const n = (to + filters.length) % filters.length;
    setActive(n);
    refs.current[n]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const next = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const prev = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    if (e.key === next) { e.preventDefault(); move(active + 1); }
    else if (e.key === prev) { e.preventDefault(); move(active - 1); }
    else if (e.key === "Home") { e.preventDefault(); move(0); }
    else if (e.key === "End") { e.preventDefault(); move(filters.length - 1); }
  };

  return (
    <div className="hm-year__list">
      <div role="tablist" aria-label={label} className="tabs" onKeyDown={onKey}>
        {filters.map((x, i) => (
          <button
            key={x.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`${base}-t-${x.id}`}
            aria-selected={i === active} aria-controls={`${base}-p`} tabIndex={i === active ? 0 : -1}
            className="tab" onClick={() => setActive(i)}
          >
            {x.label}
          </button>
        ))}
      </div>
      <p className="tab-count" aria-live="polite">{showing} {shown.length.toLocaleString(nl)} {of} {items.length.toLocaleString(nl)}</p>
      <ul role="tabpanel" id={`${base}-p`} aria-labelledby={`${base}-t-${f.id}`} className="hm-year__rows">
        {shown.map((r) => (
          <li key={r.id}>
            <Link href={r.href} className="navy-card hm-year__row">
              <span className={`date-block${r.wordy ? " hm-date--word" : ""}`}>
                <span className="date-block__big">{r.big}</span>
                <span className="date-block__small">{r.small}</span>
              </span>
              <span className="navy-card__body">
                <span className="navy-card__title">{r.title}</span>
                <span className="navy-card__meta">{r.text}</span>
                <span className="navy-card__source">{r.sourceLabel}: {r.source}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
