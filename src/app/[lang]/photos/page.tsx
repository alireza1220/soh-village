import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/lib/i18n";
import { photos } from "@/lib/photos";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Photos({ params }: PageProps<"/[lang]/photos">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <article className="flex flex-col gap-5 pt-6">
      <h1 className="text-3xl font-bold">{lang === "fa" ? "عکس‌ها" : "Photos"}</h1>
      {photos.length === 0 ? (
        <div className="todo">
          <p>{lang === "fa" ? "هنوز عکسی اضافه نشده است. عکس‌های روستا، خانه‌ها، باغ‌ها و آیین‌ها را بفرستید. فقط عکس‌هایی که اجازه‌ی انتشارشان را دارید؛ برای عکس افراد، به‌ویژه کودکان، پیش از انتشار اجازه بگیرید." : "No photos yet. Send photos of the village, houses, orchards and traditions. Only photos you have permission to publish; ask before showing people, especially children."}</p>
        </div>
      ) : (
        <ul className="grid gap-4 list-none p-0" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
          {photos.map((p) => (
            <li key={p.file} className="item">
              <Image src={`/photos/${p.file}`} alt={p.alt[lang]} width={800} height={600} className="w-full h-auto rounded" />
              <p className="mt-2">{p.caption[lang]}</p>
              <p className="text-sm muted">{p.credit}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
