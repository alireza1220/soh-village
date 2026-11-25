import "@/styles/pages.css";
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

function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Small decorative glyphs (the shared icon set has no globe or external-link icon).
function GlobeGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </svg>
  );
}
function ExternalGlyph() {
  return (
    <svg className="pg-ext" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true" focusable="false">
      <path d="M8 16 17 7M9 7h8v8" />
    </svg>
  );
}

export function Blocks({ blocks, lang }: { blocks: Block[]; lang: Locale }) {
  const anchors = cardAnchors(blocks);
  let card = 0;
  return (
    <div className="pg-blocks">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "p":
            return <p key={i} className="pg-p">{b.text[lang]}</p>;
          case "cards":
            return (
              <div key={i} className="pg-cards">
                {b.items.map((c) => {
                  const id = anchors[card++]?.id ?? `card-${i}-${slug(c.title.en)}`;
                  return (
                    <article key={id} id={id} className="pg-card">
                      <h3 className="pg-card__title">
                        {c.title[lang]}
                        {c.fa && lang === "en" && <span lang="fa" dir="rtl" className="pg-card__fa">{c.fa}</span>}
                      </h3>
                      <p className="pg-card__text">{c.text[lang]}</p>
                      {(c.status || c.source || c.href) && (
                        <p className="pg-card__foot">
                          {c.status && <span className={`chip chip-${c.status}`}>{statusText[c.status][lang]}</span>}
                          {c.href ? (
                            <a className="link" href={c.href} target="_blank" rel="noopener noreferrer">
                              {c.source ?? c.href}
                              <span className="sr-only">{lang === "fa" ? " (در زبانه‌ی جدید باز می‌شود)" : " (opens in a new tab)"}</span>
                            </a>
                          ) : c.source}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            );
          case "tags":
            return (
              <div key={i} className="pg-tags">
                {b.label && <p className="pg-tags__label">{b.label[lang]}</p>}
                <ul className="pg-tags__list">
                  {b.items.map((t) => <li key={t.en} className="tag">{t[lang]}</li>)}
                </ul>
              </div>
            );
          case "links":
            return (
              <ul key={i} className="pg-links">
                {b.items.map((l) => (
                  <li key={l.url}>
                    <a className="navy-card pg-link" href={l.url} target="_blank" rel="noopener noreferrer">
                      <span className="navy-card__thumb pg-link__thumb"><GlobeGlyph /></span>
                      <span className="navy-card__body">
                        <span className="navy-card__title">{l.name[lang]}</span>
                        <span className="navy-card__meta">{l.note[lang]}</span>
                        <span className="navy-card__source" dir="ltr">{hostOf(l.url)}</span>
                      </span>
                      <ExternalGlyph />
                      <span className="sr-only">{lang === "fa" ? "(در زبانه‌ی جدید باز می‌شود)" : "(opens in a new tab)"}</span>
                    </a>
                  </li>
                ))}
              </ul>
            );
          case "dl":
            return (
              <dl key={i} className="pg-facts">
                {b.items.map((d) => (
                  <div key={d.k.en} className="navy-card pg-fact">
                    <dt className="pg-fact__k">{d.k[lang]}</dt>
                    <dd className="pg-fact__v">{d.v[lang]}</dd>
                  </div>
                ))}
              </dl>
            );
          case "table":
            return (
              <div key={i} className="pg-table" role="region" tabIndex={0} aria-label={lang === "fa" ? "جدول (به کنار بکشید)" : "Table (scrolls sideways)"}>
                <table className="table">
                  <thead>
                    <tr>{b.head.map((h) => <th key={h.en} scope="col">{h[lang]}</th>)}</tr>
                  </thead>
                  <tbody>
                    {b.rows.length === 0 ? (
                      <tr><td colSpan={b.head.length} className="muted">{b.empty?.[lang]}</td></tr>
                    ) : (
                      b.rows.map((r, ri) => (
                        <tr key={ri}>{r.map((c, ci) => <td key={ci}>{c[lang]}</td>)}</tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            );
          case "notice":
            return (
              <div key={i} className="notice pg-notice" role="note">
                <h3 className="pg-notice__title">{b.title[lang]}</h3>
                <ul className="pg-notice__list">
                  {b.items.map((it) => <li key={it.en}>{it[lang]}</li>)}
                </ul>
              </div>
            );
        }
      })}
    </div>
  );
}
