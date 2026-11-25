import type { L } from "./i18n";

// All page text in Persian (fa) and English (en). Facts come from content/content.json and its sources.
// status: reported = one or more web sources, unverified = single or conflicting source, family = told by family.
export type Status = "reported" | "unverified" | "family";
export type Block =
  | { t: "p"; text: L }
  | { t: "cards"; items: { title: L; fa?: string; text: L; status?: Status; source?: string; href?: string }[] }
  | { t: "tags"; label?: L; items: L[] }
  | { t: "links"; items: { name: L; url: string; note: L }[] }
  | { t: "dl"; items: { k: L; v: L }[] }
  | { t: "table"; head: L[]; rows: L[][]; empty?: L }
  | { t: "notice"; title: L; items: L[] };

export type Section = { slug: string; title: L; intro: L; blocks: Block[] };

export const siteName: L = { fa: "روستای سُه", en: "Soh Village" };
export const tagline: L = {
  fa: "روستایی در دامنه‌ی کوه‌های کرکس، شهرستان شاهین‌شهر و میمه، استان اصفهان",
  en: "A mountain village on the slopes of the Karkas range, Isfahan province, Iran",
};
export const stats: { v: L; k: L }[] = [
  { v: { fa: "۲٬۳۵۰ متر", en: "2,350 m" }, k: { fa: "ارتفاع از سطح دریا", en: "altitude" } },
  { v: { fa: "۲۹۵ نفر", en: "295" }, k: { fa: "جمعیت، سرشماری ۱۳۹۵ (۲۰۱۶)", en: "people, 2016 census" } },
  { v: { fa: "حدود ۹۴ کیلومتر", en: "~94 km" }, k: { fa: "تا شهر اصفهان", en: "to Isfahan city" } },
  { v: { fa: "۳۳٫۴۴ شمالی، ۵۱٫۴۵ شرقی", en: "33.44°N 51.45°E" }, k: { fa: "مختصات", en: "coordinates" } },
];
export const population = [
  { year: 2006, people: 403, households: 141 },
  { year: 2011, people: 281, households: 108 },
  { year: 2016, people: 295, households: 127 },
];

const verifyTitle: L = { fa: "هنوز تأیید نشده", en: "Not verified yet" };

