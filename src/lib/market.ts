import type { BoardId } from "./boards";
import type { L } from "./i18n";
import type { ListingImage } from "./listing-images";

// Village boards (market, careers, needs, property): one listings table, one row shape. No payments happen on the site.
// Which types a board offers, and what it calls them, lives in boards.ts (use typeLabel there). LISTING_TYPES below is the MARKET's.
// Older rows may still be "service"; it is not offered when writing a listing.
export type ListingType = "sell" | "need" | "service" | "seeking" | "hiring" | "offer" | "rent";
export type Opt<T extends string = string> = { v: T; fa: string; en: string };

export const LISTING_TYPES: Opt<ListingType>[] = [
  { v: "sell", fa: "فروش", en: "For sale" },
  { v: "need", fa: "می‌خواهم بخرم", en: "Wanted" },
];

// Names for the market's older types, so a saved row still reads in both languages. Prefer typeLabel() from boards.ts.
const RETIRED_LISTING_TYPES: Opt<ListingType>[] = [
  { v: "service", fa: "خدمت می‌دهم", en: "Service offered" },
  { v: "seeking", fa: "دنبال کار", en: "Looking for work" },
  { v: "hiring", fa: "کارگر می‌خواهم", en: "Hiring" },
];

export const LISTING_TYPE_LABELS: Opt<ListingType>[] = [...LISTING_TYPES, ...RETIRED_LISTING_TYPES];

export const LISTING_CATEGORIES: Opt[] = [
  { v: "fruit", fa: "میوه (گیلاس، سیب، ...)", en: "Fruit (cherries, apples ...)" },
  { v: "nuts", fa: "گردو و خشکبار", en: "Walnuts and nuts" },
  { v: "bread", fa: "نان و شیرینی", en: "Bread and baking" },
  { v: "dairy", fa: "لبنیات و خوراک محلی", en: "Dairy and village food" },
  { v: "crafts", fa: "قالی و صنایع دستی", en: "Carpets and crafts" },
  { v: "garden", fa: "نگهداری باغ", en: "Garden and orchard care" },
  { v: "labour", fa: "کار کشاورزی و برداشت", en: "Farm and harvest work" },
  { v: "building", fa: "ساخت و تعمیر", en: "Building and repair" },
  { v: "driving", fa: "رانندگی و حمل", en: "Driving and transport" },
  { v: "other", fa: "دیگر", en: "Other" },
];

export const CONTACT_KINDS: Opt[] = [
  { v: "phone", fa: "تلفن", en: "Phone" },
  { v: "telegram", fa: "تلگرام", en: "Telegram" },
  { v: "whatsapp", fa: "واتس‌اپ", en: "WhatsApp" },
  { v: "other", fa: "دیگر", en: "Other" },
];

/** The poster as a public ad may show them: only when the poster allowed it (profile.show_on_ads). Never a family name or phone. */
export type ListingPoster = { firstName: string; /** full public URL of the 96 px avatar, when there is one */ avatarUrl?: string };

export type Listing = {
  id: string;
  /** which board the row belongs to; undefined (static rows) means "market" */
  board?: BoardId;
  poster?: ListingPoster;
  type: ListingType;
  category: string;
  title: string; // as the poster wrote it
  quantity?: string;
  price?: string; // free text, e.g. "120,000 toman per kg"
  area: string;
  available?: string;
  details?: string;
  contact?: { kind: string; value: string }; // LEGACY, never filled any more: the phone is fetched on demand by POST /api/listings/contact
  /** the poster is a "verified seller" (an admin confirmed them). Shown even when the poster hides their name. */
  verified?: boolean;
  postedAt: string; // YYYY-MM-DD
  expiresAt: string; // YYYY-MM-DD, 30 days after approval unless renewed
  images?: ListingImage[]; // up to 10 photos, first = cover (see listing-images.ts)
};

// Approved listings. Add one object per approved post (see README, "Approving posts").
// Never add a phone number or name unless the poster agreed to publish it.
export const listings: Listing[] = [];

export const marketNote: L = {
  fa: "آگهی‌ها فقط پس از بررسی منتشر می‌شوند و بعد از ۳۰ روز برداشته می‌شوند.",
  en: "Listings are published only after a check and removed after 30 days.",
};

// Short category names for filter chips (the full names above stay for forms and detail pages).
export const CATEGORY_SHORT: Record<string, L> = {
  fruit: { fa: "میوه", en: "Fruit" },
  nuts: { fa: "گردو و خشکبار", en: "Nuts" },
  bread: { fa: "نان و شیرینی", en: "Baking" },
  dairy: { fa: "لبنیات", en: "Dairy" },
  crafts: { fa: "صنایع دستی", en: "Crafts" },
  garden: { fa: "نگهداری باغ", en: "Garden care" },
  labour: { fa: "کار کشاورزی", en: "Farm work" },
  building: { fa: "ساخت و تعمیر", en: "Building" },
  driving: { fa: "حمل و نقل", en: "Transport" },
  other: { fa: "دیگر", en: "Other" },
};
