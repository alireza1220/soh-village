// SHARED CONTRACT. The four posting boards and how each maps onto the ONE listings table.
// No browser-only or Node-only APIs. Used by the API validation, the posting/edit forms and every board list.
// Owned by the architect: builders must not edit this file (report needed changes instead).
//
// A row is: board + type + category + title + quantity + price + area + available + details (+ contact, photos).
// What a board calls "quantity", "price", "area" and "available" is set in `fields` (label + example), so forms and
// fact lines are config-driven. Careers keeps its arrangement as a CODE in `quantity` (see ARRANGEMENTS).
import type { L, Locale } from "./i18n";
import { CATEGORY_SHORT, LISTING_CATEGORIES, LISTING_TYPES, type ListingType, type Opt } from "./market";

export const BOARD_IDS = ["market", "careers", "needs", "property"] as const;
export type BoardId = (typeof BOARD_IDS)[number];
export const isBoard = (v: unknown): v is BoardId => typeof v === "string" && (BOARD_IDS as readonly string[]).includes(v);
/** The route slug of a board page equals its id: /fa/market, /fa/careers, /fa/needs, /fa/property. */
export const boardPath = (lang: Locale, board: BoardId) => `/${lang}/${board}`;

export type Category = Opt & { short: L };
export type FieldCol = "quantity" | "price" | "area" | "available";
export type BoardField = {
  col: FieldCol;
  /** form label */
  label: L;
  /** short name in fact lines ("Size: 200 m") */
  short: L;
  /** placeholder / example */
  hint?: L;
  /** when set the form shows a select and the stored value is the option code */
  options?: Opt[];
  /** the form must not send the row without it */
  required?: boolean;
};
export type BoardConfig = {
  id: BoardId;
  title: L;
  /** types a NEW row may have (also what an edit may switch between) */
  types: Opt<ListingType>[];
  categories: Category[];
  titleLabel: L;
  titleHint: L;
  /** shown in this order in forms; `details` (textarea) always follows them */
  fields: BoardField[];
  detailsLabel: L;
  /** heading above the posting form and the main button on the list */
  formTitle: L;
  postCta: L;
  /** one-line intro above the live list */
  intro: L;
  empty: { title: L; text: L };
};

/** Careers: how the work is arranged. Stored as the code in listings.quantity. */
export const ARRANGEMENTS: Opt[] = [
  { v: "seasonal", fa: "فصلی", en: "Seasonal" },
  { v: "part", fa: "پاره‌وقت", en: "Part-time" },
  { v: "full", fa: "تمام‌وقت", en: "Full-time" },
  { v: "once", fa: "یک‌باره", en: "One-off" },
];

const cat = (v: string, fa: string, en: string, sfa = fa, sen = en): Category => ({ v, fa, en, short: { fa: sfa, en: sen } });

