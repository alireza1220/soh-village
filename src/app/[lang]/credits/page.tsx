import Image from "next/image";
import { notFound } from "next/navigation";
import { Credit } from "@/components/credit";
import { MsBanner } from "@/components/ms-banner";
import { hasLocale, locales } from "@/lib/i18n";
import { photos } from "@/lib/photos";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Credits({ params }: PageProps<"/[lang]/credits">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const fa = lang === "fa";
  return (
    <article className="ms-page">
      <MsBanner
        lang={lang}
        file="karkas-peak.jpg"
        title={fa ? "منبع عکس‌ها و مجوزها" : "Photo credits and licences"}
        intro={fa
          ? "عکس‌های این سایت از ویکی‌مدیا کامنز با مجوز آزاد گرفته شده‌اند. نام عکاس و مجوز هر عکس را در همین‌جا و زیر خود عکس می‌بینید. عکس‌های کجارو و اینستاگرام کپی نشده‌اند چون حق نشر دارند."
          : "Photos on this site come from Wikimedia Commons under free licences. Each photo's author and licence are shown here and under the photo. Photos from Kojaro and Instagram were not copied because they are protected by copyright."}
      />
      <div className="wrap ms-body">
        <section className="ms-block ms-read" aria-labelledby="all-credits">
          <div className="ms-head">
            <p className="eyebrow">{fa ? "فهرست کامل" : "Full list"}</p>
            <h2 id="all-credits">{fa ? "عکس‌ها، عکاسان و مجوزها" : "Photos, authors and licences"}</h2>
          </div>
          <ul className="ms-list">
            {photos.map((p) => (
              <li key={`${p.section}-${p.file}`} className="ms-credit">
                <span className="ms-credit__thumb">
                  <Image src={`/photos/${p.file}`} alt={p.alt[lang]} fill sizes="96px" />
                </span>
                <span className="ms-credit__body">
                  <b>{p.caption[lang]}</b>
                  <Credit p={p} lang={lang} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
