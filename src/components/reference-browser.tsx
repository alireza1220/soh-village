"use client";

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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex flex-col gap-1 text-sm max-w-md w-full" htmlFor="ref-search">
          {T.search[lang]}
          <input
            id="ref-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={T.placeholder[lang]}
            className="w-full rounded-xl border px-3 py-2 bg-[var(--surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
        <p className="text-sm muted">{total} {T.count[lang]}</p>
      </div>
      {shown.length === 0 ? <p className="muted">{T.empty[lang]}</p> : null}
      {shown.map((g) => (
        <section key={g.id} className="flex flex-col gap-3" aria-labelledby={g.id}>
          <h2 id={g.id} className="text-2xl">{g.title[lang]}</h2>
          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {g.items.map((item, index) => (
              <li key={`${item.url}-${index}`} className="item">
                <a className="link font-semibold break-all" href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
                <p className="mt-2 flex flex-col gap-1 text-sm">
                  <span>
                    <span className="eyebrow">{T.comment[lang]}</span>
                    {item.status ? <span className="chip">{statusLabel(item.status, lang)}</span> : null}
                  </span>
                  <span>{item.comment[lang]}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
