import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MsBanner } from "@/components/ms-banner";
import { ReferenceBrowser } from "@/components/reference-browser";
import { MediaList } from "@/components/media-block";
import { hasLocale, locales } from "@/lib/i18n";
import { loadResearchLinks } from "@/lib/reference-list";
import { allMedia } from "@/lib/media";
import { youtubeSearched } from "@/lib/youtube";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/references">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: lang === "fa" ? "راهنما و منابع · روستای سُه" : "Guide and sources · Soh Village" };
}

const steps = [
  { fa: "راه رسیدن در بخش گردشگری است؛ نقشه صفحه‌ی خودش را دارد.", en: "The road is in Tourism; the map has its own page." },
  { fa: "هر مطلب منبع دارد. «گزارش‌شده»: دست‌کم یک منبع. «تأییدنشده»: منبع کم یا ناهمخوان. «از خانواده»: از خانواده‌ی گرداننده‌ی سایت.", en: "Every fact has a source. “Reported”: at least one. “Unverified”: thin or conflicting sources. “From family”: told by the site owner's family." },
  { fa: "«عکس منطقه، نه سُه» یعنی عکس از خود روستا نیست.", en: "“Region photo, not Soh” means not the village itself." },
  { fa: "آگهی را بدون حساب بفرستید. ورود، اگر فعال باشد، اختیاری است و فقط آگهی‌های خودتان را نشان می‌دهد.", en: "Post without an account. Login, if on, is optional and only shows your own listings." },
  { fa: "چیزی دارید؟ از مشارکت بفرستید؛ پیش از انتشار بررسی می‌شود.", en: "Something to add? Send it via Contribute; it is checked first." },
];

export default async function ReferencesPage({ params }: PageProps<"/[lang]/references">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const groups = loadResearchLinks();
  const media = allMedia(lang);
  const fa = lang === "fa";
  const sec = (id: string, eyebrow: string, title: string, text: string, body: React.ReactNode) => (
    <section className="ms-block" aria-labelledby={id}>
      <div className="ms-head">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
        <p>{text}</p>
      </div>
      {body}
    </section>
  );
  return (
    <article className="ms-page">
      <MsBanner
        lang={lang}
        file="opening.jpg"
        title={fa ? "راهنما و منابع" : "Guide and sources"}
        intro={fa ? "روش خواندن سایت، و همه‌ی پیوندهای تحقیق." : "How to read this site, and every research link."}
      />
      <div className="wrap ms-body">
        <section className="ms-block" aria-labelledby="how">
          <div className="ms-head">
            <p className="eyebrow">{fa ? "شروع" : "Start here"}</p>
            <h2 id="how">{fa ? "چطور از سایت استفاده کنید" : "How to use the site"}</h2>
          </div>
          <ol className="ms-how">
            {steps.map((s) => <li key={s.en}>{s[lang]}</li>)}
          </ol>
        </section>
        {sec(
          "youtube", fa ? "ویدیو" : "Video", fa ? "یوتیوب" : "YouTube",
          fa
            ? `جستجو در ${youtubeSearched.fa}. فقط فیلم‌های همین سُهِ میمه. SohiranTube همنام صفحه‌ی فیسبوک روستاست. شرح‌ها از روی عنوان است.`
            : `Searched ${youtubeSearched.en}. Only this Soh, near Meymeh. SohiranTube shares the village Facebook page's name. Notes follow titles.`,
          <MediaList items={media.filter((m) => m.platform === "youtube")} lang={lang} />,
        )}
        {sec(
          "facebook", fa ? "شبکه‌های اجتماعی" : "Social", fa ? "فیسبوک" : "Facebook",
          fa
            ? "صفحه‌ی «روستای تاریخی سُه» و ویدیوهای عنوان‌دار. شرح‌ها از روی عنوان است."
            : "The “historic village of Soh” page and its titled videos. Notes follow titles.",
          <MediaList items={media.filter((m) => m.platform === "facebook")} lang={lang} />,
        )}
        {sec(
          "instagram", fa ? "شبکه‌های اجتماعی" : "Social", fa ? "اینستاگرام" : "Instagram",
          fa
            ? "پست‌ها و ریل‌های \u2066@soh_village\u2069 درباره‌ی همین روستا. تصویر بازسازی‌شده یا ساخته‌ی هوش مصنوعی عکس تاریخی حساب نشده."
            : "Posts and reels from @soh_village about this village. Reconstructed or AI images are not treated as historical photos.",
          <MediaList items={media.filter((m) => m.platform === "instagram")} lang={lang} />,
        )}
        <section className="ms-block" aria-labelledby="links-all">
          <div className="ms-head">
            <p className="eyebrow">{fa ? "همه‌ی پیوندها" : "Every link"}</p>
            <h2 id="links-all">{fa ? "پیوندهای تحقیق" : "Research links"}</h2>
          </div>
          <ReferenceBrowser groups={groups} lang={lang} />
        </section>
      </div>
    </article>
  );
}
