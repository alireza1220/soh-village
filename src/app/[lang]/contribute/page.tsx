import Link from "next/link";
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
    <article className="wrap narrow pt-10 flex flex-col gap-6">
      <h1 className="text-[clamp(34px,5vw,52px)]">{lang === "fa" ? "مشارکت" : "Contribute"}</h1>
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
            {c.title.en === "Photos" && (
              <p className="text-sm mt-2"><Link className="link" href={`/${lang}/photos`}>{lang === "fa" ? "فهرست عکس‌هایی که لازم داریم" : "See the list of photos we need"}</Link></p>
            )}
          </section>
        ))}
      </div>
      <p className="text-sm muted">{lang === "fa" ? "هیچ عکس، نام یا شماره‌ای بدون اجازه‌ی صاحبش منتشر نمی‌شود." : "No photo, name or phone number is published without its owner's permission."}</p>
    </article>
  );
}
