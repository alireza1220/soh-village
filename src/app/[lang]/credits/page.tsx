import { notFound } from "next/navigation";
import { Credit } from "@/components/credit";
import { hasLocale, locales } from "@/lib/i18n";
import { photos } from "@/lib/photos";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Credits({ params }: PageProps<"/[lang]/credits">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <article className="wrap narrow pt-10 flex flex-col gap-6">
      <h1 className="text-[clamp(34px,5vw,52px)]">{lang === "fa" ? "منبع عکس‌ها و مجوزها" : "Photo credits and licences"}</h1>
      <p className="muted">{lang === "fa" ? "عکس‌های این سایت از ویکی‌مدیا کامنز با مجوز آزاد گرفته شده‌اند. نام عکاس و مجوز هر عکس را در همین‌جا و زیر خود عکس می‌بینید. عکس‌های کجارو و اینستاگرام کپی نشده‌اند چون حق نشر دارند." : "Photos on this site come from Wikimedia Commons under free licences. Each photo's author and licence are shown here and under the photo. Photos from Kojaro and Instagram were not copied because they are protected by copyright."}</p>
      <ul className="flex flex-col gap-3 list-none p-0 m-0">
        {photos.map((p) => (
          <li key={p.file} className="item flex flex-col gap-1">
            <b>{p.caption[lang]}</b>
            <Credit p={p} lang={lang} />
          </li>
        ))}
      </ul>
    </article>
  );
}
