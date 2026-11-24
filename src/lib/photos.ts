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
const CCSA4 = "https://creativecommons.org/licenses/by-sa/4.0/";
const commons = (name: string) => `https://commons.wikimedia.org/wiki/File:${name.replace(/ /g, "_")}`;

// Free-licence photos from Wikimedia Commons (credit and licence are shown with each photo). None shows Soh itself.
export const photos: Photo[] = [
  {
    file: "karkas-mountain.jpg", width: 1920, height: 1251, section: "village", scope: "region",
    alt: { fa: "قله‌های برفی کوه‌های کرکس بالای دشتی زردرنگ", en: "Snow-capped peaks of the Karkas mountains above a golden plain" },
    caption: { fa: "کوه‌های کرکس در استان اصفهان؛ سُه در دامنه‌ی این رشته‌کوه است. عکس از خود سُه نیست.", en: "The Karkas mountains in Isfahan province; Soh sits on the slopes of this range. Not a photo of Soh." },
    credit: "Alireza Javaheri", license: "CC BY 3.0", licenseUrl: CC3, sourceUrl: commons("Karkas Kooh.jpg"),
  },
  {
    file: "madar-shah-caravanserai.jpg", width: 1920, height: 1439, section: "history", scope: "region",
    alt: { fa: "سردر آجری کاروانسرای مادر شاه با حوضی در جلو", en: "The brick portal of the Madar Shah Caravanserai with a pool in front" },
    caption: { fa: "کاروانسرای مادر شاه در مورچه‌خورت، در همان دهستان سُه. کاروانسرای سُه نیست.", en: "The Madar Shah Caravanserai in Murcheh Khvort, in the same rural district as Soh. This is not Soh's caravanserai." },
    credit: "EbrahimFaryabi", license: "CC BY-SA 4.0", licenseUrl: CCSA4, sourceUrl: commons("Madar Shah Caravanserai- Murchehkhort Iran (cropped).jpg"),
  },
  {
    file: "abyaneh.jpg", width: 1920, height: 1280, section: "tourism", scope: "region",
    alt: { fa: "خانه‌های خشتی سرخ‌رنگ ابیانه در دامنه‌ی کوه", en: "Red adobe houses of Abyaneh on a mountainside" },
    caption: { fa: "ابیانه، روستای همسایه‌ی شمالی سُه. عکس از سُه نیست.", en: "Abyaneh, the village on Soh's northern border. Not a photo of Soh." },
    credit: "Bernard Gagnon", license: "CC BY-SA 4.0", licenseUrl: CCSA4, sourceUrl: commons("Village of Abyaneh, Iran.jpg"),
  },
  {
    file: "meymeh-jame-mosque.jpg", width: 1920, height: 1440, section: "tourism", scope: "region",
    alt: { fa: "مسجد جامع میمه", en: "The Jame Mosque of Meymeh" },
    caption: { fa: "مسجد جامع میمه، شهر نزدیک سُه. عکس از سُه نیست.", en: "The Jame Mosque of Meymeh, the town near Soh. Not a photo of Soh." },
    credit: "Wikicommuni", license: "CC BY-SA 4.0", licenseUrl: CCSA4, sourceUrl: commons("Masjed meymeh.jpg"),
  },
  {
    file: "nakhl-gardani-mehriz.jpg", width: 1920, height: 1080, section: "traditions", scope: "region",
    alt: { fa: "نخل‌گردانی در روز عاشورا", en: "Nakhl-gardani on Ashura day" },
    caption: { fa: "نخل‌گردانی عاشورا در مهریز یزد (۲۰۱۴). آیینی مانند نخل‌گردانی سُه ولی در جای دیگر.", en: "Ashura nakhl-gardani in Mehriz, Yazd (2014). A ritual like Soh's palm carrying, but elsewhere." },
    credit: "amir mohammad zare zadeh", license: "CC BY-SA 4.0", licenseUrl: CCSA4, sourceUrl: commons("Nakhl Gardani - Mehriz - Ashura Muharram.jpg"),
  },
];

// While true, sections without photos show a dashed "photo needed" box. Set to false before the public launch.
export const showShotPlaceholders = true;

