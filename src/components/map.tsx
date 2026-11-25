import type { Locale } from "@/lib/i18n";
import { mapInfo } from "@/lib/site";
import "@/styles/misc.css";

// Map in a framed dark panel: the OpenStreetMap embed, then a caption bar with the links and the honest note.
export function MapFrame({
  lang,
  title,
  src,
  href,
  caption,
  tall = false,
}: {
  lang: Locale;
  title: string;
  src: string;
  href: string;
  caption?: string;
  tall?: boolean;
}) {
  return (
    <figure className={`ms-frame${tall ? " ms-frame--tall" : ""}`}>
      <div className="ms-frame__map">
        <iframe title={title} src={src} loading="lazy" referrerPolicy="no-referrer" />
      </div>
      <figcaption className="ms-frame__cap">
        <a href={href} target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
        {caption && <span className="ms-frame__note">{caption}</span>}
      </figcaption>
    </figure>
  );
}

export function VillageMap({ lang }: { lang: Locale }) {
  return (
    <figure className="ms-frame">
      <div className="ms-frame__map">
        <iframe
          title={lang === "fa" ? "نقشه‌ی سُه" : "Map of Soh"}
          src={mapInfo.osmEmbed}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
      <figcaption className="ms-frame__cap">
        <a href={mapInfo.osm} target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
        <a href={mapInfo.google} target="_blank" rel="noopener noreferrer">{lang === "fa" ? "نقشه‌ی گوگل" : "Google Maps"}</a>
        <span className="ms-frame__note">{mapInfo.note[lang]}</span>
      </figcaption>
    </figure>
  );
}
