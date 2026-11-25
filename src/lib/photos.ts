import type { L } from "./i18n";

// Add a photo: put the file in public/photos/ (jpg or webp, about 1600 px wide), then add one entry below.
// section = a section slug (history, tourism, traditions, stay, shop, words, resources, banks, property) or "village".
// Only photos Al or the family own or have permission to publish. Ask before showing people, especially children.
export type Photo = {
  file: string;
  width: number;
  height: number;
  section: string;
  scope: "soh" | "region"; // "region" = the area around Soh, NOT the village itself; always shown with a label
  alt: L;
  caption: L;
  credit: string; // photographer's name
  license: string; // e.g. "CC BY 3.0", "Used with permission"
  licenseUrl?: string;
  sourceUrl?: string; // page the photo came from (Wikimedia Commons file page)
  year?: number;
};
const CC3 = "https://creativecommons.org/licenses/by/3.0/";
const CCSA3 = "https://creativecommons.org/licenses/by-sa/3.0/";
const CCSA4 = "https://creativecommons.org/licenses/by-sa/4.0/";
const commons = (name: string) => `https://commons.wikimedia.org/wiki/File:${name.replace(/ /g, "_")}`;

// The opening photo was supplied for this site. The rest are free-licence photos from Wikimedia Commons. Those are the area around Soh, not the village, and stay labelled.
export const photos: Photo[] = [
  {
    file: "opening.jpg", width: 1024, height: 601, section: "village", scope: "soh",
    alt: { fa: "بنای آجری با طاق‌های تیزه‌دار و یک برج گوشه", en: "A brick building with pointed arches and a corner tower" },
    caption: { fa: "بنای آجری با طاق‌های تیزه‌دار و یک برج گوشه. این عکس برای صفحه‌ی اول فرستاده شده است.", en: "A brick building with pointed arches and a corner tower. This photo was supplied for the opening page." },
    credit: "Supplied for this site", license: "Used with permission",
  },
  {
    file: "karkas-mountain.jpg", width: 1920, height: 1251, section: "village", scope: "region",
    alt: { fa: "قله‌های برفی کوه‌های کرکس بالای دشتی زردرنگ", en: "Snow-capped peaks of the Karkas mountains above a golden plain" },
    caption: { fa: "کوه‌های کرکس در استان اصفهان؛ سُه در دامنه‌ی این رشته‌کوه است. عکس از خود سُه نیست.", en: "The Karkas mountains in Isfahan province; Soh sits on the slopes of this range. Not a photo of Soh." },
    credit: "Alireza Javaheri", license: "CC BY 3.0", licenseUrl: CC3, sourceUrl: commons("Karkas Kooh.jpg"),
  },
  {
    file: "opening.jpg", width: 1024, height: 601, section: "history", scope: "soh",
    alt: { fa: "بنای آجری با طاق‌های تیزه‌دار و یک برج گوشه", en: "A brick building with pointed arches and a corner tower" },
    caption: { fa: "بنای آجری با طاق‌های تیزه‌دار و یک برج گوشه. این عکس برای سایت فرستاده شده است.", en: "A brick building with pointed arches and a corner tower. This photo was supplied for the site." },
    credit: "Supplied for this site", license: "Used with permission",
  },
  {
    file: "karkas-peak.jpg", width: 1920, height: 1440, section: "traditions", scope: "region",
    alt: { fa: "قله‌ی کوه کرکس در آسمانی آبی", en: "The Karkas peak against a blue sky" },
    caption: { fa: "قله‌ی کرکس", en: "The Karkas peak" },
    credit: "Orijentolog", license: "CC BY-SA 3.0", licenseUrl: CCSA3, sourceUrl: commons("Kuh-e Karkas 2.JPG"),
  },
];

// While true, sections without photos show a dashed "photo needed" box. Set to false before the public launch.
export const showShotPlaceholders = true;