// Photos the site needs. Each links to the section it belongs to.
export type Shot = { id: string; section: string; title: L; detail: L; priority: 1 | 2 | 3 };
export const shots: Shot[] = [
  { id: "overview", section: "village", priority: 1, title: { fa: "نمای کلی روستا", en: "The village from above" }, detail: { fa: "از دامنه‌ی کوه یا جاده، با کوه‌های کرکس پشت آن. بهتر است عصر یا صبح زود باشد.", en: "From the slope or the road, with the Karkas mountains behind. Early morning or late afternoon light is best." } },
  { id: "caravanserai", section: "history", priority: 1, title: { fa: "کاروانسرای سُه", en: "Soh Caravanserai" }, detail: { fa: "سردر با کتیبه‌ی سنگی، حیاط میانی و یکی از ایوان‌ها.", en: "The portal with its stone inscription, the central courtyard and one of the iwans." } },
  { id: "inscription", section: "history", priority: 2, title: { fa: "کتیبه‌ی سنگی", en: "The stone inscription" }, detail: { fa: "نزدیک و خوانا، تا بتوان متن را خواند.", en: "Close up and legible, so the text can be read." } },
  { id: "yusuf", section: "tourism", priority: 1, title: { fa: "امامزاده یوسف", en: "Imamzadeh Yusuf" }, detail: { fa: "گنبد فیروزه‌ای از بیرون و یک عکس از فضای داخل (اگر اجازه است).", en: "The turquoise dome from outside, and the interior if permitted." } },
  { id: "golileh", section: "tourism", priority: 1, title: { fa: "امامزاده گلیله", en: "Imamzadeh Golileh" }, detail: { fa: "بقعه در مرکز روستا.", en: "The shrine at the centre of the village." } },
  { id: "bath", section: "tourism", priority: 2, title: { fa: "حمام قدیمی", en: "The old bath" }, detail: { fa: "سردر و داخل حمام مرمت‌شده.", en: "The entrance and the inside of the restored bath." } },
  { id: "mills", section: "tourism", priority: 3, title: { fa: "آسیاب‌ها، پل نواب و برج کبوتر", en: "Mills, Nav Bridge and the dovecote" }, detail: { fa: "هر کدام یک عکس با توضیح جای آن.", en: "One photo of each, with its location." } },
  { id: "nature", section: "tourism", priority: 2, title: { fa: "رودخانه و مرغزار", en: "River and meadow" }, detail: { fa: "لب‌چار، مرغزار سرمرغ یا آبشار، با نام جا در توضیح.", en: "The Lab Char river, Sar-Marq meadow or the waterfall, with the place named in the caption." } },
  { id: "tasua", section: "traditions", priority: 1, title: { fa: "نخل‌گردانی تاسوعا", en: "Tasua palm carrying" }, detail: { fa: "نخل آراسته در امامزاده یوسف یا در مسیر. اگر افراد پیداست، اجازه‌ی آن‌ها لازم است.", en: "The decorated palm at Imamzadeh Yusuf or on its route. Consent is needed if people are recognisable." } },
  { id: "carpet", section: "traditions", priority: 2, title: { fa: "قالی‌بافی", en: "Carpet weaving" }, detail: { fa: "دار قالی و نقش جوشقانی؛ با اجازه‌ی بافنده.", en: "The loom and a Joshaqani design, with the weaver's permission." } },
  { id: "houses", section: "traditions", priority: 2, title: { fa: "خانه‌های خشتی و بام‌های خاکی", en: "Adobe houses and earth roofs" }, detail: { fa: "کوچه‌ها و در و دیوار قدیمی.", en: "Old lanes, doors and walls." } },
  { id: "orchard", section: "shop", priority: 1, title: { fa: "باغ سیب", en: "Apple orchard" }, detail: { fa: "شکوفه‌ی بهار یا میوه‌ی پاییز؛ نام رقم و ماه عکس را بنویسید.", en: "Spring blossom or autumn fruit; note the variety and the month." } },
  { id: "products", section: "shop", priority: 2, title: { fa: "محصولات محلی", en: "Local products" }, detail: { fa: "گردو، لبنیات، نان محلی و صنایع دستی روی یک سطح ساده.", en: "Walnuts, dairy, village bread and crafts on a plain surface." } },
  { id: "stay", section: "stay", priority: 3, title: { fa: "جای اقامت", en: "A place to stay" }, detail: { fa: "هر اتاق یا خانه‌ی مسافری که می‌خواهد در سایت بیاید.", en: "Any room or guest house that wants to be listed." } },
  { id: "words", section: "words", priority: 3, title: { fa: "گویندگان واژه‌ها", en: "Speakers of the dialect" }, detail: { fa: "فقط با رضایت گوینده؛ ترجیحاً همراه ضبط صدا.", en: "Only with the speaker's consent, ideally with a voice recording." } },
];
