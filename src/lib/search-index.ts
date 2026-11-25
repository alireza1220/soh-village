import type { L, Locale } from "./i18n";
import { photos } from "./photos";
import { socialPosts } from "./social-embeds";
import { youtubeVideos } from "./youtube";
import { contact, contribute, mapApproaches, mapInfo, mapRoad, mapServices, sections, siteName, sources, tagline } from "./site";
import type { Block } from "./site";

// Client-side site search. No network: the index is built from the same data the pages use.
// This module is imported lazily (dynamic import) the first time the search dialog opens, so it stays out of the main bundle.
// Not indexed: the research-link list behind /references (it is read from files on the server, about 200 links); the
// Guide and sources group covers the sources written into site.ts and the guide pages instead.

export type Group = "sections" | "guide";
export type Entry = {
  id: number;
  group: Group;
  /** Path under the language prefix ("history", "map") or an absolute external URL. */
  path: string;
  external: boolean;
  /** Short kind label, for example "Section", "Source". */
  kind: L;
  /** Parent section title for items found inside a section. */
  parent?: L;
  title: L;
  text: L;
  // Precomputed, normalised
  nt: Record<Locale, string>;
  nx: Record<Locale, string>;
  tw: Record<Locale, string[]>;
  xw: Record<Locale, string[]>;
  boost: number;
};

// ---------- normalisation ----------

const ARABIC_DIGIT_0 = 0x0660;
const PERSIAN_DIGIT_0 = 0x06f0;
const COMBINING = /[̀-ͯ]/g;

/** Normalise one character. Returns "" to drop it. Result may be longer than one char only for odd Latin letters. */
function normChar(ch: string): string {
  const c = ch.charCodeAt(0);
  if (c === 0x200c || c === 0x200d || c === 0x200f || c === 0x200e || c === 0x0640) return ""; // ZWNJ, ZWJ, marks, tatweel
  if ((c >= 0x064b && c <= 0x065f) || c === 0x0670 || (c >= 0x06d6 && c <= 0x06ed)) return ""; // Arabic diacritics
  if (c === 0x064a || c === 0x0649) return "ی"; // ي ى -> ی
  if (c === 0x0643) return "ک"; // ك -> ک
  if (c === 0x06c0 || c === 0x0629) return "ه"; // ۀ ة -> ه
  if (c >= ARABIC_DIGIT_0 && c <= ARABIC_DIGIT_0 + 9) return String(c - ARABIC_DIGIT_0);
  if (c >= PERSIAN_DIGIT_0 && c <= PERSIAN_DIGIT_0 + 9) return String(c - PERSIAN_DIGIT_0);
  if (c === 0x066b || c === 0x066c) return ""; // Arabic decimal / thousands separators: 2,350 and ۲٬۳۵۰ both become 2350
  if (c === 0x2019 || c === 0x2018 || c === 0x02bb) return "'";
  if (c < 0x80) return ch.toLowerCase();
  return ch.normalize("NFD").replace(COMBINING, "").toLowerCase();
}

/** Normalised string plus, for each normalised char, the index of its source char (for highlighting). */
export function normalizeWithMap(text: string): { s: string; map: number[] } {
  let s = "";
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const n = normChar(text[i]);
    for (let k = 0; k < n.length; k++) {
      s += n[k];
      map.push(i);
    }
  }
  return { s, map };
}

export function normalize(text: string): string {
  let s = "";
  for (let i = 0; i < text.length; i++) s += normChar(text[i]);
  // Latin thousands separators between digits: 2,350 -> 2350
  return s.replace(/(\d)[, ](?=\d{3}\b)/g, "$1");
}

const SPLIT = /[^\p{L}\p{N}]+/u;
export const tokenize = (norm: string) => norm.split(SPLIT).filter(Boolean);

// ---------- building ----------

type Draft = Omit<Entry, "id" | "nt" | "nx" | "tw" | "xw" | "boost" | "external"> & { boost?: number };

