import type { L, Locale } from "./i18n";
import { sectionTitle as ytSectionTitle, youtubeVideos } from "./youtube";
import { socialPosts, socialSectionTitle } from "./social-embeds";
import type { Block } from "./site";

import type { MediaItem } from "./media-types";
export { platformName, type MediaItem } from "./media-types";

export function allMedia(lang: Locale): MediaItem[] {
  const videos: MediaItem[] = youtubeVideos.map((v) => ({
    id: v.id, kind: "video", platform: "youtube", title: v.title[lang], source: v.channel, note: v.note[lang],
    href: `https://www.youtube.com/watch?v=${v.id}`, sections: v.sections,
  }));
  const posts: MediaItem[] = socialPosts.map((p) => ({
    id: p.id, kind: "post", platform: p.platform, title: p.title[lang], source: p.account, note: p.note[lang],
    href: p.href, embed: p.embed, width: p.width, height: p.height, tall: p.tall, sections: p.sections,
  }));
  return [...videos, ...posts];
}

const norm = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "").toLowerCase();

/** Items whose original address is written in one of this section's own link lists. */
export function linkedInBlocks(blocks: Block[]): Set<string> {
  const urls = new Set<string>();
  for (const b of blocks) if (b.t === "links") for (const i of b.items) urls.add(norm(i.url));
  return urls;
}

/** Videos first, then posts. Items that belong first to this section come before shared ones. */
export function mediaFor(section: string, lang: Locale, blocks: Block[] = []): MediaItem[] {
  const linked = linkedInBlocks(blocks);
  const own = allMedia(lang).filter((m) => m.sections.includes(section) || linked.has(norm(m.href)));
  const rank = (m: MediaItem) => (m.sections[0] === section ? 0 : 1);
  const byKind = (k: MediaItem["kind"]) => own.filter((m) => m.kind === k).sort((a, b) => rank(a) - rank(b));
  return [...byKind("video"), ...byKind("post")];
}

/** Link-list items that are now shown as a preview on the same page (so they are not listed twice). */
export function withoutPreviewed(blocks: Block[], shown: MediaItem[]): Block[] {
  const gone = new Set(shown.map((m) => norm(m.href)));
  return blocks.map((b) => (b.t === "links" ? { ...b, items: b.items.filter((i) => !gone.has(norm(i.url))) } : b)).filter((b) => b.t !== "links" || b.items.length > 0);
}

export function mediaSectionTitle(slug: string): L {
  const a = ytSectionTitle(slug);
  return a.fa === slug ? socialSectionTitle(slug) : a;
}