export const BOARDS: Record<BoardId, BoardConfig> = {
  market: {
    id: "market",
    title: { fa: "بازارچه", en: "Market" },
    types: LISTING_TYPES,
    categories: LISTING_CATEGORIES.map((c) => ({ ...c, short: CATEGORY_SHORT[c.v] ?? { fa: c.fa, en: c.en } })),
    titleLabel: { fa: "چه می‌فروشید یا می‌خواهید؟ (مثلاً گیلاس تازه)", en: "What do you sell or want? (e.g. fresh cherries)" },
    titleHint: { fa: "گیلاس تازه", en: "Fresh cherries" },
    fields: [
      { col: "quantity", label: { fa: "مقدار یا حجم کار (مثلاً ۵ کیلو)", en: "Amount or job size (e.g. 5 kg)" }, short: { fa: "مقدار", en: "Amount" } },
      { col: "price", label: { fa: "قیمت یا دستمزد به تومان (یا «توافقی»)", en: "Price or pay in toman (or “negotiable”)" }, short: { fa: "قیمت", en: "Price" } },
      { col: "area", label: { fa: "منطقه و محل تحویل", en: "Area and pickup place" }, short: { fa: "منطقه", en: "Area" } },
      { col: "available", label: { fa: "چه زمانی؟ (مثلاً اواسط خرداد)", en: "When? (e.g. mid-June)" }, short: { fa: "زمان", en: "When" } },
    ],
    detailsLabel: { fa: "توضیح بیشتر", en: "More details" },
    formTitle: { fa: "آگهی خود را بنویسید", en: "Write your listing" },
    postCta: { fa: "آگهی بگذارید", en: "Post an ad" },
    intro: { fa: "آگهی‌های همسایه‌ها. پرداخت و کمیسیونی در کار نیست؛ مستقیم با آگهی‌دهنده حرف بزنید.", en: "Ads from neighbours. No payments, no fees: talk to the poster directly." },
    empty: { title: { fa: "هنوز آگهی‌ای نیست", en: "No ads yet" }, text: { fa: "اولین آگهی را شما بگذارید.", en: "Be the first to post." } },
  },
  careers: {
    id: "careers",
    title: { fa: "فرصت‌های شغلی", en: "Careers" },
    types: [
      { v: "seeking", fa: "دنبال کار هستم", en: "I am looking for work" },
      { v: "hiring", fa: "کارگر یا همکار می‌خواهم", en: "I am hiring" },
    ],
    categories: [
      cat("farm", "باغ و کشاورزی", "Orchard and farm"),
      cat("craft", "قالی و صنایع دستی", "Carpets and crafts", "صنایع دستی", "Crafts"),
      cat("tourism", "گردشگری و راهنمایی", "Tourism and guiding", "گردشگری", "Tourism"),
      cat("building", "مرمت و ساخت‌وساز", "Restoration and building", "ساخت‌وساز", "Building"),
      cat("driving", "رانندگی و حمل", "Driving and transport", "حمل و نقل", "Transport"),
      cat("remote", "کار از راه دور", "Remote work"),
      cat("other", "دیگر", "Other"),
    ],
    titleLabel: { fa: "کار یا مهارت", en: "Job or skill" },
    titleHint: { fa: "کارگر برای چیدن سیب", en: "Workers for the apple harvest" },
    fields: [
      { col: "quantity", label: { fa: "نوع همکاری", en: "Arrangement" }, short: { fa: "همکاری", en: "Arrangement" }, options: ARRANGEMENTS, required: true },
      { col: "price", label: { fa: "دستمزد به تومان (یا «توافقی»)", en: "Pay in toman (or “negotiable”)" }, short: { fa: "دستمزد", en: "Pay" } },
      { col: "area", label: { fa: "محل کار (سُه، میمه، از راه دور ...)", en: "Where (Soh, Meymeh, remote ...)" }, short: { fa: "محل", en: "Where" } },
      { col: "available", label: { fa: "از چه زمانی؟ (مثلاً از اول مهر)", en: "From when? (e.g. from October)" }, short: { fa: "شروع", en: "Start" } },
    ],
    detailsLabel: { fa: "توضیح (شرایط، ساعت کار، مهارت لازم)", en: "Details (conditions, hours, skills)" },
    formTitle: { fa: "آگهی کاری خود را بنویسید", en: "Write your job post" },
    postCta: { fa: "آگهی کاری بگذارید", en: "Post a job" },
    intro: { fa: "کار در سُه و اطراف، و کارجویان. برای کار پول نپردازید.", en: "Work in and around Soh, and people looking for work. Never pay to get a job." },
    empty: { title: { fa: "هنوز آگهی کاری نیست", en: "No job posts yet" }, text: { fa: "کار دارید یا دنبال کارید؟ اولین آگهی را بگذارید.", en: "Have work, or need it? Post the first one." } },
  },
  needs: {
    id: "needs",
    title: { fa: "نیازمندی‌ها", en: "Requests" },
    types: [
      { v: "need", fa: "نیاز دارم", en: "I need" },
      { v: "offer", fa: "پیشنهاد دارم", en: "I can offer" },
    ],
    categories: [
      cat("stay", "اقامت", "A place to stay"),
      cat("transport", "رفت‌وآمد", "Transport"),
      cat("repair", "ساخت و تعمیر", "Building and repair", "تعمیر", "Repair"),
      cat("farm", "باغ و کشاورزی", "Orchard and farm"),
      cat("food", "فرآورده‌ی محلی", "Local products", "محلی", "Local"),
      cat("guide", "راهنمای گردشگری", "Local guide", "راهنما", "Guide"),
      cat("help", "کار اداری و ترجمه", "Paperwork and translation", "کار اداری", "Paperwork"),
      cat("other", "دیگر", "Other"),
    ],
    titleLabel: { fa: "چه لازم دارید یا چه پیشنهاد می‌دهید؟", en: "What do you need or offer?" },
    titleHint: { fa: "اتاق برای دو شب", en: "A room for two nights" },
    fields: [
      { col: "quantity", label: { fa: "چه مقدار؟ (اختیاری)", en: "How much? (optional)" }, short: { fa: "مقدار", en: "Amount" } },
      { col: "price", label: { fa: "بودجه یا قیمت (اختیاری)", en: "Budget or price (optional)" }, short: { fa: "قیمت", en: "Price" } },
      { col: "area", label: { fa: "منطقه", en: "Area" }, short: { fa: "منطقه", en: "Area" } },
      { col: "available", label: { fa: "چه زمانی؟", en: "When?" }, short: { fa: "زمان", en: "When" } },
    ],
    detailsLabel: { fa: "توضیح (مکان، زمان، شرایط)", en: "Details (place, timing, conditions)" },
    formTitle: { fa: "نیاز یا پیشنهاد خود را بنویسید", en: "Write your request or offer" },
    postCta: { fa: "نیاز یا پیشنهاد بگذارید", en: "Post a request or offer" },
    intro: { fa: "مثل تابلوی نیازمندی‌های روستا. شماره‌ی تماس فقط با اجازه‌ی شما دیده می‌شود.", en: "Like the village notice board. Your number shows only if you allow it." },
    empty: { title: { fa: "هنوز نیازمندی‌ای نیست", en: "Nothing posted yet" }, text: { fa: "نیاز یا پیشنهادتان را بنویسید.", en: "Post what you need or can offer." } },
  },
  property: {
    id: "property",
    title: { fa: "خرید و فروش ملک", en: "Property" },
    types: [
      { v: "sell", fa: "برای فروش", en: "For sale" },
      { v: "rent", fa: "برای اجاره", en: "For rent" },
      { v: "need", fa: "دنبال ملک هستم", en: "Wanted" },
    ],
    categories: [
      cat("house", "خانه", "House"),
      cat("orchard", "باغ", "Orchard"),
      cat("farmland", "زمین کشاورزی", "Farmland", "زمین زراعی", "Farmland"),
      cat("plot", "زمین", "Plot of land", "زمین", "Plot"),
      cat("shop", "مغازه", "Shop"),
      cat("other", "دیگر", "Other"),
    ],
    titleLabel: { fa: "چه ملکی؟ (مثلاً باغ ۲۰۰۰ متری)", en: "Which property? (e.g. 2,000 m² orchard)" },
    titleHint: { fa: "باغ ۲۰۰۰ متری", en: "2,000 m² orchard" },
    fields: [
      { col: "quantity", label: { fa: "متراژ (مثلاً ۲۰۰۰ متر)", en: "Size (e.g. 2,000 m²)" }, short: { fa: "متراژ", en: "Size" } },
      { col: "price", label: { fa: "قیمت به تومان (یا «توافقی»)", en: "Price in toman (or “negotiable”)" }, short: { fa: "قیمت", en: "Price" } },
      { col: "area", label: { fa: "محله یا آدرس تقریبی", en: "Neighbourhood or rough address" }, short: { fa: "محل", en: "Place" } },
      { col: "available", label: { fa: "نوع سند (مثلاً شش‌دانگ)", en: "Deed type (e.g. full title)" }, short: { fa: "سند", en: "Deed" } },
    ],
    detailsLabel: { fa: "توضیح (آب، راه، ساختمان، شرایط)", en: "Details (water, road, buildings, conditions)" },
    formTitle: { fa: "آگهی ملک را بنویسید", en: "Write your property ad" },
    postCta: { fa: "آگهی ملک بگذارید", en: "Post a property" },
    intro: { fa: "خانه، باغ و زمین در سُه. پیش از خرید سند و مالک را در دفترخانه بررسی کنید.", en: "Houses, orchards and land in Soh. Check the deed and owner at a notary before buying." },
    empty: { title: { fa: "هنوز آگهی ملکی نیست", en: "No property ads yet" }, text: { fa: "ملکی دارید یا دنبال ملکید؟ آگهی بگذارید.", en: "Selling, renting or looking? Post an ad." } },
  },
};

