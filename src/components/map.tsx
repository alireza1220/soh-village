import type { Locale } from "@/lib/i18n";
import { mapInfo } from "@/lib/site";

export function VillageMap({ lang }: { lang: Locale }) {
  return (
    <figure className="flex flex-col gap-2 m-0">
      <iframe
        title={lang === "fa" ? "نقشه‌ی سُه" : "Map of Soh"}
        src={mapInfo.osmEmbed}
        className="w-full rounded border"
        style={{ height: 340, borderColor: "var(--line)" }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <figcaption className="text-sm flex flex-wrap gap-x-4 gap-y-1">
        <a className="link" href={mapInfo.osm} target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
        <a className="link" href={mapInfo.google} target="_blank" rel="noopener noreferrer">{lang === "fa" ? "نقشه‌ی گوگل" : "Google Maps"}</a>
        <span className="muted">{mapInfo.note[lang]}</span>
      </figcaption>
    </figure>
  );
}
