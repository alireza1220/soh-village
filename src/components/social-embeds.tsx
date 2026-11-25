import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import "@/styles/misc.css";
import { socialFor, socialSectionTitle, type SocialPost } from "@/lib/social-embeds";

export function SocialList({ posts, lang }: { posts: SocialPost[]; lang: Locale }) {
  return (
    <ul className="ms-embeds">
      {posts.map((p) => {
        const fb = p.platform === "facebook";
        return (
          <li key={p.id} id={p.id} className="ms-embed">
            <div className="ms-embed__body" style={{ borderBlockStart: 0 }}>
              <h3>{p.title[lang]}</h3>
              <p className="ms-sub">{p.account}</p>
              <p>{p.note[lang]}</p>
              <p className="ms-embed__links">
                {p.sections.map((slug) => (
                  <Link key={slug} href={`/${lang}/${slug}`}>{socialSectionTitle(slug)[lang]}</Link>
                ))}
                <a href={p.href} target="_blank" rel="noopener noreferrer">{fb ? "Facebook" : "Instagram"}</a>
              </p>
            </div>
            <div className="ms-embed__scroll" style={{ borderBlockStart: "3px solid var(--turq)" }}>
              <iframe
                src={p.embed}
                title={p.title[lang]}
                width={p.width}
                height={p.height}
                loading={fb ? "eager" : "lazy"}
                scrolling={fb ? "no" : undefined}
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                referrerPolicy={fb ? undefined : "strict-origin-when-cross-origin"}
                allowFullScreen
                className={fb ? "ms-embed__frame" : "ms-embed__frame ms-embed__frame--fluid"}
                style={p.width && p.height ? { width: p.width, height: p.height } : { height: p.tall ? 640 : 460 }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function SocialForSection({ section, lang }: { section: string; lang: Locale }) {
  const posts = socialFor(section);
  if (posts.length === 0) return null;
  return (
    <section className="ms-block" aria-labelledby={`social-${section}`}>
      <div className="ms-head"><h2 id={`social-${section}`}>{lang === "fa" ? "فیسبوک و اینستاگرام" : "Facebook and Instagram"}</h2></div>
      <ul className="ms-list">
        {posts.map((p) => (
          <li key={p.id}>
            <Link className="link" href={`/${lang}/references#${p.id}`}>{p.title[lang]}</Link>
            <span className="ms-sub"> · {p.account}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
