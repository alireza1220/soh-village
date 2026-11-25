import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MsBanner } from "@/components/ms-banner";
import { ReferenceBrowser } from "@/components/reference-browser";
import { SocialList } from "@/components/social-embeds";
import { YoutubeList } from "@/components/youtube-list";
import { hasLocale, locales } from "@/lib/i18n";
import { loadResearchLinks } from "@/lib/reference-list";
import { socialPosts } from "@/lib/social-embeds";
import { youtubeSearched, youtubeVideos } from "@/lib/youtube";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/references">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: lang === "fa" ? "راهنما و منابع · روستای سُه" : "Guide and sources · Soh Village" };
}

const steps = [
  { fa: "از صفحه‌ی اول، «کجاست» یا «چطور بروید» را باز کنید. راه رسیدن در بخش گردشگری است و نقشه صفحه‌ی خودش را دارد.", en: "From the home page, open “Where” or “How to get there”. The road is in Tourism, and the map has its own page." },
  { fa: "هر مطلب یک منبع دارد. برچسب «گزارش‌شده» یعنی دست‌کم یک منبع آن را نوشته، «تأییدنشده» یعنی منبع کم است یا منبع‌ها با هم نمی‌خوانند، و «از خانواده» یعنی از خانواده‌ی گرداننده‌ی سایت شنیده شده.", en: "Every fact has a source. “Reported” means at least one source says it, “unverified” means the source is thin or the sources disagree, and “from family” means the family running the site said it." },
  { fa: "عکس‌هایی که برچسب «عکس منطقه، نه سُه» دارند از خود روستا نیستند.", en: "Photos labelled “Region photo, not Soh” are not pictures of the village." },
  { fa: "آگهی بازارچه، نیازمندی و کار را می‌توانید بدون حساب بفرستید. اگر ورود فعال باشد، اختیاری است و فقط آگهی‌های خودتان را یک‌جا نشان می‌دهد. خروج در صفحه‌ی آگهی‌های من و صفحه‌ی ورود است.", en: "You can send a market, request or job post without an account. If login is switched on, it is optional and only gathers your own listings. Sign out is on My listings and on the login page." },
  { fa: "چیزی برای اضافه کردن دارید؟ از مشارکت بفرستید. پیش از انتشار بررسی می‌شود.", en: "Have something to add? Send it from Contribute. It is checked before it is published." },
];

export default async function ReferencesPage({ params }: PageProps<"/[lang]/references">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const groups = loadResearchLinks();
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
        intro={fa ? "بالا، روش خواندن این سایت است. پایین، همه‌ی پیوندهایی است که هنگام تحقیق پیدا شده، از جمله صفحه‌هایی که درباره‌ی سُه نیستند یا دیگر باز نمی‌شوند." : "The top is how to read this site. Below is every link found while researching, including pages that are not about Soh or that no longer open."}
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
            ? `جستجو در ${youtubeSearched.fa} برای «روستای سُه»، «گویش سُهی» و «نخل سُه». فقط فیلم‌هایی این‌جا آمده که عنوان یا کانالشان همین سُهِ میمه است. کانال SohiranTube همان نام صفحه‌ی فیسبوک روستاست. فیلم‌ها کامل دیده نشده‌اند، پس شرح هر کدام از روی عنوان است. ویدیوهای ابیانه، میمه، مورچه‌خورت و روستاهای دیگر را نیاورده‌ایم.`
            : `Searched on ${youtubeSearched.en} for “Soh village”, “Sohi dialect” and “Soh nakhl”. Only films whose title or channel is this Soh, near Meymeh, are here. SohiranTube uses the same name as the village Facebook page. The films have not been watched through, so each note follows the title. Videos of Abyaneh, Meymeh, Murcheh Khvort and other villages are left out.`,
          <YoutubeList videos={youtubeVideos} lang={lang} />,
        )}
        {sec(
          "facebook", fa ? "شبکه‌های اجتماعی" : "Social", fa ? "فیسبوک" : "Facebook",
          fa
            ? "صفحه‌ی «روستای تاریخی سُه» و ویدیوهایی که عنوان دارند. ویدیوهای بدون عنوان را نیاورده‌ایم. شرح‌ها از روی عنوان صفحه است."
            : "The “historic village of Soh” page, and the videos that have a title. Videos with no title are left out. The notes follow the page title.",
          <SocialList posts={socialPosts.filter((p) => p.platform === "facebook")} lang={lang} />,
        )}
        {sec(
          "instagram", fa ? "شبکه‌های اجتماعی" : "Social", fa ? "اینستاگرام" : "Instagram",
          fa
            ? "پست‌ها و ریل‌های \u2066@soh_village\u2069 که عنوانشان همین روستاست. اگر خود عنوان بگوید تصویر بازسازی یا ساخته‌ی هوش مصنوعی است، همان را نوشته‌ایم و آن را عکس تاریخی حساب نکرده‌ایم."
            : "Posts and reels from @soh_village whose caption is about this village. Where the caption itself says the picture is a reconstruction or made with AI, that is stated, and it is not treated as a historical photograph.",
          <SocialList posts={socialPosts.filter((p) => p.platform === "instagram")} lang={lang} />,
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
