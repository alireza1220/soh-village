"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Arrow } from "@/components/icons";
import type { Locale } from "@/lib/i18n";
import { LISTING_CATEGORIES, LISTING_TYPE_LABELS, listings as localListings } from "@/lib/market";
import { useLiveListings } from "@/lib/use-live-listings";

type Labels = { empty: string; example: string; exampleTitle: string; exampleMeta: string; readMore: string; area: string; until: string; typeSell: string; catFruit: string };

/** Three newest approved, unexpired listings. Contact details are never shown here; the market page decides that. */
export function MarketTeaser({ lang, href, labels }: { lang: Locale; href: string; labels: Labels }) {
  const remote = useLiveListings();
  const [today, setToday] = useState("");
  useEffect(() => { setToday(new Date().toISOString().slice(0, 10)); }, []);
  const latest = useMemo(() => {
    return [...remote, ...localListings]
      .filter((l) => l.expiresAt >= today)
      .sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1))
      .slice(0, 3);
  }, [remote, today]);
  const name = (list: { v: string; fa: string; en: string }[], v: string) => list.find((o) => o.v === v)?.[lang] ?? v;

  if (latest.length === 0) {
    return (
      <div className="hm-market__empty">
        <p>{labels.empty}</p>
        <article className="post-card hm-market__example" aria-label={labels.example}>
          <div className="post-card__body">
            <p className="post-card__meta"><span className="tag">{labels.example}</span></p>
            <h3>{labels.exampleTitle}</h3>
            <p className="post-card__meta">
              <span className="chip">{labels.typeSell}</span><span className="chip">{labels.catFruit}</span>
            </p>
            <p className="muted">{labels.exampleMeta}</p>
          </div>
        </article>
      </div>
    );
  }
  return (
    <ul className="hm-cards" aria-live="polite">
      {latest.map((l) => (
        <li key={l.id}>
          <article className="post-card hm-card">
            <div className="post-card__body">
              <p className="post-card__meta">
                <span className="tag">{name(LISTING_TYPE_LABELS, l.type)}</span>
                <span className="tag">{name(LISTING_CATEGORIES, l.category)}</span>
              </p>
              <h3>{l.title}</h3>
              <p className="muted">
                {labels.area}: {l.area}
                {l.price ? <> · {l.price}</> : null}
              </p>
              <p className="post-card__meta"><span dir="ltr">{l.postedAt}</span> · <span>{labels.until} <span dir="ltr">{l.expiresAt}</span></span></p>
              <Link href={href} className="link-arrow hm-card__more">{labels.readMore} <Arrow /></Link>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
