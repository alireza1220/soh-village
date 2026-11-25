import type { L, Locale } from "./i18n";
import { photos, type Photo } from "./photos";
import { sectionBySlug, type Section, type Status } from "./site";

// Bilingual copy and data for the home page. Facts come from site.ts or are labelled with their source here.
// Server-side only: client components receive plain props from src/app/[lang]/page.tsx.

/** First photo from src/lib/photos.ts whose file name is in the list (registered photos only, so credit and licence are always known). */
export function photoOf(...files: string[]): Photo | undefined {
  for (const f of files) {
    const p = photos.find((x) => x.file === f);
    if (p) return p;
  }
  return undefined;
}

/** Hero order from the design spec. Files not yet registered in photos.ts are skipped; karkas-peak fills the gap. */
export const heroFiles = ["opening.jpg", "karkas-mountain.jpg", "abyaneh.jpg", "madar-shah-caravanserai.jpg", "karkas-peak.jpg"];

export const hc = {
  heroLabel: { fa: "عکس‌های سُه و اطراف آن", en: "Photos of Soh and its surroundings" },
  pause: { fa: "توقف نمایش اسلایدها", en: "Pause slideshow" },
  play: { fa: "پخش نمایش اسلایدها", en: "Play slideshow" },
  slideOf: { fa: "از", en: "of" },
  slide: { fa: "اسلاید", en: "Slide" },
  goTo: { fa: "رفتن به اسلاید", en: "Go to slide" },

  welcomeEyebrow: { fa: "به روستای سُه خوش آمدید", en: "Welcome to Soh village" },
  welcomeTitle: { fa: "روستایی در دامنه‌ی کوه‌های کرکس", en: "A mountain village in the Karkas range" },
  welcomeP1: {
    fa: "راهنمای سُه: کجاست و چه دارد. هر مطلب منبع دارد؛ تأییدنشده‌ها برچسب دارند.",
    en: "A guide to Soh and what is in it. Every fact has a source; unchecked ones are labelled.",
  },
  welcomeP2: {
    fa: "کاروانسرایی قاجاری، دو امامزاده‌ی گنبدفیروزه‌ای و باغ‌های سیب.",
    en: "A Qajar caravanserai, two turquoise-domed shrines and apple orchards.",
  },
  welcomeCta: { fa: "گشت در سُه", en: "Explore Soh" },

  exploreEyebrow: { fa: "گشت در سُه", en: "Explore Soh" },
  exploreTitle: { fa: "از کجا شروع کنیم؟", en: "Where to begin" },
  exploreLabel: { fa: "بخش‌های اصلی", en: "Main sections" },
  tabHistory: { fa: "تاریخ", en: "History" },
  tabSights: { fa: "جاهای دیدنی", en: "Sights" },
  tabTraditions: { fa: "آیین‌ها", en: "Traditions" },
  openSection: { fa: "باز کردن بخش", en: "Open" },
  planEyebrow: { fa: "برنامه‌ی سفر", en: "Plan your visit" },
  planViewAll: { fa: "همه‌ی راهنمای سفر", en: "View all" },

  yearEyebrow: { fa: "سال در روستا", en: "The village year" },
  yearTitle: { fa: "آیین‌ها و فصل‌ها", en: "Traditions and seasons" },
  yearIntro: {
    fa: "تاریخ دقیق نیست؛ هر ردیف را منبعش می‌گوید.",
    en: "Not exact dates. Each row follows its source.",
  },
  filterLabel: { fa: "فیلتر ردیف‌ها", en: "Filter rows" },
  fAll: { fa: "همه", en: "All" },
  fTraditions: { fa: "آیین‌ها", en: "Traditions" },
  fSeasons: { fa: "فصل‌ها", en: "Seasons" },
  fVisit: { fa: "سفر", en: "Visit" },
  showing: { fa: "نمایش", en: "Showing" },
  showingOf: { fa: "از", en: "of" },
  sourceLabel: { fa: "منبع", en: "Source" },
  cardTraditions: { fa: "آیین‌ها", en: "Traditions" },
  cardHistory: { fa: "تاریخ", en: "History" },
  statusReported: { fa: "گزارش‌شده", en: "Reported" },
  statusUnverified: { fa: "تأییدنشده", en: "Unverified" },
  statusFamily: { fa: "از خانواده", en: "Family" },

  marketEyebrow: { fa: "از بازارچه‌ی روستا", en: "From the village market" },
  marketTitle: { fa: "تازه‌ترین آگهی‌ها", en: "Latest listings" },
  marketIntro: { fa: "آگهی‌ها بی‌درنگ و بدون بررسی مدیر منتشر می‌شوند. پرداخت بیرون از سایت است.", en: "Ads go live without an admin check. Payment happens off-site." },
  marketEmpty: { fa: "هنوز آگهی‌ای نیست. اولین نفر باشید.", en: "No listings yet. Be the first." },
  marketExample: { fa: "نمونه‌ی آگهی (واقعی نیست)", en: "Sample listing (not real)" },
  marketExampleTitle: { fa: "گیلاس تازه‌ی باغ", en: "Fresh orchard cherries" },
  marketExampleMeta: { fa: "سُه، تحویل در باغ", en: "Soh, pickup at the orchard" },
  marketCta: { fa: "بازارچه", en: "Browse the market" },
  marketPost: { fa: "ثبت آگهی", en: "Post a listing" },
  readMore: { fa: "ادامه", en: "Read more" },
  area: { fa: "منطقه", en: "Area" },
  until: { fa: "تا", en: "Until" },

  guideEyebrow: { fa: "از راهنما", en: "From the guide" },
  guideTitle: { fa: "بیشتر بخوانید", en: "Keep reading" },
  guideAll: { fa: "راهنما و منابع", en: "Guide and sources" },
  allSections: { fa: "همه‌ی بخش‌ها", en: "All sections" },

  glanceEyebrow: { fa: "یک نگاه", en: "At a glance" },
  mapTitle: { fa: "نقشه", en: "Map" },
  popTitle: { fa: "جمعیت", en: "Population" },
  households: { fa: "خانوار", en: "households" },
  popNote: {
    fa: "مرکز آمار ایران، از ویکی‌پدیا. کجارو: حدود ۱۰۰۰ نفر در بهار و تابستان؛ گردشنامه: تا ۵۰۰۰ در اوج سفر. سرشماری نیستند و با هم نمی‌خوانند.",
    en: "Statistical Centre of Iran, via Wikipedia. Visitors: Kojaro says about 1,000 in spring and summer, Gardeshnama up to 5,000 at peaks. Not census; they disagree.",
  },

  ctaTitle: { fa: "به ساختن این سایت کمک کنید", en: "Help build this site" },
  ctaText: {
    fa: "عکس، واژه، خاطره یا اصلاحی دارید؟ پیش از انتشار بررسی می‌شود. آگهی را خودتان در بخش آگهی‌ها بگذارید؛ بی‌درنگ منتشر می‌شود.",
    en: "A photo, word, memory or correction? It is checked before publishing. Post ads yourself on the ad boards; they go live at once.",
  },
  ctaButton: { fa: "مشارکت", en: "Contribute" },
} satisfies Record<string, L>;

