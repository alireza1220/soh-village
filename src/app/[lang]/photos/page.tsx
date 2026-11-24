import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/gallery";
import { hasLocale, locales } from "@/lib/i18n";
import { photos, shots } from "@/lib/photos";
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
      {photos.length === 0 ? (
        <p className="muted">{lang === "fa" ? "هنوز عکسی از خود سُه نداریم. این عکس‌ها از منطقه‌ی اطراف است و مجوز آزاد دارند؛ هر کدام برچسب «نه سُه» دارد. عکس‌های لازم از خود روستا در پایین آمده است." : "We do not have a photo of Soh itself yet. These are freely licensed photos of the surrounding area, each labelled “not Soh”. The photos we need from the village are listed below."}</p>
      ) : (
        groups.map((g) => (
          <section key={g} className="flex flex-col gap-3">
            <h2 className="text-2xl">{name(g)}</h2>
            <Gallery photos={photos.filter((p) => p.section === g)} lang={lang} />
          </section>
        ))
      )}
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