export const sections: Section[] = [
  {
    slug: "history",
    title: { fa: "تاریخ", en: "History" },
    intro: {
      fa: "آنچه از گذشته‌ی سُه نوشته شده و آنچه سندی ندارد.",
      en: "What is written about Soh's past, and what has no document.",
    },
    blocks: [
      {
        t: "cards",
        items: [
          {
            title: { fa: "قدمت", en: "Age" },
            text: {
              fa: "گفته می‌شود سُه بیش از ۲۰۰۰ سال قدمت دارد؛ نشانه‌ها: قلعه‌های گبری، قلعه‌ی نچفت، سنگ‌های آسیاب و ویرانه‌ی آتشکده. ویکی‌پدیای فارسی می‌گوید سندی نیست.",
              en: "Said to be over 2,000 years old. Cited: Gabri-named castles, the Nachaft castle, millstones, a fire-temple ruin. Persian Wikipedia says no document supports this.",
            },
            status: "unverified",
            source: "FA Wikipedia, EN Wikipedia, Kojaro",
          },
          {
            title: { fa: "نام روستا", en: "The name" },
            text: {
              fa: "گفته می‌شود نام از «سُهی» یا «سَهی» به معنی بلند آمده، چون روستا بر دامنه‌ی کرکس است. فقط یک منبع.",
              en: "Said to come from “sohi” or “sahi”, meaning high, as the village sits on the Karkas slopes. One source only.",
            },
            status: "unverified",
            source: "Kojaro",
          },
          {
            title: { fa: "جاده‌ی کاروان‌رو", en: "The caravan road" },
            text: {
              fa: "تا میانه‌ی قاجار، سُه بر جاده‌ی کاروان‌رو بود و محل داد و ستد و استراحت مسافران شده بود. بناهای باقی‌مانده صفوی و قاجاری‌اند.",
              en: "Until mid-Qajar, the caravan road made Soh a stop for trade and rest. Surviving buildings are Safavid and Qajar.",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "کاروانسرای سُه", en: "Soh Caravanserai" },
            fa: "کاروانسرای سُه",
            text: {
              fa: "کتیبه‌ی سردر: ۱۲۲۳ هجری قمری (۱۸۰۸)، زمان فتحعلی‌شاه، بانی «ابوالقاسم اصفهانی». حدود ۳۰۰۰ مترمربع، چهار ایوان، ۲۰ اتاق. شماره‌ی ثبت ملی ۷۶۴۱ (کجارو) تأیید نشده؛ ویکی‌پدیا آن را برای اردبیل آورده. مرمت ۱۳۹۵ تا ۱۴۰۰.",
              en: "Portal inscription: 1223 AH (1808 CE), Fath-Ali Shah's reign; builder Abolqasem Esfahani. About 3,000 m², four iwans, 20 rooms. Kojaro's monument no. 7641 is unconfirmed; Persian Wikipedia files it under Ardabil. Restored 1395 to 1400.",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "قلعه‌ها", en: "The forts" },
            text: {
              fa: "چهار قلعه: بالا، پایین، میان و چال. «قلعه‌میان» بیش از بقیه نام برده می‌شود.",
              en: "Four forts: Bala (upper), Pain (lower), Miyan (middle) and Chal. Miyan is named most.",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "یادداشت قدیمی مسافران", en: "An old travellers' route book" },
            text: {
              fa: "کتاب راه‌های ایران (سده‌ی نوزدهم) از «سه» روی راه اصفهان می‌گوید: دو ده دیوارکشیده و کاروانسرایی آجری. روشن نیست همان سُه‌ی میمه باشد.",
              en: "A 19th-century route book mentions a “Soh” on the Isfahan road: two walled villages, a brick caravanserai. Unclear if it is Soh near Meymeh.",
            },
            status: "unverified",
            source: "Qatar Digital Library",
            href: "https://www.qdl.qa/archive/81055/vdc_100024054422.0x0000c4",
          },
          {
            title: { fa: "تغییر چهره‌ی روستا", en: "How the village is changing" },
            text: {
              fa: "مهرخ هاشمی (۱۴۰۰): ساخت‌وساز تازه به منظر آسیب می‌زند؛ توان گردشگری بالا ولی سرمایه کم است. گزارش سفر (اسفند ۱۴۰۰): بخش‌هایی تغییر یا تخریب می‌شود؛ حمام از دوره‌ی رضاشاه است.",
              en: "Researcher Mahrokh Hashemi (2021): new construction harms the landscape; tourism potential is high, investment low. A travel report (Feb 2022) says parts are altered or demolished and dates the bath to Reza Shah.",
            },
            status: "unverified",
            source: "A 2021 blog and a 2022 travel report (Beinabein)",
          },
          {
            title: { fa: "محوطه‌های باستانی (ادعای تازه)", en: "Ancient sites (a recent claim)" },
            text: {
              fa: "پست فیسبوکی (اسفند ۱۴۰۳): یک باستان‌شناس میراث فرهنگی اصفهان چند محوطه‌ی سُه را بررسی کرده و قدمت آن‌ها را دست‌کم ۵۰۰۰ سال دانسته. گزارش رسمی پیدا نشد؛ فقط گفته‌ی یک اهل روستاست.",
              en: "A Feb 2025 Facebook group post says an Isfahan heritage archaeologist dated sites in Soh to at least 5,000 years. No official report found; one villager's claim.",
            },
            status: "unverified",
            source: "Facebook group post (Feb 2025)",
            href: "https://www.facebook.com/groups/250924961607462/",
          },
          {
            title: { fa: "نقشه‌ی کاروانسرا از سال ۱۳۴۱", en: "A 1962 plan of the caravanserai" },
            text: {
              fa: "گروه فیسبوکی روستا نقشه‌ی کاروانسرا را دارد، ترسیم ماکسیم سیرو (ایران‌شناس فرانسوی)، نوامبر ۱۹۶۲. اصل نقشه پیدا نشد.",
              en: "The village Facebook group shows a caravanserai plan drawn by French Iranologist Maxime Siroux, November 1962. Original not found.",
            },
            status: "unverified",
            source: "Facebook group post (Sep 2014)",
            href: "https://www.facebook.com/groups/250924961607462/",
          },
          {
            title: { fa: "جدایی از نطنز", en: "Separation from Natanz" },
            text: {
              fa: "تا ۱۳۷۵ (۱۹۹۶) سُه جزو نطنز بود. ویکی‌پدیا «نیازمند منبع» گذاشته.",
              en: "Part of Natanz County until 1996 (1375). Persian Wikipedia marks this “needs citation”.",
            },
            status: "unverified",
            source: "FA Wikipedia",
          },
        ],
      },
      {
        t: "notice",
        title: { fa: "از خانواده بپرسیم", en: "To ask the family" },
        items: [
          { fa: "داستان‌ها و خاطره‌های قدیمی روستا", en: "Old stories and memories of the village" },
          { fa: "خانواده‌ها و خانه‌های قدیمی شناخته‌شده", en: "Well-known families and old houses" },
        ],
      },
    ],
  },
  {
    slug: "tourism",
    title: { fa: "گردشگری", en: "Tourism" },
    intro: {
      fa: "جاهای دیدنی و طبیعت سُه.",
      en: "Places to see and nature in Soh.",
    },
    blocks: [
      { t: "p", text: { fa: "کجارو: سایت سفر ایرانی. صدا و سیما و ایرنا: رسانه‌ی دولتی.", en: "Kojaro: Iranian travel site. IRIB, IRNA: state media." } },
      {
        t: "dl",
        items: [
          { k: { fa: "بهترین زمان سفر", en: "Best time to visit" }, v: { fa: "بهار و اوایل تابستان", en: "Spring and early summer" } },
          { k: { fa: "هوا", en: "Climate" }, v: { fa: "تابستان معتدل، زمستان سرد", en: "Temperate summers, cold winters" } },
          { k: { fa: "دهستان", en: "Rural district" }, v: { fa: "مورچه‌خورت: ۳۹ روستا، ۲٬۱۹۸ نفر (۱۳۹۵؛ خود مورچه‌خورت ۱٬۳۶۹)", en: "Murcheh Khvort: 39 villages, 2,198 people (2016; Murcheh Khvort itself 1,369)" } },
          { k: { fa: "همسایه‌ها", en: "Neighbours" }, v: { fa: "ابیانه (شمال)، بیدشک (جنوب)، کله‌رود (شرق)، رباط آقا کمال و میمه (غرب)", en: "Abyaneh (north), Bidshak (south), Kalahrud (east), Rebat Aqa Kamal and Meymeh (west)" } },
          { k: { fa: "راه", en: "Getting there" }, v: { fa: "کجارو: خروجی دهلر و بیدشک، حدود ۵۰ کیلومتر بعد از شاهین‌شهر؛ ویکی‌پدیا: ۶۰ کیلومتر مانده به اصفهان. ایستگاه قطار یا پایانه در روستا نیست. نقشه را ببینید.", en: "Exit for Dehlor and Bidshak: Kojaro says 50 km after Shahin Shahr; Persian Wikipedia says 60 km before Isfahan. No bus or train station in the village. See Map." } },
        ],
      },
      {
        t: "cards",
        items: [
          { title: { fa: "کاروانسرای سُه", en: "Soh Caravanserai" }, text: { fa: "اثر ملی قاجاری با چهار ایوان. جزئیات در بخش تاریخ.", en: "A Qajar national monument with four iwans. Details under History." }, status: "reported", source: "Kojaro" },
          { title: { fa: "امامزاده یوسف", en: "Imamzadeh Yusuf" }, text: { fa: "بقعه‌ای در بالادست روستا، حدود ۴۰۰ سال قدمت، گنبد ۱۶ متری فیروزه‌ای. گفته می‌شود یوسف، فرزند امام هادی، آرمیده است.", en: "Upper-village shrine, about 400 years old, 16 m turquoise dome. Said to hold Yusuf, son of Imam Hadi." }, status: "reported", source: "Kojaro" },
          { title: { fa: "امامزاده گلیله", en: "Imamzadeh Golileh" }, text: { fa: "بقعه‌ی گنبد فیروزه‌ای در مرکز پایین روستا.", en: "Turquoise-domed shrine at the centre of the lower village." }, status: "reported", source: "Kojaro" },
          { title: { fa: "حمام قدیمی", en: "The old bath" }, text: { fa: "حمام قاجاری، حدود ۲۰۰ سال قدمت. از دو حمام بالا و پایین یکی مانده و با کمک مردم مرمت شده.", en: "Qajar-era bath, about 200 years old. Of two baths, one survives, restored with local help." }, status: "reported", source: "Kojaro" },
          { title: { fa: "خانه‌ی کدخدا", en: "Kadkhoda house" }, text: { fa: "خانه‌ی تاریخی کدخدا، میرزا بهرام صفوی.", en: "Historic home of the headman, Mirza Bahram Safavi." }, status: "reported", source: "Kojaro" },
          { title: { fa: "پل نواب", en: "Nav Bridge" }, text: { fa: "کجارو آن را در فهرست آثار آورده، بی‌ذکر قدمت، مصالح یا وضع فعلی.", en: "On Kojaro's list of sights; no age, material or present state given." }, status: "reported", source: "Kojaro" },
          { title: { fa: "آسیاب امامزاده", en: "Imamzadeh mill" }, text: { fa: "یکی از سه آسیاب آبی کجارو؛ صدا و سیما (۱۳۹۷) هفت آسیاب می‌گوید. حماسه‌سازان آن‌ها را مخروبه می‌داند، ولی مختصاتش با مختصات این سایت نمی‌خواند. شرح جداگانه‌ای نیست.", en: "One of Kojaro's three water mills; IRIB News (2018) says seven. Hamaseh Sazan calls them ruined, but its coordinates do not match ours. No separate description found." }, status: "unverified", source: "Kojaro; IRIB News, 14 Shahrivar 1397; Hamaseh Sazan" },
          { title: { fa: "آسیاب میرزا ابوالحسن", en: "Mirza Abolhasan mill" }, text: { fa: "دومین آسیاب فهرست کجارو. فقط نام آمده؛ وضع آن معلوم نیست.", en: "Second mill on Kojaro's list. Only the name is given; its state is unknown." }, status: "reported", source: "Kojaro" },
          { title: { fa: "آسیاب میرزا محمد", en: "Mirza Mohammad mill" }, text: { fa: "سومین آسیاب فهرست کجارو. فقط نام آمده. سه آسیاب کجارو با «هفت آسیاب» صدا و سیما نمی‌خواند.", en: "Third mill on Kojaro's list. Only the name. Kojaro's three do not match IRIB's “seven mills”." }, status: "unverified", source: "Kojaro; IRIB News, 14 Shahrivar 1397" },
          { title: { fa: "خانه‌ی تلگراف", en: "The telegraph house" }, text: { fa: "کجارو «عمارت قدیمی معروف به خانه‌ی تلگراف» را از آثار صفوی و قاجاری می‌شمارد. حماسه‌سازان آن را همان عمارت فرنگی می‌داند؛ یک خلاصه‌ی انگلیسی ۲۰۲۶ آن‌ها را دو بنا می‌شمارد. یکی یا دو تا، معلوم نیست.", en: "Kojaro lists an old mansion called the telegraph house. Hamaseh Sazan says it is the Farangi mansion; a 2026 summary lists two. Unclear if one building or two." }, status: "unverified", source: "Kojaro; Hamaseh Sazan; Saed News, Feb 2026" },
          { title: { fa: "برج کبوتر", en: "Dovecote tower" }, text: { fa: "کجارو یک برج کبوتر را در فهرست آثار آورده. تعداد، جا و وضع آن نوشته نشده.", en: "Kojaro lists one dovecote tower. Number, place and condition are not given." }, status: "reported", source: "Kojaro" },
          { title: { fa: "خانه‌ی میرزا جعفر", en: "Mirza Jafar's house" }, text: { fa: "کجارو فقط «منزل میرزا جعفر» را نام برده. نسبتش با کدخدا یا صاحبان آسیاب‌ها معلوم نیست.", en: "Kojaro only names “Mirza Jafar's house”. His relation to the kadkhoda or the mill owners is unknown." }, status: "reported", source: "Kojaro" },
          { title: { fa: "کوره‌ی آجرپزی", en: "Brick kiln" }, text: { fa: "کجارو «کوره آجرپزی» را آورده، بی‌توضیح. معلوم نیست هنوز دیده می‌شود.", en: "Kojaro lists a brick kiln, no detail. Unknown if it can still be seen." }, status: "reported", source: "Kojaro" },
          { title: { fa: "زورخانه‌ی کوچک", en: "The small zurkhaneh" }, text: { fa: "کجارو می‌نویسد ورزش باستانی در سُه محبوب است و روستا زورخانه‌ی کوچکی دارد. در بخش آیین‌ها هم آمده.", en: "Kojaro says traditional gym sports are popular in Soh and the village has a small zurkhaneh. Also under Traditions." }, status: "reported", source: "Kojaro" },
          { title: { fa: "مسجد کنار حمام", en: "The mosque beside the bath" }, text: { fa: "یادداشت‌های قبلی سایت از مسجدی ۲۰۰ ساله کنار حمام می‌گفت. کجارو چنین مسجدی را شرح نمی‌دهد؛ آن ۲۰۰ سال برای حمام است. صدا و سیما مسجد جامعی با سه امامزاده نام می‌برد؛ همان بنا بودنش معلوم نیست.", en: "Old notes had a 200-year-old mosque beside the bath. Kojaro says only the bath is 200 years old. IRIB names a Friday mosque with three shrines; may be the same building." }, status: "unverified", source: "Site notes checked against Kojaro and IRIB News" },
          { title: { fa: "کاروانسرای عباسی", en: "The Abbasi caravanserai" }, text: { fa: "کجارو: کاروانسرای عباسی روی جاده‌ی ورودی روستاست و با کاروانسرای قاجاری نشان می‌دهد سُه بر راه بازرگانی بوده. خلاصه‌ی انگلیسی ۲۰۲۶ (ایرنا) آن را «آقاکمال پایین» و «Abbasid» می‌نامد. داخل روستا نیست.", en: "On the road into the village; with the Qajar caravanserai it shows Soh was on a trade route (Kojaro). A 2026 summary (IRNA) calls it Agha Kamal Payin, “Abbasid”. Outside the village." }, status: "unverified", source: "Kojaro; Saed News, Feb 2026" },
          { title: { fa: "عمارت فرنگی", en: "The Farangi mansion" }, text: { fa: "کجارو جدا نیاورده. حماسه‌سازان می‌گوید تلگراف‌خانه بوده؛ خلاصه‌ی انگلیسی ۲۰۲۶ (ایرنا) آن‌ها را دو بنا می‌شمارد. هنوز با متن ایرنا سنجیده نشده.", en: "Not listed separately by Kojaro. Hamaseh Sazan says it was the telegraph office; a 2026 English summary (IRNA) counts two buildings. Not yet checked against the IRNA text." }, status: "unverified", source: "Hamaseh Sazan; Saed News, Feb 2026" },
          { title: { fa: "ساباط کوچه‌ی قلعه‌ی بالا", en: "The covered passage in the upper-castle alley" }, text: { fa: "ساباط یعنی کوچه‌ی سرپوشیده. کجارو شرحش نداده؛ خلاصه‌ی انگلیسی ۲۰۲۶ آن را در محله‌ی قلعه‌ی بالا می‌گذارد. متن ایرنا خوانده نشده و عکسی نداریم.", en: "A sabat is a covered lane. Kojaro does not describe it; a 2026 summary places it in the upper-castle quarter." }, status: "unverified", source: "Saed News, Feb 2026, quoting IRNA" },
          { title: { fa: "کنده‌ی باغستان", en: "Kandeh Baghestan" }, text: { fa: "خلاصه‌ی انگلیسی ۲۰۲۶ «باغ کنده» را آورده. کجارو ندارد؛ معنی نام و جای دقیق نوشته نشده.", en: "A 2026 English summary mentions a “Kandeh garden”. Not in Kojaro; meaning and exact place unknown." }, status: "unverified", source: "Saed News, Feb 2026, quoting IRNA" },
          { title: { fa: "مسجد جامع و شمار آسیاب‌ها", en: "The Friday mosque and how many mills" }, text: { fa: "صدا و سیما (۱۴ شهریور ۱۳۹۷): مسجد جامعی با مقبره‌ی شاهزاده سعید، اسدالله و سلیمان، و هفت آسیاب. کجارو سه آسیاب می‌گوید؛ هیچ‌کدام قطعی نیست. فاصله تا اصفهان: ۹۴ کیلومتر.", en: "IRIB (2018): a Friday mosque with the tombs of Shahzadeh Saeed, Asadollah and Soleiman, and seven mills. Kojaro names three. Isfahan is 94 km away." }, status: "unverified", source: "IRIB News, 14 Shahrivar 1397", href: "https://www.irib-news.ir/fa/news/2220982/%D8%B1%D9%88%D8%B3%D8%AA%D8%A7%DB%8C-%D9%87%D8%AF%D9%81-%DA%AF%D8%B1%D8%AF%D8%B4%DA%AF%D8%B1%DB%8C-%D8%B3%D9%8F%D9%87-%D8%AF%D8%B1-%D8%B4%D8%A7%D9%87%DB%8C%D9%86-%D8%B4%D9%87%D8%B1" },
        ],
      },
      { t: "p", text: { fa: "آیین‌های سُه، مانند نخل‌گردانی تاسوعا، در بخش «آیین‌ها و سنت‌ها» است.", en: "Soh's traditions, like the Tasua palm carrying, are under Traditions." } },
      { t: "p", text: { fa: "طبیعت و گردش. کجارو این‌ها را جاذبه‌ی طبیعی می‌داند؛ حریم باغ و کشتزار را نگه دارید. بیشترشان فقط نام دارند.", en: "Nature and walks. Kojaro counts these as natural sights; keep clear of gardens and fields. Most have only a name." } },
      {
        t: "cards",
        items: [
          { title: { fa: "کوه چر", en: "Kuh-e Char" }, text: { fa: "کجارو «کوه چر» نوشته، کنار بغل سیاه (پیش‌تر «چار» آمده بود). بلندی و مسیر نیامده. ۲٬۳۵۰ متر ارتفاع خود روستاست، نه قله.", en: "Kojaro writes کوه چر, beside Baghal Siyah (the site had Char, چار). Height and path not given. The 2,350 m is the village, not the peak." }, status: "reported", source: "Kojaro" },
          { title: { fa: "کوه بغل سیاه", en: "Kuh-e Baghal Siyah" }, text: { fa: "کجارو آن را کنار کوه چر از کوه‌های روستا می‌شمارد، بی‌شرح.", en: "Kojaro names it beside Kuh-e Char as a village mountain, no description." }, status: "reported", source: "Kojaro" },
          { title: { fa: "رودخانه‌ی لب‌چر", en: "Lab Char river" }, text: { fa: "کجارو «رودخانه‌ی لب چر» را جاذبه‌ی طبیعی می‌داند و جدا از رودخانه‌ای فصلی در غرب روستا می‌گوید؛ یکی نگرفته‌ایم. ویکی‌پدیا: آب کشاورزی بیشتر از جریان‌های سطحی است.", en: "Kojaro lists the Lab Char river, and separately a seasonal river west of the village; not assumed to be the same. Persian Wikipedia: farm water is mostly surface streams." }, status: "reported", source: "Kojaro; Persian Wikipedia" },
          { title: { fa: "قاش سرخه", en: "Qash Sorkheh" }, text: { fa: "کجارو فقط «قاش سرخه» را نام برده؛ معنی و جای آن نیامده.", en: "Kojaro only names Qash Sorkheh; meaning and place not given." }, status: "reported", source: "Kojaro" },
          { title: { fa: "مارگله", en: "Margaleh" }, text: { fa: "کجارو و ویکی‌پدیای فارسی آن را در فهرست گردش آورده‌اند. هیچ‌کدام نمی‌گویند مرغزار است یا دره.", en: "Kojaro and Persian Wikipedia both list it for walks. Neither says meadow or valley." }, status: "reported", source: "Kojaro; Persian Wikipedia" },
          { title: { fa: "مزرعه‌ی سرمرق", en: "Sar-Marq meadow" }, text: { fa: "کجارو «مزرعه‌ی سرمرق» و در پرانتز «مرغه‌زار» نوشته، یعنی مرغزار (سایت پیش‌تر «سرمرغ» داشت). وسعت و جا نیامده.", en: "Kojaro writes the Sar-Marq farm, with «مرغه‌زار» (meadow) in brackets; the site had سرمرغ. Size and place not given." }, status: "reported", source: "Kojaro" },
          { title: { fa: "مرغزار گزی", en: "Gazi meadow" }, text: { fa: "فقط ویکی‌پدیای فارسی آن را آورده، بی‌منبع. کجارو ندارد. با گویش گزی یکی گرفته نشده.", en: "Only Persian Wikipedia lists it, no source. Not in Kojaro. Not linked to the Gazi dialect." }, status: "unverified", source: "Persian Wikipedia" },
          { title: { fa: "چشمه‌ی هاز", en: "Haz spring" }, text: { fa: "کجارو «چشمه‌ی هاز» را نام می‌برد. ویکی‌پدیا «گل پرده هاز» را جدا دارد و یکی بودنشان را نگفته. آب‌دهی و جا نیامده.", en: "Kojaro names the Haz spring. Persian Wikipedia lists Gol Pardeh Haz separately, not as the same. Flow and place not given." }, status: "reported", source: "Kojaro; Persian Wikipedia" },
          { title: { fa: "دشت پایمیل", en: "Paymil plain" }, text: { fa: "کجارو «دشت پایمیل» را آورده؛ اندازه و راه نیامده. می‌گوید گشت در دشت‌ها بهار و اوایل تابستان بهتر است.", en: "Kojaro lists the Paymil plain; size and route not given. It says plains are best walked in spring and early summer." }, status: "reported", source: "Kojaro" },
          { title: { fa: "آبشار", en: "The waterfall" }, text: { fa: "ویکی‌پدیای فارسی فقط کلمه‌ی «آبشار» را دارد، بی‌بلندی، مسیر و منبع. کجارو آبشاری نام نبرده.", en: "Persian Wikipedia has only the word “waterfall”: no height, path or citation. Kojaro names none." }, status: "unverified", source: "Persian Wikipedia" },
          { title: { fa: "سرکریز", en: "Sarkarriz" }, text: { fa: "ویکی‌پدیای فارسی آن را بی‌توضیح آورده؛ نه جا، نه نوع. کجارو ندارد.", en: "Persian Wikipedia lists it with no description of place or kind. Not in Kojaro." }, status: "unverified", source: "Persian Wikipedia" },
          { title: { fa: "گل پرده هاز", en: "Gol Pardeh Haz" }, text: { fa: "ویکی‌پدیا آن را جدا از «چشمه‌ی هاز» کجارو آورده و یکی بودنشان را نگفته. جا و معنی نیامده.", en: "Persian Wikipedia lists it apart from Kojaro's Haz spring, not as the same. Place and meaning not given." }, status: "unverified", source: "Persian Wikipedia" },
          { title: { fa: "هل حرامزاده", en: "Hol Haramzadeh" }, text: { fa: "فقط نامش در سطر گردشگری ویکی‌پدیاست. نمی‌دانیم شخص است یا مکان. کجارو ندارد.", en: "Only the name appears on Persian Wikipedia's tourism line. Person or place unknown. Not in Kojaro." }, status: "unverified", source: "Persian Wikipedia" },
          { title: { fa: "نچفت", en: "Nachaft" }, text: { fa: "ویکی‌پدیا «نچفت» را میان جاهای گردشگری نام می‌برد، بی‌شرح. «قلعه‌ی نچفت» در بخش تاریخ هم هست؛ یکی بودنشان گفته نشده. سایت پیش‌تر «ناچفت» داشت.", en: "Persian Wikipedia names Nachaft among places to visit, no description. A Nachaft castle appears under History; no source says they are the same. The site had ناچفت." }, status: "unverified", source: "Persian Wikipedia; Kojaro" },
          { title: { fa: "زیرپل", en: "Zir-Pol" }, text: { fa: "ویکی‌پدیا «زیرپل» را آورده، بی‌گفتن کدام پل، یا این‌که پایین پل نواب است یا نه. کجارو ندارد.", en: "Persian Wikipedia lists Zir-Pol without saying which bridge, or whether it is below Nav Bridge. Not in Kojaro." }, status: "unverified", source: "Persian Wikipedia" },
        ],
      },
    ],
  },
  {
    slug: "people",
    title: { fa: "چهره‌ها", en: "People" },
    intro: {
      fa: "کسانی که با سُه شناخته می‌شوند؛ فقط با منبع.",
      en: "People tied to Soh. Sourced items only.",
    },
    blocks: [
      {
        t: "cards",
        items: [
          {
            title: { fa: "سید علی صفوی سُهی", en: "Seyed Ali Safavi Sohi" },
            fa: "سید علی صفوی سُهی",
            text: {
              fa: "متولد ۷ مرداد ۱۳۱۹، فرمانده گردان تانک ۲۹۳ در آغاز جنگ ایران و عراق. ۱۱ مرداد ۱۳۶۲ بر اثر ترکش کشته شد. پدر: سید موسی صفوی. پلی در تهران نام او را دارد. محل شهادت در دو منبع فرق دارد (فکه یا جنگل عمق).",
              en: "Born 29 July 1940. Commanded the 293rd tank battalion at the start of the Iran-Iraq war. Killed by shrapnel 2 August 1983. Father: Seyed Musa Safavi. A Tehran bridge bears his name. Sources differ on where he died (Fakkeh or Jangal-e Amqar).",
            },
            status: "unverified",
            source: "FA Wikipedia, Khabar Foori (Mar 2021)",
          },
          {
            title: { fa: "میرزا بهرام صفوی", en: "Mirza Bahram Safavi" },
            text: {
              fa: "کدخدای روستا؛ خانه‌اش از جاهای تاریخی سُه است.",
              en: "The village headman (kadkhoda); his house is a historic site.",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "گروه خانوادگی «صفوی سُهی»", en: "The Safavi Sohi family group" },
            text: {
              fa: "گردشنامه «صفوی سُهی» را بزرگ‌ترین گروه خانوادگی می‌نامد. فقط یک منبع؛ نام خانواده‌های دیگر را نمی‌دانیم.",
              en: "Gardeshnama names “Safavi Sohi” the largest family group. One source; other family names unknown.",
            },
            status: "unverified",
            source: "Gardeshnama",
          },
          {
            title: { fa: "ابوالقاسم اصفهانی", en: "Abolqasem Esfahani" },
            text: {
              fa: "بانی کاروانسرای سُه بر پایه‌ی کتیبه‌ی سردر (۱۲۲۳ هجری قمری).",
              en: "Builder of the Soh Caravanserai per the portal inscription (1223 AH).",
            },
            status: "reported",
            source: "Kojaro",
          },
        ],
      },
      {
        t: "notice",
        title: { fa: "هنوز تأیید نشده", en: "Not verified yet" },
        items: [
          { fa: "ویکی‌پدیای فارسی چند نام دیگر را بی‌توضیح دارد؛ منبع دوم نیافتیم، پس نمی‌آوریم.", en: "Persian Wikipedia lists a few more names; no second source, so not published." },
          { fa: "چهره‌های محلی (ورزشکاران، هنرمندان، شهدا، بزرگان) با کمک و رضایت خانواده", en: "Local figures (athletes, artists, martyrs, elders), with family help and consent" },
        ],
      },
    ],
  },
  {
    slug: "traditions",
    title: { fa: "آیین‌ها و سنت‌ها", en: "Traditions" },
    intro: {
      fa: "عزاداری، صنایع دستی و زندگی سنتی سُه.",
      en: "Mourning rites, crafts and traditional life in Soh.",
    },
    blocks: [
      {
        t: "cards",
        items: [
          {
            title: { fa: "نخل‌گردانی تاسوعا", en: "Tasua palm carrying" },
            text: {
              fa: "تاسوعا صبح نخل در امامزاده یوسف آراسته می‌شود، حدود ۲٫۵ کیلومتر تا امامزاده گلیله می‌رود و پس از عزاداری ظهر عاشورا برمی‌گردد. اهالی تاسوعا را «روز عباس علی» می‌نامند.",
              en: "On Tasua the palm standard is decorated at Imamzadeh Yusuf, carried about 2.5 km to Imamzadeh Golileh, and returned after the Ashura noon mourning. Locals call Tasua “Roz-e Abbas Ali”.",
            },
            status: "reported",
            source: "Mehr News (2023), Kojaro",
            href: "https://www.mehrnews.com/news/5842144/",
          },
          {
            title: { fa: "علم‌گردانی، عمار‌گردانی، تعزیه و نوحه", en: "Alam-gardani, ammar-gardani, taziyeh and nowheh" },
            text: {
              fa: "با هیئت‌های سینه‌زنی و تعزیه برگزار می‌شود. کجارو: حدود ۲۰۰ سال قدمت؛ ثبت ملی میراث ناملموس شماره‌ی ۱۲۰۷ (۵ مرداد ۱۳۹۵).",
              en: "Performed by chest-beating groups (heyat) and taziyeh troupes. Kojaro: about 200 years old; national intangible heritage no. 1207 (27 July 2016).",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "عماری و علم‌ها", en: "The amari and the standards" },
            text: {
              fa: "عماری قاب چوبی کوچکی با طاق‌های هلالی است، نماد تابوت علی‌اکبر؛ خانواده‌ای نگهدارش است و جوان‌ها روز هشتم می‌گردانند. تاسوعا هفت علم بسته می‌شود (پنج رنگی، دو سیاه) و پیشاپیش نخل می‌رود.",
              en: "The amari is a small wooden frame with crescent arches, a symbolic bier for Ali Akbar. One family keeps it; young men carry it on the 8th. On Tasua seven standards (five coloured, two black) lead the palm.",
            },
            status: "unverified",
            source: "Mehr News (2023), single source",
            href: "https://www.mehrnews.com/news/5842144/",
          },
          {
            title: { fa: "سینه‌زنی و ذکر شبانه", en: "Chest-beating and nightly zekr" },
            text: {
              fa: "سینه‌زنی و نوحه‌خوانی از شب اول محرم شروع می‌شود؛ اوج آن هشتم تا دهم است، با مجلس‌هایی در مسجد جامع. مهمان‌ها از سراسر استان می‌آیند.",
              en: "Chest-beating and dirges start on the first night of Muharram, peaking on the 8th to 10th, with gatherings at the Jame Mosque. Visitors come from across the province.",
            },
            status: "unverified",
            source: "Mehr News (2023), single source",
            href: "https://www.mehrnews.com/news/5842144/",
          },
          {
            title: { fa: "غذا و بازی‌های محلی", en: "Local foods and games" },
            text: {
              fa: "کله‌جوش، کشک مامه، آبگوشت تنوری، گلمیشه، شامی، سمنو، کشک، دوغ و کره. بازی: قاب‌بازی و «شاه‌بازی».",
              en: "Kalleh-joosh, kashk-e mama, tanoori abgoosht, golmisheh, shami, semnu, kashk, doogh and butter. Games: knucklebones and “shah bazi”.",
            },
            status: "reported",
            source: "Kojaro, a 2021 blog",
          },
          {
            title: { fa: "قالی‌بافی جوشقانی", en: "Joshaqani carpet weaving" },
            text: {
              fa: "قالی‌بافی دست‌باف میان زنان رایج است. نقش‌ها جوشقانی است و در بازار اصفهان و تهران فروخته می‌شود.",
              en: "Hand-woven carpets are common among the women. Joshaqani designs, sold in Isfahan and Tehran bazaars.",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "صنایع دستی دیگر", en: "Other crafts" },
            text: {
              fa: "گیوه‌بافی، چادرشب‌بافی، گلدوزی، سبد بید، قره‌بافی (ظرف موی بز)، لحاف تکه‌دوزی، کلاه‌بافی، ریسندگی با دوک و مشک پوست بز.",
              en: "Giveh and chadorshab weaving, embroidery, willow baskets, goat-hair containers (gharreh), patchwork quilts, cap weaving, spindle spinning, goatskin water bags.",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "خانه‌های سنتی و زورخانه", en: "Traditional houses and the zurkhaneh" },
            text: {
              fa: "خانه‌های قدیمی از چوب، گل، خشت و سنگ با بام خاکی مسطح بود. روستا زورخانه‌ی کوچکی هم دارد.",
              en: "Old houses: wood, mud, adobe and stone, with flat earth roofs. The village also has a small zurkhaneh (traditional gym).",
            },
            status: "reported",
            source: "Kojaro",
          },
        ],
      },
      {
        t: "notice",
        title: { fa: "از خانواده بپرسیم", en: "To ask the family" },
        items: [
          { fa: "عروسی، جشن‌ها و آیین‌های فصلی (برداشت سیب، نوروز، یلدا)", en: "Weddings, feasts and seasonal customs (apple harvest, Nowruz, Yalda)" },
          { fa: "غذاها و نان‌های محلی و دستور پخت", en: "Local foods and breads, and recipes" },
          { fa: "ترانه‌ها، لالایی‌ها، مَثَل‌ها و قصه‌های محلی", en: "Local songs, lullabies, proverbs and stories" },
        ],
      },
    ],
  },
  {
    slug: "market",
    title: { fa: "بازارچه", en: "Village market" },
    intro: {
      fa: "آگهی میوه، نان، خوراک محلی و کار؛ بدون پرداخت در سایت.",
      en: "Listings for fruit, food and work. No payments on the site.",
    },
    blocks: [
      { t: "p", text: { fa: "تابلوی آگهی روستا. کمیسیون ندارد؛ سایت پولی نگه نمی‌دارد.", en: "The village notice board. No commission; the site holds no money." } },
      { t: "notice", title: { fa: "قواعد (پیش‌نویس)", en: "Rules (draft)" }, items: [
        { fa: "پرداخت بیرون از سایت است؛ سایت طرفین را تأیید نمی‌کند.", en: "Pay outside the site; it does not verify people." },
        { fa: "برای کار پول ندهید. آگهی پیش‌پرداخت منتشر نمی‌شود.", en: "Never pay to get a job. Upfront-payment listings are not published." },
        { fa: "دستمزد و ساعت کار را پیش از شروع مکتوب کنید. کار کودکان پذیرفته نیست.", en: "Put pay and hours in writing first. No child labour." },
        { fa: "فقط کالا و خدمات قانونی؛ نام و شماره فقط با اجازه‌ی صاحبش.", en: "Legal goods and services only; names and numbers only with permission." },
        { fa: "هر آگهی پس از ۳۰ روز برداشته می‌شود، مگر تمدید شود.", en: "Listings expire after 30 days unless renewed." },
      ] },
    ],
  },
  {
    slug: "stay",
    title: { fa: "اقامت", en: "Where to stay" },
    intro: {
      fa: "جای ماندن در سُه و اطراف آن.",
      en: "Places to stay in and around Soh.",
    },
    blocks: [
      {
        t: "cards",
        items: [
          { title: { fa: "در خود روستا", en: "In the village" }, text: { fa: "کجارو: در سُه بوم‌گردی یا مهمان‌پذیر نیست؛ چادر بزنید یا در شهرهای نزدیک بمانید. ما هم چیزی نیافتیم (آذر ۱۴۰۵).", en: "Kojaro: no eco-lodge or guest house in Soh; camp or stay nearby. We found none either (Nov 2026)." }, status: "reported", source: "Kojaro" },
          { title: { fa: "آمار گردشگری شهرستان", en: "County tourism count" }, text: { fa: "فهرست آذر ۱۴۰۱ شهرستان: ۴ بوم‌گردی، ۱ مسافرخانه، ۱ هتل، ۲ مهمان‌پذیر، ۳ کمپ. سُه و کله‌رود روستاهای هدف گردشگری‌اند. نام و تماس نیامده؛ شاید قدیمی باشد.", en: "County inventory, Dec 2022: 4 eco-lodges, 1 traveller's house, 1 hotel, 2 guest houses, 3 camping sites. Soh and Kalahrud are target villages. No names or numbers; may be dated." }, status: "reported", source: "Kojaro news, 7 Dec 2022", href: "https://www.kojaro.com/news/194447-tourist-attractions-shahinshahr-revived/" },
          { title: { fa: "ابیانه (همسایه‌ی شمالی)", en: "Abyaneh (northern neighbour)" }, text: { fa: "چند ویلا و اقامتگاه سنتی در جاجیگا و اسنپ‌تریپ، و بوم‌گردی «درافشان». قیمت و فاصله بررسی نشده.", en: "Villas and traditional lodgings on Jajiga and Snapptrip, plus Dorafshan eco-lodge. Prices and distance unchecked." }, status: "unverified", href: "https://ioverlander.com/places/196946-dorafshan-ecolodge", source: "iOverlander" },
          { title: { fa: "نطنز", en: "Natanz" }, text: { fa: "«خانه‌ی توسلیان» و «کمپ اکو متین‌آباد». قیمت و فاصله بررسی نشده.", en: "Tavasolian House and Matin Abad Eco Camp. Prices and distance unchecked." }, status: "unverified", href: "https://www.visitouriran.com/en/hotel/Natanz/5002993", source: "visitouriran.com" },
          { title: { fa: "سرای معلم کوه کرکس (طرق‌رود)", en: "Saray-e Moallem Karkas (Tarq Rud)" }, text: { fa: "بوم‌گردی نزدیک دریاچه‌ی طرق‌رود، نطنز؛ نه در سُه. فاصله بررسی نشده؛ ممکن است بسته باشد.", en: "Eco-lodge near Tarq Rud lake, Natanz County; not near Soh. Distance unchecked; may be closed." }, status: "unverified", href: "https://www.balad.ir/p/%D8%A7%D9%82%D8%A7%D9%85%D8%AA%DA%AF%D8%A7%D9%87-%D8%B3%D8%B1%D8%A7%D9%89-%D9%85%D8%B9%D9%84%D9%85_hotel-2ibeYQS0ucocsj", source: "Balad" },
          { title: { fa: "شهرهای نزدیک", en: "Nearby towns" }, text: { fa: "میمه و شاهین‌شهر (حدود ۷۵ کیلومتر) و اصفهان (۹۴ تا ۱۰۰ کیلومتر) اقامتگاه بیشتری دارند. فهرست بررسی‌شده نداریم.", en: "Meymeh and Shahin Shahr (about 75 km) and Isfahan (94 to 100 km) have more. No checked list yet." }, status: "unverified" },
        ],
      },
      {
        t: "notice",
        title: verifyTitle,
        items: [
          { fa: "نام، تماس و قیمت اقامتگاه‌های نزدیک", en: "Names, phones and prices nearby" },
          { fa: "اتاق اجاره‌ای در سُه، میمه، دهلر، بیدشک و کله‌رود", en: "Rooms for rent in Soh, Meymeh, Dehlor, Bidshak and Kalahrud" },
        ],
      },
    ],
  },
  {
    slug: "shop",
    title: { fa: "خرید", en: "Where to buy" },
    intro: {
      fa: "محصولات سُه و جاهایی که می‌شود خرید.",
      en: "What Soh is known for and where to buy things.",
    },
    blocks: [
      { t: "p", text: { fa: "سیب سُه از بهترین‌های استان اصفهان توصیف شده و حدود ۳۰٪ ظرفیت اقتصادی روستاست. فروشگاه یا فروشنده‌ی آنلاین مشخصی نیافتیم.", en: "Soh apples are described as among Isfahan province's best; about 30% of the village's economic capacity. We found no specific shop or online seller." } },
      { t: "tags", label: { fa: "میوه و کشاورزی", en: "Fruit and farm" }, items: [{ fa: "سیب (رقم‌های متعدد)", en: "Apples (many varieties)" }, { fa: "گردو", en: "Walnut" }, { fa: "بادام", en: "Almond" }, { fa: "انگور", en: "Grape" }, { fa: "گیلاس و آلبالو", en: "Cherry and sour cherry" }, { fa: "زردآلو", en: "Apricot" }, { fa: "گلابی", en: "Pear" }, { fa: "به", en: "Quince" }, { fa: "توت", en: "Mulberry" }, { fa: "گیاهان دارویی", en: "Medicinal plants" }] },
      { t: "tags", label: { fa: "لبنیات و غذا", en: "Dairy and food" }, items: [{ fa: "شیر و ماست", en: "Milk and yogurt" }, { fa: "پنیر", en: "Cheese" }, { fa: "کشک", en: "Kashk" }, { fa: "دوغ", en: "Buttermilk" }, { fa: "روغن", en: "Ghee" }, { fa: "نان محلی", en: "Village bread" }, { fa: "تخم‌مرغ محلی", en: "Free-range eggs" }] },
      { t: "tags", label: { fa: "صنایع دستی", en: "Crafts" }, items: [{ fa: "قالی دست‌باف (نقش جوشقانی)", en: "Hand-woven carpets (Joshaqani style)" }, { fa: "گیوه‌بافی", en: "Giveh weaving" }, { fa: "چادرشب", en: "Chadorshab" }, { fa: "گلدوزی", en: "Embroidery" }, { fa: "سبد بید", en: "Willow baskets" }, { fa: "قره‌بافی (ظرف موی بز)", en: "Goat-hair containers (gharreh)" }, { fa: "لحاف تکه‌دوزی", en: "Patchwork quilts" }, { fa: "مشک پوست بز", en: "Goatskin water bags" }] },
      {
        t: "cards",
        items: [
          { title: { fa: "مستقیم از روستا", en: "Directly from the village" }, text: { fa: "راه مطمئن، پرسیدن از اهالی یا خانواده است. اگر می‌فروشید و می‌خواهید در این صفحه بیایید، بگویید.", en: "Ask residents or family. If you sell a Soh product and want to be listed, tell us." }, status: "unverified" },
          { title: { fa: "بازار آنلاین باسلام", en: "Basalam online marketplace" }, text: { fa: "بازار آنلاین ایرانی برای محصولات خانگی و روستایی. فروشنده‌ی سُه‌ای نیافتیم.", en: "Iranian online marketplace for home and village products. No Soh seller found." }, href: "https://basalam.com", source: "basalam.com" },
        ],
      },
    ],
  },
  {
    slug: "stores",
    title: { fa: "فروشگاه‌ها", en: "Stores" },
    intro: {
      fa: "مغازه‌های سُه برای خرید روزمره.",
      en: "Shops in Soh for everyday buying.",
    },
    blocks: [
      { t: "p", text: { fa: "برای بقالی، نانوایی و مغازه‌های خود روستا. «خرید» درباره‌ی محصولات سُه است، نه مغازه.", en: "For the grocery, bakery and shops in the village. Where to buy covers Soh's products, not shops." } },
      {
        t: "cards",
        items: [
          { title: { fa: "در خود روستا", en: "In the village" }, text: { fa: "هیچ منبعی بقالی، نانوایی یا مغازه‌ای در سُه با نشانی ندارد (جستجو، آذر ۱۴۰۵). کجارو: بعضی باغدارها میوه را مستقیم می‌فروشند.", en: "No source names a shop in Soh with an address (searched Nov 2026). Kojaro: some gardeners sell fruit directly." }, status: "reported", source: "Kojaro; site search, 24 Nov 2026" },
          { title: { fa: "شهرهای نزدیک", en: "Nearby towns" }, text: { fa: "میمه و شاهین‌شهر مغازه دارند؛ هنوز بررسی نشده‌اند.", en: "Meymeh and Shahin Shahr have shops; not checked yet." }, status: "unverified" },
        ],
      },
      {
        t: "notice",
        title: { fa: "برای افزودن مغازه بفرستید", en: "To add a shop, send" },
        items: [
          { fa: "نام مغازه و آنچه می‌فروشد", en: "Shop name and what it sells" },
          { fa: "جای تقریبی و ساعت کار", en: "Rough location and opening hours" },
          { fa: "اجازه‌ی نوشتن شماره‌ی تماس در سایت", en: "Permission to publish a phone number" },
        ],
      },
    ],
  },
  {
    slug: "hospital",
    title: { fa: "بیمارستان", en: "Hospital" },
    intro: {
      fa: "درمان و بیمارستان برای مردم سُه.",
      en: "Care and hospitals for people in Soh.",
    },
    blocks: [
      { t: "p", text: { fa: "برای کار فوری با اورژانس ۱۱۵ تماس بگیرید. این صفحه جای توصیه‌ی پزشکی نیست.", en: "For an emergency, call 115. This page is not medical advice." } },
      {
        t: "cards",
        items: [
          { title: { fa: "در خود روستا", en: "In the village" }, text: { fa: "در منابع عمومی، بیمارستان، درمانگاه یا خانه‌ی بهداشت در سُه پیدا نشد (آذر ۱۴۰۵).", en: "No hospital, clinic or health house in Soh found in public sources (Nov 2026)." }, status: "unverified", source: "Site search, 24 Nov 2026" },
          { title: { fa: "بیمارستان شهرهای نزدیک", en: "Hospitals in nearby towns" }, text: { fa: "بیمارستان معمول مردم سُه هنوز ثبت نشده؛ تا تأیید اهالی نامی نمی‌نویسیم.", en: "The usual hospital for Soh is not recorded; none is named until confirmed." }, status: "unverified" },
        ],
      },
      {
        t: "notice",
        title: { fa: "برای تکمیل این صفحه بفرستید", en: "To fill in this page, send" },
        items: [
          { fa: "خانه‌ی بهداشت یا درمانگاه روستا و روزهای حضور پزشک", en: "Village health house or clinic, and doctor's days" },
          { fa: "بیمارستان مردم سُه برای کار جدی، با شهر و نشانی", en: "Hospital used for serious care, with town and address" },
          { fa: "اجازه‌ی نوشتن شماره‌ی تماس در سایت", en: "Permission to publish a phone number" },
        ],
      },
    ],
  },
  {
    slug: "words",
    title: { fa: "واژه‌ها و گویش", en: "Words and dialect" },
    intro: {
      fa: "گویش سُه و واژه‌های مردمش.",
      en: "The Soh dialect and its words.",
    },
    blocks: [
      { t: "p", text: { fa: "گویش مادی و مرکزی ایران؛ مورگنستیرنه آن را با قهرود، کاشان و میمه هم‌گروه می‌داند. ایرانیکا: نخستین یادداشت‌ها از آندریاس و مان و هدانک (۱۹۲۶). واژه‌نامه‌ی تأییدشده‌ای در اینترنت نیست.", en: "A Central Plateau (Median) dialect; Morgenstierne groups it with Qohrud, Kashan and Meyma. Iranica: earliest notes by Andreas and by Mann and Hadank (1926). No verified word list online." } },
      { t: "links", items: [
        { name: { fa: "ایرانیکا: گویش میمه", en: "Iranica: Meyma dialect" }, url: "https://www.iranicaonline.org/articles/meyma-ii-dialect/", note: { fa: "نزدیک‌ترین گویش مستند", en: "The closest documented dialect" } },
        { name: { fa: "ایرانیکا: گویش‌های مادی کاشان", en: "Iranica: The Median dialects of Kashan" }, url: "https://www.iranicaonline.org/articles/kashan-ix-the-median-dialects-of-kashan", note: { fa: "سُه را مرکزی می‌داند؛ داده از آندریاس و مان و هدانک", en: "Lists Soh as Central; data from Andreas and Mann and Hadank" } },
        { name: { fa: "ثبت ملی سه گویش محلی اصفهان (شهر خبر)", en: "National registration of three Isfahan dialects (Shahr-e Khabar)" }, url: "https://www.shahrekhabar.com/analysis/148837020005114", note: { fa: "گزی و میمه‌ای نام برده شده؛ سُه نه", en: "Names Gazi and Meymeh; not Soh" } },
        { name: { fa: "گویش میمه‌ای (وبلاگ)", en: "The Meymeh dialect (blog)" }, url: "http://vatankhah.blogfa.com/post/261", note: { fa: "فهرست واژه‌های میمه‌ای؛ سُه نیست", en: "Meymeh word list; not Soh" } },
        { name: { fa: "ایرانیکا: گویش‌های استان اصفهان", en: "Iranica: Isfahan provincial dialects" }, url: "https://www.iranicaonline.org/articles/isfahan-xxi-provincial-dialects", note: { fa: "پیشینه‌ی گویش‌های منطقه", en: "Background on the region's dialects" } },
      ] },
      {
        t: "table",
        head: [{ fa: "واژه‌ی سُه‌ای", en: "Soh word" }, { fa: "فارسی معیار", en: "Standard Persian" }, { fa: "انگلیسی", en: "English" }, { fa: "چه کسی گفته", en: "Told by" }],
        rows: [],
        empty: { fa: "هنوز واژه‌ی تأییدشده‌ای نیست. از اهالی جمع می‌کنیم، نه از گویش‌های همسایه.", en: "No confirmed words yet. We collect from residents, not neighbouring dialects." },
      },
      {
        t: "notice",
        title: { fa: "برای افزودن واژه بفرستید", en: "To add a word, send" },
        items: [
          { fa: "واژه به شکل سُه‌ای، با فارسی‌نویسی", en: "The word as said in Soh, in Persian script" },
          { fa: "معنی، جمله‌ی نمونه و گوینده", en: "Meaning, example sentence, speaker" },
          { fa: "اگر ممکن است، ضبط صدا", en: "A voice recording, if possible" },
        ],
      },
    ],
  },
  {
    slug: "resources",
    title: { fa: "منابع اینترنتی", en: "Resources online" },
    intro: {
      fa: "مطالب اینترنتی درباره‌ی سُه.",
      en: "What we found online about Soh.",
    },
    blocks: [
      { t: "p", text: { fa: "فیسبوک روستا «soh.ir» را وب‌سایت خود نوشته، ولی در آذر ۱۴۰۵ باز نشد. وب‌سایت رسمی دیگری نیافتیم.", en: "The village Facebook page lists “soh.ir”, which did not load in Nov 2026. No other official site found." } },
      { t: "links", items: [
        { name: { fa: "ویکی‌پدیای فارسی: سه (شاهین‌شهر)", en: "Persian Wikipedia: Soh" }, url: "https://fa.wikipedia.org/wiki/%D8%B3%D9%87_(%D8%B4%D8%A7%D9%87%DB%8C%D9%86%E2%80%8C%D8%B4%D9%87%D8%B1_%D9%88_%D9%85%DB%8C%D9%85%D9%87)", note: { fa: "تاریخ، اقتصاد، چهره‌ها", en: "History, economy, people" } },
        { name: { fa: "ویکی‌پدیای انگلیسی: Soh, Shahinshahr", en: "English Wikipedia: Soh, Shahinshahr" }, url: "https://en.wikipedia.org/wiki/Soh,_Shahinshahr", note: { fa: "جمعیت (سرشماری)", en: "Census population" } },
        { name: { fa: "ویکی‌داده Q5955889", en: "Wikidata Q5955889" }, url: "https://www.wikidata.org/wiki/Q5955889", note: { fa: "داده‌ی ساختاریافته", en: "Structured data" } },
        { name: { fa: "کجارو: روستای سه اصفهان", en: "Kojaro: Soh village" }, url: "https://www.kojaro.com/attraction/64660-isfahan-soh-village/", note: { fa: "راهنمای گردشگری، منبع بیشتر جاذبه‌ها", en: "Travel guide, the source for most sights" } },
        { name: { fa: "نقشه‌ی گوگل (از کجارو)", en: "Google Maps (via Kojaro)" }, url: "https://goo.gl/maps/wDRqsHQ2uwYaXufJ9", note: { fa: "موقعیت روستا", en: "Village location" } },
        { name: { fa: "اینستاگرام: soh_village", en: "Instagram: soh_village" }, url: "https://www.instagram.com/soh_village/", note: { fa: "«روستای تاریخی سه»؛ آبان ۱۴۰۵ فعال و روزانه. گرداننده معلوم نیست.", en: "“The historic village of Soh”. Active, posting daily, Nov 2026. Runner unknown." } },
        { name: { fa: "فیسبوک: صفحه‌ی روستای تاریخی سُه", en: "Facebook: the historic village of Soh (page)" }, url: "https://www.facebook.com/sohiran", note: { fa: "حدود ۹۳۰ دنبال‌کننده؛ soh.ir را وب‌سایت نوشته", en: "About 930 followers; lists soh.ir" } },
        { name: { fa: "فیسبوک: گروه عمومی روستای تاریخی سه (soh)", en: "Facebook: public group “the historic village of Soh”" }, url: "https://www.facebook.com/groups/250924961607462/", note: { fa: "حدود ۱٫۱ هزار عضو؛ عکس قدیمی و خاطره. بیشتر پس از عضویت", en: "About 1.1K members; old photos, memories. More after joining." } },
        { name: { fa: "تلگرام: esfahansohi", en: "Telegram: esfahansohi" }, url: "https://t.me/esfahansohi", note: { fa: "کانال اهالی: اطلاعیه، خاطره، عکس. حدود ۸۵۰ عضو", en: "Announcements, memories, photos. About 850 subscribers." } },
        { name: { fa: "مهر: آیین‌های محرم در سه", en: "Mehr News: Muharram rites in Soh" }, url: "https://www.mehrnews.com/news/5842144/", note: { fa: "گزارش تیر ۱۴۰۲ درباره‌ی عماری‌گردانی و نخل‌گردانی", en: "July 2023 report on the amari and nakhl carrying" } },
        { name: { fa: "خبر صدا و سیما: روستای سُه، تماشایی اما ناشناخته", en: "IRIB News: Soh, beautiful but unknown" }, url: "https://www.irib-news.ir/fa/news/3114741/", note: { fa: "خرداد ۱۴۰۰؛ ویدیو و ۹ عکس. نخوانده‌ایم.", en: "May 2021; video, 9 photos. Not read." } },
        { name: { fa: "گردشنامه: سه", en: "Gardeshnama: Soh" }, url: "https://gardeshnama.com/tours/destinations/2742/%D8%B3%D9%87/", note: { fa: "راهنمای گردشگری؛ بهترین فصل فروردین", en: "Travel guide; best season is Farvardin (spring)" } },
        { name: { fa: "بین‌آبین: کاروانسرای روستای سه", en: "Beinabein: the caravanserai of Soh" }, url: "https://beinabein.com/%DA%A9%D8%A7%D8%B1%D9%88%D8%A7%D9%86%D8%B3%D8%B1%D8%A7%DB%8C-%D8%B3%D9%87-%D8%A7%D8%B5%D9%81%D9%87%D8%A7%D9%86/", note: { fa: "سفرنامه‌ی محمد گائینی، اسفند ۱۴۰۰: کاروانسرای صفوی، حمام رضاشاهی", en: "Mohammad Gaeeni travel report, Feb 2022: Safavid caravanserai, Reza Shah-era bath" } },
        { name: { fa: "وبلاگ: روستای تاریخی سه (۱۴۰۰)", en: "Blog: the historic village of Soh (2021)" }, url: "https://downloadsara.expresblog.ir/post/%D8%B1%D9%88%D8%B3%D8%AA%D8%A7%DB%8C-%D8%AA%D8%A7%D8%B1%DB%8C%D8%AE%DB%8C-%D8%B3%D9%87-%D8%A7%D8%B5%D9%81%D9%87%D8%A7%D9%86-%D8%AF%D8%A7%D8%B1%D8%A7%DB%8C-4871", note: { fa: "بناهای تاریخی و دیدگاه یک پژوهشگر میراث", en: "Historic buildings and a heritage researcher's view" } },
        { name: { fa: "ویکی‌پدیا: مناطق نمونه‌ی گردشگری استان اصفهان", en: "Persian Wikipedia: model tourism areas of Isfahan province" }, url: "https://fa.wikipedia.org/wiki/%D9%81%D9%87%D8%B1%D8%B3%D8%AA_%D9%85%D9%86%D8%A7%D8%B7%D9%82_%D9%86%D9%85%D9%88%D9%86%D9%87_%DA%AF%D8%B1%D8%AF%D8%B4%DA%AF%D8%B1%DB%8C_%D8%A7%D8%B3%D8%AA%D8%A7%D9%86_%D8%A7%D8%B5%D9%81%D9%87%D8%A7%D9%86", note: { fa: "سُه و کله‌رود، روستاهای نمونه‌ی گردشگری", en: "Soh and Kalahrud as model tourism villages" } },
        { name: { fa: "ماکسیم سیرو (ویکی‌پدیا)", en: "Maxime Siroux (Wikipedia)" }, url: "https://en.wikipedia.org/wiki/Maxime_Siroux", note: { fa: "ایران‌شناس فرانسوی؛ کتاب ۱۹۴۹ و مقاله‌ی ۱۹۷۴ درباره‌ی کاروانسراهای صفوی", en: "French scholar; 1949 book and 1974 article on Safavid caravanserais" } },
        { name: { fa: "جاذبه‌های شاهین‌شهر: کجارو (خبر)", en: "Kojaro news: Shahin Shahr attractions" }, url: "https://www.kojaro.com/news/194447-tourist-attractions-shahinshahr-revived/", note: { fa: "سُه و کله‌رود روستاهای هدف گردشگری", en: "Soh and Kalahrud as tourism target villages" } },
        { name: { fa: "صدا و سیما: روستای هدف گردشگری سُه (۱۳۹۷)", en: "IRIB News: Soh as a tourism target village (2018)" }, url: "https://www.irib-news.ir/fa/news/2220982/%D8%B1%D9%88%D8%B3%D8%AA%D8%A7%DB%8C-%D9%87%D8%AF%D9%81-%DA%AF%D8%B1%D8%AF%D8%B4%DA%AF%D8%B1%DB%8C-%D8%B3%D9%8F%D9%87-%D8%AF%D8%B1-%D8%B4%D8%A7%D9%87%DB%8C%D9%86-%D8%B4%D9%87%D8%B1", note: { fa: "۱۴ شهریور ۱۳۹۷. مسجد جامع، سه امامزاده، هفت آسیاب؛ شمار آسیاب با کجارو نمی‌خواند.", en: "5 Sep 2018. Friday mosque, three shrines, seven mills; mill count differs from Kojaro." } },
        { name: { fa: "حماسه سازان: سه", en: "Hamaseh Sazan: Soh" }, url: "https://www.hamasesazan.ir/electorate/%d8%b3%d9%87", note: { fa: "فهرست جاها؛ مختصاتش با مختصات این‌جا نمی‌خواند", en: "Place list; its coordinates do not match ours" } },
        { name: { fa: "Saed News، به نقل از ایرنا (فوریه ۲۰۲۶)", en: "Saed News, quoting IRNA (February 2026)" }, url: "https://en.saednews.com/cn/7/15875", note: { fa: "گزارش انگلیسی؛ متن ایرنا را نخوانده‌ایم", en: "English report; original IRNA not read" } },
        { name: { fa: "اتنوپدیا: Soi", en: "Etnopedia: Soi" }, url: "https://en.etnopedia.org/Soi", note: { fa: "روستا را با گویش سویی یکی می‌گیرد؛ واژه‌نامه نیست", en: "Equates village with Soi dialect; no word list" } },
      ] },
      { t: "notice", title: verifyTitle, items: [
        { fa: "ویکی‌پدیای انگلیسی ۳۱٫۷۸ شمالی دارد، منابع دیگر ۳۳٫۴۴؛ ۳۳٫۴۴ به‌کار رفته.", en: "English Wikipedia says 31.78 N, others 33.44 N; we use 33.44." },
        { fa: "فاصله‌ی دقیق تا میمه؛ کجارو «۱۵ کیلومتر شرق میمه» و «مرز غربی با میمه» می‌نویسد.", en: "Exact distance to Meymeh; Kojaro says “15 km east” and “western border”." },
      ] },
    ],
  },
  {
    slug: "banks",
    title: { fa: "بانک‌ها", en: "Banks" },
    intro: {
      fa: "بانک و خودپرداز نزدیک سُه.",
      en: "Banks and ATMs near Soh.",
    },
    blocks: [
      { t: "p", text: { fa: "در سُه شعبه یا خودپردازی پیدا نشد. پول نقد همراه داشته باشید.", en: "No branch or ATM found in Soh. Carry cash." } },
      { t: "cards", items: [
        { title: { fa: "بانک صادرات، شهرک صنعتی مورچه‌خورت", en: "Bank Saderat, Murcheh Khvort industrial town" }, text: { fa: "بلد: شهرک صنعتی مورچه‌خورت، بلوار شیخ‌بهایی، خیابان زکریا، ابوریحان ۴؛ همان دهستان سُه. ساعت و فاصله بررسی نشده؛ با ۱۴۸۸ تماس بگیرید.", en: "Balad: Murcheh Khvort industrial town, Sheikh Bahai Blvd, Zakaria St, Abu Rayhan 4; same rural district as Soh. Hours and distance unchecked; call 1488." }, status: "unverified", source: "Balad" },
        { title: { fa: "میمه و شاهین‌شهر", en: "Meymeh and Shahin Shahr" }, text: { fa: "فقط یک خودپرداز بانک دی در میدان فاطمیه‌ی شاهین‌شهر پیدا شد. شعبه‌ای در میمه، نطنز یا ابیانه و دفتر پستی نیافتیم.", en: "Only a Bank Day ATM on Fatemiyeh Square, Shahin Shahr, found. No branch in Meymeh, Natanz or Abyaneh, and no post office." }, status: "unverified" },
      ] },
      { t: "links", items: [
        { name: { fa: "نقشه‌ی بلد", en: "Balad map" }, url: "https://balad.ir", note: { fa: "جستجوی «بانک» و «خودپرداز» در میمه", en: "Search “bank” and “ATM” near Meymeh" } },
        { name: { fa: "نقشه‌ی نشان", en: "Neshan map" }, url: "https://neshan.org", note: { fa: "جستجوی شعبه و ساعت کار", en: "Search branches and opening hours" } },
      ] },
    ],
  },
  {
    slug: "property",
    title: { fa: "خرید و فروش ملک", en: "Property" },
    intro: {
      fa: "خانه، باغ و زمین در سُه: خرید و فروش.",
      en: "Houses, orchards and land in Soh.",
    },
    blocks: [
      { t: "p", text: { fa: "آگهی ملکی در سُه نیست. آگهی پس از تماس مالک و بررسی اضافه می‌شود.", en: "No Soh property listings yet. Added after the owner contacts us and details are checked." } },
      { t: "table",
        head: [{ fa: "نوع", en: "Type" }, { fa: "متراژ", en: "Size" }, { fa: "قیمت", en: "Price" }, { fa: "نوع سند", en: "Deed" }, { fa: "تماس", en: "Contact" }],
        rows: [],
        empty: { fa: "هنوز آگهی‌ای ثبت نشده است.", en: "No listings yet." } },
      { t: "links", items: [
        { name: { fa: "دیوار", en: "Divar" }, url: "https://divar.ir", note: { fa: "جستجوی «سه، میمه» یا «شاهین‌شهر و میمه»", en: "Search “Soh, Meymeh” or “Shahin Shahr and Meymeh”" } },
        { name: { fa: "شیپور", en: "Sheypoor" }, url: "https://www.sheypoor.com", note: { fa: "آگهی ملک و زمین", en: "Property and land listings" } },
      ] },
      { t: "notice", title: { fa: "پیش از خرید بررسی کنید", en: "Check before buying" }, items: [
        { fa: "سند و نام مالک، در دفترخانه", en: "Deed type and owner's name, at a notary" },
        { fa: "کاربری زمین و امکان ساخت", en: "Land use and whether building is allowed" },
        { fa: "حقابه‌ی آب و دسترسی به جاده", en: "Water rights and road access" },
        { fa: "تغییر کاربری باغ و زمین زراعی بیرون از شهر محدود است؛ پیش از خرید از وکیل بپرسید.", en: "Changing use of orchards and farmland outside towns is restricted; ask a lawyer first." },
        { fa: "مشاوره‌ی حقوقی نیست.", en: "This is not legal advice." },
      ] },
    ],
  },
  {
    slug: "needs",
    title: { fa: "نیازمندی‌ها", en: "Requests" },
    intro: {
      fa: "نیاز یا پیشنهاد خود را به مردم سُه برسانید.",
      en: "Ask the village for what you need, and offer what you have.",
    },
    blocks: [
      { t: "p", text: { fa: "مثل تابلوی نیازمندی‌های روستاست. نیاز یا پیشنهادتان را در فرم بنویسید و متن را بفرستید. آگهی‌ها بررسی می‌شوند؛ شماره‌ی تماس فقط با اجازه‌ی شما.", en: "Like the village notice board. Write your need or offer in the form and send the text. Posts are checked; your number is shown only with permission." } },
      { t: "tags", label: { fa: "نمونه‌ی نیازمندی‌ها", en: "Examples of what people ask for" }, items: [
        { fa: "اتاق یا خانه برای اقامت", en: "A room or house to stay" },
        { fa: "راننده یا وسیله‌ی رفت‌وآمد", en: "A driver or a ride" },
        { fa: "بنّا، نجار یا تعمیرکار", en: "A mason, carpenter or repairer" },
        { fa: "کارگر برای باغ و برداشت", en: "Workers for the orchard or harvest" },
        { fa: "سیب، گردو، لبنیات و فرآورده‌ی محلی", en: "Apples, walnuts, dairy and local products" },
        { fa: "قالی و صنایع دستی", en: "Carpets and crafts" },
        { fa: "راهنمای گردشگری", en: "A local guide" },
        { fa: "کمک در کارهای اداری و ترجمه", en: "Help with paperwork and translation" },
        { fa: "ابزار و وسایل دست‌دوم", en: "Tools and second-hand equipment" },
      ] },
      { t: "table",
        head: [{ fa: "نوع", en: "Type" }, { fa: "نیاز یا پیشنهاد", en: "Request or offer" }, { fa: "منطقه", en: "Area" }, { fa: "تاریخ", en: "Date" }, { fa: "تماس", en: "Contact" }],
        rows: [],
        empty: { fa: "هنوز آگهی‌ای منتشر نشده است. اولین نفر باشید.", en: "No posts published yet. Be the first." } },
      { t: "notice", title: { fa: "قواعد پیشنهادی (پیش‌نویس)", en: "Draft rules" }, items: [
        { fa: "سایت پولی را نگه نمی‌دارد و کسی را تأیید نمی‌کند؛ پیش از پرداخت مطمئن شوید.", en: "No payments held, nobody verified. Make sure before you pay." },
        { fa: "شماره و نشانی فقط با رضایت صاحبش.", en: "Phones and addresses shown only with consent." },
        { fa: "هر آگهی پس از ۳۰ روز برداشته می‌شود، مگر تمدید شود.", en: "Posts expire after 30 days unless renewed." },
        { fa: "آگهی خلاف قانون، توهین‌آمیز یا فریبنده منتشر نمی‌شود.", en: "Illegal, abusive or misleading posts are not published." },
      ] },
    ],
  },
  {
    slug: "careers",
    title: { fa: "فرصت‌های شغلی", en: "Careers" },
    intro: {
      fa: "کار در سُه و اطراف، و کارجویان.",
      en: "Work in and around Soh, and people seeking work.",
    },
    blocks: [
      { t: "p", text: { fa: "کشاورزی و دامداری پایه‌ی کار روستاست (بررسی ۱۳۸۶: حدود ۸۶٪ اهالی کشاورزند). گردشگری، مرمت و صنایع دستی می‌توانند رشد کنند. کار یا کارگر می‌خواهید؟ فرم را پر کنید.", en: "Farming and livestock anchor local work (2007–08 survey: about 86% of residents farmed). Tourism, restoration and crafts could grow. Need work or workers? Fill in the form." } },
      { t: "cards", items: [
        { title: { fa: "باغ و کشاورزی", en: "Orchards and farming" }, text: { fa: "سیب، گردو، بادام و غلات؛ کار فصلی هرس، آبیاری و برداشت.", en: "Apples, walnuts, almonds, grain. Seasonal pruning, irrigation, harvest." }, status: "reported", source: "FA Wikipedia, Kojaro" },
        { title: { fa: "قالی‌بافی و صنایع دستی", en: "Carpets and crafts" }, text: { fa: "قالی جوشقانی، گیوه، چادرشب، گلدوزی و سبد بید؛ فروش در بازار اصفهان و تهران.", en: "Joshaqani carpets, giveh, chadorshab, embroidery, willow baskets; sold in Isfahan and Tehran bazaars." }, status: "reported", source: "Kojaro" },
        { title: { fa: "گردشگری و راهنمایی", en: "Tourism and guiding" }, text: { fa: "سُه روستای هدف گردشگری است و اقامتگاه ندارد؛ بوم‌گردی و راهنمای محلی فرصت‌اند.", en: "A tourism target village with no lodging: eco-lodges and local guides are an opening." }, status: "reported", source: "Kojaro news (Dec 2022)", href: "https://www.kojaro.com/news/194447-tourist-attractions-shahinshahr-revived/" },
        { title: { fa: "مرمت و ساخت‌وساز", en: "Restoration and building" }, text: { fa: "کاروانسرا و حمام با کمک مردم مرمت شد. بنّای آشنا با معماری خشتی و سنگی لازم است.", en: "Caravanserai and bath restored with local help. Masons who know adobe and stone are needed." }, status: "reported", source: "Kojaro" },
        { title: { fa: "کار از راه دور", en: "Remote work" }, text: { fa: "کسانی که ریشه در سُه دارند و جای دیگری زندگی می‌کنند می‌توانند از راه دور کمک کنند، مثلاً ترجمه، طراحی یا اداره‌ی همین سایت.", en: "People with Soh roots can help remotely: translation, design, running this site." }, status: "unverified" },
      ] },
      { t: "table",
        head: [{ fa: "نوع", en: "Type" }, { fa: "کار یا مهارت", en: "Job or skill" }, { fa: "نوع همکاری", en: "Arrangement" }, { fa: "منطقه", en: "Area" }, { fa: "تماس", en: "Contact" }],
        rows: [],
        empty: { fa: "هنوز آگهی کاری منتشر نشده است.", en: "No job posts published yet." } },
      { t: "notice", title: { fa: "برای ایمنی و انصاف", en: "For safety and fairness" }, items: [
        { fa: "برای کار پول نپردازید. آگهی پیش‌پرداخت منتشر نمی‌شود.", en: "Never pay to get a job. Upfront-payment posts are not published." },
        { fa: "دستمزد، ساعت و مدت کار را پیش از شروع مکتوب کنید.", en: "Put pay, hours and duration in writing first." },
        { fa: "کار کودکان پذیرفته نیست.", en: "No child labour." },
        { fa: "مشاوره‌ی حقوقی نیست؛ برای قرارداد رسمی از وکیل بپرسید.", en: "Not legal advice; ask a lawyer for formal contracts." },
      ] },
    ],
  },
];

