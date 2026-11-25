import "@/styles/pages.css";
import type { Locale } from "@/lib/i18n";
import type { Photo } from "@/lib/photos";

// The two credit values on the supplied photo are English in photos.ts; Persian pages show these Persian forms.
const FA: Record<string, string> = {
  "Supplied for this site": "تهیه‌شده برای این سایت",
  "Used with permission": "با اجازه",
};

// Attribution line shown with every photo: author, licence (linked), source (linked).
// Region photos always carry the "Region photo, not Soh" label (outside the isolated credit text).
// light = white text for use on dark photos or panels.
export function Credit({ p, lang, light }: { p: Photo; lang: Locale; light?: boolean }) {
  const fa = lang === "fa";
  const credit = fa ? FA[p.credit] ?? p.credit : p.credit;
  const license = fa ? FA[p.license] ?? p.license : p.license;
  // Persian wording flows right to left; names, licence codes and URLs stay left to right.
  const translated = fa && (credit !== p.credit || license !== p.license);
  const textDir = translated ? "rtl" : "ltr";
  const part = translated ? "rtl" : "ltr";
  return (
    <span className={`photo-credit pg-credit ${light ? "pg-credit--light" : "muted"}`}>
      {p.scope === "region" && <b className="pg-credit__region">{fa ? "عکس منطقه، نه سُه" : "Region photo, not Soh"}</b>}
      <span className="pg-credit__text" dir={textDir}>
        <bdi dir={part}>© {credit}</bdi>
        {" · "}
        {p.licenseUrl ? (
          <a className="underline underline-offset-2 pg-credit__nb" href={p.licenseUrl} target="_blank" rel="noopener noreferrer"><bdi dir={part}>{license}</bdi></a>
        ) : (
          <bdi dir={part} className="pg-credit__nb">{license}</bdi>
        )}
        {p.sourceUrl && (
          <>
            {" · "}
            <a className="underline underline-offset-2 pg-credit__nb" href={p.sourceUrl} target="_blank" rel="noopener noreferrer"><bdi dir="ltr">Wikimedia Commons</bdi></a>
          </>
        )}
      </span>
    </span>
  );
}