export type YearFilter = "traditions" | "seasons" | "visit";
export type YearRow = { id: string; filters: YearFilter[]; big: L; small: L; title: L; text: L; source: L; section: string; wordy?: boolean };

// Rows use words, not invented dates. Each text restates what an existing, sourced entry on this site says.
export const yearRows: YearRow[] = [
  {
    id: "muharram", filters: ["traditions"], big: { fa: "۸ تا ۱۰", en: "8-10" }, small: { fa: "محرم", en: "Muharram" },
    title: { fa: "عماری، نخل و علم‌ها", en: "Amari, palm and standards" },
    text: {
      fa: "عماری روز هشتم، نخل و هفت علم در تاسوعا.",
      en: "Amari on the 8th, palm and seven standards on Tasua.",
    },
    source: { fa: "مهر نیوز (۲۰۲۳)، فقط یک منبع", en: "Mehr News (2023), single source" }, section: "traditions",
  },
  {
    id: "spring", filters: ["seasons", "visit"], big: { fa: "بهار", en: "Spring" }, small: { fa: "تا اوایل تابستان", en: "to early summer" },
    title: { fa: "بهترین زمان سفر", en: "Best time to visit" },
    text: {
      fa: "بهار و اوایل تابستان؛ گردشنامه فروردین را بهترین می‌داند.",
      en: "Spring and early summer; Gardeshnama picks Farvardin.",
    },
    source: { fa: "کجارو، گردشنامه", en: "Kojaro, Gardeshnama" }, section: "tourism", wordy: true,
  },
  {
    id: "crowds", filters: ["seasons", "visit"], big: { fa: "نوروز", en: "Nowruz" }, small: { fa: "محرم و تابستان", en: "Muharram, summer" },
    title: { fa: "وقتی جمعیت بالا می‌رود", en: "When the village fills up" },
    text: {
      fa: "کجارو: حدود ۱۰۰۰ در بهار و تابستان. گردشنامه: تا ۵۰۰۰ در نوروز، محرم و تابستان. سرشماری نیستند و با هم نمی‌خوانند.",
      en: "Kojaro: about 1,000 in spring and summer. Gardeshnama: up to 5,000 at Nowruz, Muharram and summer. Not census; they disagree.",
    },
    source: { fa: "کجارو، گردشنامه", en: "Kojaro, Gardeshnama" }, section: "population", wordy: true,
  },
];

