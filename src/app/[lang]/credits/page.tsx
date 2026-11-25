import Image from "next/image";
import { notFound } from "next/navigation";
import { Credit } from "@/components/credit";
import { IllustrationLabel } from "@/components/illustration-label";
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
          ? "عکس‌ها از ویکی‌مدیا کامنز با مجوز آزادند. عکاس و مجوز زیر هر عکس آمده است. عکس‌های کجارو و اینستاگرام حق نشر دارند و کپی نشده‌اند."
          : "Photos are from Wikimedia Commons under free licences, with author and licence shown. Kojaro and Instagram photos are copyrighted and not copied."
      }
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
        <section className="ms-block ms-read" aria-labelledby="ill-credits">
          <div className="ms-head">
            <p className="eyebrow">{fa ? "تصویرسازی" : "Illustrations"}</p>
            <h2 id="ill-credits">{fa ? "تصویرسازی‌ها" : "Illustrations"}</h2>
          </div>
          <p>
            {fa
              ? "تصویرسازی‌های این سایت در ۲۵ نوامبر ۲۰۲۶ با یک ابزار تصویرسازی هوش مصنوعی ساخته شده‌اند. عکس نیستند و جای واقعی یا آدم واقعی را نشان نمی‌دهند."
              : "The illustrations on this site were made with an AI image tool on 25 Nov 2026. They are not photographs, and they do not show real places or people."}
          </p>
          <p><IllustrationLabel lang={lang} /></p>
        </section>
      </div>
    </article>
  );
}