// Photos the site needs. Each links to the section it belongs to.
export type Shot = { id: string; section: string; title: L; detail: L; priority: 1 | 2 | 3 };
export const shots: Shot[] = [
  { id: "overview", section: "village", priority: 1, title: { fa: "نمای کلی روستا", en: "The village from above" }, detail: { fa: "از دامنه یا جاده، با کوه‌های کرکس پشت آن؛ صبح زود یا عصر.", en: "From the slope or road, Karkas mountains behind; early or late light." } },
  { id: "caravanserai", section: "history", priority: 1, title: { fa: "کاروانسرای سُه", en: "Soh Caravanserai" }, detail: { fa: "سردر با کتیبه، حیاط و یک ایوان.", en: "Portal, courtyard and one iwan." } },
  { id: "inscription", section: "history", priority: 2, title: { fa: "کتیبه‌ی سنگی", en: "The stone inscription" }, detail: { fa: "نزدیک و خوانا.", en: "Close up and legible." } },
  { id: "yusuf", section: "tourism", priority: 1, title: { fa: "امامزاده یوسف", en: "Imamzadeh Yusuf" }, detail: { fa: "گنبد فیروزه‌ای از بیرون؛ داخل، اگر اجازه است.", en: "Turquoise dome outside; inside if permitted." } },
  { id: "golileh", section: "tourism", priority: 1, title: { fa: "امامزاده گلیله", en: "Imamzadeh Golileh" }, detail: { fa: "بقعه در مرکز روستا.", en: "The shrine at the centre of the village." } },
  { id: "bath", section: "tourism", priority: 2, title: { fa: "حمام قدیمی", en: "The old bath" }, detail: { fa: "سردر و داخل حمام.", en: "Entrance and interior." } },
  { id: "mills", section: "tourism", priority: 3, title: { fa: "آسیاب‌ها، پل نواب و برج کبوتر", en: "Mills, Nav Bridge and the dovecote" }, detail: { fa: "از هر کدام یک عکس، با جایش.", en: "One of each, with location." } },
  { id: "nature", section: "tourism", priority: 2, title: { fa: "رودخانه و مرغزار", en: "River and meadow" }, detail: { fa: "لب‌چر، سرمرق یا آبشار؛ نام جا را بنویسید.", en: "Lab Char, Sar-Marq or the waterfall; name the place." } },
  { id: "tasua", section: "traditions", priority: 1, title: { fa: "نخل‌گردانی تاسوعا", en: "Tasua palm carrying" }, detail: { fa: "نخل آراسته در امامزاده یوسف یا مسیر. اگر افراد پیدایند، اجازه‌شان لازم است.", en: "Decorated palm at Imamzadeh Yusuf or en route. Faces need consent." } },
  { id: "carpet", section: "traditions", priority: 2, title: { fa: "قالی‌بافی", en: "Carpet weaving" }, detail: { fa: "دار و نقش جوشقانی؛ با اجازه‌ی بافنده.", en: "Loom and Joshaqani design, with the weaver's permission." } },
  { id: "houses", section: "traditions", priority: 2, title: { fa: "خانه‌های خشتی و بام‌های خاکی", en: "Adobe houses and earth roofs" }, detail: { fa: "کوچه، در و دیوار قدیمی.", en: "Old lanes, doors, walls." } },
  { id: "orchard", section: "shop", priority: 1, title: { fa: "باغ سیب", en: "Apple orchard" }, detail: { fa: "شکوفه‌ی بهار یا میوه‌ی پاییز؛ رقم و ماه را بنویسید.", en: "Spring blossom or autumn fruit; note variety and month." } },
  { id: "products", section: "shop", priority: 2, title: { fa: "محصولات محلی", en: "Local products" }, detail: { fa: "گردو، لبنیات، نان و صنایع دستی روی سطحی ساده.", en: "Walnuts, dairy, bread, crafts on a plain surface." } },
  { id: "stay", section: "stay", priority: 3, title: { fa: "جای اقامت", en: "A place to stay" }, detail: { fa: "اتاق یا خانه‌ی مسافری که می‌خواهد در سایت بیاید.", en: "A room or guest house to be listed." } },
  { id: "words", section: "words", priority: 3, title: { fa: "گویندگان واژه‌ها", en: "Speakers of the dialect" }, detail: { fa: "فقط با رضایت گوینده؛ ترجیحاً با ضبط صدا.", en: "Only with the speaker's consent; ideally a voice recording." } },
];
