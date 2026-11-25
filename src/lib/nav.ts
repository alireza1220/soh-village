import type { L, Locale } from "./i18n";
import { sectionBySlug } from "./site";

// Header and footer navigation data (bilingual). Add or move a link here and the header mega-menu,
// the mobile drawer and the footer columns all follow.
//   slug  : a section from site.ts (label comes from its title) or a standalone route
//   label : only for standalone routes (photos, map, references, credits, contribute, manage)
export type NavDef = { slug: string; label?: L };
export type NavGroupDef = { id: string; label: L; description: L; items: NavDef[] };

const routeLabels: Record<string, L> = {
  photos: { fa: "عکس‌ها", en: "Photos" },
  map: { fa: "نقشه", en: "Map" },
  references: { fa: "راهنما و منابع", en: "Guide and sources" },
  credits: { fa: "منبع عکس‌ها و مجوزها", en: "Photo credits and licences" },
  contribute: { fa: "مشارکت", en: "Contribute" },
  manage: { fa: "مدیریت آگهی با کد", en: "Manage a listing" },
  login: { fa: "ورود", en: "Log in" },
};

export const navGroups: NavGroupDef[] = [
  {
    id: "explore",
    label: { fa: "کاوش", en: "Explore" },
    description: { fa: "تاریخ، مردم، آیین‌ها و عکس‌های سُه و اطراف آن.", en: "History, people, traditions and photos of Soh and its surroundings." },
    items: [{ slug: "history" }, { slug: "tourism" }, { slug: "people" }, { slug: "traditions" }, { slug: "photos" }, { slug: "map" }],
  },
  {
    id: "plan",
    label: { fa: "سفر به سُه", en: "Plan your visit" },
    description: { fa: "آنچه پیش از سفر باید بدانید: دیدنی‌ها، اقامت، خرید، بانک و نقشه.", en: "What to know before you travel: sights, places to stay, shopping, banks and the map." },
    items: [{ slug: "tourism" }, { slug: "stay" }, { slug: "shop" }, { slug: "stores" }, { slug: "hospital" }, { slug: "banks" }, { slug: "map" }],
  },
  {
    id: "market",
    label: { fa: "بازارچه", en: "Market" },
    description: { fa: "خرید و فروش، نیازمندی‌ها و فرصت‌های شغلی روستا. در سایت پرداختی انجام نمی‌شود.", en: "Village buying and selling, wanted ads and jobs. No payments happen on the site." },
    items: [{ slug: "market" }, { slug: "needs" }, { slug: "careers" }, { slug: "property" }, { slug: "manage" }],
  },
  {
    id: "guide",
    label: { fa: "راهنما", en: "Guide" },
    description: { fa: "واژه‌های گویش، منابع، منبع عکس‌ها و راه‌های مشارکت.", en: "Dialect words, sources, photo credits and how to contribute." },
    items: [{ slug: "words" }, { slug: "resources" }, { slug: "references" }, { slug: "credits" }, { slug: "contribute" }],
  },
];

export type NavItem = { href: string; label: string; slug: string };
export type NavGroup = { id: string; label: string; description: string; items: NavItem[] };

/** Resolve the nav for one language: real hrefs (/fa/history) and plain strings, safe to pass to client components. */
export function resolveNav(lang: Locale): NavGroup[] {
  return navGroups.map((g) => ({
    id: g.id,
    label: g.label[lang],
    description: g.description[lang],
    items: g.items.map((i) => ({
      slug: i.slug,
      href: `/${lang}/${i.slug}`,
      label: (i.label ?? routeLabels[i.slug] ?? sectionBySlug(i.slug)?.title)?.[lang] ?? i.slug,
    })),
  }));
}

/** Bilingual UI microcopy for the shell (header, drawer, footer, search button). */
export const ui = {
  skip: { fa: "پرش به محتوا", en: "Skip to main content" },
  mainNav: { fa: "منوی اصلی", en: "Main navigation" },
  footerNav: { fa: "پیوندهای پایین صفحه", en: "Footer links" },
  social: { fa: "شبکه‌های اجتماعی", en: "Social media" },
  search: { fa: "جستجو", en: "Search" },
  menu: { fa: "منو", en: "Menu" },
  closeMenu: { fa: "بستن منو", en: "Close menu" },
  contribute: { fa: "مشارکت", en: "Contribute" },
  logo: { fa: "روستای سُه، صفحه‌ی اصلی", en: "Soh village, home page" },
  footerAbout: { fa: "سایت جامعه‌ی روستای سُه در استان اصفهان، به دو زبان فارسی و انگلیسی.", en: "A bilingual community site for the village of Soh in Isfahan province." },
  draft: { fa: "پیش‌نویس ساخته‌شده از منابع عمومی اینترنت. برچسب‌ها نشان می‌دهند هر مطلب چقدر پشتوانه دارد.", en: "A draft built from public web sources. Labels show how well each fact is backed." },
  credits: { fa: "منبع عکس‌ها و مجوزها", en: "Photo credits and licences" },
  manage: { fa: "مدیریت آگهی با کد", en: "Manage a listing with your code" },
} satisfies Record<string, L>;
