import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { photos } from "@/lib/photos";
import { Credit } from "./credit";
import "@/styles/misc.css";

// Page banner for the "other pages" (map, photos, credits, guide, contribute).
// Uses the shared .page-banner classes; the photo is looked up by file name so the credit label is always shown.
export function MsBanner({
  lang,
  title,
  intro,
  file,
  priority = true,
}: {
  lang: Locale;
  title: string;
  intro: string;
  file: string;
  priority?: boolean;
}) {
  const p = photos.find((x) => x.file === file) ?? photos[0];
  return (
    <header className="page-banner">
      <div className="page-banner__bg">
        <Image src={`/photos/${p.file}`} alt="" fill priority={priority} sizes="100vw" />
      </div>
      <div className="page-banner__credit">
        <Credit p={p} lang={lang} light />
      </div>
      <div className="wrap page-banner__inner">
        <nav aria-label={lang === "fa" ? "مسیر صفحه" : "Breadcrumb"}>
          <ol className="breadcrumb">
            <li><Link href={`/${lang}`}>{lang === "fa" ? "خانه" : "Home"}</Link></li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
        <h1>{title}</h1>
        <p className="page-banner__intro">{intro}</p>
      </div>
    </header>
  );
}
