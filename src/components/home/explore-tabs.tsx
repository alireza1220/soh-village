"use client";
import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Arrow } from "@/components/icons";

export type ExploreTab = {
  id: string; label: string; count: string; title: string; intro: string; href: string; linkLabel: string;
  image: string; alt: string; ar: string; credit: ReactNode;
};

/** Tabs pattern (automatic activation, roving tabindex, Arrow/Home/End). `dir` flips the arrow keys in RTL. */
export function ExploreTabs({ tabs, dir, label }: { tabs: ExploreTab[]; dir: "ltr" | "rtl"; label: string }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const t = tabs[active];

  const move = (to: number) => {
    const n = (to + tabs.length) % tabs.length;
    setActive(n);
    refs.current[n]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const next = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const prev = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    if (e.key === next) { e.preventDefault(); move(active + 1); }
    else if (e.key === prev) { e.preventDefault(); move(active - 1); }
    else if (e.key === "Home") { e.preventDefault(); move(0); }
    else if (e.key === "End") { e.preventDefault(); move(tabs.length - 1); }
  };

  return (
    <div className="hm-explore__main">
      <figure className="hm-explore__figure">
        <div className="media" style={{ "--ar": t.ar } as React.CSSProperties}>
          <Image key={t.image} src={`/photos/${t.image}`} alt={t.alt} fill sizes="(max-width: 1023px) 100vw, 720px" className="object-cover" />
        </div>
        <figcaption className="hm-credit">{t.credit}</figcaption>
      </figure>

      <div role="tablist" aria-label={label} className="tabs hm-explore__tabs" onKeyDown={onKey}>
        {tabs.map((x, i) => (
          <button
            key={x.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`${base}-t-${x.id}`}
            aria-selected={i === active} aria-controls={`${base}-p`} tabIndex={i === active ? 0 : -1}
            className="tab" onClick={() => setActive(i)}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`${base}-p`} aria-labelledby={`${base}-t-${t.id}`} className="hm-explore__panel">
        <p className="eyebrow">{t.count}</p>
        <h3 className="hm-explore__title">{t.title}</h3>
        <p>{t.intro}</p>
        <Link href={t.href} className="link-arrow">{t.linkLabel} <Arrow /></Link>
      </div>
    </div>
  );
}
