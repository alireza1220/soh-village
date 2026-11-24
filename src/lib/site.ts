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
              fa: "کتیبه‌ی سنگی سردر، ساخت آن را به سال ۱۲۲۳ هجری قمری (۱۸۰۸ میلادی) و زمان فتحعلی‌شاه قاجار می‌رساند. بانی آن «ابوالقاسم اصفهانی» نوشته شده است. حدود ۳۰۰۰ مترمربع، چهار ایوان، چهار برج گرد در گوشه‌ها و ۲۰ اتاق. اثر ملی شماره‌ی ۷۶۴۱ (ثبت: ۱۷ اسفند ۱۳۸۱). مرمت: ۱۳۹۵ تا ۱۴۰۰ با کمک مردم.",
              en: "A stone inscription over the portal dates it to 1223 AH (1808 CE), in the reign of Fath-Ali Shah Qajar; the builder is named as Abolqasem Esfahani. About 3,000 m², four iwans, four round corner towers, 20 rooms. National monument no. 7641 (registered 17 Esfand 1381). Restored 1395 to 1400 with local donations.",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "قلعه‌ها", en: "The forts" },
            text: {
              fa: "چهار قلعه‌ی روستا با نام‌های بالا، پایین، میان و چال یاد شده است. «قلعه‌میان» بیشتر از بقیه نام برده می‌شود.",
              en: "Four forts are named around the village: Bala (upper), Pain (lower), Miyan (middle) and Chal. The Miyan fort is the one mentioned most often.",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "یادداشت قدیمی مسافران", en: "An old travellers' route book" },
            text: {
              fa: "کتاب راه‌های ایران (سده‌ی نوزدهم) از «سه» روی راه اصفهان نام می‌برد و دو ده دیوارکشیده و کاروانسرایی بزرگ از آجر را شرح می‌دهد. روشن نیست که این همان سُه‌ی میمه باشد.",
              en: "A 19th-century route book (Routes in Persia) mentions a “Soh” on the Isfahan road with two walled villages and a large brick caravanserai. It is not certain that this is the Soh near Meymeh.",
            },
            status: "unverified",
            source: "Qatar Digital Library",
            href: "https://www.qdl.qa/archive/81055/vdc_100024054422.0x0000c4",
          },
          {
            title: { fa: "تغییر چهره‌ی روستا", en: "How the village is changing" },
            text: {
              fa: "پژوهشگر میراث فرهنگی، مهرخ هاشمی (۱۴۰۰)، می‌گوید ساخت‌وسازهای تازه به منظر تاریخی و طبیعی آسیب می‌زند. او توان گردشگری را بالا می‌داند ولی تبلیغ و سرمایه‌گذاری کم است؛ مرمت و اقامتگاه‌های بوم‌گردی محلی را پیشنهاد می‌کند. نویسنده‌ی یک گزارش سفر (اسفند ۱۴۰۰) هم می‌نویسد بخش‌هایی از روستا در حال تغییر یا تخریب است و حمام را از دوره‌ی رضاشاه می‌داند.",
              en: "Heritage researcher Mahrokh Hashemi (2021) says new construction is damaging the historic and natural landscape. She sees high tourism potential but little promotion or investment, and recommends restoration and local eco-lodges. A travel writer (Feb 2022) also says parts of the village are being altered or demolished, and dates the bath to the Reza Shah era.",
            },
            status: "unverified",
            source: "A 2021 blog, Beinabein (2022), single sources",
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
          { k: { fa: "دهستان", en: "Rural district" }, v: { fa: "مورچه‌خورت: ۳۹ روستا و ۲٬۱۹۸ نفر در سرشماری ۱۳۹۵ (خود روستای مورچه‌خورت ۱٬۳۶۹ نفر)", en: "Murcheh Khvort: 39 villages and 2,198 people in the 2016 census (Murcheh Khvort village itself 1,369)" } },
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
          { title: { fa: "جاهای دیگر", en: "Other historic places" }, text: { fa: "پل نواب، سه آسیاب (امامزاده، میرزا ابوالحسن و میرزا محمد)، خانه‌ی تلگراف («تلگراف‌خانه‌ی انگلیسی»)، برج کبوتر، خانه‌ی میرزا جعفر، کوره‌ی آجرپزی، یک زورخانه‌ی کوچک، مسجدی حدود ۲۰۰ ساله کنار حمام، کاروانسرای عباسی در آقاکمال پایین (سر راه روستا)، «عمارت فرنگی»، ساباط کوچه‌ی قلعه‌ی بالا و کنده‌ی باغستان.", en: "Nav Bridge, three mills (Imamzadeh, Mirza Abolhasan and Mirza Mohammad), the old telegraph house (called the “English telegraph house”), a dovecote tower, Mirza Jafar's house, a brick kiln, a small zurkhaneh (traditional gym), a mosque about 200 years old beside the bath, the Abbasi caravanserai at Aqa Kamal Pain (on the access road), a “Farangi” mansion, the covered passage (sabat) in the upper-castle alley and Kandeh Baghestan." }, status: "reported", source: "Kojaro" },
        ],
      },
      { t: "p", text: { fa: "آیین‌های سُه، مانند نخل‌گردانی تاسوعا، در بخش «آیین‌ها و سنت‌ها» آمده است.", en: "Soh's traditions, such as the Tasua palm carrying, are in the Traditions section." } },
      {
        t: "tags",
        label: { fa: "طبیعت و گردش", en: "Nature and walks" },
        items: [
          { fa: "کوه چار", en: "Kuh-e Char" }, { fa: "کوه بغل سیاه", en: "Kuh-e Baghal Siyah" }, { fa: "رودخانه‌ی لب‌چار", en: "Lab Char river" },
          { fa: "قاش سرخه", en: "Qash Sorkheh" }, { fa: "مارگله", en: "Margaleh" }, { fa: "مرغزار سرمرغ", en: "Sar-Marq meadow" },
          { fa: "مرغزار گزی", en: "Gazi meadow" }, { fa: "چشمه‌ی هاز", en: "Haz spring" }, { fa: "دشت پایمیل", en: "Paymil plain" }, { fa: "آبشار", en: "A waterfall" },
        ],
      },
    ],
  },
  {
    slug: "people",
    title: { fa: "چهره‌ها", en: "People" },
    intro: {
      fa: "کسانی که با سُه شناخته می‌شوند. فقط مواردی با منبع آمده است.",
      en: "People connected with Soh. Only items with a source are listed.",
    },
    blocks: [
      {
        t: "cards",
        items: [
          {
            title: { fa: "سید علی صفوی سُهی", en: "Seyed Ali Safavi Sohi" },
            fa: "سید علی صفوی سُهی",
            text: {
              fa: "متولد ۷ مرداد ۱۳۱۹، فرمانده گردان تانک (گردان ۲۹۳) در آغاز جنگ ایران و عراق. ۱۱ مرداد ۱۳۶۲ بر اثر ترکش کشته شد. نام پدرش سید موسی صفوی است. در تهران پلی به نام او نام‌گذاری شده است. محل شهادت در دو منبع فرق می‌کند (فکه و جنگل عمق).",
              en: "Born 29 July 1940. Commanded a tank battalion (the 293rd) at the start of the Iran-Iraq war. Killed by shrapnel on 2 August 1983. His father was Seyed Musa Safavi, and a bridge in Tehran is named after him. Two sources disagree on where he died (Fakkeh or the Jangal-e Amqar area).",
            },
            status: "unverified",
            source: "FA Wikipedia, Khabar Foori (Mar 2021)",
          },
          {
            title: { fa: "میرزا بهرام صفوی", en: "Mirza Bahram Safavi" },
            text: {
              fa: "کدخدای روستا؛ خانه‌ی او از جاهای تاریخی سُه است.",
              en: "The village headman (kadkhoda); his house is one of Soh's historic sites.",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "گروه خانوادگی «صفوی سُهی»", en: "The Safavi Sohi family group" },
            text: {
              fa: "گردشنامه بزرگ‌ترین گروه خانوادگی روستا را «صفوی سُهی» می‌نامد. این فقط در یک منبع آمده و نام خانواده‌های دیگر را نمی‌دانیم.",
              en: "Gardeshnama names “Safavi Sohi” as the village's largest family group. This is from one source only, and we do not know the other family names.",
            },
            status: "unverified",
            source: "Gardeshnama",
          },
          {
            title: { fa: "ابوالقاسم اصفهانی", en: "Abolqasem Esfahani" },
            text: {
              fa: "بانی کاروانسرای سُه بر پایه‌ی کتیبه‌ی سنگی سردر (۱۲۲۳ هجری قمری).",
              en: "Named on the portal inscription as the builder of the Soh Caravanserai (1223 AH).",
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
          { fa: "ویکی‌پدیای فارسی چند نام دیگر را بدون توضیح آورده است. برای هیچ‌کدام منبع دومی پیدا نشد، پس نام‌ها را این‌جا نمی‌نویسیم.", en: "Persian Wikipedia lists a few more names with no detail. We found no second source for any of them, so they are not published here." },
          { fa: "چهره‌های محلی (ورزشکاران، هنرمندان، شهدا و بزرگان روستا) با کمک خانواده و با رضایت خودشان یا خانواده‌شان", en: "Local figures (athletes, artists, martyrs and elders), added with the family's help and with their or their family's consent" },
        ],
      },
    ],
  },
  {
    slug: "traditions",
    title: { fa: "آیین‌ها و سنت‌ها", en: "Traditions" },
    intro: {
      fa: "آیین‌های عزاداری، صنایع دستی و زندگی سنتی سُه.",
      en: "Mourning rituals, crafts and traditional life in Soh.",
    },
    blocks: [
      {
        t: "cards",
        items: [
          {
            title: { fa: "نخل‌گردانی تاسوعا", en: "Tasua palm carrying" },
            text: {
              fa: "در تاسوعای محرم، نخل صبح در امامزاده یوسف آراسته می‌شود، حدود ۲٫۵ کیلومتر تا امامزاده گلیله برده می‌شود و پس از عزاداری ظهر عاشورا برمی‌گردد. در هشتم محرم «عماری‌گردانی» انجام می‌شود و هفت علم در مراسم حضور دارند. اهالی تاسوعا را «روز عباس علی» می‌نامند.",
              en: "On Tasua in Muharram the palm-shaped standard is decorated in the morning at Imamzadeh Yusuf, carried about 2.5 km to Imamzadeh Golileh and returned after the Ashura noon mourning. On 8 Muharram the amari (litter) is carried, and seven standards take part. Locals call Tasua “Roz-e Abbas Ali”.",
            },
            status: "reported",
            source: "Mehr News (2023), Kojaro",
            href: "https://www.mehrnews.com/news/5842144/",
          },
          {
            title: { fa: "علم‌گردانی، عمار‌گردانی، تعزیه و نوحه", en: "Alam-gardani, ammar-gardani, taziyeh and nowheh" },
            text: {
              fa: "این آیین‌ها با هیئت‌های سینه‌زنی و تعزیه انجام می‌شود. کجارو می‌نویسد حدود ۲۰۰ سال قدمت دارند و در ۵ مرداد ۱۳۹۵ با شماره‌ی ۱۲۰۷ در فهرست میراث ناملموس ملی ثبت شده‌اند.",
              en: "These are performed by chest-beating groups (heyat) and taziyeh troupes. Kojaro says they are about 200 years old and were listed as national intangible heritage no. 1207 on 5 Mordad 1395 (27 July 2016).",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "عماری و علم‌ها", en: "The amari and the standards" },
            text: {
              fa: "عماری قابی چوبی و کوچک با طاق‌های هلالی است، نمادی از تابوت علی‌اکبر. خانواده‌ای آن را به‌صورت موروثی نگه می‌دارد و جوان‌ها روز هشتم، پس از نماز ظهر و ناهار، آن را می‌گردانند. روز تاسوعا هفت علم بسته می‌شود (پنج رنگی و دو سیاه)، یکی تا چهارم برای ابوالفضل و زینب، پنجم «پنج تن» و دو علم دیگر بی‌نام، و پیشاپیش نخل حرکت می‌کنند.",
              en: "The amari is a small rectangular wooden frame with crescent arches, a symbolic bier for Ali Akbar. A family keeps it by hereditary custody, and young men carry it on the 8th after the midday prayer and a meal. On Tasua seven standards are tied (five coloured, two black): the first four for Abolfazl and Zeynab, the fifth for the “Panj Tan”, and two unnamed. They lead the palm.",
            },
            status: "unverified",
            source: "Mehr News (2023), single source",
            href: "https://www.mehrnews.com/news/5842144/",
          },
          {
            title: { fa: "سینه‌زنی و ذکر شبانه", en: "Chest-beating and nightly zekr" },
            text: {
              fa: "سینه‌زنی و نوحه‌خوانی از شب اول محرم آغاز می‌شود و به‌عنوان نخستین آیین روستا توصیف شده است. اوج مراسم هشتم تا دهم محرم است و مجلس‌ها در مسجد جامع برگزار می‌شود. بازدیدکنندگان از سراسر استان می‌آیند.",
              en: "Chest-beating and dirge recitation start on the first night of Muharram and are described as the village's first rite. The peak is the 8th to the 10th, with gatherings at the Jame Mosque. Visitors come from across the province.",
            },
            status: "unverified",
            source: "Mehr News (2023), single source",
            href: "https://www.mehrnews.com/news/5842144/",
          },
          {
            title: { fa: "غذا و بازی‌های محلی", en: "Local foods and games" },
            text: {
              fa: "کله‌جوش، کشک مامه، آبگوشت تنوری، گلمیشه، شامی و سمنو. از لبنیات: کشک، دوغ و کره. بازی‌های قدیمی: قاب‌بازی و «شاه‌بازی».",
              en: "Kalleh-joosh, kashk-e mama, tanoori abgoosht, golmisheh, shami and semnu. Dairy: kashk, doogh and butter. Old games: knucklebones and “shah bazi”.",
            },
            status: "reported",
            source: "Kojaro, a 2021 blog",
          },
          {
            title: { fa: "قالی‌بافی جوشقانی", en: "Joshaqani carpet weaving" },
            text: {
              fa: "بافتن قالی دست‌باف میان زنان روستا رایج است. نقش‌ها به سبک جوشقانی است و در بازار اصفهان و تهران فروخته می‌شود.",
              en: "Hand-weaving carpets is common among the village's women. The designs are in the Joshaqani style, sold in the Isfahan and Tehran bazaars.",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "صنایع دستی دیگر", en: "Other crafts" },
            text: {
              fa: "گیوه‌بافی، چادرشب‌بافی، گلدوزی، سبد بید، قره‌بافی (ظرف موی بز)، لحاف تکه‌دوزی، کلاه‌بافی با نخ پنبه، ریسندگی با دوک و مشک پوست بز.",
              en: "Giveh weaving, chadorshab weaving, embroidery, willow baskets, goat-hair containers (gharreh), patchwork quilts, cotton-thread cap weaving, hand spinning with a spindle and goatskin water bags.",
            },
            status: "reported",
            source: "Kojaro",
          },
          {
            title: { fa: "خانه‌های سنتی و زورخانه", en: "Traditional houses and the zurkhaneh" },
            text: {
              fa: "خانه‌های قدیمی از چوب، گل، خشت و سنگ با بام‌های مسطح خاکی ساخته می‌شد. در روستا یک زورخانه‌ی کوچک هم هست.",
              en: "Old houses were built of wood, mud, adobe brick and stone, with flat earth roofs. The village also has a small zurkhaneh (traditional gym).",
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
          { fa: "عروسی، جشن‌ها و آیین‌های فصلی (برداشت سیب، نوروز، شب یلدا) در سُه چگونه بوده؟", en: "How were weddings, feasts and seasonal customs (apple harvest, Nowruz, Yalda) in Soh?" },
          { fa: "غذاها و نان‌های محلی و دستور پخت آن‌ها", en: "Local foods and breads, and how they are made" },
          { fa: "ترانه‌ها، لالایی‌ها، مَثَل‌ها و قصه‌های محلی", en: "Local songs, lullabies, proverbs and stories" },
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
          { title: { fa: "در خود روستا", en: "In the village" }, text: { fa: "کجارو می‌نویسد در سُه بوم‌گردی یا مهمان‌پذیر نیست و برای ماندن چادر زدن در دامنه‌ی کوه یا اقامت در شهرها و روستاهای نزدیک را پیشنهاد می‌کند. ما هم چیزی ثبت‌شده در اینترنت پیدا نکردیم (۲ آذر ۱۴۰۵). اگر آشنا یا خانواده در روستا دارید، پرسیدن از آن‌ها ساده‌ترین راه است.", en: "Kojaro says Soh has no eco-lodge or guest house and suggests camping in the foothills or staying in nearby towns and villages. We also found nothing listed online (23 Nov 2026). If you have family or friends in the village, asking them is the simplest way." }, status: "reported", source: "Kojaro" },
          { title: { fa: "آمار گردشگری شهرستان", en: "County tourism count" }, text: { fa: "فهرست آذر ۱۴۰۱ شهرستان: ۴ بوم‌گردی، ۱ مسافرخانه، ۱ هتل، ۲ مهمان‌پذیر و ۳ محل کمپ. سُه و کله‌رود دو روستای هدف گردشگری شهرستان نام برده شده‌اند. نام و شماره‌ی تماس داده نشده و آمار ممکن است قدیمی باشد.", en: "The county's December 2022 inventory: 4 eco-lodges, 1 traveller's house, 1 hotel, 2 guest houses and 3 camping sites. Soh and Kalahrud are named as the county's two tourism target villages. No names or numbers are given, and it may be out of date." }, status: "reported", source: "Kojaro news, 7 Dec 2022", href: "https://www.kojaro.com/news/194447-tourist-attractions-shahinshahr-revived/" },
          { title: { fa: "ابیانه (همسایه‌ی شمالی)", en: "Abyaneh (northern neighbour)" }, text: { fa: "چند ویلا و اقامتگاه سنتی در سایت‌های رزرو (جاجیگا، اسنپ‌تریپ) و اقامتگاه «درافشان» دیده شد. قیمت و فاصله از سُه را بررسی نکرده‌ایم.", en: "Several villas and traditional lodgings appear on booking sites (Jajiga, Snapptrip), plus the Dorafshan eco-lodge. We have not checked prices or the distance from Soh." }, status: "unverified", href: "https://ioverlander.com/places/196946-dorafshan-ecolodge", source: "iOverlander" },
          { title: { fa: "نطنز", en: "Natanz" }, text: { fa: "«خانه‌ی توسلیان» (اتاق‌های سنتی) و «کمپ اکو متین‌آباد» در نطنز فهرست شده‌اند. قیمت و فاصله بررسی نشده.", en: "Tavasolian House (traditional rooms) and Matin Abad Eco Camp are listed in Natanz. Prices and distance not checked." }, status: "unverified", href: "https://www.visitouriran.com/en/hotel/Natanz/5002993", source: "visitouriran.com" },
          { title: { fa: "سرای معلم کوه کرکس (طرق‌رود)", en: "Saray-e Moallem Karkas (Tarq Rud)" }, text: { fa: "بوم‌گردی در طرق‌رود، شهرستان نطنز، نزدیک دریاچه و قلعه‌ی طرق‌رود. این‌جا در سُه یا نزدیک آن نیست. فاصله بررسی نشده و ممکن است دیگر فعال نباشد (نظرها قدیمی است).", en: "An eco-lodge in Tarq Rud, Natanz County, near the Tarq Rud lake and castle. It is not in or next to Soh. Distance not checked, and it may no longer operate (the reviews are old)." }, status: "unverified", href: "https://www.balad.ir/p/%D8%A7%D9%82%D8%A7%D9%85%D8%AA%DA%AF%D8%A7%D9%87-%D8%B3%D8%B1%D8%A7%D9%89-%D9%85%D8%B9%D9%84%D9%85_hotel-2ibeYQS0ucocsj", source: "Balad" },
          { title: { fa: "شهرهای نزدیک", en: "Nearby towns" }, text: { fa: "میمه و شاهین‌شهر (حدود ۷۵ کیلومتر) و اصفهان (حدود ۹۴ تا ۱۰۰ کیلومتر) اقامتگاه بیشتری دارند. فهرست بررسی‌شده هنوز نداریم.", en: "Meymeh and Shahin Shahr (about 75 km) and Isfahan (about 94 to 100 km) have more places to stay. We have no checked list yet." }, status: "unverified" },
        ],
      },
      {
        t: "notice",
        title: verifyTitle,
        items: [
          { fa: "نام، شماره‌ی تماس و قیمت اقامتگاه‌های نزدیک (با کمک خانواده)", en: "Names, phone numbers and prices of nearby places (with the family's help)" },
          { fa: "اتاق‌های اجاره‌ای یا خانه‌ی مسافر در خود روستا و در میمه، دهلر، بیدشک و کله‌رود", en: "Rooms or guest houses for rent in the village itself and in Meymeh, Dehlor, Bidshak and Kalahrud" },
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
      { t: "p", text: { fa: "گویش سُه از گویش‌های فلات مرکزی ایران (مادی) است. مورگنستیرنه سُه را با قهرود، کاشان (کشه) و میمه در یک گروه آورده است. ایرانیکا می‌نویسد نخستین یادداشت‌های گویش سُه را آندریاس و مان و هدانک ثبت کرده‌اند. ایرانیکا سُه («سُهی / سُئی») را در فهرست گویش‌های مرکزی کاشان و اصفهان آورده است. متن یا فهرست واژه‌ی تأییدشده‌ی سُه را آنلاین پیدا نکردیم و پژوهش مستقلی هم نیافتیم.", en: "The Soh dialect belongs to the Central Plateau (Median) dialects of Iran. Morgenstierne groups Soh with Qohrud, Kashan (Keš) and Meyma. Iranica says early notes on Soh were made by Andreas and by Mann and Hadank. Iranica lists Soh (“Sohi / Soʾi”) among the local Central dialects of Kashan and Isfahan. We found no verified Soh word list or text online, and no standalone study." } },
      { t: "links", items: [
        { name: { fa: "ایرانیکا: گویش میمه", en: "Iranica: Meyma dialect" }, url: "https://www.iranicaonline.org/articles/meyma-ii-dialect/", note: { fa: "نزدیک‌ترین گویش مستند", en: "The closest documented dialect" } },
        { name: { fa: "ایرانیکا: گویش‌های مادی کاشان", en: "Iranica: The Median dialects of Kashan" }, url: "https://www.iranicaonline.org/articles/kashan-ix-the-median-dialects-of-kashan", note: { fa: "سُه را در گروه گویش‌های مرکزی آورده؛ داده‌ی سُه از آندریاس و از مان و هدانک است", en: "Places Soh among the Central dialects; the Soh data come from Andreas and from Mann and Hadank" } },
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
        { name: { fa: "اینستاگرام: soh_village", en: "Instagram: soh_village" }, url: "https://www.instagram.com/soh_village/", note: { fa: "صفحه‌ی «روستای تاریخی سه». در آبان ۱۴۰۵ فعال بود و هر روز مطلب می‌گذاشت. گرداننده‌اش معلوم نیست.", en: "“The historic village of Soh”. Active in November 2026, posting daily. Who runs it is not stated." } },
        { name: { fa: "تلگرام: esfahansohi", en: "Telegram: esfahansohi" }, url: "https://t.me/esfahansohi", note: { fa: "کانال اهالی: اطلاعیه، خاطره و عکس. حدود ۸۵۰ عضو.", en: "A channel for villagers: announcements, memories and photos. About 850 subscribers." } },
        { name: { fa: "مهر: آیین‌های محرم در سه", en: "Mehr News: Muharram rites in Soh" }, url: "https://www.mehrnews.com/news/5842144/", note: { fa: "گزارش تیر ۱۴۰۲ درباره‌ی عماری‌گردانی و نخل‌گردانی", en: "July 2023 report on the amari and nakhl carrying" } },
        { name: { fa: "خبر صدا و سیما: روستای سُه، تماشایی اما ناشناخته", en: "IRIB News: Soh, beautiful but unknown" }, url: "https://www.irib-news.ir/fa/news/3114741/", note: { fa: "خرداد ۱۴۰۰؛ ویدیو و ۹ عکس دارد. متن را نخوانده‌ایم.", en: "May 2021; has a video and 9 photos. We have not read it." } },
        { name: { fa: "گردشنامه: سه", en: "Gardeshnama: Soh" }, url: "https://gardeshnama.com/tours/destinations/2742/", note: { fa: "راهنمای گردشگری؛ بهترین فصل فروردین", en: "Travel guide; best season is Farvardin (spring)" } },
        { name: { fa: "بین‌آبین: کاروانسرای سه", en: "Beinabein: Soh Caravanserai" }, url: "https://beinabein.com/%DA%A9%D8%A7%D8%B1%D9%88%D8%A7%D9%86%D8%B3%D8%B1%D8%A7-%D8%B3%D9%87-%D8%A7%D8%B5%D9%81%D9%87%D8%A7%D9%86/", note: { fa: "گزارش سفر، اسفند ۱۴۰۰", en: "Travel report, February 2022" } },
        { name: { fa: "وبلاگ: روستای تاریخی سه (۱۴۰۰)", en: "Blog: the historic village of Soh (2021)" }, url: "https://downloadsara.expresblog.ir/post/%D8%B1%D9%88%D8%B3%D8%AA%D8%A7%DB%8C-%D8%AA%D8%A7%D8%B1%DB%8C%D8%AE%DB%8C-%D8%B3%D9%87-%D8%A7%D8%B5%D9%81%D9%87%D8%A7%D9%86-%D8%AF%D8%A7%D8%B1%D8%A7%DB%8C-4871", note: { fa: "بناهای تاریخی و دیدگاه یک پژوهشگر میراث", en: "Historic buildings and a heritage researcher's view" } },
        { name: { fa: "جاذبه‌های شاهین‌شهر: کجارو (خبر)", en: "Kojaro news: Shahin Shahr attractions" }, url: "https://www.kojaro.com/news/194447-tourist-attractions-shahinshahr-revived/", note: { fa: "سُه و کله‌رود روستاهای هدف گردشگری", en: "Soh and Kalahrud as tourism target villages" } },
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
        { title: { fa: "بانک صادرات، شهرک صنعتی مورچه‌خورت", en: "Bank Saderat, Murcheh Khvort industrial town" }, text: { fa: "نشانی در نقشه‌ی بلد: شهرک صنعتی مورچه‌خورت، بلوار شیخ‌بهایی، خیابان زکریا، ابوریحان ۴. مورچه‌خورت در همان دهستان سُه است. ساعت کار و فاصله را بررسی نکرده‌ایم؛ پیش از رفتن با ۱۴۸۸ تماس بگیرید.", en: "Address on the Balad map: Murcheh Khvort industrial town, Sheikh Bahai Blvd, Zakaria St, Abu Rayhan 4. Murcheh Khvort is in the same rural district as Soh. We have not checked the opening hours or distance; call 1488 (Saderat) before going." }, status: "unverified", source: "Balad" },
        { title: { fa: "میمه و شاهین‌شهر", en: "Meymeh and Shahin Shahr" }, text: { fa: "شهرهای نزدیک شعبه و خودپرداز بیشتری دارند. تنها مورد پیداشده یک خودپرداز بانک دی در میدان فاطمیه‌ی شاهین‌شهر است. شعبه‌های میمه، نطنز و ابیانه و دفتر پست را پیدا نکردیم.", en: "The nearby towns have more branches and ATMs. The only one found is a Bank Day ATM on Fatemiyeh Square in Shahin Shahr. We found no branches in Meymeh, Natanz or Abyaneh, and no post office." }, status: "unverified" },
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
        { fa: "تغییر کاربری باغ و زمین زراعی بیرون از شهر در قانون محدود شده و استثناها از کمیسیون استانی می‌گذرد. پیش از خرید از وکیل بپرسید.", en: "Changing the use of orchards and farmland outside towns is restricted by law, and exceptions go through a provincial commission. Ask a lawyer before buying." },
        { fa: "این صفحه مشاوره‌ی حقوقی نیست. با وکیل یا کارشناس رسمی مشورت کنید.", en: "This page is not legal advice. Talk to a lawyer or a licensed expert." },
      ] },
    ],
  },
];

export const sectionBySlug = (slug: string) => sections.find((s) => s.slug === slug);

// How people contribute. Fill `channel` when Al decides (email, Telegram or a form link); the page shows a placeholder while empty.
export const contact = {
  channel: { label: "", url: "" },
  note: {
    fa: "این سایت با کمک مردم سُه کامل می‌شود. هر چیزی که می‌دانید یا دارید بفرستید؛ پیش از انتشار بررسی می‌شود.",
    en: "This site is finished with the help of Soh's people. Send anything you know or have; it is checked before it is published.",
  } satisfies L,
  pending: {
    fa: "راه ارسال به‌زودی اضافه می‌شود. تا آن زمان، مطالب را به آشنایان خود در خانواده بدهید.",
    en: "A way to send things will be added soon. Until then, pass your material to the family member who runs this site.",
  } satisfies L,
};

export const contribute: { title: L; send: L[]; tip?: L }[] = [
  {
    title: { fa: "عکس", en: "Photos" },
    send: [
      { fa: "عکس با کیفیت‌ترین نسخه، نه عکس فرستاده‌شده در پیام‌رسان", en: "The original high-quality photo, not one re-sent through a chat app" },
      { fa: "جای عکس، سال تقریبی و نام عکاس", en: "Where it was taken, the approximate year and the photographer's name" },
      { fa: "اجازه‌ی انتشار؛ برای عکس افراد، به‌ویژه کودکان، رضایت خودشان یا خانواده‌شان", en: "Permission to publish; for photos of people, especially children, their or their family's consent" },
    ],
  },
  {
    title: { fa: "واژه و گویش", en: "Words and dialect" },
    send: [
      { fa: "واژه به همان شکلی که در سُه گفته می‌شود، با فارسی‌نویسی", en: "The word as said in Soh, in Persian script" },
      { fa: "معنی، یک جمله‌ی نمونه و نام گوینده", en: "Its meaning, an example sentence and who said it" },
      { fa: "یک صدای ضبط‌شده، اگر ممکن است", en: "A voice recording, if possible" },
    ],
  },
  {
    title: { fa: "تاریخ، خاطره و آیین", en: "History, memories and traditions" },
    send: [
      { fa: "آنچه می‌دانید و از چه کسی شنیده‌اید", en: "What you know and who you heard it from" },
      { fa: "نام‌ها، سال‌ها و جاها تا جای ممکن", en: "Names, years and places, as far as you can" },
      { fa: "اگر سند یا نوشته‌ای دارید، یک عکس از آن", en: "A photo of any document or writing you have" },
    ],
  },
  {
    title: { fa: "اقامت، فروشگاه و بانک", en: "Stay, shops and banks" },
    send: [
      { fa: "نام، نشانی، شماره‌ی تماس و ساعت کار", en: "Name, address, phone number and opening hours" },
      { fa: "قیمت تقریبی و تاریخ اطلاع از آن", en: "An approximate price and the date you learned it" },
      { fa: "اجازه‌ی نوشتن شماره‌ی تماس در سایت", en: "Permission to publish the phone number" },
    ],
  },
  {
    title: { fa: "آگهی ملک", en: "Property listings" },
    send: [
      { fa: "نوع ملک، متراژ، قیمت درخواستی و نوع سند", en: "Type, size, asking price and deed type" },
      { fa: "چند عکس و نشانی تقریبی", en: "A few photos and the approximate location" },
      { fa: "تماس مالک و رضایت او برای انتشار", en: "The owner's contact and consent to publish" },
    ],
  },
  {
    title: { fa: "اصلاح اشتباه", en: "Corrections" },
    send: [
      { fa: "جمله‌ای که اشتباه است و شکل درست آن", en: "The sentence that is wrong and the right version" },
      { fa: "منبع یا دلیل، اگر دارید", en: "A source or reason, if you have one" },
    ],
  },
];

export const mapInfo = {
  lat: 33.439,
  lon: 51.452,
  osmEmbed: "https://www.openstreetmap.org/export/embed.html?bbox=51.40%2C33.41%2C51.50%2C33.47&layer=mapnik&marker=33.439%2C51.452",
  osm: "https://www.openstreetmap.org/?mlat=33.439&mlon=51.452#map=13/33.439/51.452",
  google: "https://goo.gl/maps/wDRqsHQ2uwYaXufJ9",
  note: {
    fa: "جای نشانگر بر پایه‌ی مختصات ۳۳٫۴۴ شمالی و ۵۱٫۴۵ شرقی است (ویکی‌پدیای فارسی و کجارو). مختصات ویکی‌پدیای انگلیسی با این‌ها حدود ۲۰۰ کیلومتر فاصله دارد و اشتباه به نظر می‌رسد.",
    en: "The marker uses 33.44 N, 51.45 E (Persian Wikipedia and Kojaro). English Wikipedia's coordinates are about 200 km away and look wrong.",
  } satisfies L,
};

export const sources = [
  { name: "EN Wikipedia", url: "https://en.wikipedia.org/wiki/Soh,_Shahinshahr" },
  { name: "FA Wikipedia", url: "https://fa.wikipedia.org/wiki/%D8%B3%D9%87_(%D8%B4%D8%A7%D9%87%DB%8C%D9%86%E2%80%8C%D8%B4%D9%87%D8%B1_%D9%88_%D9%85%DB%8C%D9%85%D9%87)" },
  { name: "Kojaro", url: "https://www.kojaro.com/attraction/64660-isfahan-soh-village/" },
  { name: "Wikidata", url: "https://www.wikidata.org/wiki/Q5955889" },
];
