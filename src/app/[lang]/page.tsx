import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Credit } from "@/components/credit";
import { VillageMap } from "@/components/map";
import { SectionMark } from "@/components/section-mark";
import { hasLocale } from "@/lib/i18n";
import { photos } from "@/lib/photos";
import { population, sections, siteName, stats } from "@/lib/site";

const starts: { slug: string; title: { fa: string; en: string }; text: { fa: string; en: string }; image?: string }[] = [
  { slug: "map", title: { fa: "کجاست", en: "Where" }, text: { fa: "نقشه‌ی روستا", en: "The village on the map" }, image: "soh-map.png" },
  { slug: "tourism", title: { fa: "چطور بروید", en: "How to get there" }, text: { fa: "راه، همسایه‌ها و جاهای دیدنی", en: "The road, the neighbours and the sights" }, image: "karkas-mountain.jpg" },
  { slug: "history", title: { fa: "چه می‌دانیم", en: "What we know" }, text: { fa: "تاریخ، با برچسب برای مطلب تأییدنشده", en: "History, with a label when a fact is not checked" }, image: "opening.jpg" },
  { slug: "market", title: { fa: "بازارچه", en: "Market" }, text: { fa: "آگهی محلی؛ سایت پول نمی‌گیرد", en: "Local listings. The site takes no payment." } },
  { slug: "references", title: { fa: "راهنما و منابع", en: "Guide and sources" }, text: { fa: "روش استفاده از سایت و همه‌ی پیوندها", en: "How to use the site, and every link we found" } },
];

