import { readFileSync } from "node:fs";
import path from "node:path";
import type { L } from "./i18n";
import { commentFor } from "./reference-comments";

export type RefItem = { url: string; status: string; note: string; comment: L };
export type RefGroup = { id: string; title: L; items: RefItem[] };

const URL_RE = /https?:\/\/[^\s|<>)\]]+/g;
const STATUSES = new Set(["200", "404", "403", "blocked", "not checked", "not reached", "no dns", "snippet read", "not used", "listed", "200 (chrome)"]);

function isStatus(value: string) {
  return STATUSES.has(value.trim().toLowerCase());
}

const TITLES: Record<string, L> = {
  "1. About Soh itself": { fa: "درباره‌ی خود سُه", en: "About Soh itself" },
  "2. Soh caravanserai, heritage and Siroux": { fa: "کاروانسرا، میراث و سیرو", en: "Caravanserai, heritage and Siroux" },
  "3. Muharram and traditions": { fa: "محرم و آیین‌ها", en: "Muharram and traditions" },
  "4. Dialect and language": { fa: "گویش و زبان", en: "Dialect and language" },
  "5. Neighbouring places and region": { fa: "جاهای همسایه و منطقه", en: "Neighbouring places and the region" },
  "6. Videos (none of Soh itself)": { fa: "ویدیوهای آپارات که سُه نیستند", en: "Aparat clips that are not Soh" },
  "7. Photos": { fa: "عکس‌ها، در فهرست اصلی", en: "Photos, in the master list" },
  "8. Practical: stay, shops, banks, property, law": { fa: "اقامت، خرید، بانک، ملک و قانون", en: "Stay, shops, banks, property and law" },
  "9. People and memorials": { fa: "افراد و یادبودها", en: "People and memorials" },
  "10. Came up in searches but are about other places or are unrelated": { fa: "پیدا شد، ولی درباره‌ی جای دیگر است", en: "Found in search, but about somewhere else" },
  "11. Second pass, 24 Nov 2026": { fa: "جستجوی دوباره، ۳ آذر ۱۴۰۵", en: "Second pass, 24 Nov 2026" },
  'A. On the site (free licence, labelled "Region photo, not Soh")': { fa: "عکس‌های آزادِ روی سایت (منطقه، نه سُه)", en: "Free-licence photos on the site (the region, not Soh)" },
  "B. Free-licence photos of the area (not used)": { fa: "عکس‌های آزاد منطقه که در سایت نیست", en: "Free-licence area photos not used on the site" },
  "C. Possibly Soh, identity uncertain (not used)": { fa: "شاید سُه باشد؛ هویت نامعلوم", en: "Possibly Soh; identity uncertain" },
  "D. Real photos of Soh, protected by copyright (links only)": { fa: "عکس‌های واقعی سُه؛ حق نشر دارند و فقط پیوندند", en: "Real photos of Soh, protected by copyright (links only)" },
  "Checked, nothing of Soh": { fa: "بررسی شد؛ چیزی از سُه نبود", en: "Checked, nothing of Soh" },
};

function cleanUrl(url: string) {
  return url.replace(/[.,;]+$/g, "");
}

function headingOf(part: string) {
  const nl = part.indexOf("\n");
  return { title: (nl === -1 ? part : part.slice(0, nl)).trim(), body: nl === -1 ? "" : part.slice(nl + 1) };
}

function cellsOf(line: string) {
  return line.trim().split("|").map((c) => c.trim()).filter(Boolean);
}

function noteFrom(line: string, urls: string[]) {
  const trimmed = line.trim();
  if (trimmed.startsWith("|")) {
    const cells = cellsOf(trimmed);
    if (!cells.length || cells[0] === "Status" || cells[0] === "File" || cells[0] === "What" || /^-+$/.test(cells[0] ?? "")) return null;
    if (isStatus(cells[0] ?? "")) return cells.slice(2).join(" · ") || cells.slice(1).join(" · ");
    if ((cells[0] ?? "").startsWith("http")) return cells.slice(1).join(" · ");
    return cells.filter((c) => !c.startsWith("http")).join(" · ") || cells[0] || "";
  }
  let text = trimmed.replace(/^[-*]\s*/, "");
  for (const url of urls) text = text.replace(url, "");
  return text.replace(/\s+/g, " ").replace(/^[,;:\-–—()\s]+|[,;:\-–—()\s]+$/g, "").trim();
}

function statusFrom(line: string) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return "listed";
  const cells = cellsOf(trimmed);
  if (isStatus(cells[0] ?? "")) return cells[0] ?? "";
  return "";
}

function groupsFrom(file: string): RefGroup[] {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  const parts = text.split(/^## /m).slice(1);
  const groups: RefGroup[] = [];
  for (const part of parts) {
    const { title, body } = headingOf(part);
    const items: RefItem[] = [];
    const seen = new Set<string>();
    for (const line of body.split("\n")) {
      const urls = [...line.matchAll(URL_RE)].map((m) => cleanUrl(m[0]));
      if (!urls.length) continue;
      const note = noteFrom(line, urls);
      if (note === null) continue;
      const status = statusFrom(line);
      for (const url of urls) {
        const key = `${url}\n${note}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({ url, status, note, comment: commentFor(note) });
      }
    }
    if (!items.length) continue;
    groups.push({
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      title: TITLES[title] ?? { fa: title, en: title },
      items,
    });
  }
  return groups;
}

/** Every URL kept in the research notes, in the order the notes list them. */
export function loadResearchLinks(): RefGroup[] {
  return [...groupsFrom("research/all-links.md"), ...groupsFrom("research/photo-links.md")];
}