const kinds = {
  section: { fa: "بخش", en: "Section" },
  card: { fa: "مطلب", en: "Item" },
  page: { fa: "صفحه", en: "Page" },
  source: { fa: "منبع", en: "Source" },
  photo: { fa: "عکس", en: "Photo" },
  video: { fa: "ویدیو", en: "Video" },
  post: { fa: "پست", en: "Post" },
  word: { fa: "واژه", en: "Word" },
  note: { fa: "یادداشت", en: "Note" },
  table: { fa: "جدول", en: "Table row" },
  tags: { fa: "فهرست", en: "List" },
  how: { fa: "راه رسیدن", en: "Getting there" },
} satisfies Record<string, L>;

const join = (parts: (L | string | undefined)[]): L => ({
  fa: parts.map((p) => (typeof p === "string" ? p : p?.fa)).filter(Boolean).join(" · "),
  en: parts.map((p) => (typeof p === "string" ? p : p?.en)).filter(Boolean).join(" · "),
});

function blockEntries(slug: string, sectionTitle: L, block: Block, out: Draft[]) {
  const base = { group: "sections" as const, path: slug, parent: sectionTitle };
  switch (block.t) {
    case "p":
      out.push({ ...base, kind: kinds.note, title: sectionTitle, text: block.text });
      break;
    case "cards":
      for (const c of block.items) {
        out.push({ ...base, kind: kinds.card, title: c.title, text: join([c.text, c.fa, c.source]), boost: 2 });
      }
      break;
    case "tags":
      for (const item of block.items) out.push({ ...base, kind: kinds.tags, title: item, text: block.label ?? { fa: "", en: "" } });
      break;
    case "links":
      for (const l of block.items) {
        out.push({ group: "guide", path: l.url, kind: kinds.source, parent: sectionTitle, title: l.name, text: join([l.note, l.url]), boost: 1 });
      }
      break;
    case "dl":
      for (const i of block.items) out.push({ ...base, kind: kinds.card, title: i.k, text: i.v });
      break;
    case "table":
      for (const row of block.rows) {
        out.push({
          ...base,
          kind: slug === "words" ? kinds.word : kinds.table,
          title: row[0] ?? sectionTitle,
          text: {
            fa: row.slice(1).map((c) => c.fa).filter(Boolean).join(" · "),
            en: row.slice(1).map((c) => c.en).filter(Boolean).join(" · "),
          },
        });
      }
      break;
    case "notice":
      out.push({ ...base, kind: kinds.note, title: block.title, text: { fa: block.items.map((i) => i.fa).join(" "), en: block.items.map((i) => i.en).join(" ") } });
      break;
  }
}

const guidePages: { path: string; title: L; text: L }[] = [
  {
    path: "references",
    title: { fa: "راهنما و منابع", en: "Guide and sources" },
    text: {
      fa: "راهنمای سایت، برچسب‌های گزارش‌شده و تأییدنشده، و پیوندهای تحقیق.",
      en: "How to read this site, the labels, and research links.",
    },
  },
  {
    path: "credits",
    title: { fa: "منبع عکس‌ها", en: "Photo credits" },
    text: {
      fa: "عکاس، مجوز و منبع هر عکس. عکس‌های منطقه برچسب «عکس منطقه، نه سُه» دارند.",
      en: "Photographer, licence and source of each photo. Region photos say “Region photo, not Soh”.",
    },
  },
  {
    path: "contribute",
    title: { fa: "مشارکت", en: "Contribute" },
    text: join([contact.note]),
  },
  {
    path: "news",
    title: { fa: "خبر و رویداد", en: "News & events" },
    text: {
      fa: "خبرها، نوشته‌ها و رویدادهای پیش‌روی سُه، با تاریخ و مکان.",
      en: "News, blog posts and upcoming events from Soh, with dates and places.",
    },
  },
  {
    path: "my",
    title: { fa: "آگهی‌های من", en: "My ads" },
    text: {
      fa: "آگهی‌های خودتان را ببینید، ویرایش، تمدید یا حذف کنید. نیاز به ورود دارد.",
      en: "See, edit, renew or remove your own ads. Needs a login.",
    },
  },
];

