"use client";

import "@/styles/misc.css";
import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { statusLabel } from "@/lib/reference-comments";
import type { RefGroup } from "@/lib/reference-list";

const T = {
  search: { fa: "جستجو در پیوندها", en: "Search the links" },
  placeholder: { fa: "نام، نشانی یا وضعیت", en: "Name, address or status" },
  empty: { fa: "پیوندی با این عبارت پیدا نشد.", en: "No link matches that." },
  count: { fa: "پیوند", en: "links" },
  comment: { fa: "نظر", en: "Comment" },
};

export function ReferenceBrowser({ groups, lang }: { groups: RefGroup[]; lang: Locale }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const shown = useMemo(() => {
    if (!query) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => `${item.url} ${item.note} ${item.comment.fa} ${item.comment.en} ${item.status} ${g.title.fa} ${g.title.en}`.toLowerCase().includes(query)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);
  const total = shown.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="ms-block">
      <div className="ms-search">
        <div className="field">
          <label className="label" htmlFor="ref-search">{T.search[lang]}</label>
          <input
            id="ref-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={T.placeholder[lang]}
            className="input"
          />
        </div>
        <p className="ms-count" role="status" aria-live="polite">{total} {T.count[lang]}</p>
      </div>
      {shown.length === 0 ? <p className="notice">{T.empty[lang]}</p> : null}
      {shown.map((g) => (
        <section key={g.id} className="ms-block" aria-labelledby={g.id}>
          <div className="ms-head"><h2 id={g.id}>{g.title[lang]}</h2></div>
          <ul className="ms-list">
            {g.items.map((item, index) => (
              <li key={`${item.url}-${index}`} className="ms-ref">
                <a href={item.url} target="_blank" rel="noopener noreferrer" dir="ltr">{item.url}</a>
                <span className="ms-ref__label">
                  {T.comment[lang]}
                  {item.status ? <span className="chip">{statusLabel(item.status, lang)}</span> : null}
                </span>
                <p>{item.comment[lang]}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