export const sectionBySlug = (slug: string) => sections.find((s) => s.slug === slug);

// How people contribute. Fill `channel` when Al decides (email, Telegram or a form link); the page shows a placeholder while empty.
export const contact = {
  channel: { label: "", url: "" },
  note: {
    fa: "این سایت با کمک مردم سُه کامل می‌شود. هر چه می‌دانید بفرستید؛ بررسی می‌شود.",
    en: "Soh's people complete this site. Send what you know; it is checked first.",
  } satisfies L,
  pending: {
    fa: "راه ارسال به‌زودی اضافه می‌شود. تا آن زمان به عضو خانواده‌ای که سایت را می‌گرداند بدهید.",
    en: "A way to send will be added soon. Until then, pass it to the family member who runs this site.",
  } satisfies L,
};

export const contribute: { title: L; send: L[]; tip?: L }[] = [
  {
    title: { fa: "عکس", en: "Photos" },
    send: [
      { fa: "عکس اصلی با بهترین کیفیت، نه نسخه‌ی پیام‌رسان", en: "The original photo, not a chat-app copy" },
      { fa: "جا، سال تقریبی و نام عکاس", en: "Place, approximate year, photographer" },
      { fa: "اجازه‌ی انتشار؛ برای عکس افراد، به‌ویژه کودکان، رضایت خودشان یا خانواده", en: "Permission to publish; consent for photos of people, especially children" },
    ],
  },
  {
    title: { fa: "واژه و گویش", en: "Words and dialect" },
    send: [
      { fa: "واژه به شکل سُه‌ای، با فارسی‌نویسی", en: "The word as said in Soh, in Persian script" },
      { fa: "معنی، جمله‌ی نمونه و گوینده", en: "Meaning, example sentence, speaker" },
      { fa: "یک صدای ضبط‌شده، اگر ممکن است", en: "A voice recording, if possible" },
    ],
  },
  {
    title: { fa: "تاریخ، خاطره و آیین", en: "History, memories and traditions" },
    send: [
      { fa: "آنچه می‌دانید و از که شنیده‌اید", en: "What you know and who told you" },
      { fa: "نام، سال و جا تا حد ممکن", en: "Names, years, places as far as you can" },
      { fa: "عکس هر سند یا نوشته", en: "A photo of any document" },
    ],
  },
  {
    title: { fa: "اقامت، فروشگاه، درمان و بانک", en: "Stay, shops, care and banks" },
    send: [
      { fa: "نام، نشانی، تماس و ساعت کار", en: "Name, address, phone, opening hours" },
      { fa: "قیمت تقریبی و تاریخ آن", en: "Approximate price and its date" },
      { fa: "اجازه‌ی نوشتن شماره‌ی تماس", en: "Permission to publish the phone number" },
    ],
  },
  {
    title: { fa: "آگهی ملک", en: "Property listings" },
    send: [
      { fa: "نوع، متراژ، قیمت و سند", en: "Type, size, price, deed type" },
      { fa: "چند عکس و نشانی تقریبی", en: "A few photos, approximate location" },
      { fa: "تماس مالک و رضایت او", en: "Owner's contact and consent" },
    ],
  },
  {
    title: { fa: "اصلاح اشتباه", en: "Corrections" },
    send: [
      { fa: "جمله‌ی اشتباه و شکل درست", en: "The wrong sentence and the right version" },
      { fa: "منبع یا دلیل، اگر دارید", en: "A source or reason, if you have one" },
    ],
  },
];

