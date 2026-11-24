import Link from "next/link";
import { notFound } from "next/navigation";
import { MapFrame, VillageMap } from "@/components/map";
import { SocialForSection } from "@/components/social-embeds";
import { hasLocale, locales } from "@/lib/i18n";
import { mapApproaches, mapRoad, mapServices } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function MapPage({ params }: PageProps<"/[lang]/map">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const servicesLabel = lang === "fa" ? "خدمات" : "Services";
  return (
    <article className="wrap pt-10 pb-16 flex flex-col gap-10">
      <header className="flex flex-col gap-3 max-w-3xl">
        <h1 className="text-[clamp(34px,5vw,52px)]">{lang === "fa" ? "نقشه" : "Map"}</h1>
        <p className="text-lg muted">
          {lang === "fa"
            ? "جای روستا، شرح راه، دو سو از اصفهان و از تهران، و توضیح هر خدمت با یک کلیک."
            : "Where the village is, the road written out, the two approaches from Isfahan and from Tehran, and a note on each service when you open it."}
        </p>
      </header>

      <VillageMap lang={lang} />

      <section className="flex flex-col gap-4 max-w-3xl" aria-labelledby="road">
        <h2 id="road" className="text-2xl">{mapRoad.title[lang]}</h2>
        <p>{mapRoad.lead[lang]}</p>
        <ol className="flex flex-col gap-3 m-0 ps-5">
          {mapRoad.steps.map((step) => (
            <li key={step.en}>{step[lang]}</li>
          ))}
        </ol>
        <p className="text-sm muted">{mapRoad.distances[lang]}</p>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="approaches">
        <h2 id="approaches" className="text-2xl">{lang === "fa" ? "دو سو تا سُه" : "Two ways in"}</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {mapApproaches.map((area) => (
            <section key={area.id} className="flex flex-col gap-3" aria-labelledby={area.id}>
              <h3 id={area.id} className="text-xl">{area.title[lang]}</h3>
              <MapFrame
                lang={lang}
                title={area.title[lang]}
                src={area.embed}
                href={area.href}
                caption={area.text[lang]}
                tall
              />
            </section>
          ))}
        </div>
      </section>

      <SocialForSection section="map" lang={lang} />

      <section className="flex flex-col gap-4 max-w-3xl" aria-labelledby="services">
        <div className="flex flex-col gap-2">
          <h2 id="services" className="text-2xl">{servicesLabel}</h2>
          <p className="muted">
            {lang === "fa"
              ? "هر خدمت را باز کنید تا همین‌جا شرحش را ببینید. نشان جداگانه‌ای روی نقشه ندارند، چون نشانی دقیق‌شان در منابع نیامده است."
              : "Open any service to read what we know, here on this page. They have no separate pin, because the sources do not give an exact address."}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {mapServices.map((service) => (
            <details key={service.slug} className="card px-4 py-3">
              <summary className="cursor-pointer font-semibold">{service.title[lang]}</summary>
              <div className="pt-3 flex flex-col gap-3">
                <p>{service.text[lang]}</p>
                <Link className="link text-sm" href={`/${lang}/${service.slug}`}>
                  {lang === "fa" ? `صفحه‌ی ${service.title.fa}` : `${service.title.en} page`}
                </Link>
              </div>
            </details>
          ))}
        </div>
      </section>
    </article>
  );
}