function buildDrafts(): Draft[] {
  const d: Draft[] = [];

  for (const s of sections) {
    d.push({ group: "sections", path: s.slug, kind: kinds.section, title: s.title, text: s.intro, boost: 8 });
    for (const b of s.blocks) blockEntries(s.slug, s.title, b, d);
  }

  // Static pages in the Sections group
  d.push({
    group: "sections", path: "map", kind: kinds.page, boost: 8,
    title: { fa: "نقشه", en: "Map" },
    text: join([mapInfo.note]),
  });
  d.push({ group: "sections", path: "map", kind: kinds.how, parent: { fa: "نقشه", en: "Map" }, title: mapRoad.title, text: { fa: [mapRoad.lead.fa, ...mapRoad.steps.map((s) => s.fa), mapRoad.distances.fa].join(" "), en: [mapRoad.lead.en, ...mapRoad.steps.map((s) => s.en), mapRoad.distances.en].join(" ") } });
  for (const a of mapApproaches) d.push({ group: "sections", path: "map", kind: kinds.how, parent: { fa: "نقشه", en: "Map" }, title: a.title, text: a.text, boost: 1 });
  for (const s of mapServices) d.push({ group: "sections", path: s.slug, kind: kinds.card, parent: { fa: "نقشه", en: "Map" }, title: s.title, text: s.text });

  d.push({
    group: "sections", path: "photos", kind: kinds.page, boost: 8,
    title: { fa: "عکس‌ها و ویدیوها", en: "Photos and videos" },
    text: { fa: "عکس‌های سُه و منطقه، با نام عکاس و مجوز، و ویدیوها و پست‌های یوتیوب، فیسبوک و اینستاگرام. عکس‌های منطقه برچسب دارند.", en: "Photos of Soh and the region, with photographer and licence, plus YouTube, Facebook and Instagram videos and posts. Region photos are labelled." },
  });
  const seen = new Set<string>();
  for (const p of photos) {
    const key = `${p.file}|${p.caption.en}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const label: L = p.scope === "region" ? { fa: "عکس منطقه، نه سُه", en: "Region photo, not Soh" } : { fa: "", en: "" };
    d.push({ group: "sections", path: "photos", kind: kinds.photo, parent: { fa: "عکس‌ها و ویدیوها", en: "Photos and videos" }, title: p.alt, text: join([label, p.caption, p.credit]) });
  }

  const gallery: L = { fa: "عکس‌ها و ویدیوها", en: "Photos and videos" };
  for (const v of youtubeVideos) d.push({ group: "sections", path: "photos", kind: kinds.video, parent: gallery, title: v.title, text: join([v.note, v.channel]) });
  for (const x of socialPosts) d.push({ group: "sections", path: "photos", kind: kinds.post, parent: gallery, title: x.title, text: join([x.note, x.account]) });

  // Guide and sources group
  for (const g of guidePages) d.push({ group: "guide", path: g.path, kind: kinds.page, title: g.title, text: g.text, boost: 8 });
  for (const c of contribute) {
    d.push({
      group: "guide", path: "contribute", kind: kinds.note, parent: { fa: "مشارکت", en: "Contribute" }, title: c.title,
      text: { fa: [...c.send.map((s) => s.fa), c.tip?.fa ?? ""].join(" · "), en: [...c.send.map((s) => s.en), c.tip?.en ?? ""].join(" · ") },
    });
  }
  for (const s of sources) {
    d.push({ group: "guide", path: s.url, kind: kinds.source, title: { fa: s.name, en: s.name }, text: { fa: s.url, en: s.url }, boost: 1 });
  }
  // Site name and tagline, so "Soh" and "village" find the home page
  d.push({ group: "sections", path: "", kind: kinds.page, title: siteName, text: tagline, boost: 4 });
  return d;
}

export type Index = { entries: Entry[] };
let cached: Index | null = null;

export function buildIndex(): Index {
  if (cached) return cached;
  const entries = buildDrafts().map((d, id): Entry => {
    const nt = { fa: normalize(d.title.fa), en: normalize(d.title.en) };
    const nx = { fa: normalize(d.text.fa), en: normalize(d.text.en) };
    return {
      ...d,
      id,
      external: /^https?:\/\//.test(d.path),
      nt,
      nx,
      tw: { fa: tokenize(nt.fa), en: tokenize(nt.en) },
      xw: { fa: tokenize(nx.fa), en: tokenize(nx.en) },
      boost: d.boost ?? 0,
    };
  });
  cached = { entries };
  return cached;
}

// ---------- searching ----------

export type Hit = { entry: Entry; lang: Locale; score: number };
export type Results = { sections: Hit[]; guide: Hit[]; totals: Record<Group, number>; tokens: string[] };
export const PER_GROUP = 8;

function scoreIn(entry: Entry, lang: Locale, tokens: string[], whole: string): number {
  const nt = entry.nt[lang];
  const nx = entry.nx[lang];
  if (!nt && !nx) return 0;
  const tw = entry.tw[lang];
  const xw = entry.xw[lang];
  let total = 0;
  for (const tok of tokens) {
    let best = 0;
    if (tw.includes(tok)) best = 40;
    else if (tw.some((w) => w.startsWith(tok))) best = 30;
    else if (nt.includes(tok)) best = 20;
    else if (xw.includes(tok)) best = 10;
    else if (xw.some((w) => w.startsWith(tok))) best = 7;
    else if (nx.includes(tok)) best = 4;
    if (!best) return 0; // every word must match
    total += best;
  }
  if (nt === whole) total += 60;
  else if (nt.startsWith(whole)) total += 30;
  else if (nt.includes(whole)) total += 15;
  else if (tokens.length > 1 && nx.includes(whole)) total += 8;
  return total + entry.boost;
}

export function search(index: Index, query: string, lang: Locale): Results {
  const whole = normalize(query).trim().replace(/\s+/g, " ");
  const tokens = tokenize(whole);
  const empty: Results = { sections: [], guide: [], totals: { sections: 0, guide: 0 }, tokens };
  if (!tokens.length) return empty;
  const other: Locale = lang === "fa" ? "en" : "fa";
  const hits: Hit[] = [];
  for (const entry of index.entries) {
    // Page language first; the other language only if the page language has no match (so "caravanserai" still works on the Persian site)
    let score = scoreIn(entry, lang, tokens, whole);
    let used: Locale = lang;
    if (!score) {
      score = scoreIn(entry, other, tokens, whole);
      used = other;
    }
    if (score) hits.push({ entry, lang: used, score });
  }
  hits.sort((a, b) => b.score - a.score || a.entry.id - b.entry.id);
  const res: Results = { sections: [], guide: [], totals: { sections: 0, guide: 0 }, tokens };
  for (const h of hits) {
    const g = h.entry.group;
    res.totals[g]++;
    if (res[g].length < PER_GROUP) res[g].push(h);
  }
  return res;
}

// ---------- highlighting ----------

export type Segment = { text: string; hit: boolean };

/** Split `text` into segments, marking the parts that match any token. Positions map back through the normalisation. */
export function highlight(text: string, tokens: string[]): Segment[] {
  if (!text) return [];
  const { s, map } = normalizeWithMap(text);
  const marks = new Array<boolean>(text.length).fill(false);
  let any = false;
  for (const tok of tokens) {
    if (!tok) continue;
    let from = 0;
    for (;;) {
      const at = s.indexOf(tok, from);
      if (at === -1) break;
      for (let k = at; k < at + tok.length; k++) marks[map[k]] = true;
      any = true;
      from = at + tok.length;
    }
  }
  if (!any) return [{ text, hit: false }];
  const out: Segment[] = [];
  let cur = "";
  let state = marks[0];
  for (let i = 0; i < text.length; i++) {
    if (marks[i] !== state) {
      out.push({ text: cur, hit: state });
      cur = "";
      state = marks[i];
    }
    cur += text[i];
  }
  out.push({ text: cur, hit: state });
  return out;
}

/** One-line excerpt (about `max` chars) centred on the first match in `text`; falls back to the start. */
export function excerpt(text: string, tokens: string[], max = 120): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const { s, map } = normalizeWithMap(flat);
  let at = -1;
  for (const tok of tokens) {
    const i = s.indexOf(tok);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1 || map[at] < max - 30) return flat.slice(0, max).replace(/\s+\S*$/, "") + "…";
  const origin = map[at];
  let start = Math.max(0, origin - 40);
  // do not start in the middle of a word
  const sp = flat.indexOf(" ", start);
  if (start > 0 && sp !== -1 && sp < origin) start = sp + 1;
  let end = Math.min(flat.length, start + max);
  if (end < flat.length) end = flat.lastIndexOf(" ", end) > start ? flat.lastIndexOf(" ", end) : end;
  return (start > 0 ? "…" : "") + flat.slice(start, end) + (end < flat.length ? "…" : "");
}
