import type { Locale } from "@/lib/i18n";
import { mapInfo } from "@/lib/site";

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
    <figure className="flex flex-col gap-2 m-0">
      <div className="card overflow-hidden">
        <iframe
          title={title}
          src={src}
          className="block w-full border-0"
          style={{ height: tall ? 420 : 360 }}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
      <figcaption className="text-sm flex flex-col gap-1">
        <a className="link" href={href} target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
        {caption && <span className="muted">{caption}</span>}
      </figcaption>
    </figure>
  );
}

export function VillageMap({ lang }: { lang: Locale }) {
  return (
    <figure className="flex flex-col gap-2 m-0">
      <div className="card overflow-hidden">
        <iframe
          title={lang === "fa" ? "نقشه‌ی سُه" : "Map of Soh"}
          src={mapInfo.osmEmbed}
          className="block w-full border-0"
          style={{ height: 360 }}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
      <figcaption className="text-sm flex flex-wrap gap-x-4 gap-y-1">
        <a className="link" href={mapInfo.osm} target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
        <a className="link" href={mapInfo.google} target="_blank" rel="noopener noreferrer">{lang === "fa" ? "نقشه‌ی گوگل" : "Google Maps"}</a>
        <span className="muted">{mapInfo.note[lang]}</span>
      </figcaption>
    </figure>
  );
}
