"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Arrow } from "@/components/icons";
import type { Locale } from "@/lib/i18n";
import { categoryLabel, typeLabel } from "@/lib/boards";
import { listings as localListings } from "@/lib/market";
import { useLiveListings } from "@/lib/use-live-listings";

type Labels = { empty: string; example: string; exampleTitle: string; exampleMeta: string; readMore: string; area: string; until: string; typeSell: string; catFruit: string };

/** Three newest approved, unexpired listings. Contact details are never shown here; the market page decides that. */
export function MarketTeaser({ lang, href, labels }: { lang: Locale; href: string; labels: Labels }) {
  const { listings: remote } = useLiveListings("market");
  const [today, setToday] = useState("");
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the date is only known in the browser
  useEffect(() => { setToday(new Date().toISOString().slice(0, 10)); }, []);
  const latest = useMemo(() => {
    return [...remote, ...localListings]
      .filter((l) => l.expiresAt >= today)
      .sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1))
      .slice(0, 3);
  }, [remote, today]);

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
                <span className="tag">{typeLabel("market", l.type, lang)}</span>
                <span className="tag">{categoryLabel("market", l.category, lang)}</span>
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
