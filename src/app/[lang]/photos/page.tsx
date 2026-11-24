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
    <article className="flex flex-col gap-8 pt-6">
      <h1 className="text-3xl font-bold">{lang === "fa" ? "عکس‌ها" : "Photos"}</h1>
      {photos.length === 0 ? (
        <p className="muted">{lang === "fa" ? "هنوز عکسی اضافه نشده است. فهرست عکس‌های لازم در پایین آمده است." : "No photos yet. The list of photos we need is below."}</p>
      ) : (
        groups.map((g) => (
          <section key={g} className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">{name(g)}</h2>
            <Gallery photos={photos.filter((p) => p.section === g)} lang={lang} />
          </section>
        ))
      )}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{lang === "fa" ? "عکس‌هایی که لازم داریم" : "Photos we need"}</h2>
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
