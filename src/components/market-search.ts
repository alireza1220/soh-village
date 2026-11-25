// Client-side search for the market board. Persian-aware: Arabic letter forms, digits, ZWNJ, tatweel and diacritics are
// normalised on both sides, every word must match (AND), a word may match the start or middle of a word, and one typo is tolerated.
import { CATEGORY_SHORT, LISTING_CATEGORIES, LISTING_TYPE_LABELS, type Listing } from "@/lib/market";

const DROP = /[‌‍‎‏ـً-ٰٟۖ-ۭ]/;

/** Normalise text char by char; `idx[i]` is the index in the original string of normalised char i (for highlighting). */
export function normMap(s: string): { n: string; idx: number[] } {
  let n = "";
  const idx: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s[i];
    if (DROP.test(c)) continue;
    const code = c.charCodeAt(0);
    if (c === "ي" || c === "ى" || c === "ئ") c = "ی";
    else if (c === "ك") c = "ک";
    else if (c === "ة" || c === "ۀ") c = "ه";
    else if (c === "أ" || c === "إ" || c === "آ" || c === "ٱ") c = "ا";
    else if (c === "ؤ") c = "و";
    else if (code >= 0x06f0 && code <= 0x06f9) c = String(code - 0x06f0);
    else if (code >= 0x0660 && code <= 0x0669) c = String(code - 0x0660);
    else c = c.toLowerCase();
    for (const ch of c) { n += ch; idx.push(i); }
  }
  return { n, idx };
}
export const norm = (s: string) => normMap(s).n;

/** Query words (normalised, punctuation removed). */
export const tokens = (q: string) => norm(q).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

function lev1(a: string, b: string) {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return la > lb ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);
}

export type Indexed = { l: Listing; text: string; words: string[] };

export function indexListing(l: Listing): Indexed {
  const cat = LISTING_CATEGORIES.find((c) => c.v === l.category);
  const short = CATEGORY_SHORT[l.category];
  const type = LISTING_TYPE_LABELS.find((t) => t.v === l.type);
  const raw = [l.title, l.details, l.area, l.quantity, l.price, l.available, cat?.fa, cat?.en, short?.fa, short?.en, type?.fa, type?.en].filter(Boolean).join(" \n ");
  const text = norm(raw);
  return { l, text, words: text.split(/[^\p{L}\p{N}]+/u).filter(Boolean) };
}

export function matches(ix: Indexed, toks: string[]) {
  return toks.every((t) => {
    if (ix.text.includes(t)) return true;
    if (t.length < 4) return false;
    return ix.words.some((w) => lev1(t, w) || (w.length > t.length && lev1(t, w.slice(0, t.length))));
  });
}

/** Split `text` into pieces, flagging the parts that match a query word (exact substring only). */
export function highlight(text: string, toks: string[]): { s: string; hit: boolean }[] {
  if (!toks.length) return [{ s: text, hit: false }];
  const { n, idx } = normMap(text);
  const mark = new Array<boolean>(text.length).fill(false);
  let any = false;
  for (const t of toks) {
    let from = 0;
    for (;;) {
      const at = n.indexOf(t, from);
      if (at < 0) break;
      for (let k = at; k < at + t.length; k++) mark[idx[k]] = true;
      any = true;
      from = at + t.length;
    }
  }
  if (!any) return [{ s: text, hit: false }];
  // A dropped char (ZWNJ) between two marked chars should stay inside the mark.
  for (let i = 1; i < text.length - 1; i++) if (!mark[i] && mark[i - 1] && mark[i + 1] && DROP.test(text[i])) mark[i] = true;
  const out: { s: string; hit: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = out[out.length - 1];
    if (last && last.hit === mark[i]) last.s += text[i];
    else out.push({ s: text[i], hit: mark[i] });
  }
  return out;
}
