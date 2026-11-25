import Link from "next/link";
import { notFound } from "next/navigation";
import { MapFrame, VillageMap } from "@/components/map";
import { MsBanner } from "@/components/ms-banner";
import { Arrow } from "@/components/icons";
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
  const fa = lang === "fa";
  return (
    <article className="ms-page">
      <MsBanner
        lang={lang}
        file="karkas-mountain.jpg"
        title={fa ? "نقشه" : "Map"}
        intro={fa
          ? "جای روستا، شرح راه، دو سو از اصفهان و از تهران، و توضیح هر خدمت با یک کلیک."
          : "Where the village is, the road written out, the two approaches from Isfahan and from Tehran, and a note on each service when you open it."}
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

        <SocialForSection section="map" lang={lang} />

        <section className="ms-block ms-read" aria-labelledby="services">
          <div className="ms-head">
            <p className="eyebrow">{fa ? "در راه و در روستا" : "On the way and in the village"}</p>
            <h2 id="services">{servicesLabel}</h2>
            <p>
              {fa
                ? "هر خدمت را باز کنید تا همین‌جا شرحش را ببینید. نشان جداگانه‌ای روی نقشه ندارند، چون نشانی دقیق‌شان در منابع نیامده است."
                : "Open any service to read what we know, here on this page. They have no separate pin, because the sources do not give an exact address."}
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