export const mapRoad = {
  title: { fa: "راهی که قبلاً نوشته بودیم", en: "The road already written here" },
  lead: {
    fa: "همان راه ورود، با شرح بیشتر. دو منبع یک‌جور ننوشته‌اند؛ هر دو آمده و هیچ‌کدام قطعی نیست.",
    en: "The same road, in more detail. The two sources differ, so both are given and neither is settled.",
  },
  steps: [
    {
      fa: "کجارو: بهترین وسیله خودروی شخصی است. حدود ۵۰ کیلومتر شمال شاهین‌شهر، شرق جاده‌ی میمه، از خروجی دهلر، بیدشک و سُه خارج شوید؛ سُه بعد از آن دو روستاست.",
      en: "Kojaro: go by private car. About 50 km north of Shahin Shahr, east of the Meymeh road, take the exit for Dehlor, Bidshak and Soh; Soh is past the other two.",
    },
    {
      fa: "ویکی‌پدیای فارسی: راه اصلی جاده‌ی تهران–اصفهان (۶۵ شمالی)؛ حدود ۶۰ کیلومتر مانده به اصفهان، بین میمه و مورچه‌خورت، ۳۰ کیلومتر تا سُه. رباط شاه‌عباسی، دهلر و بیدشک سر راه‌اند.",
      en: "Persian Wikipedia: main road is Tehran–Isfahan (65 north); about 60 km short of Isfahan, between Meymeh and Murcheh Khvort, 30 km to Soh. The Shah Abbasi caravanserai, Dehlor and Bidshak lie on it.",
    },
    {
      fa: "در روستا پایانه یا ایستگاه قطار نیست. کجارو: پایانه‌ی شاهین‌شهر و بعد تاکسی؛ حدود ۷۵ کیلومتر تا روستا.",
      en: "No bus terminal or railway station in the village. Kojaro: Shahin Shahr terminal, then a taxi; about 75 km.",
    },
  ],
  distances: {
    fa: "تا اصفهان: ۹۴ کیلومتر (ویکی‌پدیا، صدا و سیما) یا حدود ۱۰۰ (کجارو). کجارو هم «۱۵ کیلومتر شرق میمه» می‌نویسد هم حدود ۷۵ کیلومتر تا میمه. عددها را یکی نکرده‌ایم.",
    en: "To Isfahan: 94 km (Wikipedia, IRIB) or about 100 (Kojaro). Kojaro gives both “15 km east of Meymeh” and about 75 km from Meymeh. Figures left as is.",
  },
} satisfies { title: L; lead: L; steps: L[]; distances: L };

