import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/lib/i18n";
import { contact, contribute } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Contribute({ params }: PageProps<"/[lang]/contribute">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const ch = contact.channel;
  return (
    <article className="flex flex-col gap-5 pt-6">
      <h1 className="text-3xl font-bold">{lang === "fa" ? "مشارکت" : "Contribute"}</h1>
      <p className="text-lg muted">{contact.note[lang]}</p>
      <div className="todo">
        {ch.url ? (
          <p><a className="link font-semibold" href={ch.url} target="_blank" rel="noopener noreferrer">{ch.label || ch.url}</a></p>
        ) : (
          <p>{contact.pending[lang]}</p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {contribute.map((c) => (
          <section key={c.title.en} className="item">
            <h2 className="text-lg font-semibold">{c.title[lang]}</h2>
            <p className="text-sm muted mt-1">{lang === "fa" ? "لطفاً بفرستید:" : "Please send:"}</p>
            <ul className="ps-5 list-disc flex flex-col gap-1 mt-1">
              {c.send.map((x) => <li key={x.en}>{x[lang]}</li>)}
            </ul>
          </section>
        ))}
      </div>
      <p className="text-sm muted">{lang === "fa" ? "هیچ عکس، نام یا شماره‌ای بدون اجازه‌ی صاحبش منتشر نمی‌شود." : "No photo, name or phone number is published without its owner's permission."}</p>
    </article>
  );
}
