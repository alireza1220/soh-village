import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { socialFor, socialSectionTitle, type SocialPost } from "@/lib/social-embeds";

export function SocialList({ posts, lang }: { posts: SocialPost[]; lang: Locale }) {
  return (
    <ul className="flex flex-col gap-8 list-none p-0 m-0">
      {posts.map((p) => (
        <li key={p.id} id={p.id} className="card overflow-hidden scroll-mt-24">
          <div className="p-4 flex flex-col gap-2">
            <h3 className="text-xl">{p.title[lang]}</h3>
            <p className="text-sm muted">{p.account}</p>
            <p className="text-sm">{p.note[lang]}</p>
            <p className="text-sm flex flex-wrap gap-x-4 gap-y-1">
              {p.sections.map((slug) => (
                <Link key={slug} className="link" href={`/${lang}/${slug}`}>{socialSectionTitle(slug)[lang]}</Link>
              ))}
              <a className="link" href={p.href} target="_blank" rel="noopener noreferrer">{p.platform === "facebook" ? "Facebook" : "Instagram"}</a>
            </p>
          </div>
          <iframe
            src={p.embed}
            title={p.title[lang]}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="block w-full border-0 bg-white"
            style={{ height: p.tall ? 640 : 460 }}
          />
        </li>
      ))}
    </ul>
  );
}

export function SocialForSection({ section, lang }: { section: string; lang: Locale }) {
  const posts = socialFor(section);
  if (posts.length === 0) return null;
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`social-${section}`}>
      <h2 id={`social-${section}`} className="text-2xl">{lang === "fa" ? "فیسبوک و اینستاگرام" : "Facebook and Instagram"}</h2>
      <ul className="flex flex-col gap-2 list-none p-0 m-0">
        {posts.map((p) => (
          <li key={p.id}>
            <Link className="link font-semibold" href={`/${lang}/references#${p.id}`}>{p.title[lang]}</Link>
            <span className="text-sm muted"> · {p.account}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
