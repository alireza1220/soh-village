import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/gallery";
import { Arrow } from "@/components/icons";
import { MsBanner } from "@/components/ms-banner";
import { hasLocale, locales } from "@/lib/i18n";
import { photos, shots } from "@/lib/photos";
import { freeAreaPhotoLinks, ownedPhotoLinks, possiblySohLinks } from "@/lib/photo-links";
import { sectionBySlug } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Photos({ params }: PageProps<"/[lang]/photos">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const fa = lang === "fa";
  const groups = [...new Set(photos.map((p) => p.section))];
  const name = (slug: string) => (slug === "village" ? (fa ? "روستا" : "The village") : sectionBySlug(slug)?.title[lang] ?? slug);
  const missing = shots.filter((s) => !photos.some((p) => p.section === s.section && p.file.startsWith(s.id))).sort((a, b) => a.priority - b.priority);
  const newTab = fa ? "(در تب تازه باز می‌شود)" : "(opens in a new tab)";
  return (
    <article className="ms-page">
      <MsBanner
        lang={lang}
        file="opening.jpg"
        title={fa ? "عکس‌ها" : "Photos"}
        intro={fa
          ? "عکس صفحه‌ی اول برای این سایت فرستاده شده. بقیه از منطقه‌اند و برچسب «نه سُه» دارند."
          : "The opening photo was sent for this site. The rest show the region and are labelled “not Soh”."}
      />
      <div className="wrap ms-body">
        {groups.map((g) => (
          <section key={g} className="ms-block" aria-labelledby={`g-${g}`}>
            <div className="ms-head">
              <p className="eyebrow">{fa ? "گالری" : "Gallery"}</p>
              <h2 id={`g-${g}`}>{name(g)}</h2>
            </div>
            <Gallery photos={photos.filter((p) => p.section === g)} lang={lang} />
          </section>
        ))}

        <section className="ms-block" aria-labelledby="owned">
          <div className="ms-head">
            <p className="eyebrow">{fa ? "پیوند" : "Links"}</p>
            <h2 id="owned">{fa ? "عکس‌های دیگرِ سُه در اینترنت" : "More photos of Soh online"}</h2>
            <p>{fa ? "فقط پیوند است؛ عکس‌ها مال صاحبانشان است. برای استفاده اجازه بگیرید." : "Linked only; the photos belong to their owners. Ask before using one."}</p>
          </div>
          <ul className="ms-links">
            {ownedPhotoLinks.map((l) => (
              <li key={l.url + l.label.en}>
                <a className="navy-card" href={l.url} target="_blank" rel="noopener noreferrer">
                  <span className="navy-card__body"><span className="navy-card__title">{l.label[lang]}<span className="sr-only"> {newTab}</span></span></span>
                  <span className="ms-ext"><Arrow /></span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="ms-block" aria-labelledby="possibly">
          <div className="ms-head">
            <p className="eyebrow">{fa ? "نامطمئن" : "Unconfirmed"}</p>
            <h2 id="possibly">{fa ? "شاید از سُه باشد" : "Possibly Soh"}</h2>
          </div>
          <ul className="ms-links">
            {possiblySohLinks.map((l) => (
              <li key={l.url}>
                <a className="navy-card" href={l.url} target="_blank" rel="noopener noreferrer">
                  <span className="navy-card__body">
                    <span className="navy-card__title">{l.label[lang]}<span className="sr-only"> {newTab}</span></span>
                    {l.note && <span className="navy-card__meta">{l.note[lang]}</span>}
                  </span>
                  <span className="ms-ext"><Arrow /></span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="ms-block" aria-labelledby="free">
          <div className="ms-head">
            <p className="eyebrow">Wikimedia Commons</p>
            <h2 id="free">{fa ? "عکس‌های آزاد از منطقه (در سایت نیست)" : "Free-licence photos of the area (not on the site)"}</h2>
            <p>{fa ? "مجوز آزاد؛ هیچ‌کدام سُه نیست." : "Free licence; none shows Soh."}</p>
          </div>
          <details className="ms-details">
            <summary>{fa ? `نمایش ${freeAreaPhotoLinks.length} پیوند` : `Show ${freeAreaPhotoLinks.length} links`}</summary>
            <div className="ms-details__body">
              <div className="ms-tablewrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">{fa ? "عنوان" : "Title"}</th>
                      <th scope="col">{fa ? "عکاس" : "Author"}</th>
                      <th scope="col">{fa ? "مجوز" : "Licence"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {freeAreaPhotoLinks.map((l) => (
                      <tr key={l.url}>
                        <td><a className="link" href={l.url} target="_blank" rel="noopener noreferrer">{l.title}</a></td>
                        <td>{l.author}</td>
                        <td>{l.license}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        </section>

        <section className="ms-block" aria-labelledby="need">
          <div className="ms-head">
            <p className="eyebrow">{fa ? "کمک کنید" : "Help us"}</p>
            <h2 id="need">{fa ? "عکس‌هایی که لازم داریم" : "Photos we need"}</h2>
          </div>
          <ul className="ms-links">
            {missing.map((s) => (
              <li key={s.id} className="ms-need">
                <span className="ms-need__title">{s.title[lang]} <span className="chip">{fa ? `اولویت ${s.priority}` : `priority ${s.priority}`}</span></span>
                <p className="ms-sub">{s.detail[lang]}</p>
              </li>
            ))}
          </ul>
          <p className="ms-read">
            {fa ? "با نام عکاس و اجازه‌ی انتشار بفرستید. " : "Send with photographer's name and permission. "}
            <Link className="link-arrow" href={`/${lang}/contribute`}>{fa ? "راه ارسال" : "How to send"} <Arrow /></Link>
          </p>
        </section>
      </div>
    </article>
  );
}