const copy = {
  eyebrow: { fa: "مورچه‌خورت · شاهین‌شهر و میمه · اصفهان", en: "Murcheh Khvort · Shahin Shahr and Meymeh · Isfahan" },
  lead: { fa: "راهنمای روستای سُه: کجاست، چه دارد، و چطور مطلب یا آگهی اضافه کنید. هر مطلب منبع دارد و اگر تأیید نشده باشد برچسب خورده است.", en: "A guide to Soh: where it is, what is there, and how to add a note or a listing. Every fact has a source, and anything not checked is labelled." },
  place: { fa: "در دامنه‌ی کوه‌های کرکس، با کاروانسرایی قاجاری، دو امامزاده‌ی گنبدفیروزه‌ای و باغ‌های سیب.", en: "On the slopes of the Karkas mountains, with a Qajar caravanserai, two turquoise-domed shrines and apple orchards." },
  explore: { fa: "گشت در سُه", en: "Explore Soh" },
  exploreSub: { fa: "هر بخش از منابع نام‌برده ساخته شده و مطلب تأییدنشده برچسب دارد.", en: "Every section is built from named sources, and unverified items are labelled." },
  glance: { fa: "یک نگاه", en: "At a glance" },
  help: { fa: "به ساختن این سایت کمک کنید", en: "Help build this site" },
  helpSub: { fa: "عکس، واژه‌ی محلی، خاطره، اصلاح اشتباه یا آگهی ملک دارید؟ همه‌چیز پیش از انتشار بررسی می‌شود.", en: "Have a photo, a local word, a memory, a correction or a property listing? Everything is checked before it is published." },
  explore2: { fa: "بخش‌ها", en: "Browse sections" },
  contribute: { fa: "مشارکت", en: "Contribute" },
  map: { fa: "نقشه", en: "Map" },
  pop: { fa: "جمعیت", en: "Population" },
  households: { fa: "خانوار", en: "households" },
  popNote: { fa: "مرکز آمار ایران، از ویکی‌پدیا. کجارو می‌نویسد در بهار و تابستان حدود ۱۰۰۰ نفر در روستا هستند و گردشنامه تا ۵۰۰۰ نفر در نوروز، محرم و تابستان (سرشماری نیست و دو عدد با هم نمی‌خوانند).", en: "Statistical Centre of Iran, via Wikipedia. Kojaro says about 1,000 people are in the village in spring and summer, and Gardeshnama up to 5,000 at Nowruz, Muharram and in summer (not census figures, and they disagree)." },
};

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const hero = photos.find((p) => p.section === "village") ?? photos[0];
  const max = Math.max(...population.map((p) => p.people));
  return (
    <>
      <section className="wrap pt-10 pb-12 grid gap-10 items-center lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <span className="pill self-start">{copy.eyebrow[lang]}</span>
          <h1 className="text-[clamp(38px,6vw,64px)]">{siteName[lang]}</h1>
          <p className="text-lg max-w-xl">{copy.lead[lang]}</p>
          <p className="muted max-w-xl">{copy.place[lang]}</p>
          <div className="flex flex-wrap gap-3">
            <a href="#explore" className="btn btn-primary">{copy.explore[lang]}</a>
            <Link href={`/${lang}/contribute`} className="btn btn-ghost">{copy.contribute[lang]}</Link>
          </div>
        </div>
        {hero && (
          <figure className="card hero-photo relative m-0 overflow-hidden" style={{ aspectRatio: `${hero.width} / ${hero.height}` }}>
            <Image src={`/photos/${hero.file}`} alt={hero.alt[lang]} fill priority sizes="(max-width: 1024px) 100vw, 540px" className="object-cover" />
            <p lang="fa" className="fa-display absolute top-3 z-10 text-[84px] font-bold leading-none text-white/95 drop-shadow-lg start-5">سُه</p>
            <figcaption className="absolute inset-x-0 bottom-0 z-10 p-4 flex flex-col gap-1 text-white">
              <span className="text-sm">{hero.caption[lang]}</span>
              <Credit p={hero} lang={lang} light />
            </figcaption>
          </figure>
        )}
      </section>

      <section className="wrap pb-12" aria-labelledby="start">
        <h2 id="start" className="section-title mb-4">{lang === "fa" ? "از اینجا شروع کنید" : "Start here"}</h2>
        <ul className="grid gap-3 list-none p-0 m-0" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
          {starts.map((s) => {
            const ph = s.image ? photos.find((p) => p.file === s.image) : undefined;
            const mapShot = s.image === "soh-map.png";
            return (
              <li key={s.slug}>
                <Link href={`/${lang}/${s.slug}`} className="card lift flex h-full flex-col overflow-hidden">
                  <div className="relative" style={{ aspectRatio: "16 / 10", background: "linear-gradient(135deg, var(--accent-soft), var(--chip))" }}>
                    {mapShot ? (
                      <>
                        <Image src="/photos/soh-map.png" alt={lang === "fa" ? "نقشه‌ی محدوده‌ی سُه" : "Map of the Soh area"} fill sizes="240px" className="object-cover" />
                        <span className="region-badge">© OpenStreetMap</span>
                      </>
                    ) : ph ? (
                      <>
                        <Image src={`/photos/${ph.file}`} alt={ph.alt[lang]} fill sizes="240px" className="object-cover" />
                        {ph.scope === "region" && <span className="region-badge">{lang === "fa" ? "عکس منطقه، نه سُه" : "Region photo, not Soh"}</span>}
                      </>
                    ) : (
                      <SectionMark slug={s.slug} />
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-1">
                    <b>{s.title[lang]}</b>
                    <span className="text-sm muted">{s.text[lang]}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="wrap pb-12">
        <ul className="grid gap-3 list-none p-0 m-0" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
          {stats.map((s) => (
            <li key={s.k.en} className="card p-4">
              <b className="block text-2xl" style={{ fontFamily: "var(--font-serif), var(--font-fa)", fontVariantNumeric: "tabular-nums" }}>{s.v[lang]}</b>
              <span className="text-sm muted">{s.k[lang]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap pb-14 flex flex-col gap-6" aria-labelledby="explore">
        <div className="flex flex-col gap-2 max-w-2xl">
          <h2 id="explore" className="section-title">{copy.explore2[lang]}</h2>
          <p className="muted">{copy.exploreSub[lang]}</p>
        </div>
        <ul className="grid gap-4 list-none p-0 m-0" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))" }}>
          {sections.map((s) => {
            const ph = photos.find((p) => p.section === s.slug);
            return (
              <li key={s.slug}>
                <Link href={`/${lang}/${s.slug}`} className="card lift flex h-full flex-col overflow-hidden">
                  <div className="relative" style={{ aspectRatio: "16 / 9", background: "linear-gradient(135deg, var(--accent-soft), var(--chip))" }}>
                    {ph ? (
                      <>
                        <Image src={`/photos/${ph.file}`} alt={ph.alt[lang]} fill sizes="(max-width: 640px) 100vw, 300px" className="object-cover" />
                        {ph.scope === "region" && <span className="region-badge">{lang === "fa" ? "عکس منطقه، نه سُه" : "Region photo, not Soh"}</span>}
                      </>
                    ) : (
                      <SectionMark slug={s.slug} />
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-1">
                    <h3 className="text-xl">{s.title[lang]}</h3>
                    <p className="text-sm muted">{s.intro[lang]}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="wrap pb-14 grid gap-8 lg:grid-cols-[3fr_2fr] items-start" aria-labelledby="glance">
        <div className="flex flex-col gap-3">
          <h2 id="glance" className="section-title">{copy.map[lang]}</h2>
          <VillageMap lang={lang} />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="section-title">{copy.pop[lang]}</h2>
          <div className="card p-5 flex flex-col gap-4" role="img" aria-label={population.map((p) => `${p.year}: ${p.people}`).join(", ")}>
            {population.map((p) => (
              <div key={p.year} className="flex flex-col gap-1" style={{ fontVariantNumeric: "tabular-nums" }}>
                <div className="flex justify-between text-sm"><b>{p.year}</b><span className="muted">{p.people} · {p.households} {copy.households[lang]}</span></div>
                <div className="h-3 rounded-full" style={{ background: "var(--chip)" }}>
                  <div className="h-3 rounded-full" style={{ width: `${Math.round((p.people / max) * 100)}%`, background: "var(--apple)" }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm muted">{copy.popNote[lang]}</p>
        </div>
      </section>

      <section className="wrap">
        <div className="card p-8 md:p-12 flex flex-col gap-4 items-start" style={{ background: "linear-gradient(135deg, var(--accent-soft), var(--surface))" }}>
          <h2 className="section-title max-w-2xl">{copy.help[lang]}</h2>
          <p className="muted max-w-2xl">{copy.helpSub[lang]}</p>
          <Link href={`/${lang}/contribute`} className="btn btn-primary">{copy.contribute[lang]} →</Link>
        </div>
      </section>
    </>
  );
}
