"use client";

import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { CloseIcon, SearchIcon } from "@/components/icons";
import "@/styles/search.css";

// Header search: icon button + modal dialog. The index (built from site.ts, photos.ts, the contribute and map data)
// is loaded with a dynamic import the first time the dialog opens, or when the button gets hover/focus.
type SearchMod = typeof import("@/lib/search-index");

const copy = {
  button: { fa: "جستجو", en: "Search" },
  title: { fa: "جستجو در سایت", en: "Search the site" },
  label: { fa: "جستجو در بخش‌ها و منابع", en: "Search sections and sources" },
  placeholder: { fa: "مثلاً کاروانسرا، محرم", en: "e.g. caravanserai, Muharram" },
  close: { fa: "بستن جستجو", en: "Close search" },
  clear: { fa: "پاک کردن", en: "Clear" },
  loading: { fa: "در حال آماده‌سازی…", en: "Getting ready…" },
  hintA: { fa: "چند حرف بنویسید. با کلید", en: "Type a few letters. Press" },
  hintB: { fa: "جستجو باز می‌شود.", en: "to open search." },
  tryLabel: { fa: "نمونه:", en: "Try:" },
  sections: { fa: "بخش‌ها", en: "Sections" },
  guide: { fa: "راهنما و منابع", en: "Guide and sources" },
  keys: { fa: "بالا و پایین: حرکت", en: "Up and down: move" },
  keysEnter: { fa: "باز کردن", en: "open" },
  keysEsc: { fa: "بستن", en: "close" },
  external: { fa: "پیوند بیرونی", en: "External link" },
  note: { fa: "فقط متن همین سایت جستجو می‌شود.", en: "Only the text of this site is searched." },
} satisfies Record<string, { fa: string; en: string }>;

const suggestions: { fa: string; en: string }[] = [
  { fa: "کاروانسرا", en: "caravanserai" },
  { fa: "محرم", en: "Muharram" },
  { fa: "سیب", en: "apple" },
  { fa: "گویش", en: "dialect" },
];

const nf = (lang: Locale) => (n: number) => n.toLocaleString(lang === "fa" ? "fa-IR" : "en-US");

function countText(lang: Locale, n: number, q: string) {
  const f = nf(lang)(n);
  if (n === 0) {
    return lang === "fa"
      ? `چیزی برای «${q}» پیدا نشد. کلمه‌ی کوتاه‌تری یا املای دیگری را امتحان کنید.`
      : `Nothing found for “${q}”. Try a shorter word or another spelling.`;
  }
  return lang === "fa" ? `${f} نتیجه` : n === 1 ? "1 result" : `${f} results`;
}

