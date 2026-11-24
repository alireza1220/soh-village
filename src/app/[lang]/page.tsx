import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n";
import { population, sections, siteName, stats, tagline } from "@/lib/site";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const max = Math.max(...population.map((p) => p.people));
  return (
    <div className="flex flex-col gap-10 pt-6">
      <section className="flex flex-col gap-3">
        <p lang="fa" dir="rtl" className="fa-display font-bold leading-none" style={{ fontSize: "clamp(88px,22vw,148px)", color: "var(--apple)" }}>سُه</p>
        <h1 className="text-4xl font-bold">{siteName[lang]}</h1>
        <p className="text-lg muted max-w-prose">{tagline[lang]}.</p>
        <ul className="grid gap-3 list-none p-0 mt-2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
          {stats.map((s) => (
            <li key={s.k.en} className="item">
              <b className="block text-xl" style={{ fontVariantNumeric: "tabular-nums" }}>{s.v[lang]}</b>
              <span className="text-sm muted">{s.k[lang]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold border-t-4 pt-3" style={{ borderColor: "var(--apple)" }}>{lang === "fa" ? "بخش‌ها" : "Sections"}</h2>
        <ul className="grid gap-3 list-none p-0" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          {sections.map((s) => (
            <li key={s.slug}>
              <Link href={`/${lang}/${s.slug}`} className="item block h-full hover:underline">
                <b>{s.title[lang]}</b>
                <span className="block text-sm muted">{s.intro[lang]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold border-t-4 pt-3" style={{ borderColor: "var(--apple)" }}>{lang === "fa" ? "جمعیت" : "Population"}</h2>
        <div className="flex flex-col gap-2" role="img" aria-label={population.map((p) => `${p.year}: ${p.people}`).join(", ")}>
          {population.map((p) => (
            <div key={p.year} className="grid items-center gap-3" style={{ gridTemplateColumns: "48px 1fr", fontVariantNumeric: "tabular-nums" }}>
              <b>{p.year}</b>
              <div className="flex items-center gap-3">
                <i className="block h-3.5 rounded-sm" style={{ width: `${Math.round((p.people / max) * 60)}%`, background: "var(--apple)" }} />
                <span className="text-sm">{p.people} · {p.households} {lang === "fa" ? "خانوار" : "households"}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm muted">{lang === "fa" ? "مرکز آمار ایران، از ویکی‌پدیا. کجارو می‌نویسد در بهار و تابستان حدود ۱۰۰۰ نفر در روستا هستند (سرشماری نیست)." : "Statistical Centre of Iran, via Wikipedia. Kojaro says about 1,000 people are in the village in spring and summer (not a census figure)."}</p>
      </section>
    </div>
  );
}