export const statusLabel = (s: Status | undefined, lang: Locale) =>
  s === "reported" ? hc.statusReported[lang] : s === "unverified" ? hc.statusUnverified[lang] : s === "family" ? hc.statusFamily[lang] : undefined;

/** A sourced card from site.ts, found by its English title (so the home page restates exact existing text). */
export function findCard(sectionSlug: string, titleEn: string) {
  const s: Section | undefined = sectionBySlug(sectionSlug);
  if (!s) return undefined;
  for (const b of s.blocks) {
    if (b.t === "cards") {
      const c = b.items.find((i) => i.title.en === titleEn);
      if (c) return c;
    }
  }
  return undefined;
}

/** Number of card entries in a section, shown as the small count line on the explore tabs. */
export function entryCount(slug: string): number {
  const s = sectionBySlug(slug);
  if (!s) return 0;
  return s.blocks.reduce((n, b) => n + (b.t === "cards" ? b.items.length : 0), 0);
}

export const entriesLabel = (n: number, lang: Locale) =>
  lang === "fa" ? `${n.toLocaleString("fa-IR")} مطلب` : `${n} entries`;

/** Plan-your-visit cards: title, one line, target section/route. */
export const planCards: { slug: string; title: L; text: L; thumb: "map" | "mark"; mark?: string; ill?: string }[] = [
  { slug: "map", title: { fa: "چطور برسیم", en: "Getting there" }, text: { fa: "نقشه و مسیرها", en: "Map and routes" }, thumb: "map", ill: "resources" },
  { slug: "stay", title: { fa: "کجا بمانیم", en: "Where to stay" }, text: { fa: "اقامت در سُه و اطراف", en: "Stays in and near Soh" }, thumb: "mark", mark: "stay", ill: "stay" },
  { slug: "banks", title: { fa: "بانک‌ها", en: "Banks" }, text: { fa: "بانک و خودپرداز نزدیک", en: "Banks and ATMs nearby" }, thumb: "mark", mark: "banks", ill: "banks" },
  { slug: "tourism", title: { fa: "بهترین زمان سفر", en: "Best time to visit" }, text: { fa: "بهار و اوایل تابستان", en: "Spring and early summer" }, thumb: "mark", mark: "tourism", ill: "tourism" },
  { slug: "shop", title: { fa: "خرید", en: "Where to buy" }, text: { fa: "محصولات سُه", en: "What Soh grows and makes" }, thumb: "mark", mark: "shop", ill: "shop" },
];
