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
      fa: "آنچه درباره‌ی گذشته‌ی سُه نوشته شده و آنچه هنوز سندی ندارد.",
      en: "What has been written about Soh's past, and what still has no document behind it.",
    },
    blocks: [
      {
        t: "cards",
        items: [
          {
            title: { fa: "قدمت", en: "Age" },
            text: {
              fa: "گفته می‌شود سُه بیش از ۲۰۰۰ سال قدمت دارد. نشانه‌های آورده‌شده: قلعه‌هایی با نام‌های گبری، قلعه‌ی ناچفت، «قلعه‌میان»، سنگ‌های آسیاب و ویرانه‌ی یک آتشکده. ویکی‌پدیای فارسی می‌نویسد که سندی برای این قدمت وجود ندارد.",
              en: "Soh is said to be more than 2,000 years old. Evidence cited: castles with Gabri (Zoroastrian-era) names, the Nachaft castle, the Qal'eh Miyan, millstones and the ruins of a fire temple. Persian Wikipedia says no document supports the age.",
            },
            status: "unverified",
            source: "FA Wikipedia, EN Wikipedia, Kojaro",
          },
          {
            title: { fa: "نام روستا", en: "The name" },
            text: {
              fa: "نام سُه را از «سُهی» یا «سَهی» به معنی بلند می‌دانند، چون روستا در دامنه‌ی کوه‌های کرکس قرار دارد. این توضیح فقط در یک منبع آمده است.",
              en: "The name is said to come from “sohi” or “sahi”, meaning tall or high, because the village sits on the slopes of the Karkas mountains. Only one source says this.",
            },
            status: "unverified",
            source: "Kojaro",
          },
          {
            title: { fa: "جاده‌ی کاروان‌رو", en: "The caravan road" },
            text: {
              fa: "تا میانه‌ی دوره‌ی قاجار، جاده‌ی کاروان‌رو سُه را به محل داد و ستد و استراحت مسافران تبدیل کرده بود. ساختمان‌های باقی‌مانده از دوره‌ی صفوی و قاجار است.",
              en: "Until the middle of the Qajar era the caravan road made Soh a place of trade and rest for travellers. The buildings that survive date from the Safavid and Qajar periods.",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "کاروانسرای سُه", en: "Soh Caravanserai" },
            fa: "کاروانسرای سُه",
            text: {
              fa: "کتیبه‌ی سنگی سردر، ساخت آن را به سال ۱۲۲۳ هجری قمری (۱۸۰۸ میلادی) و زمان فتحعلی‌شاه قاجار می‌رساند. بانی آن «ابوالقاسم اصفهانی» نوشته شده است. حدود ۳۰۰۰ مترمربع، چهار ایوان و ۲۰ اتاق. اثر ملی شماره‌ی ۷۶۴۱ (ثبت: ۱۷ اسفند ۱۳۸۱). مرمت: ۱۳۹۵ تا ۱۴۰۰ با کمک مردم.",
              en: "A stone inscription over the portal dates it to 1223 AH (1808 CE), in the reign of Fath-Ali Shah Qajar; the builder is named as Abolqasem Esfahani. About 3,000 m², four iwans, 20 rooms. National monument no. 7641 (registered 17 Esfand 1381). Restored 1395 to 1400 with local donations.",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "جدایی از نطنز", en: "Separation from Natanz" },
            text: {
              fa: "تا سال ۱۳۷۵ (۱۹۹۶) سُه جزو شهرستان نطنز بوده و پس از آن جدا شده است. ویکی‌پدیای فارسی برای این جمله «نیازمند منبع» گذاشته است.",
              en: "Until 1996 (1375) Soh belonged to Natanz County and was then separated. Persian Wikipedia marks this sentence “needs citation”.",
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
          { fa: "داستان‌ها و خاطره‌های قدیمی روستا چیست؟", en: "What old stories and memories does the village have?" },
          { fa: "خانواده‌ها و خانه‌های قدیمی شناخته‌شده کدام‌اند؟", en: "Which families and old houses are well known?" },
        ],
      },
    ],
  },
  {
    slug: "tourism",
    title: { fa: "گردشگری", en: "Tourism" },
    intro: {
      fa: "جاهای دیدنی، طبیعت و آیین‌های سُه.",
      en: "Places to see, nature and traditions in Soh.",
    },
    blocks: [
      {
        t: "dl",
        items: [
          { k: { fa: "بهترین زمان سفر", en: "Best time to visit" }, v: { fa: "بهار و اوایل تابستان", en: "Spring and early summer" } },
          { k: { fa: "هوا", en: "Climate" }, v: { fa: "تابستان معتدل، زمستان سرد", en: "Temperate summers, cold winters" } },
          { k: { fa: "همسایه‌ها", en: "Neighbours" }, v: { fa: "ابیانه (شمال)، بیدشک (جنوب)، کله‌رود (شرق)، رباط آقا کمال و میمه (غرب)", en: "Abyaneh (north), Bidshak (south), Kalahrud (east), Rebat Aqa Kamal and Meymeh (west)" } },
          { k: { fa: "راه", en: "Getting there" }, v: { fa: "از جاده‌ی شاهین‌شهر به میمه، حدود ۵۰ کیلومتر بعد از شاهین‌شهر وارد جاده‌ی دهلر و بیدشک شوید؛ سُه در انتهای مسیر است. پایانه‌ی اتوبوس یا ایستگاه قطار در روستا نیست.", en: "From the Shahin Shahr to Meymeh road, turn off about 50 km north of Shahin Shahr at Dehlor and pass Bidshak; Soh is at the end of the road. There is no bus terminal or railway station in the village." } },
        ],
      },
      {
        t: "cards",
        items: [
          { title: { fa: "کاروانسرای سُه", en: "Soh Caravanserai" }, text: { fa: "اثر ملی قاجاری با چهار ایوان. جزئیات در بخش تاریخ.", en: "A Qajar national monument with four iwans. Details under History." }, status: "reported", source: "Kojaro" },
          { title: { fa: "امامزاده یوسف", en: "Imamzadeh Yusuf" }, text: { fa: "بقعه‌ای در بالادست روستا، حدود ۴۰۰ سال قدمت، گنبد ۱۶ متری با کاشی فیروزه‌ای. گفته می‌شود یوسف، فرزند امام هادی، در این‌جا آرمیده است.", en: "A shrine in the upper village, about 400 years old, with a 16 m dome in turquoise tile. Said to be the resting place of Yusuf, son of Imam Hadi." }, status: "reported", source: "Kojaro" },
          { title: { fa: "امامزاده گلیله", en: "Imamzadeh Golileh" }, text: { fa: "بقعه‌ی گنبد فیروزه‌ای در پایین روستا و در مرکز آن.", en: "A turquoise-domed shrine in the lower village, at its centre." }, status: "reported", source: "Kojaro" },
          { title: { fa: "حمام قدیمی", en: "The old bath" }, text: { fa: "حمام قاجاری با حدود ۲۰۰ سال قدمت. از دو حمام بالا و پایین، یکی مانده و با کمک مردم مرمت شده است.", en: "A Qajar-era bath about 200 years old. Of the upper and lower baths one survives, restored with local help." }, status: "reported", source: "Kojaro" },
          { title: { fa: "خانه‌ی کدخدا", en: "Kadkhoda house" }, text: { fa: "خانه‌ی تاریخی کدخدای روستا، میرزا بهرام صفوی.", en: "The historic home of the village headman, Mirza Bahram Safavi." }, status: "reported", source: "Kojaro" },
          { title: { fa: "جاهای دیگر", en: "Other historic places" }, text: { fa: "پل نواب، آسیاب امامزاده و دو آسیاب دیگر، خانه‌ی تلگراف، برج کبوتر، خانه‌ی میرزا جعفر، کوره‌ی آجرپزی و یک زورخانه‌ی کوچک.", en: "Nav Bridge, the Imamzadeh mill and two other mills, the old telegraph house, a dovecote tower, Mirza Jafar's house, a brick kiln and a small zurkhaneh (traditional gym)." }, status: "reported", source: "Kojaro" },
        ],
      },
      {
        t: "tags",
        label: { fa: "طبیعت و گردش", en: "Nature and walks" },
        items: [
          { fa: "کوه چار", en: "Kuh-e Char" }, { fa: "کوه بغل سیاه", en: "Kuh-e Baghal Siyah" }, { fa: "رودخانه‌ی لب‌چار", en: "Lab Char river" },
          { fa: "قاش سرخه", en: "Qash Sorkheh" }, { fa: "مارگله", en: "Margaleh" }, { fa: "مرغزار سرمرغ", en: "Sar-Marq meadow" },
          { fa: "مرغزار گزی", en: "Gazi meadow" }, { fa: "چشمه‌ی هاز", en: "Haz spring" }, { fa: "دشت پایمیل", en: "Paymil plain" }, { fa: "آبشار", en: "A waterfall" },
        ],
      },
      {
        t: "cards",
        items: [
          {
            title: { fa: "نخل‌گردانی تاسوعا", en: "Tasua palm carrying" },
            text: {
              fa: "در تاسوعای محرم، نخل صبح در امامزاده یوسف آراسته می‌شود، به امامزاده گلیله برده می‌شود و پس از عزاداری ظهر عاشورا برمی‌گردد. آیین‌های دیگر: علم‌گردانی، عمار‌گردانی، تعزیه و نوحه‌خوانی. کجارو می‌نویسد این آیین‌ها حدود ۲۰۰ ساله است و به شماره‌ی ۱۲۰۷ در فهرست میراث ناملموس ملی ثبت شده است.",
              en: "On Tasua in Muharram the palm-shaped standard is decorated in the morning at Imamzadeh Yusuf, carried to Imamzadeh Golileh and returned after the Ashura noon mourning. Other rituals: alam-gardani, ammar-gardani, taziyeh and nowheh chanting. Kojaro says they are about 200 years old and listed as national intangible heritage no. 1207.",
            },
            status: "reported",
            source: "Kojaro",
          },
        ],
      },
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
          { title: { fa: "در خود روستا", en: "In the village" }, text: { fa: "هتل یا اقامتگاه ثبت‌شده‌ای برای سُه در اینترنت پیدا نشد (جستجو در ۲ آذر ۱۴۰۵ / ۲۳ نوامبر ۲۰۲۶). اگر آشنا یا خانواده در روستا دارید، پرسیدن از آن‌ها ساده‌ترین راه است.", en: "No registered hotel or guesthouse for Soh was found online (searched 23 Nov 2026). If you have family or friends in the village, asking them is the simplest way." }, status: "unverified" },
          { title: { fa: "سرای معلم کوه کرکس", en: "Saray-e Moallem, Karkas mountain" }, text: { fa: "یک اقامتگاه بوم‌گردی که در نقشه‌ی بلد ثبت شده است. فاصله‌ی آن تا سُه را بررسی نکرده‌ایم؛ پیش از برنامه‌ریزی تماس بگیرید.", en: "An eco-lodge listed on the Balad map. We have not checked its distance from Soh; call before planning." }, status: "unverified", href: "https://www.balad.ir/p/%D8%A7%D9%82%D8%A7%D9%85%D8%AA%DA%AF%D8%A7%D9%87-%D8%B3%D8%B1%D8%A7%D9%89-%D9%85%D8%B9%D9%84%D9%85_hotel-2ibeYQS0ucocsj", source: "Balad" },
          { title: { fa: "شهرهای نزدیک", en: "Nearby towns" }, text: { fa: "میمه و شاهین‌شهر (حدود ۷۵ کیلومتر) و اصفهان (حدود ۹۴ تا ۱۰۰ کیلومتر) اقامتگاه بیشتری دارند. فهرست مشخص هنوز نداریم.", en: "Meymeh and Shahin Shahr (about 75 km) and Isfahan (about 94 to 100 km) have more places to stay. We have no checked list yet." }, status: "unverified" },
        ],
      },
      {
        t: "notice",
        title: verifyTitle,
        items: [
          { fa: "نام، شماره‌ی تماس و قیمت اقامتگاه‌های نزدیک (با کمک خانواده)", en: "Names, phone numbers and prices of nearby places (with the family's help)" },
          { fa: "اتاق‌های اجاره‌ای یا خانه‌ی مسافر در خود روستا", en: "Rooms or guest houses for rent in the village itself" },
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
      { t: "p", text: { fa: "سیب سُه از بهترین سیب‌های استان اصفهان توصیف شده و حدود ۳۰٪ ظرفیت اقتصادی روستا به سیب بستگی دارد. فروشگاه یا فروشنده‌ی آنلاینِ مشخصی برای محصولات سُه پیدا نکردیم.", en: "Soh's apples are described as among the best in Isfahan province, and about 30% of the village's economic capacity is apple growing. We found no specific shop or online seller for Soh's products." } },
      { t: "tags", label: { fa: "میوه و کشاورزی", en: "Fruit and farm" }, items: [{ fa: "سیب (رقم‌های متعدد)", en: "Apples (many varieties)" }, { fa: "گردو", en: "Walnut" }, { fa: "بادام", en: "Almond" }, { fa: "انگور", en: "Grape" }, { fa: "گیلاس و آلبالو", en: "Cherry and sour cherry" }, { fa: "زردآلو", en: "Apricot" }, { fa: "گلابی", en: "Pear" }, { fa: "به", en: "Quince" }, { fa: "توت", en: "Mulberry" }, { fa: "گیاهان دارویی", en: "Medicinal plants" }] },
      { t: "tags", label: { fa: "لبنیات و غذا", en: "Dairy and food" }, items: [{ fa: "شیر و ماست", en: "Milk and yogurt" }, { fa: "پنیر", en: "Cheese" }, { fa: "کشک", en: "Kashk" }, { fa: "دوغ", en: "Buttermilk" }, { fa: "روغن", en: "Ghee" }, { fa: "نان محلی", en: "Village bread" }, { fa: "تخم‌مرغ محلی", en: "Free-range eggs" }] },
      { t: "tags", label: { fa: "صنایع دستی", en: "Crafts" }, items: [{ fa: "قالی دست‌باف (نقش جوشقانی)", en: "Hand-woven carpets (Joshaqani style)" }, { fa: "گیوه‌بافی", en: "Giveh weaving" }, { fa: "چادرشب", en: "Chadorshab" }, { fa: "گلدوزی", en: "Embroidery" }, { fa: "سبد بید", en: "Willow baskets" }, { fa: "قره‌بافی (ظرف موی بز)", en: "Goat-hair containers (gharreh)" }, { fa: "لحاف تکه‌دوزی", en: "Patchwork quilts" }, { fa: "مشک پوست بز", en: "Goatskin water bags" }] },
      {
        t: "cards",
        items: [
          { title: { fa: "مستقیم از روستا", en: "Directly from the village" }, text: { fa: "تنها راه مطمئن امروز، پرسیدن از اهالی یا خانواده است. اگر کسی در سُه محصولی می‌فروشد و می‌خواهد در این صفحه بیاید، به ما بگویید.", en: "Today the reliable way is to ask residents or family. If someone in Soh sells a product and wants to be listed here, tell us." }, status: "unverified" },
          { title: { fa: "بازار آنلاین باسلام", en: "Basalam online marketplace" }, text: { fa: "بازار آنلاین ایرانی برای محصولات خانگی و روستایی. فروشنده‌ی سُه در آن پیدا نکردیم.", en: "An Iranian online marketplace for home and village products. We found no Soh seller there." }, href: "https://basalam.com", source: "basalam.com" },
        ],
      },
    ],
  },
  {
    slug: "words",
    title: { fa: "واژه‌ها و گویش", en: "Words and dialect" },
    intro: {
      fa: "گویش سُه و واژه‌هایی که مردم آن را به‌کار می‌برند.",
      en: "The Soh dialect and the words people there use.",
    },
    blocks: [
      { t: "p", text: { fa: "گویش سُه از گویش‌های فلات مرکزی ایران (مادی) است. مورگنستیرنه سُه را با قهرود، کاشان (کشه) و میمه در یک گروه آورده است. ایرانیکا می‌نویسد نخستین یادداشت‌های گویش سُه را آندریاس و مان و هدانک ثبت کرده‌اند. پژوهش مستقلی درباره‌ی واژگان سُه پیدا نکردیم.", en: "The Soh dialect belongs to the Central Plateau (Median) dialects of Iran. Morgenstierne groups Soh with Qohrud, Kashan (Keš) and Meyma. Iranica says early notes on Soh were made by Andreas and by Mann and Hadank. We found no standalone study of Soh vocabulary." } },
      { t: "links", items: [
        { name: { fa: "ایرانیکا: گویش میمه", en: "Iranica: Meyma dialect" }, url: "https://www.iranicaonline.org/articles/meyma-ii-dialect/", note: { fa: "نزدیک‌ترین گویش مستند", en: "The closest documented dialect" } },
        { name: { fa: "ایرانیکا: گویش‌های استان اصفهان", en: "Iranica: Isfahan provincial dialects" }, url: "https://www.iranicaonline.org/articles/isfahan-xxi-provincial-dialects", note: { fa: "پیشینه‌ی گویش‌های منطقه", en: "Background on the region's dialects" } },
      ] },
      {
        t: "table",
        head: [{ fa: "واژه‌ی سُه‌ای", en: "Soh word" }, { fa: "فارسی معیار", en: "Standard Persian" }, { fa: "انگلیسی", en: "English" }, { fa: "چه کسی گفته", en: "Told by" }],
        rows: [],
        empty: { fa: "هنوز واژه‌ی تأییدشده‌ای نداریم. واژه‌ها را از زبان اهالی و خانواده جمع می‌کنیم و از گویش‌های همسایه کپی نمی‌کنیم.", en: "No confirmed words yet. We collect them from residents and family, and do not copy from neighbouring dialects." },
      },
      {
        t: "notice",
        title: { fa: "برای افزودن واژه بفرستید", en: "To add a word, send" },
        items: [
          { fa: "واژه به همان شکلی که در سُه گفته می‌شود (با فارسی‌نویسی)", en: "The word as said in Soh, written in Persian script" },
          { fa: "معنی، یک جمله‌ی نمونه و نام کسی که آن را گفته", en: "Its meaning, an example sentence and who said it" },
          { fa: "اگر ممکن است، یک صدای ضبط‌شده", en: "If possible, a voice recording" },
        ],
      },
    ],
  },
  {
    slug: "resources",
    title: { fa: "منابع اینترنتی", en: "Resources online" },
    intro: {
      fa: "مطالب اینترنتی درباره‌ی سُه که تا امروز پیدا کرده‌ایم.",
      en: "What exists online about Soh that we have found so far.",
    },
    blocks: [
      { t: "p", text: { fa: "وب‌سایت رسمی برای سُه پیدا نشد (۲ آذر ۱۴۰۵). روستاها معمولاً دهیاری دارند و سایت مستقل ندارند.", en: "No official website for Soh was found (23 Nov 2026). Villages usually have a dehyari (village council) rather than a site of their own." } },
      { t: "links", items: [
        { name: { fa: "ویکی‌پدیای فارسی: سه (شاهین‌شهر)", en: "Persian Wikipedia: Soh" }, url: "https://fa.wikipedia.org/wiki/%D8%B3%D9%87_(%D8%B4%D8%A7%D9%87%DB%8C%D9%86%E2%80%8C%D8%B4%D9%87%D8%B1_%D9%88_%D9%85%DB%8C%D9%85%D9%87)", note: { fa: "تاریخ، اقتصاد، چهره‌ها", en: "History, economy, people" } },
        { name: { fa: "ویکی‌پدیای انگلیسی: Soh, Shahinshahr", en: "English Wikipedia: Soh, Shahinshahr" }, url: "https://en.wikipedia.org/wiki/Soh,_Shahinshahr", note: { fa: "جمعیت (سرشماری)", en: "Census population" } },
        { name: { fa: "ویکی‌داده Q5955889", en: "Wikidata Q5955889" }, url: "https://www.wikidata.org/wiki/Q5955889", note: { fa: "داده‌ی ساختاریافته", en: "Structured data" } },
        { name: { fa: "کجارو: روستای سه اصفهان", en: "Kojaro: Soh village" }, url: "https://www.kojaro.com/attraction/64660-isfahan-soh-village/", note: { fa: "راهنمای گردشگری، منبع بیشتر جاذبه‌ها", en: "Travel guide, the source for most sights" } },
        { name: { fa: "نقشه‌ی گوگل (از کجارو)", en: "Google Maps (via Kojaro)" }, url: "https://goo.gl/maps/wDRqsHQ2uwYaXufJ9", note: { fa: "موقعیت روستا", en: "Village location" } },
        { name: { fa: "اینستاگرام: soh_village", en: "Instagram: soh_village" }, url: "https://www.instagram.com/soh_village/", note: { fa: "کجارو عکس‌ها را از این صفحه آورده است. فعال بودن آن بررسی نشده.", en: "Kojaro credits most photos to this page. Not checked whether it is active." } },
      ] },
      { t: "notice", title: verifyTitle, items: [
        { fa: "تفاوت مختصات ویکی‌پدیای انگلیسی (۳۱٫۷۸ شمالی) با همه‌ی منابع دیگر (۳۳٫۴۴ شمالی)؛ این‌جا ۳۳٫۴۴ استفاده شده.", en: "English Wikipedia's coordinates (31.78 N) differ from every other source (33.44 N); 33.44 is used here." },
        { fa: "فاصله‌ی دقیق تا میمه؛ کجارو هم «۱۵ کیلومتر شرق میمه» و هم «مرز غربی با میمه» نوشته است.", en: "The exact distance to Meymeh; Kojaro says both “15 km east of Meymeh” and “Meymeh on the western border”." },
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
      { t: "p", text: { fa: "شعبه یا خودپردازی در خود سُه پیدا نشد. پیش از سفر مقداری پول نقد همراه داشته باشید.", en: "No branch or ATM was found in Soh itself. Carry some cash before you travel." } },
      { t: "cards", items: [
        { title: { fa: "بانک صادرات، شهرک صنعتی مورچه‌خورت", en: "Bank Saderat, Murcheh Khvort industrial town" }, text: { fa: "تنها شعبه‌ی نزدیک که در نتیجه‌ی جستجو دیدیم. مورچه‌خورت در همان دهستان سُه است. آدرس و فاصله را بررسی نکرده‌ایم.", en: "The only nearby branch our search showed. Murcheh Khvort is in the same rural district as Soh. We have not checked the address or distance." }, status: "unverified", source: "Balad" },
        { title: { fa: "میمه و شاهین‌شهر", en: "Meymeh and Shahin Shahr" }, text: { fa: "شهرهای نزدیک شعبه و خودپرداز بیشتری دارند. فهرست بانک‌ها هنوز بررسی نشده.", en: "The nearby towns have more branches and ATMs. The list of banks is not checked yet." }, status: "unverified" },
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
      fa: "خانه، باغ و زمین در سُه: خرید، فروش و آگهی.",
      en: "Houses, orchards and land in Soh: buying, selling and listings.",
    },
    blocks: [
      { t: "p", text: { fa: "آگهی‌ای برای ملک در سُه پیدا نشد. آگهی‌ها فقط پس از تماس مالک و بررسی اطلاعات به این صفحه اضافه می‌شوند.", en: "No listing for property in Soh was found. Listings are added here only after the owner makes contact and the details are checked." } },
      { t: "table",
        head: [{ fa: "نوع", en: "Type" }, { fa: "متراژ", en: "Size" }, { fa: "قیمت", en: "Price" }, { fa: "نوع سند", en: "Deed" }, { fa: "تماس", en: "Contact" }],
        rows: [],
        empty: { fa: "هنوز آگهی‌ای ثبت نشده است.", en: "No listings yet." } },
      { t: "links", items: [
        { name: { fa: "دیوار", en: "Divar" }, url: "https://divar.ir", note: { fa: "جستجوی «سه، میمه» یا «شاهین‌شهر و میمه»", en: "Search “Soh, Meymeh” or “Shahin Shahr and Meymeh”" } },
        { name: { fa: "شیپور", en: "Sheypoor" }, url: "https://www.sheypoor.com", note: { fa: "آگهی ملک و زمین", en: "Property and land listings" } },
      ] },
      { t: "notice", title: { fa: "پیش از خرید بررسی کنید", en: "Check before buying" }, items: [
        { fa: "نوع سند و نام مالک در دفترخانه", en: "The deed type and the owner's name, at a notary office" },
        { fa: "کاربری زمین (مسکونی، باغ یا زراعی) و امکان ساخت", en: "Land use (residential, orchard or farmland) and whether building is allowed" },
        { fa: "حقابه‌ی آب و دسترسی به جاده", en: "Water rights and road access" },
        { fa: "این صفحه مشاوره‌ی حقوقی نیست. با وکیل یا کارشناس رسمی مشورت کنید.", en: "This page is not legal advice. Talk to a lawyer or a licensed expert." },
      ] },
    ],
  },
];

export const sectionBySlug = (slug: string) => sections.find((s) => s.slug === slug);

export const contact = {
  email: "", // add when Al decides; the page shows a placeholder while this is empty
  note: {
    fa: "اگر اطلاعات، عکس، واژه یا اصلاحیه دارید، برای ما بفرستید. راه تماس به‌زودی اضافه می‌شود.",
    en: "If you have facts, photos, words or corrections, send them to us. A contact address will be added soon.",
  } satisfies L,
};

export const sources = [
  { name: "EN Wikipedia", url: "https://en.wikipedia.org/wiki/Soh,_Shahinshahr" },
  { name: "FA Wikipedia", url: "https://fa.wikipedia.org/wiki/%D8%B3%D9%87_(%D8%B4%D8%A7%D9%87%DB%8C%D9%86%E2%80%8C%D8%B4%D9%87%D8%B1_%D9%88_%D9%85%DB%8C%D9%85%D9%87)" },
  { name: "Kojaro", url: "https://www.kojaro.com/attraction/64660-isfahan-soh-village/" },
  { name: "Wikidata", url: "https://www.wikidata.org/wiki/Q5955889" },
];
