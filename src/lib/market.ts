import type { L } from "./i18n";

// Village market: listings for produce, food, services and jobs. No payments happen on the site.
export type ListingType = "sell" | "need" | "service" | "seeking" | "hiring";
export type Opt<T extends string = string> = { v: T; fa: string; en: string };

export const LISTING_TYPES: Opt<ListingType>[] = [
  { v: "sell", fa: "فروش", en: "For sale" },
  { v: "need", fa: "می‌خواهم بخرم", en: "Wanted" },
  { v: "service", fa: "خدمت می‌دهم", en: "Service offered" },
  { v: "seeking", fa: "دنبال کار", en: "Looking for work" },
  { v: "hiring", fa: "کارگر می‌خواهم", en: "Hiring" },
];

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

export type Listing = {
  id: string;
  type: ListingType;
  category: string;
  title: string; // as the poster wrote it
  quantity?: string;
  price?: string; // free text, e.g. "120,000 toman per kg"
  area: string;
  available?: string;
  details?: string;
  contact?: { kind: string; value: string }; // only with the poster's permission to publish it
  postedAt: string; // YYYY-MM-DD
  expiresAt: string; // YYYY-MM-DD, 30 days after approval unless renewed
};

// Approved listings. Add one object per approved post (see README, "Approving posts").
// Never add a phone number or name unless the poster agreed to publish it.
export const listings: Listing[] = [];

export const marketNote: L = {
  fa: "آگهی‌ها فقط پس از بررسی منتشر می‌شوند و بعد از ۳۰ روز برداشته می‌شوند.",
  en: "Listings are published only after a check and removed after 30 days.",
};
