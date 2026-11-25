import "@/styles/pages.css";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { photos, type Photo } from "@/lib/photos";
import { Breadcrumb, type Crumb } from "./breadcrumb";
import { illustrationSrc, type Illustration } from "@/lib/illustrations";
import { Credit } from "./credit";
import { IllustrationLabel } from "./illustration-label";

/** The banner photo of a section: its first photo, else the Karkas mountain photo (a region photo, labelled). */
export function bannerPhoto(section: string): Photo | undefined {
  return photos.find((p) => p.section === section) ?? photos.find((p) => p.file === "karkas-mountain.jpg");
}

// Inner-page banner: background photo under a deep-teal gradient (set in globals.css), breadcrumb, h1, intro, photo credit.
export function PageBanner({ lang, title, intro, crumbs, photo, illustration }: { lang: Locale; title: string; intro?: string; crumbs: Crumb[]; photo?: Photo; illustration?: Illustration }) {
  return (
    <header className="page-banner pg-banner">
      {!photo && illustration && (
        <>
          <div className="page-banner__bg">
            <Image src={illustrationSrc(illustration)} alt={illustration.alt[lang]} width={illustration.width} height={illustration.height} priority sizes="100vw" />
          </div>
          <div className="page-banner__credit"><IllustrationLabel lang={lang} /></div>
        </>
      )}
      {photo && (
        <>
          <div className="page-banner__bg">
            <Image src={`/photos/${photo.file}`} alt={photo.alt[lang]} fill priority sizes="100vw" />
          </div>
          <div className="page-banner__credit"><Credit p={photo} lang={lang} light /></div>
        </>
      )}
      <div className="wrap page-banner__inner pg-banner__inner">
        <Breadcrumb items={crumbs} lang={lang} />
        <h1>{title}</h1>
        {intro && <p className="page-banner__intro">{intro}</p>}
      </div>
    </header>
  );
}