export function SiteSearch({ lang }: { lang: Locale }) {
  const [open, setOpen] = useState(false);
  const [mod, setMod] = useState<SearchMod | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const uid = useId();
  const listId = `${uid}-list`;

  const load = useCallback(() => {
    import("@/lib/search-index").then(setMod).catch(() => {});
  }, []);

  const show = useCallback(() => {
    opener.current = (document.activeElement as HTMLElement | null) ?? buttonRef.current;
    load();
    setOpen(true);
  }, [load]);

  // "/" opens search when no field is focused
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (document.querySelector("dialog[open]")) return;
      e.preventDefault();
      show();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [show]);

  // Open the native modal dialog (focus trap + inert background), lock scroll, focus the field
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!open || !dlg) return;
    if (!dlg.open) dlg.showModal();
    document.documentElement.classList.add("scroll-lock");
    inputRef.current?.focus();
    return () => document.documentElement.classList.remove("scroll-lock");
  }, [open]);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  // Fires for Escape, the close button and backdrop clicks alike
  const onClosed = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
    const o = opener.current;
    const back = o && o !== document.body && document.contains(o) ? o : buttonRef.current;
    back?.focus();
  }, []);

  const results = useMemo(() => {
    if (!mod || !query.trim()) return null;
    return mod.search(mod.buildIndex(), query, lang);
  }, [mod, query, lang]);

  const flat = useMemo(() => (results ? [...results.sections, ...results.guide] : []), [results]);
  const total = flat.length;
  const activeIdx = total ? Math.min(active, total - 1) : 0;

  useEffect(() => {
    if (!open || !total) return;
    document.getElementById(`${uid}-opt-${activeIdx}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, total, open, uid]);

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && total) {
      e.preventDefault();
      setActive((activeIdx + 1) % total);
    } else if (e.key === "ArrowUp" && total) {
      e.preventDefault();
      setActive((activeIdx - 1 + total) % total);
    } else if (e.key === "Home" && total && e.ctrlKey) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "Enter" && total) {
      e.preventDefault();
      (document.getElementById(`${uid}-opt-${activeIdx}`)?.querySelector("a") as HTMLAnchorElement | null)?.click();
    }
  }

  const t = (k: keyof typeof copy) => copy[k][lang];
  const dir = lang === "fa" ? "rtl" : "ltr";
  const q = query.trim();

  let counter = -1;
  function renderGroup(id: "sections" | "guide", hits: NonNullable<typeof results>["sections"], totalInGroup: number) {
    if (!hits.length || !mod) return null;
    const headId = `${uid}-g-${id}`;
    return (
      <div className="sr-group" role="group" aria-labelledby={headId} key={id}>
        <h3 className="sr-group__title eyebrow" id={headId}>
          {t(id)} <span className="sr-group__count">{nf(lang)(totalInGroup)}</span>
        </h3>
        <ul className="sr-list" role="presentation">
          {hits.map((h) => {
            counter++;
            const i = counter;
            const e = h.entry;
            const l = h.lang;
            const href = e.external ? e.path : `/${lang}${e.path ? `/${e.path}` : ""}`;
            const title = mod.highlight(e.title[l], results!.tokens);
            const ex = mod.excerpt(e.text[l], results!.tokens);
            const body = ex ? mod.highlight(ex, results!.tokens) : [];
            const parent = e.parent && e.parent[l] !== e.title[l] ? e.parent[l] : "";
            const foreign = l !== lang;
            return (
              <li
                key={e.id}
                id={`${uid}-opt-${i}`}
                role="option"
                aria-selected={i === activeIdx}
                className="sr-item"
                data-active={i === activeIdx ? "true" : undefined}
                onMouseMove={() => i !== activeIdx && setActive(i)}
              >
                <a
                  href={href}
                  tabIndex={-1}
                  {...(e.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  onClick={(ev) => {
                    if (e.external) return;
                    // Let Next handle the navigation via a plain anchor: close first so the scroll lock is released
                    ev.currentTarget.blur();
                    dialogRef.current?.close();
                  }}
                  className="sr-item__link"
                  lang={foreign ? l : undefined}
                  dir={foreign ? (l === "fa" ? "rtl" : "ltr") : undefined}
                >
                  <span className="sr-item__meta">
                    <span className="sr-item__kind">{e.kind[l]}</span>
                    {parent ? <span className="sr-item__parent">{parent}</span> : null}
                    {e.external ? <span className="sr-item__ext">{t("external")}</span> : null}
                  </span>
                  <span className="sr-item__title" {...(e.external ? { dir: "ltr", lang: "en" } : {})}>
                    {title.map((s, k) => (s.hit ? <mark key={k} className="sr-mark">{s.text}</mark> : <Fragment key={k}>{s.text}</Fragment>))}
                  </span>
                  {body.length ? (
                    <span className="sr-item__text" {...(e.external ? { dir: "ltr", lang: "en" } : {})}>
                      {body.map((s, k) => (s.hit ? <mark key={k} className="sr-mark">{s.text}</mark> : <Fragment key={k}>{s.text}</Fragment>))}
                    </span>
                  ) : null}
                </a>
              </li>
            );
          })}
        </ul>
        {totalInGroup > hits.length ? (
          <p className="sr-more">
            {lang === "fa" ? `${nf(lang)(totalInGroup - hits.length)} نتیجه‌ی دیگر. عبارت را دقیق‌تر کنید.` : `${totalInGroup - hits.length} more. Narrow your search to see them.`}
          </p>
        ) : null}
      </div>
    );
  }

  let status = "";
  if (open) {
    if (!q) status = "";
    else if (!mod) status = t("loading");
    else if (results) status = countText(lang, results.totals.sections + results.totals.guide, q);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="icon-btn"
        aria-label={t("button")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={show}
        onPointerEnter={load}
        onFocus={load}
      >
        <SearchIcon size={22} />
      </button>
      {open ? (
        <dialog
          ref={dialogRef}
          className="sr-dialog"
          aria-labelledby={`${uid}-title`}
          dir={dir}
          lang={lang}
          onClose={onClosed}
          onClick={(e) => {
            // click on the backdrop (the dialog element itself, outside the panel)
            if (e.target === dialogRef.current) close();
          }}
        >
          <div className="sr-panel">
            <div className="sr-head">
              <h2 id={`${uid}-title`} className="sr-head__title">{t("title")}</h2>
              <button type="button" className="icon-btn sr-close" onClick={close} aria-label={t("close")}>
                <CloseIcon size={22} />
              </button>
            </div>
            <div className="sr-field">
              <label htmlFor={`${uid}-input`} className="sr-only">{t("label")}</label>
              <SearchIcon size={20} className="sr-field__icon" />
              <input
                id={`${uid}-input`}
                ref={inputRef}
                className="sr-input"
                type="text"
                role="combobox"
                aria-expanded={total > 0}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={total ? `${uid}-opt-${activeIdx}` : undefined}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                placeholder={t("placeholder")}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
              />
              {query ? (
                <button
                  type="button"
                  className="sr-clear"
                  onClick={() => {
                    setQuery("");
                    setActive(0);
                    inputRef.current?.focus();
                  }}
                >
                  {t("clear")}
                </button>
              ) : null}
            </div>
            <p className="sr-status" role="status" aria-live="polite" aria-atomic="true">{status}</p>
            <div className="sr-body" ref={listRef}>
              <div id={listId} role="listbox" aria-label={t("title")} className="sr-results" hidden={!total}>
                {results ? (
                  <>
                    {renderGroup("sections", results.sections, results.totals.sections)}
                    {renderGroup("guide", results.guide, results.totals.guide)}
                  </>
                ) : null}
              </div>
              {!q ? (
                <div className="sr-empty">
                  <p>{t("hintA")} <kbd className="sr-kbd" dir="ltr">/</kbd> {t("hintB")}</p>
                  <div className="sr-try">
                    <span>{t("tryLabel")}</span>
                    {suggestions.map((s) => (
                      <button
                        key={s.en}
                        type="button"
                        className="tag sr-try__btn"
                        onClick={() => {
                          setQuery(s[lang]);
                          setActive(0);
                          inputRef.current?.focus();
                        }}
                      >
                        {s[lang]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {q && mod && results && total === 0 ? (
                <div className="sr-empty" aria-hidden="true">
                  <p>{countText(lang, 0, q)}</p>
                  <p className="sr-empty__note">{t("note")}</p>
                </div>
              ) : null}
            </div>
            <p className="sr-keys" aria-hidden="true">
              <span>{t("keys")}</span>
              <span><kbd className="sr-kbd" dir="ltr">Enter</kbd> {t("keysEnter")}</span>
              <span><kbd className="sr-kbd" dir="ltr">Esc</kbd> {t("keysEsc")}</span>
            </p>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