export const mapApproaches = [
  {
    id: "isfahan",
    title: { fa: "از اصفهان", en: "From Isfahan" },
    text: {
      fa: "اصفهان جنوب سُه است. از شمال اصفهان بیایید و نزدیک میمه و مورچه‌خورت به راه دهلر و بیدشک بپیچید؛ سُه ته آن است. خط رانندگی نیست، چون خروجی در منابع مختصات ندارد.",
      en: "Isfahan is south of Soh. Drive north, turn near Meymeh and Murcheh Khvort onto the Dehlor and Bidshak road; Soh is at its end. No driving line: sources give no exit coordinates.",
    },
    embed: "https://www.openstreetmap.org/export/embed.html?bbox=51.10%2C32.50%2C51.85%2C33.55&layer=mapnik&marker=33.439%2C51.452",
    href: "https://www.openstreetmap.org/?mlat=33.439&mlon=51.452#map=9/33.05/51.48",
  },
  {
    id: "tehran",
    title: { fa: "از تهران", en: "From Tehran" },
    text: {
      fa: "کیلومتر تهران تا سُه در منابع نیست. از جاده‌ی تهران–اصفهان بیایید، بین میمه و مورچه‌خورت بپیچید، بعد دهلر، بیدشک و سُه. نقشه کریدور شمالی را نشان می‌دهد، نه مسیر اندازه‌گیری‌شده.",
      en: "No Tehran-to-Soh distance in the sources. Take the Tehran–Isfahan road, turn between Meymeh and Murcheh Khvort, then Dehlor, Bidshak, Soh. The map shows the corridor, not a measured route.",
    },
    embed: "https://www.openstreetmap.org/export/embed.html?bbox=50.55%2C33.20%2C51.95%2C35.90&layer=mapnik&marker=33.439%2C51.452",
    href: "https://www.openstreetmap.org/?mlat=33.439&mlon=51.452#map=7/34.55/51.25",
  },
] as const;

