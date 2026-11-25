import type { L } from "./i18n";

// AI-generated illustrations (25 Nov 2026). They are NOT photographs and do not show real places or people.
// Every place that shows one must carry <IllustrationLabel /> (see docs/DESIGN.md).
export type Illustration = { file: string; width: number; height: number; alt: L };

const W = 1536;
const H = 1024;
const ill = (slug: string, fa: string, en: string): Illustration => ({ file: `${slug}.jpg`, width: W, height: H, alt: { fa, en } });

export const illustrations: Record<string, Illustration> = {
  history: ill("history", "تصویرسازی کاروانسرایی آجری با طاق‌های تیزه‌دار، برجی گرد در گوشه و کوه‌های برفی در پشت آن", "Illustration of a brick caravanserai with pointed arches, a round corner tower and snowy mountains behind it"),
  tourism: ill("tourism", "تصویرسازی مسیری پیاده که از دامنه‌ای سبز و از کنار بقعه‌ای با گنبد فیروزه‌ای به سوی قله‌های برفی می‌پیچد، با جویباری و عصایی چوبی تکیه‌داده به سنگ در پیش‌زمینه.", "Illustration of a footpath winding up a grassy mountain slope past a turquoise-domed shrine toward snow-dusted peaks, with a stream and a walking stick leaning on a rock in the foreground."),
  people: ill("people", "تصویرسازی از کوچه‌ای آرام با خانه‌های خشتی در نور طلایی، با فانوسی روشن کنار دری چوبی، دوچرخه‌ای تکیه‌داده به دیوار، شاخه‌های سیب بالای دیوار و دو آدم کوچک که به سمت کوه‌ها دور می‌شوند.", "Illustration of a quiet mud-brick village lane in golden light, with a lit lantern by a wooden door, a bicycle leaning on a wall, apple branches overhanging, and two tiny figures walking away toward the mountains."),
  traditions: ill("traditions", "تصویرسازی یک فرش دست‌بافت قرمز و فیروزه‌ای روی دار چوبی کنار پنجره‌ای قوسی از آجر، با گلوله‌های کاموا در سبد، شانه‌ی دفتین و یک استکان چای روی چهارپایه.", "Illustration of a hand-knotted red and turquoise carpet on a wooden loom in an arched brick window, with balls of wool in a basket, a weaving comb and a glass of tea on a stool."),
  tasua: ill("tasua", "تصویرسازی از نخلی چوبی و منبت‌کاری‌شده با پارچه‌های سیاه و سبز، در سپیده‌دم کنار امامزاده‌ای کوچک با گنبد فیروزه‌ای، میان پرچم‌های تیره و کوه‌های پشت آن، با چند سایه‌ی کوچک و دور.", "Illustration of a tall carved wooden palm-shaped ceremonial standard draped in dark and green cloth, standing at dawn beside a small turquoise-domed shrine among dark banners, with mountains behind and a few tiny distant figures."),
  market: ill("market", "تصویرسازی از یک غرفه بازار روستایی زیر سایبان راه‌راه سبز و کرم، با سبدهای گیلاس و سیب، نان تخت چیده‌شده، گردو، شیشه‌های عسل و جعبه‌های چوبی، در برابر دیوارهای خشتی و کوه‌های برفی دوردست.", "Illustration of a village market stall under a green and cream striped awning, with baskets of cherries and apples, stacked flatbread, walnuts, jars of honey and wooden crates, set before adobe walls and distant snow-capped mountains."),
  stay: ill("stay", "تصویرسازی از یک اتاق مهمان سنتی با دیوار سنگی، پنجره‌ای رو به کوه‌های برفی، گلیم، پشتی‌های کف‌نشین، سینی و قوری برنجی، چراغ نفتی و پتوهای تاشده در نور گرم غروب.", "Illustration of a traditional stone guest room with an open window onto snowy mountains, a kilim, floor cushions, a brass tea set, an oil lamp and folded blankets in warm golden light."),
  shop: ill("shop", "تصویرسازی از باغ سیب در پاییز با سیب‌های قرمز روی درختان، جعبه‌های چوبی برداشت، نردبان، چرخ‌دستی و سبد حصیری، و در پس‌زمینه خانه‌های خشتی و کوه‌های برفی.", "Illustration of an autumn apple orchard with red apples on the trees, wooden harvest crates, a ladder, a hand cart and a woven basket, with mud-brick houses and snowy mountains behind."),
  words: ill("words", "تصویرسازی از یک کتاب باز با صفحه‌های سفید و نشانک قرمز روی میز چوبی، کنار استکان چای، انار، شکوفهٔ بادام و مداد، مقابل پنجره‌ای رو به یک روستای کوهستانی.", "Illustration of an open book with blank cream pages and a red ribbon bookmark on a wooden table, with a glass of tea, a pomegranate, almond blossom and a pencil, in front of an open window onto a mountain village."),
  resources: ill("resources", "تصویرسازی از میز یک پژوهشگر با نقشه‌ای از خطوط تراز و مسیر نقطه‌چین، قطب‌نما، ذره‌بین، فانوس، چند کتاب قدیمی و دفتری باز و سفید، با منظره‌ای از روستایی کوهستانی در نور گرم غروب.", "Illustration of a researcher's table with a contour-line map and dotted route, a brass compass, a magnifying glass, a lantern, a stack of old books and an open blank notebook, set before a mountain village in warm golden light."),
  banks: ill("banks", "تصویرسازی از پیشخوان یک مغازه روستایی با دفتر حساب باز و سفید، چرتکه برنجی، کیسه چرمی و ترازوی کوچک، زیر پنجره‌ای قوسی که به کوه‌های برفی و روستایی خشتی باز می‌شود.", "Illustration of a village shop counter with an open blank ledger, a brass abacus, a leather pouch and a small balance scale beneath an arched window that looks onto snowy mountains and a mud-brick village."),
  property: ill("property", "تصویرسازی خانه‌ای خشتی با بام تخت پشت حیاطی دیوارکشیده، با درخت گردو، دروازه‌ای چوبی که کلیدی آهنی و قدیمی از آن آویزان است و کوه‌های برفی در دوردست.", "Illustration of a mud-brick village house with a flat roof behind a walled garden, with a walnut tree, a wooden gate with an old iron key hanging on it, and snow-capped mountains in the distance."),
  needs: ill("needs", "تصویرسازی دو جفت دست که سبدی بافته پر از نان، سیب و انگور را از روی دیوار کوتاه سنگی باغ به هم می‌دهند، با درخت سیب، روستایی کوهستانی و قله‌های برفی در پس‌زمینه.", "Illustration of two pairs of hands passing a woven basket of flatbread, apples and grapes across a low stone garden wall, with an apple tree, a mountain village and snowy peaks behind."),
  careers: ill("careers", "تصویرسازی نردبانی چوبی تکیه‌داده به درخت سیب در طلوع آفتاب، با قیچی هرس روی جعبه، کمربند ابزار چرمی آویخته از شاخه، و فرغون و آستین‌های کار کنار نرده، و کوه‌ها و روستایی خشتی در پشت.", "Illustration of a wooden ladder leaning on an apple tree at sunrise, with pruning shears on a crate, a leather tool belt hanging from a branch, and a wheelbarrow and work sleeves by a fence, with mountains and a small adobe village behind."),
};

/** The illustration for a section slug (history ... careers), or the separate "tasua" key. Undefined when there is none. */
export function illustrationFor(slug: string): Illustration | undefined {
  return illustrations[slug];
}

export const illustrationSrc = (i: Illustration) => `/illustrations/${i.file}`;
