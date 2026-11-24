import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/gallery";
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
  const groups = [...new Set(photos.map((p) => p.section))];
  const name = (slug: string) => (slug === "village" ? (lang === "fa" ? "روستا" : "The village") : sectionBySlug(slug)?.title[lang] ?? slug);
  const missing = shots.filter((s) => !photos.some((p) => p.section === s.section && p.file.startsWith(s.id))).sort((a, b) => a.priority - b.priority);
  return (
    <article className="wrap pt-10 flex flex-col gap-8">
      <h1 className="text-[clamp(34px,5vw,52px)]">{lang === "fa" ? "عکس‌ها" : "Photos"}</h1>
      <p className="muted max-w-3xl">{lang === "fa" ? "عکس صفحه‌ی اول را برای همین سایت فرستاده‌اند. بقیه‌ی عکس‌ها از منطقه‌ی اطراف است، مجوز آزاد دارند و برچسب «نه سُه» دارند. عکس‌هایی که هنوز از خود روستا لازم داریم پایین صفحه آمده است." : "The opening photo was supplied for this site. The other pictures are freely licensed photos of the surrounding area, and each one is labelled “not Soh”. The photos we still need from the village are listed at the bottom."}</p>
      {groups.map((g) => (
          <section key={g} className="flex flex-col gap-3">
            <h2 className="text-2xl">{name(g)}</h2>
            <Gallery photos={photos.filter((p) => p.section === g)} lang={lang} />
          </section>
        ))}
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl">{lang === "fa" ? "عکس‌های دیگرِ سُه در اینترنت" : "More photos of Soh online"}</h2>
        <p className="text-sm muted">{lang === "fa" ? "این عکس‌ها مال صاحبانشان است و این‌جا کپی نشده‌اند؛ فقط پیوند آمده. برای استفاده، از عکاس اجازه بگیرید." : "These photos belong to their owners and are not copied here, only linked. Ask the photographer before using one."}</p>
        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          {ownedPhotoLinks.map((l) => (
            <li key={l.url + l.label.en} className="item">
              <a className="link" href={l.url} target="_blank" rel="noopener noreferrer">{l.label[lang]}</a>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl">{lang === "fa" ? "شاید از سُه باشد" : "Possibly Soh"}</h2>
        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          {possiblySohLinks.map((l) => (
            <li key={l.url} className="item">
              <a className="link" href={l.url} target="_blank" rel="noopener noreferrer">{l.label[lang]}</a>
              {l.note && <p className="text-sm muted">{l.note[lang]}</p>}
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl">{lang === "fa" ? "عکس‌های آزاد از منطقه (در سایت نیست)" : "Free-licence photos of the area (not on the site)"}</h2>
        <p className="text-sm muted">{lang === "fa" ? "همه در ویکی‌مدیا کامنز با مجوز آزاد؛ هیچ‌کدام سُه نیست." : "All on Wikimedia Commons under free licences; none shows Soh."}</p>
        <details className="item">
          <summary className="cursor-pointer font-semibold">{lang === "fa" ? `نمایش ${freeAreaPhotoLinks.length} پیوند` : `Show ${freeAreaPhotoLinks.length} links`}</summary>
          <ul className="mt-3 flex flex-col gap-2 list-none p-0 m-0 text-sm">
            {freeAreaPhotoLinks.map((l) => (
              <li key={l.url}>
                <a className="link" href={l.url} target="_blank" rel="noopener noreferrer">{l.title}</a>
                <span className="muted"> · {l.author} · {l.license}</span>
              </li>
            ))}
          </ul>
        </details>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl">{lang === "fa" ? "عکس‌هایی که لازم داریم" : "Photos we need"}</h2>
        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          {missing.map((s) => (
            <li key={s.id} className="item">
              <b>{s.title[lang]}</b> <span className="chip">{lang === "fa" ? `اولویت ${s.priority}` : `priority ${s.priority}`}</span>
              <p className="text-sm muted">{s.detail[lang]}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm muted">
          {lang === "fa" ? "عکس‌ها را با نام عکاس و اجازه‌ی انتشار بفرستید. " : "Send photos with the photographer's name and permission to publish. "}
          <Link className="link" href={`/${lang}/contribute`}>{lang === "fa" ? "راه ارسال" : "How to send"}</Link>
        </p>
      </section>
    </article>
  );
}
