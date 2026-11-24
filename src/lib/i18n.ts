export const locales = ["fa", "en"] as const;
export type Locale = (typeof locales)[number];
export type L = { fa: string; en: string };
export const hasLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);
export const dirOf = (l: Locale) => (l === "fa" ? "rtl" : "ltr");
export const t = (v: L, l: Locale) => v[l];