export const mapServices = [
  {
    slug: "stores",
    title: { fa: "فروشگاه‌ها", en: "Stores" },
    text: {
      fa: "مغازه‌های روزمره‌ی خود روستا. منابع بقالی یا نانوایی با نشانی ندارند؛ کجارو فقط از فروش مستقیم میوه می‌گوید. میمه و شاهین‌شهر بررسی نشده‌اند.",
      en: "Everyday shops in the village. No source names a grocery or bakery with an address; Kojaro mentions only direct fruit sales. Meymeh and Shahin Shahr unchecked.",
    },
  },
  {
    slug: "hospital",
    title: { fa: "بیمارستان", en: "Hospital" },
    text: {
      fa: "در شرایط اورژانسی با ۱۱۵ تماس بگیرید؛ توصیه‌ی پزشکی نیست. در سُه بیمارستان، درمانگاه یا خانه‌ی بهداشت پیدا نشد و بیمارستان معمول مردم هنوز ثبت نشده.",
      en: "Emergency: call 115; not medical advice. No hospital, clinic or health house found in Soh; the usual hospital is not recorded yet.",
    },
  },
  {
    slug: "banks",
    title: { fa: "بانک‌ها", en: "Banks" },
    text: {
      fa: "در سُه شعبه یا خودپردازی نیست؛ پول نقد ببرید. یک نشانی بررسی‌نشده‌ی بانک صادرات در مورچه‌خورت در بلد هست. شهرهای نزدیک فهرست نشده‌اند.",
      en: "No branch or ATM in Soh; carry cash. Balad lists an unchecked Bank Saderat address in Murcheh Khvort. Nearby towns not listed yet.",
    },
  },
  {
    slug: "stay",
    title: { fa: "اقامت", en: "Where to stay" },
    text: {
      fa: "کجارو: در سُه بوم‌گردی یا مهمان‌پذیر نیست؛ چادر بزنید یا در شهرهای نزدیک بمانید. میمه، شاهین‌شهر و اصفهان اقامتگاه بیشتری دارند؛ فهرستی بررسی‌شده نیست.",
      en: "Kojaro: no eco-lodge or guest house in Soh; camp or stay nearby. Meymeh, Shahin Shahr and Isfahan have more; no checked list.",
    },
  },
  {
    slug: "shop",
    title: { fa: "خرید", en: "Where to buy" },
    text: {
      fa: "فهرست مغازه نیست؛ سیب، گردو، لبنیات و قالی جوشقانی است. فروشنده‌ی مشخصی پیدا نشد؛ از اهالی بپرسید.",
      en: "Not a shop list: apples, walnuts, dairy, Joshaqani carpets. No specific seller found; ask residents.",
    },
  },
] as const;

