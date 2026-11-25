"use client";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { Locale } from "@/lib/i18n";
import { Markdown } from "@/components/markdown";

const T = {
  write: { fa: "نوشتن", en: "Write" },
  preview: { fa: "پیش‌نمایش", en: "Preview" },
  empty: { fa: "هنوز متنی ننوشته‌اید.", en: "Nothing written yet." },
};

/** A Markdown textarea with Write | Preview tabs. `code` is the language of the TEXT (not of the admin screen). */
export function MarkdownField({ lang, code, id, label, value, onChange, maxLength }: {
  lang: Locale; code: "fa" | "en"; id: string; label: string; value: string; onChange: (v: string) => void; maxLength: number;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const uid = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const go = (t: "write" | "preview") => { setTab(t); refs.current[t]?.focus(); };
  const key = (e: KeyboardEvent) => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) { e.preventDefault(); go(tab === "write" ? "preview" : "write"); }
  };
  return (
    <div className="field adm-md">
      <div className="adm-md__bar">
        <label className="label" htmlFor={id}>{label}</label>
        <div className="adm-md__tabs" role="tablist" aria-label={label} onKeyDown={key}>
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              ref={(el) => { refs.current[t] = el; }}
              type="button"
              role="tab"
              id={`${uid}-${t}`}
              aria-selected={tab === t}
              aria-controls={`${uid}-panel`}
              tabIndex={tab === t ? 0 : -1}
              className="adm-md__tab"
              onClick={() => setTab(t)}
            >{T[t][lang]}</button>
          ))}
        </div>
      </div>
      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-${tab}`}>
        {tab === "write" ? (
          <textarea id={id} className="textarea" lang={code} dir={code === "fa" ? "rtl" : "ltr"} rows={10} maxLength={maxLength} value={value} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <div className="adm-md__preview" tabIndex={0}>
            {value.trim() ? <Markdown text={value} lang={code} /> : <p className="adm-quiet">{T.empty[lang]}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

const HELP = {
  title: { fa: "راهنمای مارک‌داون", en: "Markdown help" },
  note: { fa: "در متن HTML و عکس نمی‌شود؛ تنها عکس مطلب را در بخش «عکس مطلب» بگذارید.", en: "No HTML and no images in the text; the one image goes in the cover field." },
  rows: [
    ["# Heading", { fa: "تیتر", en: "Heading" }],
    ["**bold**", { fa: "پررنگ", en: "Bold" }],
    ["*italic*", { fa: "مورب", en: "Italic" }],
    ["[text](https://link)", { fa: "پیوند", en: "Link" }],
    ["- item", { fa: "فهرست نقطه‌ای", en: "Bullet list" }],
    ["1. item", { fa: "فهرست شماره‌دار", en: "Numbered list" }],
    ["> quote", { fa: "نقل‌قول", en: "Quote" }],
  ] as const,
};

export function MarkdownHelp({ lang }: { lang: Locale }) {
  return (
    <details className="adm-help">
      <summary>{HELP.title[lang]}</summary>
      <table className="adm-help__table">
        <tbody>
          {HELP.rows.map(([syntax, what]) => (
            <tr key={syntax}><th scope="row"><code dir="ltr">{syntax}</code></th><td>{what[lang]}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="field-hint">{HELP.note[lang]}</p>
    </details>
  );
}
