import type { L } from "./i18n";

const STATUS_LABEL: Record<string, L> = {
  "200": { fa: "باز شد", en: "Opened" },
  "200 (Chrome)": { fa: "در کروم باز شد", en: "Opened in Chrome" },
  "404": { fa: "صفحه نیست", en: "Page gone" },
  "403": { fa: "دسترسی بسته بود", en: "Access refused" },
  blocked: { fa: "از اینجا باز نشد", en: "Blocked from here" },
  "not checked": { fa: "هنوز باز نشده", en: "Not opened yet" },
  "not reached": { fa: "رسیده نشد", en: "Not reached" },
  "no DNS": { fa: "نشانی پیدا نشد", en: "Address did not resolve" },
  "snippet read": { fa: "خلاصه‌اش خوانده شد", en: "Summary read" },
  "not used": { fa: "استفاده نشد", en: "Not used" },
  listed: { fa: "فقط در جستجو آمد", en: "Only came up in search" },
};

export function statusLabel(status: string, lang: keyof L): string {
  return STATUS_LABEL[status]?.[lang] ?? status;
}

/** A full sentence for each research note. Photo rows are built from their columns. */
export function commentFor(note: string): L {
  const photo = photoComment(note);
  if (photo) return photo;
  return NOTES[note] ?? { fa: note, en: note };
}

function photoComment(note: string): L | null {
  const parts = note.split(" · ");
  if (parts.length < 3) return null;
  const [shows, author, license, caution] = parts;
  if (!/CC |see page|CC0/i.test(license ?? "") && license !== "(see page)") return null;
  const cautionFa = caution ? ` ${caution}` : "";
  const cautionEn = caution ? ` ${caution}.` : " This is not a photo of Soh.";
  return {
    fa: `عکس آزاد: ${shows}. عکاس: ${author}. مجوز: ${license}.${caution ? " احتیاط:" + cautionFa : " این عکس خود سُه نیست."}`,
    en: `Free-licence photo of ${shows}, by ${author}, ${license}.${cautionEn}`,
  };
}