export const mapInfo = {
  lat: 33.439,
  lon: 51.452,
  osmEmbed: "https://www.openstreetmap.org/export/embed.html?bbox=51.40%2C33.41%2C51.50%2C33.47&layer=mapnik&marker=33.439%2C51.452",
  osm: "https://www.openstreetmap.org/?mlat=33.439&mlon=51.452#map=13/33.439/51.452",
  google: "https://goo.gl/maps/wDRqsHQ2uwYaXufJ9",
  note: {
    fa: "نشانگر بر پایه‌ی ۳۳٫۴۴ شمالی و ۵۱٫۴۵ شرقی است (ویکی‌پدیای فارسی، کجارو). مختصات ویکی‌پدیای انگلیسی حدود ۲۰۰ کیلومتر دورتر و ظاهراً اشتباه است.",
    en: "Marker: 33.44 N, 51.45 E (Persian Wikipedia, Kojaro). English Wikipedia's are about 200 km off and look wrong.",
  } satisfies L,
};

export const sources = [
  { name: "EN Wikipedia", url: "https://en.wikipedia.org/wiki/Soh,_Shahinshahr" },
  { name: "FA Wikipedia", url: "https://fa.wikipedia.org/wiki/%D8%B3%D9%87_(%D8%B4%D8%A7%D9%87%DB%8C%D9%86%E2%80%8C%D8%B4%D9%87%D8%B1_%D9%88_%D9%85%DB%8C%D9%85%D9%87)" },
  { name: "Kojaro", url: "https://www.kojaro.com/attraction/64660-isfahan-soh-village/" },
  { name: "Wikidata", url: "https://www.wikidata.org/wiki/Q5955889" },
];