/** Names for old row types that no board offers any more, so a saved row still reads in both languages. */
const LEGACY_TYPES: Opt<ListingType>[] = [
  { v: "service", fa: "خدمت می‌دهم", en: "Service offered" },
  { v: "seeking", fa: "دنبال کار", en: "Looking for work" },
  { v: "hiring", fa: "کارگر می‌خواهم", en: "Hiring" },
  { v: "offer", fa: "پیشنهاد", en: "Offer" },
  { v: "rent", fa: "اجاره", en: "For rent" },
];

/** Type name as that board words it; falls back to older names, then to the raw value. */
export function typeLabel(board: BoardId | undefined, type: string, lang: Locale): string {
  const b = BOARDS[board ?? "market"];
  return (b.types.find((t) => t.v === type) ?? LEGACY_TYPES.find((t) => t.v === type) ?? LISTING_TYPES.find((t) => t.v === type))?.[lang] ?? type;
}

/** Category name (full or short) for a board; unknown codes fall back to the raw value. */
export function categoryLabel(board: BoardId | undefined, category: string, lang: Locale, short = false): string {
  const c = BOARDS[board ?? "market"].categories.find((x) => x.v === category);
  return c ? (short ? c.short[lang] : c[lang]) : category;
}

/** Is `type` allowed on `board`? create = only what the board offers; update = also the older names the row may already carry. */
export function typeAllowed(board: BoardId, type: string, mode: "create" | "update", current?: string): boolean {
  if (BOARDS[board].types.some((t) => t.v === type)) return true;
  return mode === "update" && type === current;
}

export const categoryAllowed = (board: BoardId, category: string, mode: "create" | "update", current?: string): boolean =>
  BOARDS[board].categories.some((c) => c.v === category) || (mode === "update" && category === current);

/** Valid careers arrangement code? (quantity on the careers board) */
export const isArrangement = (v: unknown): boolean => typeof v === "string" && ARRANGEMENTS.some((a) => a.v === v);

/** "Size: 200 m" style facts for a list row or detail view, in the board's own words. Empty values are skipped. */
export function factsOf(
  board: BoardId | undefined,
  l: { quantity?: string | null; price?: string | null; area?: string | null; available?: string | null },
  lang: Locale,
): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  for (const f of BOARDS[board ?? "market"].fields) {
    const raw = l[f.col];
    if (!raw || raw === "—") continue;
    const value = f.options ? f.options.find((o) => o.v === raw)?.[lang] ?? raw : raw;
    out.push({ label: f.short[lang], value });
  }
  return out;
}