const NOTES: Record<string, L> = {
  "Kojaro guide (main source)": {
    fa: "راهنمای کجارو و منبع اصلی بیشتر جاهای دیدنی این سایت.",
    en: "The Kojaro guide, and the main source for most of the sights on this site.",
  },
  "Gardeshnama guide": {
    fa: "راهنمای گردشگری گردشنامه. جمعیت فصلی‌ای که نوشته با کجارو یکی نیست.",
    en: "The Gardeshnama travel guide. The seasonal population it gives does not match Kojaro.",
  },
  "Seeiran, 25 Mordad 1394 (Aug 2015); the same text as Persian Wikipedia": {
    fa: "متن سی‌ایران، مرداد ۱۳۹۴، همان متن ویکی‌پدیای فارسی است و منبع مستقلی به حساب نمی‌آید.",
    en: "Seeiran, August 2015. The text is the same as Persian Wikipedia, so it is not an independent source.",
  },
  "Touristgah": {
    fa: "صفحه‌ی توریستگاه درباره‌ی سُه. از اینجا باز نشد.",
    en: "The Touristgah page about Soh. It did not open from here.",
  },
  "Chargoshe village page (gone)": {
    fa: "صفحه‌ی روستا در چارگوشه دیگر وجود ندارد.",
    en: "The Chargoshe village page no longer exists.",
  },
  "Beinabein travel report, Feb 2022": {
    fa: "گزارش سفر محمد گائینی، اسفند ۱۴۰۰، درباره‌ی کاروانسرا، حمام و تغییر بافت روستا.",
    en: "Travel report by Mohammad Gaeeni, February 2022, on the caravanserai, the bath and the village fabric changing.",
  },
  "Blog, Aug 2021": {
    fa: "وبلاگ مرداد ۱۴۰۰ با نظر یک پژوهشگر میراث درباره‌ی ساخت‌وساز تازه.",
    en: "A blog from August 2021 with a heritage researcher's view of new construction.",
  },
  "Blog \"Soh, a 2000-year-old village in Karkas\" (gone)": {
    fa: "وبلاگی با عنوان «روستای دوهزارساله‌ی سُه در کرکس» که صفحه‌اش دیگر نیست.",
    en: "A blog titled “Soh, a 2,000-year-old village in Karkas”. The page is gone.",
  },
  "\"Soh village\", Sep 2024 (gone)": {
    fa: "صفحه‌ی «روستای سُه» در پرواز ما، شهریور ۱۴۰۳. دیگر باز نمی‌شود.",
    en: "The “Soh village” page on Our Flight, September 2024. It no longer opens.",
  },
  "\"Introducing the tourism target village Soh\" (gone; an archive copy exists at https://web.archive.org/web/2023/https://esfahansabz.ir/read.php?id=20923 and was not read)": {
    fa: "معرفی روستای هدف گردشگری سُه در اصفهان سبز. صفحه رفته است و نسخه‌ی آرشیو خوانده نشده.",
    en: "An introduction to Soh as a tourism target village. The page is gone, and the archive copy was not read.",
  },
  "Dana news: Soh mourning, first intangible heritage of the county, with photos": {
    fa: "خبر دانا درباره‌ی عزاداری سُه و ثبت آن به‌عنوان نخستین میراث ناملموس شهرستان، با عکس. از اینجا باز نشد.",
    en: "Dana news on Soh's mourning rites as the county's first intangible heritage, with photos. Blocked from here.",
  },
  "IRIB News, May 2021 (also https://www.iribnews.ir/fa/news/3114741/)": {
    fa: "خبر صدا و سیما، خرداد ۱۴۰۰، با عنوان «روستای سُه، تماشایی اما ناشناخته». ویدیو و ۹ عکس دارد. متن کامل خوانده نشده.",
    en: "IRIB News, May 2021, “Soh, beautiful but unknown”. It has a video and nine photos. The full text was not read.",
  },
  "IRIB Isfahan production page \"روستای سه\"": {
    fa: "صفحه‌ی تولیدات صدای مرکز اصفهان با عنوان «روستای سه». به آن نرسیدیم.",
    en: "IRIB Isfahan's production page titled “Soh village”. We did not reach it.",
  },
  "Mehr News, July 2023: Muharram rites": {
    fa: "گزارش مهر، تیر ۱۴۰۲، درباره‌ی عماری، نخل و علم‌های محرم در سُه.",
    en: "Mehr News, July 2023, on the amari, the nakhl and the standards at Muharram in Soh.",
  },
  "Kojaro news, Dec 2022: county tourism inventory": {
    fa: "خبر کجارو، آذر ۱۴۰۱: سیاهه‌ی گردشگری شهرستان. سُه و کله‌رود را روستای هدف گردشگری می‌نامد.",
    en: "Kojaro news, December 2022: the county tourism inventory. It names Soh and Kalahrud as tourism target villages.",
  },
  "Persian Wikipedia (also https://fa.wikipedia.org/wiki/%D8%B3%D9%87_(%D8%B4%D8%A7%D9%87%DB%8C%D9%86%E2%80%8C%D8%B4%D9%87%D8%B1))": {
    fa: "ویکی‌پدیای فارسی. جمعیت سرشماری و فاصله‌ی ۹۴ کیلومتر تا اصفهان از اینجا آمده. برای قدمت دوهزارساله خودش می‌گوید سند نیست.",
    en: "Persian Wikipedia. The census figures and the 94 km distance to Isfahan come from here. It says the 2,000-year age has no document.",
  },
  "English Wikipedia (also https://en.wikipedia.org/wiki/So,_Iran , https://Www.Wikipedia.org/wiki/Seh , https://wiki.krisyotam.com/content/wikipedia_en_all_nopic_2026-03/Seh)": {
    fa: "ویکی‌پدیای انگلیسی. جمعیت سرشماری را دارد، ولی مختصاتش (۳۱٫۷۸ شمالی) غلط است و این سایت از آن استفاده نمی‌کند.",
    en: "English Wikipedia. It has the census population, but its coordinates (31.78 N) are wrong and this site does not use them.",
  },
  "Wikidata item": {
    fa: "شناسه‌ی ویکی‌داده برای سُه. مختصاتش هم کمی جابه‌جا است و روی سایت به کار نرفته.",
    en: "The Wikidata item for Soh. Its coordinates are also slightly off and are not used on the site.",
  },
  "Instagram, active": {
    fa: "اینستاگرام soh_village. در آبان ۱۴۰۵ فعال بود و هر روز مطلب می‌گذاشت. گرداننده‌اش معلوم نیست.",
    en: "Instagram @soh_village. It was active in November 2026 and posting daily. Who runs it is not stated.",
  },
  "Instagram location page": {
    fa: "صفحه‌ی مکان اینستاگرام «Soh, Esfahan, Iran»، با پست‌هایی که دیگران روی این مکان زده‌اند.",
    en: "The Instagram place page “Soh, Esfahan, Iran”, with posts other people tagged at that place.",
  },
  "Telegram channel (also https://t.me/esfahansohi)": {
    fa: "کانال تلگرام اهالی، esfahansohi: اطلاعیه، خاطره و عکس. حدود ۸۵۰ عضو.",
    en: "The villagers' Telegram channel, esfahansohi: announcements, memories and photos. About 850 subscribers.",
  },
  "Facebook page, lists soh.ir": {
    fa: "صفحه‌ی فیسبوک «روستای تاریخی سُه». نشانی soh.ir را وب‌سایت خود نوشته، ولی آن نشانی باز نشد.",
    en: "The Facebook page “the historic village of Soh”. It lists soh.ir as its website, but that address did not resolve.",
  },
  "Facebook public group, about 1.1K members": {
    fa: "گروه عمومی فیسبوک روستا، حدود ۱٫۱ هزار عضو. عکس قدیمی، تاریخ و گفت‌وگو. بخشی از آن پس از عضویت دیده می‌شود.",
    en: "The village's public Facebook group, about 1,100 members. Old photos, history and discussion. More of it is visible after you join.",
  },
  "Website listed on the Facebook page; did not resolve on 24 Nov 2026": {
    fa: "soh.ir، همان نشانی که صفحه‌ی فیسبوک نوشته. در ۳ آذر ۱۴۰۵ رکورد دامنه نداشت.",
    en: "soh.ir, the address the Facebook page lists. On 24 November 2026 it had no domain record.",
  },
  "\"SohiPictures\" blog": {
    fa: "وبلاگ سُهی‌پیکچرز. از اینجا باز نشد.",
    en: "The SohiPictures blog. It did not open from here.",
  },
  "Digital Caravanserai: Soh Caravanserai": {
    fa: "برگه‌ی کاروانسرای سُه در پروژه‌ی کاروانسرای دیجیتال.",
    en: "The Soh Caravanserai entry in the Digital Caravanserai project.",
  },
  "Kojaro: villages that became film locations (Soh not confirmed in it)": {
    fa: "مطلب کجارو درباره‌ی روستاهایی که لوکیشن فیلم شده‌اند. بودن سُه در آن تأیید نشد.",
    en: "A Kojaro piece on villages used as film locations. Soh was not confirmed in it.",
  },
  "Persian Wikipedia caravanserai list (7641 \"Soh\", Qajar, under Ardabil)": {
    fa: "فهرست کاروانسراهای ویکی‌پدیای فارسی. شماره‌ی ۷۶۴۱ را برای «سه» دوره‌ی قاجار زیر استان اردبیل آورده، پس این شماره برای سُهِ اصفهان قطعی نیست.",
    en: "Persian Wikipedia's caravanserai list. It files number 7641 for a Qajar “Soh” under Ardabil province, so that number is not confirmed for Soh in Isfahan.",
  },
  "Model tourism areas of Isfahan province (Soh, Kalahrud)": {
    fa: "فهرست مناطق نمونه‌ی گردشگری استان اصفهان. سُه و کله‌رود در آن هستند.",
    en: "The list of model tourism areas in Isfahan province. Soh and Kalahrud are on it.",
  },
  "Maxime Siroux": {
    fa: "ماکسیم سیرو، ایران‌شناس فرانسوی که کاروانسراهای ایران را برداشت کرد. نقشه‌ای از کاروانسرای سُه به او نسبت داده شده که اصلش پیدا نشده.",
    en: "Maxime Siroux, the French scholar who surveyed Iran's caravanserais. A plan of Soh's caravanserai is attributed to him; the original has not been found.",
  },
  "Siroux 1974, \"Les caravanserais routiers safavids\"": {
    fa: "مقاله‌ی ۱۹۷۴ سیرو درباره‌ی کاروانسراهای میان‌راهی صفوی.",
    en: "Siroux's 1974 article on Safavid road caravanserais.",
  },
  "Same article at Cambridge": {
    fa: "همان مقاله‌ی ۱۹۷۴ در سایت انتشارات کمبریج. جداگانه باز نشده.",
    en: "The same 1974 article on the Cambridge site. It was not opened separately.",
  },
  "Siroux 1949 book (for sale listing)": {
    fa: "آگهی فروش کتاب ۱۹۴۹ سیرو درباره‌ی کاروانسراهای ایران. خود کتاب خوانده نشده.",
    en: "A bookseller's listing of Siroux's 1949 book on Iran's caravanserais. The book itself was not read.",
  },
  "Library record of the 1949 book": {
    fa: "رکورد کتابخانه‌ای همان کتاب ۱۹۴۹، نه خود متن.",
    en: "A library record of that 1949 book, not the text itself.",
  },
  "Andaroodi et al.: classification of desert caravanserais (places Soh about 15 km from the highway, subclass 4.6)": {
    fa: "مقاله‌ی اندرودی و همکاران درباره‌ی دسته‌بندی کاروانسراهای بیابانی. سُه را حدود ۱۵ کیلومتر از جاده و در زیردسته‌ی ۴٫۶ می‌گذارد. باز نشده.",
    en: "Andaroodi and colleagues on classifying desert caravanserais. It places Soh about 15 km from the highway, subclass 4.6. Not opened.",
  },
  "Isfahan caravanserais as tourist facilities": {
    fa: "مقاله‌ای درباره‌ی تبدیل کاروانسراهای اصفهان به تأسیسات گردشگری. دسترسی به متن بسته بود.",
    en: "A paper on turning Isfahan's caravanserais into tourist facilities. The text was refused.",
  },
  "Routes in Persia (19th c.)": {
    fa: "کتاب راه‌های ایران در سده‌ی نوزدهم. از «سه»ای روی راه اصفهان نام می‌برد و معلوم نیست همان سُهِ میمه باشد.",
    en: "A 19th-century route book. It mentions a “Soh” on the Isfahan road, and it is not certain this is the Soh near Meymeh.",
  },
  "Isfahan heritage: boundaries of three historic caravanserais": {
    fa: "صفحه‌ی میراث اصفهان درباره‌ی محدوده‌ی سه کاروانسرای تاریخی. باز نشده و معلوم نیست سُه در آن باشد.",
    en: "An Isfahan heritage page on the boundaries of three historic caravanserais. Not opened, and Soh may not be among them.",
  },
  "Mehr: 9 Isfahan caravanserais near world listing": {
    fa: "خبر مهر درباره‌ی نزدیک شدن ۹ کاروانسرای اصفهان به ثبت جهانی. نام سُه در خلاصه نبود.",
    en: "Mehr News on nine Isfahan caravanserais nearing a world listing. Soh was not named in the summary.",
  },
  "54 Iranian caravanserais on the UNESCO list": {
    fa: "خبر ۵۴ کاروانسرای ایران در فهرست یونسکو. باز نشده. کاروانسرای سُه در این فهرست تأیید نشده.",
    en: "A report of 54 Iranian caravanserais on the UNESCO list. Not opened. Soh's caravanserai is not confirmed on that list.",
  },
  "13 caravanserais registered nationally": {
    fa: "خبر ثبت ملی ۱۳ کاروانسرا. باز نشده و ربطش به سُه روشن نیست.",
    en: "A report that 13 caravanserais were registered nationally. Not opened, and the link to Soh is not clear.",
  },
  "Persian caravanserais on UNESCO's list": {
    fa: "مطلبی انگلیسی درباره‌ی کاروانسراهای ایرانی در فهرست یونسکو. باز نشده.",
    en: "An English article on Persian caravanserais on the UNESCO list. Not opened.",
  },
  "Chaleh Siah Caravanserai (Wikidata)": {
    fa: "ویکی‌داده‌ی کاروانسرای چاله‌سیاه. کاروانسرای سُه نیست.",
    en: "The Wikidata item for Chaleh Siah Caravanserai. This is not Soh's caravanserai.",
  },
  "List of historical structures, Isfahan province": {
    fa: "فهرست بناهای تاریخی استان اصفهان در ویکی‌پدیای انگلیسی. باز نشده.",
    en: "English Wikipedia's list of historical structures in Isfahan province. Not opened.",
  },
  "Murcheh Khvort caravanserai ownership (gone)": {
    fa: "خبری درباره‌ی مالکیت کاروانسرای مورچه‌خورت که صفحه‌اش رفته است. کاروانسرای سُه نیست.",
    en: "A story about who owns the Murcheh Khvort caravanserai. The page is gone. It is not Soh's caravanserai.",
  },
  "Kojaro: Madar Shah caravanserai": {
    fa: "کاروانسرای مادرشاه در مورچه‌خورت، همان دهستان. کاروانسرای سُه نیست.",
    en: "The Madar Shah Caravanserai in Murcheh Khvort, the same rural district. It is not Soh's caravanserai.",
  },
  "Kojaro: Amin Abad caravanserai (Shahreza, not Soh)": {
    fa: "کاروانسرای امین‌آباد شهرضا. ربطی به سُه ندارد.",
    en: "The Amin Abad caravanserai in Shahreza. It has nothing to do with Soh.",
  },
  "Soh amari, nakhl and standards (see section 1)": {
    fa: "همان گزارش مهر درباره‌ی عماری، نخل و علم‌های سُه.",
    en: "The same Mehr report on Soh's amari, nakhl and standards.",
  },
  "Mehr: nakhl-gardani as an old rite (general, not Soh)": {
    fa: "گزارش کلی مهر درباره‌ی نخل‌گردانی. مخصوص سُه نیست.",
    en: "A general Mehr report on nakhl-gardani. It is not about Soh.",
  },
  "Kojaro: what nakhl-gardani is (general)": {
    fa: "توضیح کلی کجارو که نخل‌گردانی چیست. درباره‌ی سُه نیست.",
    en: "Kojaro's general explanation of what nakhl-gardani is. It is not about Soh.",
  },
  "Mapgard: nakhl carrying in Yazd (general)": {
    fa: "نخل‌گردانی یزد. آیین شبیه سُه است ولی جای دیگری است.",
    en: "Nakhl carrying in Yazd. The rite is like Soh's, but it is somewhere else.",
  },
  "Miras Aria: nakhl-gardani in Shahroud (other place)": {
    fa: "نخل‌گردانی شاهرود. جای دیگری است.",
    en: "Nakhl-gardani in Shahroud. A different place.",
  },
  "Iranica: lists Soh (Sohi/Soʾi); read in Chrome": {
    fa: "دانشنامه‌ی ایرانیکا در مقاله‌ی گویش‌های کاشان از سُه (سُهی) نام می‌برد. واژه‌نامه ندارد.",
    en: "Encyclopaedia Iranica's article on the Kashan dialects names Soh (Sohi). It has no word list.",
  },
  "Iranica: Meyma dialect": {
    fa: "مقاله‌ی ایرانیکا درباره‌ی گویش میمه، شهر همسایه، نه واژه‌های سُه.",
    en: "Iranica on the dialect of Meymeh, the neighbouring town, not Soh's words.",
  },
  "Iranica: geography of the Median dialects of Isfahan": {
    fa: "ایرانیکا: جغرافیای گویش‌های مرکزی اصفهان. زمینه‌ی زبانی منطقه است.",
    en: "Iranica on the geography of Isfahan's Median dialects. Background for the region's language.",
  },
  "Iranica: Isfahan provincial dialects (Stilo 2007)": {
    fa: "مقاله‌ی استیلو، ۲۰۰۷، درباره‌ی گویش‌های استان اصفهان. باز نشده.",
    en: "Stilo's 2007 article on Isfahan's provincial dialects. Not opened.",
  },
  "Iranica: Central dialects": {
    fa: "مقاله‌ی کلی ایرانیکا درباره‌ی گویش‌های مرکزی. باز نشده.",
    en: "Iranica's general article on the Central dialects. Not opened.",
  },
  "Iranica: Kesaʾi dialect": {
    fa: "گویش کسه‌ای در ایرانیکا. گویش سُه نیست و باز نشده.",
    en: "The Kesaʾi dialect in Iranica. Not Soh's dialect, and not opened.",
  },
  "Other Iranica articles that came up": {
    fa: "چند مقاله‌ی دیگر ایرانیکا که در جستجو آمدند و به سُه مربوط نبودند.",
    en: "Other Iranica articles that came up in search and were not about Soh.",
  },
  "PDF of the Kashan article": {
    fa: "نسخه‌ی پی‌دی‌اف همان مقاله‌ی کاشان که از سُه نام می‌برد.",
    en: "The PDF of the same Kashan article that names Soh.",
  },
  "Karl Hadank": {
    fa: "کارل هادانک، از پژوهشگرانی که داده‌ی گویش سُه از طریق او به ایرانیکا رسیده. این صفحه‌ها زندگی‌نامه‌اند، نه واژه‌نامه.",
    en: "Karl Hadank, one of the researchers through whom Soh dialect data reached Iranica. These pages are a biography, not a word list.",
  },
  "Paper on Hadank and the Kurdisch-Persische Forschungen": {
    fa: "مقاله‌ای درباره‌ی هادانک و مجموعه‌ی پژوهش‌های کردی-فارسی. باز نشده.",
    en: "A paper on Hadank and the Kurdish-Persian research series. Not opened.",
  },
  "Preview of Kurdisch-Persische Forschungen": {
    fa: "پیش‌نمایش همان مجموعه. باز نشده و معلوم نیست واژه‌ی سُه در همین صفحات باشد.",
    en: "A preview of that series. Not opened, and it is not known whether a Soh word is on these pages.",
  },
  "De Gruyter series page": {
    fa: "صفحه‌ی مجموعه در سایت ناشر. خود متن گویش نیست.",
    en: "The series page on the publisher's site. Not the dialect text itself.",
  },
  "\"Is there a Gabri dialect of modern Persian?\"": {
    fa: "مقاله‌ای درباره‌ی وجود گویش گبری. به نام قلعه‌های گبری سُه مربوط می‌شود، نه به واژه‌های روستا. باز نشده.",
    en: "A paper asking whether a Gabri dialect of Persian exists. It relates to the name of Soh's Gabri forts, not to the village's words. Not opened.",
  },
  "Columbia academic commons (dialect-related download)": {
    fa: "یک فایل دانشگاه کلمبیا که در جستجوی گویش آمد. باز نشده و درباره‌ی سُه تأیید نشد.",
    en: "A Columbia University file that came up in the dialect search. Not opened, and not confirmed to be about Soh.",
  },
  "Iranian dialect papers (not Soh)": {
    fa: "چند مقاله‌ی گویش‌شناسی ایرانی. درباره‌ی سُه نیستند.",
    en: "Several papers on Iranian dialects. They are not about Soh.",
  },
  "Ensani papers (499666: Murcheh Khvort fortified village)": {
    fa: "مقاله‌هایی در انسانی. یکی‌شان درباره‌ی روستای قلعه‌ای مورچه‌خورت است، نه سُه.",
    en: "Papers on Ensani. One is about the fortified village of Murcheh Khvort, not Soh.",
  },
  "SID dialect paper": {
    fa: "یک مقاله‌ی گویشی در سید. باز نشده و درباره‌ی سُه تأیید نشد.",
    en: "A dialect paper on SID. Not opened, and not confirmed to be about Soh.",
  },
  "Three Isfahan dialects approved for national registration": {
    fa: "خبر ثبت ملی سه گویش اصفهان. سُه در میان آن‌ها نام برده نشده.",
    en: "News that three Isfahan dialects were approved for national registration. Soh is not named among them.",
  },
  "Meymeh dialect word list (not Soh)": {
    fa: "فهرست واژه‌های گویش میمه. واژه‌های سُه نیست، ولی نزدیک‌ترین فهرست پیدا شده است.",
    en: "A word list for the Meymeh dialect. These are not Soh's words, but it is the nearest list found.",
  },
  "Isfahani accent (Persian Wikipedia)": {
    fa: "لهجه‌ی اصفهانی در ویکی‌پدیای فارسی. لهجه‌ی شهر است، نه گویش سُه.",
    en: "The Isfahani accent on Persian Wikipedia. That is the city's accent, not Soh's dialect.",
  },
  "Esfahani accent (English Wikipedia)": {
    fa: "همان لهجه‌ی اصفهانی در ویکی‌پدیای انگلیسی.",
    en: "The same Isfahani accent on English Wikipedia.",
  },
  "Blogs on Isfahani speech": {
    fa: "وبلاگ‌هایی درباره‌ی حرف زدن اصفهانی. گویش سُه نیستند.",
    en: "Blogs about Isfahani speech. They are not the Soh dialect.",
  },
  "News on Isfahan's local dialects": {
    fa: "خبرهایی درباره‌ی گویش‌های محلی اصفهان. سُه در خلاصه نبود.",
    en: "News about Isfahan's local dialects. Soh was not in the summary.",
  },
  "Cultural atlas: language and dialect of Isfahan province": {
    fa: "اطلس فرهنگی: زبان و گویش استان اصفهان. باز نشده.",
    en: "A cultural atlas page on the language and dialect of Isfahan province. Not opened.",
  },
  "\"A few Isfahani words\" (Noormags)": {
    fa: "مقاله‌ی «چند واژه‌ی اصفهانی». واژه‌ی سُه نیست.",
    en: "An article titled “A few Isfahani words”. Not Soh's vocabulary.",
  },
  "Varnosfadarani dialect (Sedeh; a different place)": {
    fa: "گویش ورنوسفادران در سده. جای دیگری است.",
    en: "The Varnosfadarani dialect of Sedeh. A different place.",
  },
  "Murcheh Khvort Rural District": {
    fa: "دهستان مورچه‌خورت، همان دهستانی که سُه در آن است.",
    en: "Murcheh Khvort Rural District, the district Soh belongs to.",
  },
  "Murcheh Khvort village and district items": {
    fa: "روستا و دهستان مورچه‌خورت. همسایه‌ی اداری سُه است، خود سُه نیست.",
    en: "The village and district of Murcheh Khvort. Soh's administrative neighbour, not Soh itself.",
  },
  "Dehlor": {
    fa: "دهلر، روستایی که سر راه سُه است.",
    en: "Dehlor, a village on the road to Soh.",
  },
  "Commons category": {
    fa: "رده‌ی ویکی‌مدیا برای مورچه‌خورت. عکسی از خود سُه در آن نیست.",
    en: "The Wikimedia Commons category for Murcheh Khvort. It has no photo of Soh itself.",
  },
  "Meymeh": {
    fa: "میمه، شهر غربی سُه.",
    en: "Meymeh, the town to the west of Soh.",
  },
  "The county": {
    fa: "شهرستان شاهین‌شهر و میمه، شهرستانی که سُه در آن است.",
    en: "Shahin Shahr and Meymeh County, the county Soh is in.",
  },
  "Karkas range": {
    fa: "رشته‌کوه کرکس. سُه روی دامنه‌ی آن است. این صفحه‌ها خود کوه را توضیح می‌دهند.",
    en: "The Karkas range. Soh sits on its slopes. These pages describe the mountains, not the village.",
  },
  "Karkas mountain guides": {
    fa: "راهنماهای صعود و گردشگری کوه کرکس. مسیر روستا نیستند.",
    en: "Guides to climbing and visiting Mount Karkas. They are not a route guide to the village.",
  },
  "Kojaro: things to see in Meymeh (listed in search; not opened)": {
    fa: "جاهای دیدنی میمه در کجارو. در جستجو آمد و باز نشد.",
    en: "Things to see in Meymeh on Kojaro. It came up in search and was not opened.",
  },
  "Tourist areas of Meymeh, Borkhar and Shahin Shahr": {
    fa: "مناطق گردشگری میمه، برخوار و شاهین‌شهر.",
    en: "Tourist areas of Meymeh, Borkhar and Shahin Shahr.",
  },
  "Otaghak: attractions of Shahin Shahr": {
    fa: "جاذبه‌های شاهین‌شهر در اتاقک.",
    en: "Attractions of Shahin Shahr on Otaghak.",
  },
  "General travel pages that mention nearby places": {
    fa: "صفحه‌های عمومی سفر که جاهای نزدیک را نام می‌برند، نه راهنمای سُه.",
    en: "General travel pages that mention nearby places, not a guide to Soh.",
  },
  "Road crash on the Kalahrud road, 10 Mehr 1404 (unrelated to tourism)": {
    fa: "خبر تصادف در جاده‌ی کله‌رود. به گردشگری سُه مربوط نیست.",
    en: "A report of a crash on the Kalahrud road. It is not about tourism in Soh.",
  },
  "Meymeh in spring": {
    fa: "ویدیوی میمه در بهار. سُه نیست.",
    en: "A video of Meymeh in spring. Not Soh.",
  },
  "Aparat videos that came up for Meymeh (titles not shown)": {
    fa: "ویدیوهای آپارات که برای میمه پیدا شدند. عنوانشان دیده نشد و از سُه نیستند.",
    en: "Aparat videos that came up for Meymeh. Their titles were not shown, and they are not of Soh.",
  },
  "Documentary \"GOR\", Meymeh, 7th of Muharram": {
    fa: "مستند «گور» درباره‌ی میمه در هفتم محرم. سُه نیست.",
    en: "The documentary “GOR”, about Meymeh on the 7th of Muharram. Not Soh.",
  },
  "\"Corners of Isfahan\" series": {
    fa: "مجموعه‌ی «گوشه‌های اصفهان». باز نشده.",
    en: "The “Corners of Isfahan” series. Not opened.",
  },
  "\"33 Bridges of Isfahan\"": {
    fa: "«۳۳ پل اصفهان». مربوط به سُه نیست.",
    en: "“33 Bridges of Isfahan”. Not about Soh.",
  },
  "Saray-e Moallem Karkas eco-lodge (Tarq Rud, Natanz)": {
    fa: "اقامتگاه سرای معلم کرکس در طرق‌رود نطنز. نزدیک سُه نیست.",
    en: "The Saray-e Moallem Karkas eco-lodge in Tarq Rud, Natanz. It is not near Soh.",
  },
  "Abyaneh unit on Jajiga": {
    fa: "یک واحد اجاره‌ای در ابیانه. ابیانه همسایه‌ی شمالی سُه است، خود روستا نیست.",
    en: "A rental unit in Abyaneh. Abyaneh is Soh's northern neighbour, not the village itself.",
  },
  "Abyaneh villas": {
    fa: "ویلاهای اجاره‌ای ابیانه، نه سُه.",
    en: "Rental villas in Abyaneh, not in Soh.",
  },
  "Dorafshan eco-lodge, Abyaneh": {
    fa: "بوم‌گردی درافشان در ابیانه.",
    en: "Dorafshan eco-lodge in Abyaneh.",
  },
  "Abyaneh Hotel; Matin Abad Eco Camp": {
    fa: "هتل ابیانه و کمپ متین‌آباد نطنز. هیچ‌کدام در سُه نیست.",
    en: "Abyaneh Hotel and Matin Abad Eco Camp in Natanz. Neither is in Soh.",
  },
  "Tavasolian House, Natanz": {
    fa: "خانه‌ی توسلیان در نطنز.",
    en: "Tavasolian House in Natanz.",
  },
  "Bank Saderat, Murcheh Khvort industrial town": {
    fa: "بانک صادرات در شهرک صنعتی مورچه‌خورت، نزدیک‌ترین شعبه‌ای که پیدا شد. در خود سُه نیست و ساعت کارش بررسی نشده.",
    en: "Bank Saderat in the Murcheh Khvort industrial town, the nearest branch found. It is not in Soh, and the opening hours were not checked.",
  },
  "Bank Day ATM, Shahin Shahr": {
    fa: "خودپرداز بانک دی در شاهین‌شهر. در سُه خودپرداز پیدا نشد.",
    en: "A Bank Day ATM in Shahin Shahr. No ATM was found in Soh.",
  },
  "Law on preserving farmland and orchard use": {
    fa: "متن قانون حفظ کاربری زمین زراعی و باغ. برای خرید ملک در روستا به آن اشاره شده و مشاوره‌ی حقوقی نیست.",
    en: "The text of the law on keeping farmland and orchards in agricultural use. The property page points to it. It is not legal advice.",
  },
  "Basalam marketplace (no Soh seller found)": {
    fa: "بازار باسلام. فروشنده‌ای از سُه پیدا نشد.",
    en: "The Basalam marketplace. No seller from Soh was found.",
  },
  "Property and classified sites (no Soh listings found)": {
    fa: "دیوار و شیپور. آگهی ملکی برای سُه پیدا نشد.",
    en: "Divar and Sheypoor. No property listing for Soh was found.",
  },
  "Map services": {
    fa: "نقشه‌های بلد و نشان، برای پیدا کردن شعبه و مسیر.",
    en: "The Balad and Neshan maps, for finding a bank branch and a route.",
  },
  "Isfahan Emrooz (county martyrs commemoration story; its article URL: https://esfahanemrooz.ir/بخش-شهرستان-شاهین-شهر-میمه-15/36243-بزرگداشت-سرداران-بیش-از)": {
    fa: "اصفهان امروز: گزارش بزرگداشت سرداران شهرستان. مخصوص سُه تأیید نشد.",
    en: "Isfahan Emrooz: a county commemoration of commanders. It was not confirmed to be about Soh.",
  },
  "National martyrs database (no Soh entry found; https://shohada.org/fa/shahid/101025 was an unrelated person)": {
    fa: "پایگاه شهدای کشور. مدخلی برای سُه پیدا نشد. یک شناسه که آمد شخص دیگری بود.",
    en: "The national martyrs database. No Soh entry was found. One id that came up was a different person.",
  },
  "Lives of the Shahin Shahr terror martyrs (unrelated)": {
    fa: "زندگی‌نامه‌ی شهدای ترور شاهین‌شهر. مربوط به سُه نیست.",
    en: "Lives of Shahin Shahr's terror martyrs. Not about Soh.",
  },
  "see section 2": {
    fa: "همان کتاب راه‌های ایران که در بخش کاروانسرا آمده.",
    en: "The same 19th-century route book already listed under the caravanserai section.",
  },
  "Soha Village Resort, a different place); (unrelated fan page": {
    fa: "این نشانی‌ها سُه نیستند: یکی اقامتگاه سُها در جای دیگر است و یکی صفحه‌ی هواداری بی‌ربط.",
    en: "These addresses are not Soh: one is a Soha resort somewhere else, and one is an unrelated fan page.",
  },
  "general Shahin Shahr pages, no Soh content": {
    fa: "صفحه‌های عمومی شاهین‌شهر. مطلبی درباره‌ی سُه نداشتند.",
    en: "General Shahin Shahr pages. They had nothing about Soh.",
  },
  "Pages about Sohr, Sohra, Sohanak, Sohr va Firuzan, Soh in Sistan («سه‌کوهه», ), Tepe Sialk (), Tell Jemmeh, Atr Afshan, Pirasafneh, Esfeh, Esfahanak-e Sofla, Mount Soffeh": {
    fa: "جاهایی با نام شبیه سُه، یا جاهای دیگری که در جستجو آمدند: سهر، سهرانک، سه‌کوهه‌ی سیستان، سیلک و مانند این‌ها. هیچ‌کدام روستای سُهِ میمه نیستند.",
    en: "Places with a similar name, or other places that came up: Sohr, Sohanak, Soh in Sistan, Tepe Sialk and the like. None of them is the Soh near Meymeh.",
  },
  "Tepe Kohneh Deh Sehkani, a different \"Seh\"": {
    fa: "تپه‌ی کهنه‌ده سه‌کانی. یک «سه»ی دیگر است.",
    en: "Tepe Kohneh Deh Sehkani. A different “Seh”.",
  },
  "old-photo pages (120-year-old village photo; not Soh": {
    fa: "صفحه‌های عکس قدیمی. عکس ۱۲۰ساله مال سُه نبود.",
    en: "Old-photo pages. The 120-year-old village photo was not Soh.",
  },
  "Vercel pricing pages ( , ) from the hosting question": {
    fa: "صفحه‌های قیمت ورکل که هنگام پرسش میزبانی آمدند. ربطی به روستا ندارند.",
    en: "Vercel pricing pages that came up while asking about hosting. They have nothing to do with the village.",
  },
  "IRIB, 14 Shahrivar 1397: tourism target village, Friday mosque with three shrines, seven mills, 94 km from Isfahan. Mill count conflicts with Kojaro's three.": {
    fa: "صدا و سیما، ۱۴ شهریور ۱۳۹۷: سُه را روستای هدف گردشگری می‌نامد، از مسجد جامع با سه امامزاده و از هفت آسیاب می‌گوید و فاصله تا اصفهان را ۹۴ کیلومتر می‌نویسد. کجارو سه آسیاب نام برده، پس شمار آسیاب قطعی نیست.",
    en: "IRIB, 5 September 2018: calls Soh a tourism target village, names a Friday mosque with three shrines and seven mills, and puts Isfahan 94 km away. Kojaro names three mills, so the mill count is not settled.",
  },
  "Place list. Coordinates given as 33°1' N, 51°21' E, which do not match 33.44 N, 51.45 E.": {
    fa: "فهرست جاها در حماسه‌سازان. مختصاتی که نوشته (۳۳ درجه و ۱ دقیقه) با ۳۳٫۴۴ شمالی این سایت نمی‌خواند، پس جزئیاتش به‌تنهایی قطعی گرفته نشده.",
    en: "A place list on Hamaseh Sazan. The coordinates it gives (33°1' N) do not match the 33.44 N used here, so its details are not treated as settled on their own.",
  },
  "Saed News, 2 Feb 2026, quoting IRNA. English summary of sights. Original IRNA text not opened.": {
    fa: "سعیدنیوز، ۱۳ بهمن ۱۴۰۴، به نقل از ایرنا. خلاصه‌ی انگلیسی جاهای دیدنی. متن اصلی ایرنا جداگانه باز نشد.",
    en: "Saed News, 2 February 2026, quoting IRNA. An English summary of the sights. The original IRNA story was not opened on its own.",
  },
  "Etnopedia \"Soi\": identifies Soh village with the Soi people. Not a word list.": {
    fa: "اتنوپدیا زیر نام Soi روستا را با مردم سویی یکی می‌گیرد. واژه‌نامه نیست.",
    en: "Etnopedia, under “Soi”, identifies the village with the Soi people. It is not a word list.",
  },
  "Urdu Wikipedia. Copies the English Wikipedia coordinates (31.78 N), which this site does not use.": {
    fa: "ویکی‌پدیای اردو. همان مختصات غلط ویکی‌پدیای انگلیسی را تکرار می‌کند و این سایت از آن استفاده نمی‌کند.",
    en: "Urdu Wikipedia. It repeats English Wikipedia's wrong coordinates, which this site does not use.",
  },
  "\"View of the town of Soh\", c.1880-1910, attributed Antoine Sevruguin, Rijksmuseum · CC0 · may be a different Soh": {
    fa: "عکس «نمای شهر سُه»، حدود ۱۸۸۰ تا ۱۹۱۰، منسوب به سوروگین، موزه‌ی ریکس، با مجوز آزاد. معلوم نیست کدام سُه است و روی سایت نیامده.",
    en: "“View of the town of Soh”, about 1880 to 1910, attributed to Sevruguin, Rijksmuseum, free licence. It may be a different Soh, so it is not on the site.",
  },
  "\"Soh, Persia\", March 1898, Khurad Pass · (see page) · a Soh on a pass; unknown if our village": {
    fa: "عکس «سُه، ایران»، مارس ۱۸۹۸، گذرگاه خوراد. سُهی سر یک گردنه است و معلوم نیست روستای ما باشد.",
    en: "“Soh, Persia”, March 1898, at Khurad Pass. A Soh on a mountain pass, and it is not known to be our village.",
  },
  "Kojaro Soh page (about a dozen photos, credited to Ali Safaei, Mohammad Eshaq, Nader Naderi Sohi, Masoud Safavi, Maryam Khadem Jalil)": {
    fa: "حدود ده‌ها عکس کجارو از خود سُه. حق نشر با عکاس‌هاست (علی صفایی، محمد اسحاق، نادر نادری سُهی، مسعود صفوی، مریم خادم جلیل) و اینجا کپی نشده‌اند.",
    en: "About a dozen Kojaro photos of Soh itself. The copyright belongs to the photographers, and the pictures are not copied here.",
  },
  "Instagram @soh_village (daily photos and videos)": {
    fa: "عکس و ویدیوی روزانه‌ی اینستاگرام روستا. مال صاحب صفحه است و اینجا کپی نشده.",
    en: "Daily photos and videos on the village Instagram. They belong to the account and are not copied here.",
  },
  "Instagram location page \"Soh, Esfahan, Iran\" (about 1,800 tagged posts)": {
    fa: "حدود ۱۸۰۰ پست که روی مکان سُه در اینستاگرام زده شده. مال صاحبان پست‌هاست.",
    en: "About 1,800 posts tagged at the Soh place on Instagram. They belong to the people who posted them.",
  },
  "Facebook page, Historical Village of SOH": {
    fa: "عکس‌های صفحه‌ی فیسبوک روستا. مال صاحب صفحه است.",
    en: "Photos on the village Facebook page. They belong to the page.",
  },
  "Facebook public group (old photos; Media tab not opened)": {
    fa: "عکس‌های قدیمی گروه فیسبوک. زبانه‌ی رسانه‌ها باز نشد. برای استفاده باید از صاحب عکس اجازه گرفت.",
    en: "Old photos in the Facebook group. The media tab was not opened. Ask the owner before using one.",
  },
  "Telegram channel esfahansohi (photos and videos of villagers)": {
    fa: "عکس و ویدیوی کانال تلگرام اهالی. مال فرستندگان است.",
    en: "Photos and videos on the villagers' Telegram channel. They belong to the people who sent them.",
  },
  "IRIB News report with a video and 9 photos (May 2021)": {
    fa: "همان خبر خرداد ۱۴۰۰ صدا و سیما، با ویدیو و ۹ عکس. حق پخش با صدا و سیماست.",
    en: "The same May 2021 IRIB report, with a video and nine photos. The rights belong to IRIB.",
  },
  "Mehr News Muharram report (photos)": {
    fa: "عکس‌های گزارش محرم در مهر. حق نشر با خبرگزاری است.",
    en: "Photos in the Mehr Muharram report. The copyright belongs to the news agency.",
  },
  "Dana news: Soh mourning with photos (blocked here)": {
    fa: "خبر دانا با عکس عزاداری سُه. از اینجا باز نشد و عکس‌ها کپی نشده‌اند.",
    en: "Dana news with photos of Soh's mourning. It was blocked from here, and the photos were not copied.",
  },
  "SohiPictures blog (blocked here)": {
    fa: "وبلاگ عکس سُهی‌پیکچرز. از اینجا باز نشد.",
    en: "The SohiPictures photo blog. It was blocked from here.",
  },
  "Touristgah page (blocked here)": {
    fa: "صفحه‌ی توریستگاه، احتمالاً با عکس. از اینجا باز نشد.",
    en: "The Touristgah page, probably with photos. It was blocked from here.",
  },
  "Gardeshnama": {
    fa: "عکس‌های راهنمای گردشنامه. مال سایت است و اینجا کپی نشده.",
    en: "Photos on the Gardeshnama guide. They belong to that site and are not copied here.",
  },
  "Beinabein travel report (photos)": {
    fa: "عکس‌های گزارش سفر بین‌آبین. مال نویسنده است.",
    en: "Photos in the Beinabein travel report. They belong to the author.",
  },
  "Digital Caravanserai project, Soh Caravanserai entry": {
    fa: "برگه‌ی پروژه‌ی کاروانسرای دیجیتال برای کاروانسرای سُه. عکس‌هایش جداگانه کپی نشده.",
    en: "The Digital Caravanserai project's entry for Soh Caravanserai. Its images were not copied separately.",
  },
  "Facebook post: 1962 plan of Soh caravanserai by Maxime Siroux (in the group above)": {
    fa: "پست گروه فیسبوک: نقشه‌ی ۱۹۶۲ کاروانسرای سُه منسوب به ماکسیم سیرو. اصل نقشه هنوز پیدا نشده.",
    en: "A Facebook group post: a 1962 plan of Soh's caravanserai attributed to Maxime Siroux. The original plan has not been found.",
  },
  "Commons category Murcheh Khvort (no Soh files)": {
    fa: "رده‌ی عکس‌های آزاد مورچه‌خورت. فایلی به نام سُه در آن نیست.",
    en: "The free-photo category for Murcheh Khvort. It has no file of Soh.",
  },
};
