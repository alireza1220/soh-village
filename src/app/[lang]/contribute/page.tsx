import Link from "next/link";
import { notFound } from "next/navigation";
import { Arrow } from "@/components/icons";
import { MsBanner } from "@/components/ms-banner";
import { hasLocale, locales } from "@/lib/i18n";
import { contact, contribute } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Contribute({ params }: PageProps<"/[lang]/contribute">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const fa = lang === "fa";
  const ch = contact.channel;
  return (
    <article className="ms-page">
      <MsBanner lang={lang} file="opening.jpg" title={fa ? "مشارکت" : "Contribute"} intro={contact.note[lang]} />
      <div className="wrap ms-body">
        <div className="notice ms-read ms-channel" role="note">
          {ch.url ? (
            <p><a className="link" href={ch.url} target="_blank" rel="noopener noreferrer">{ch.label || ch.url}</a></p>
          ) : (
            <p>{contact.pending[lang]}</p>
          )}
        </div>
        <section className="ms-block" aria-labelledby="send">
          <div className="ms-head">
            <p className="eyebrow">{fa ? "چه چیزی بفرستید" : "What to send"}</p>
            <h2 id="send">{fa ? "شش راه برای کمک" : "Six ways to help"}</h2>
          </div>
          <ul className="ms-cards">
            {contribute.map((c) => (
              <li key={c.title.en}>
                <section className="ms-give">
                  <h3 className="ms-h3">{c.title[lang]}</h3>
                  <p className="ms-give__lead">{fa ? "لطفاً بفرستید:" : "Please send:"}</p>
                  <ul>
                    {c.send.map((x) => <li key={x.en}>{x[lang]}</li>)}
                  </ul>
                  {c.title.en === "Photos" && (
                    <Link className="link-arrow" href={`/${lang}/photos`}>{fa ? "فهرست عکس‌هایی که لازم داریم" : "See the list of photos we need"} <Arrow /></Link>
                  )}
                </section>
              </li>
            ))}
          </ul>
        </section>
        <p className="notice ms-read">{fa ? "هیچ عکس، نام یا شماره‌ای بدون اجازه‌ی صاحبش منتشر نمی‌شود." : "No photo, name or phone number is published without its owner's permission."}</p>
      </div>
    </article>
  );
}
