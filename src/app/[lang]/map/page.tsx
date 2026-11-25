import Link from "next/link";
import { notFound } from "next/navigation";
import { MapFrame, VillageMap } from "@/components/map";
import { MsBanner } from "@/components/ms-banner";
import { Arrow } from "@/components/icons";
import { MediaBlock } from "@/components/media-block";
import { hasLocale, locales } from "@/lib/i18n";
import { mapApproaches, mapRoad, mapServices } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function MapPage({ params }: PageProps<"/[lang]/map">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const servicesLabel = lang === "fa" ? "خدمات" : "Services";
  const fa = lang === "fa";
  return (
    <article className="ms-page">
      <MsBanner
        lang={lang}
        file="karkas-mountain.jpg"
        title={fa ? "نقشه" : "Map"}
        intro={fa
          ? "جای روستا، راه رسیدن و خدمات."
          : "Where the village is, how to get there, and services."}
      />
      <div className="wrap ms-body">
        <VillageMap lang={lang} />

        <section className="ms-block" aria-labelledby="road">
          <div className="ms-head ms-read">
            <p className="eyebrow">{fa ? "شرح راه" : "The road"}</p>
            <h2 id="road">{mapRoad.title[lang]}</h2>
            <p>{mapRoad.lead[lang]}</p>
          </div>
          <ol className="ms-steps ms-read">
            {mapRoad.steps.map((step, i) => (
              <li key={step.en} className="navy-card">
                <span className="date-block"><span className="date-block__big">{i + 1}</span></span>
                <span className="navy-card__body"><p className="ms-step-text">{step[lang]}</p></span>
              </li>
            ))}
          </ol>
          <p className="ms-sub ms-read">{mapRoad.distances[lang]}</p>
        </section>

        <section className="ms-block" aria-labelledby="approaches">
          <div className="ms-head">
            <p className="eyebrow">{fa ? "مسیرها" : "Routes"}</p>
            <h2 id="approaches">{fa ? "دو سو تا سُه" : "Two ways in"}</h2>
          </div>
          <div className="ms-two">
            {mapApproaches.map((area) => (
              <section key={area.id} aria-labelledby={area.id}>
                <h3 id={area.id} className="ms-h3">{area.title[lang]}</h3>
                <MapFrame lang={lang} title={area.title[lang]} src={area.embed} href={area.href} caption={area.text[lang]} tall />
              </section>
            ))}
          </div>
        </section>

        <MediaBlock section="map" lang={lang} />

        <section className="ms-block ms-read" aria-labelledby="services">
          <div className="ms-head">
            <p className="eyebrow">{fa ? "در راه و در روستا" : "On the way and in the village"}</p>
            <h2 id="services">{servicesLabel}</h2>
            <p>
              {fa
                ? "نشانی دقیق خدمات در منابع نیامده؛ نشانی روی نقشه ندارند."
                : "Sources give no exact addresses, so no map pins."}
            </p>
          </div>
          <div className="ms-list">
            {mapServices.map((service) => (
              <details key={service.slug} className="ms-details">
                <summary>{service.title[lang]}</summary>
                <div className="ms-details__body">
                  <p>{service.text[lang]}</p>
                  <Link className="link-arrow" href={`/${lang}/${service.slug}`}>
                    {fa ? `صفحه‌ی ${service.title.fa}` : `${service.title.en} page`} <Arrow />
                  </Link>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
