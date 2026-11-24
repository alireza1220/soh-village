import type { Block, Status } from "@/lib/site";
import type { L, Locale } from "@/lib/i18n";

function slug(en: string) {
  return en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
}

/** Stable ids for the card titles, shared by the "on this page" links. */
export function cardAnchors(blocks: Block[]): { id: string; title: L }[] {
  const anchors: { id: string; title: L }[] = [];
  for (const b of blocks) {
    if (b.t !== "cards") continue;
    for (const c of b.items) anchors.push({ id: `card-${anchors.length}-${slug(c.title.en)}`, title: c.title });
  }
  return anchors;
}

const statusText: Record<Status, { fa: string; en: string }> = {
  reported: { fa: "گزارش‌شده", en: "reported" },
  unverified: { fa: "تأییدنشده", en: "unverified" },
  family: { fa: "از خانواده", en: "from family" },
};

export function Blocks({ blocks, lang }: { blocks: Block[]; lang: Locale }) {
  const anchors = cardAnchors(blocks);
  let card = 0;
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "p":
            return <p key={i}>{b.text[lang]}</p>;
          case "cards":
            return (
              <div key={i} className="flex flex-col gap-3">
                {b.items.map((c) => {
                  const id = anchors[card++]?.id ?? `card-${i}-${slug(c.title.en)}`;
                  return (
                  <article key={id} id={id} className="item flex flex-col gap-1">
                    <h3 className="text-lg font-semibold">
                      {c.title[lang]}
                      {c.fa && lang === "en" && <span lang="fa" dir="rtl" className="fa-display ms-3 text-base" style={{ color: "var(--accent)" }}>{c.fa}</span>}
                    </h3>
                    <p>{c.text[lang]}</p>
                    <p className="text-sm muted">
                      {c.status && <span className={`chip chip-${c.status}`}>{statusText[c.status][lang]}</span>}
                      {c.href ? <a className="link" href={c.href} target="_blank" rel="noopener noreferrer">{c.source ?? c.href}</a> : c.source}
                    </p>
                  </article>
                  );
                })}
              </div>
            );
          case "tags":
            return (
              <div key={i} className="flex flex-col gap-2">
                {b.label && <p className="text-sm muted">{b.label[lang]}</p>}
                <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                  {b.items.map((t) => <li key={t.en} className="tag">{t[lang]}</li>)}
                </ul>
              </div>
            );
          case "links":
            return (
              <ul key={i} className="flex flex-col gap-2 list-none p-0 m-0">
                {b.items.map((l) => (
                  <li key={l.url} className="item">
                    <a className="link font-semibold" href={l.url} target="_blank" rel="noopener noreferrer">{l.name[lang]}</a>
                    <p className="text-sm muted">{l.note[lang]}</p>
                  </li>
                ))}
              </ul>
            );
          case "dl":
            return (
              <dl key={i} className="grid gap-x-6 gap-y-2" style={{ gridTemplateColumns: "minmax(0,max-content) minmax(0,1fr)" }}>
                {b.items.map((d) => (
                  <div key={d.k.en} className="contents">
                    <dt className="muted">{d.k[lang]}</dt>
                    <dd className="m-0">{d.v[lang]}</dd>
                  </div>
                ))}
              </dl>
            );
          case "table":
            return (
              <div key={i} className="overflow-x-auto">
                <table className="w-full text-start border-collapse">
                  <thead>
                    <tr>{b.head.map((h) => <th key={h.en} className="text-start p-2 border-b" style={{ borderColor: "var(--line)" }}>{h[lang]}</th>)}</tr>
                  </thead>
                  <tbody>
                    {b.rows.length === 0 ? (
                      <tr><td colSpan={b.head.length} className="p-3 muted">{b.empty?.[lang]}</td></tr>
                    ) : (
                      b.rows.map((r, ri) => (
                        <tr key={ri}>{r.map((c, ci) => <td key={ci} className="p-2 border-b" style={{ borderColor: "var(--line)" }}>{c[lang]}</td>)}</tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            );
          case "notice":
            return (
              <aside key={i} className="todo">
                <h3 className="font-semibold">{b.title[lang]}</h3>
                <ul className="mt-2 ps-5 list-disc flex flex-col gap-1">
                  {b.items.map((it) => <li key={it.en}>{it[lang]}</li>)}
                </ul>
              </aside>
            );
        }
      })}
    </div>
  );
}
