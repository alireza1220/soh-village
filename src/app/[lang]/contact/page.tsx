import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/lib/i18n";
import { contact } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Contact({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <article className="flex flex-col gap-4 pt-6">
      <h1 className="text-3xl font-bold">{lang === "fa" ? "تماس" : "Contact"}</h1>
      <p>{contact.note[lang]}</p>
      {contact.email ? <p><a className="link" href={`mailto:${contact.email}`}>{contact.email}</a></p> : null}
    </article>
  );
}
