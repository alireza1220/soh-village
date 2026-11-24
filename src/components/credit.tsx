import type { Locale } from "@/lib/i18n";
import type { Photo } from "@/lib/photos";

// Attribution line shown with every photo: author, licence (linked), source (linked).
export function Credit({ p, lang, light }: { p: Photo; lang: Locale; light?: boolean }) {
  const cls = light ? "text-white/90" : "muted";
  return (
    <span className={`photo-credit ${cls}`}>
      {p.scope === "region" && <b>{lang === "fa" ? "عکس منطقه، نه سُه · " : "Region photo, not Soh · "}</b>}
      © {p.credit} ·{" "}
      {p.licenseUrl ? <a className="underline" href={p.licenseUrl} target="_blank" rel="noopener noreferrer">{p.license}</a> : p.license}
      {p.sourceUrl && <> · <a className="underline" href={p.sourceUrl} target="_blank" rel="noopener noreferrer">Wikimedia Commons</a></>}
    </span>
  );
}
