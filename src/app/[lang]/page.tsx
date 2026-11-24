import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Credit } from "@/components/credit";
import { VillageMap } from "@/components/map";
import { hasLocale } from "@/lib/i18n";
import { photos } from "@/lib/photos";
import { population, sections, stats } from "@/lib/site";

const copy = {
  eyebrow: { fa: "مورچه‌خورت · شاهین‌شهر و میمه · اصفهان", en: "Murcheh Khvort · Shahin Shahr and Meymeh · Isfahan" },
  h1: { fa: "روستایی در دامنه‌ی کوه‌های کرکس", en: "A mountain village in the Karkas range" },
  lead: { fa: "سُه با کاروانسرایی قاجاری، دو امامزاده‌ی گنبدفیروزه‌ای، باغ‌های سیب و آیین نخل‌گردانی تاسوعا. تاریخ، جاهای دیدنی، اقامت، خرید و واژه‌های محلی در یک‌جا.", en: "Soh has a Qajar caravanserai, two turquoise-domed shrines, apple orchards and a Tasua palm-carrying ritual. History, sights, where to stay, what to buy and local words, in one place." },
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
          <h1 className="text-[clamp(38px,6vw,64px)]">{copy.h1[lang]}</h1>
          <p className="text-lg muted max-w-xl">{copy.lead[lang]}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${lang}/history`} className="btn btn-primary">{copy.explore[lang]} →</Link>
            <Link href={`/${lang}/contribute`} className="btn btn-ghost">{copy.contribute[lang]}</Link>
          </div>
        </div>
        {hero && (
          <figure className="card hero-photo relative m-0 overflow-hidden" style={{ aspectRatio: "4 / 3.4" }}>
            <Image src={`/photos/${hero.file}`} alt={hero.alt[lang]} fill priority sizes="(max-width: 1024px) 100vw, 540px" className="object-cover" />
            <p lang="fa" className="fa-display absolute top-3 z-10 text-[84px] font-bold leading-none text-white/95 drop-shadow-lg start-5">سُه</p>
            <figcaption className="absolute inset-x-0 bottom-0 z-10 p-4 flex flex-col gap-1 text-white">
              <span className="text-sm">{hero.caption[lang]}</span>
              <Credit p={hero} lang={lang} light />
            </figcaption>
          </figure>
        )}
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
                        {ph.scope === "region" && <span className="absolute bottom-2 start-2 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white">{lang === "fa" ? "عکس منطقه، نه سُه" : "Region photo, not Soh"}</span>}
                      </>
                    ) : (
                      <span lang="fa" className="fa-display absolute inset-0 grid place-items-center text-6xl font-bold" style={{ color: "var(--accent)", opacity: 0.22 }}>سُه</span>
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
