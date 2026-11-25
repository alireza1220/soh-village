import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { resolveNav, ui } from "@/lib/nav";
import { socialLinks } from "@/lib/social";
import { AuthLink } from "@/components/auth-link";
import { SocialIcon } from "@/components/icons";
import { LogoBlock } from "@/components/logo-block";

/** Dark footer: emblem, description, social icons, four columns mirroring the nav groups, bottom bar. */
export function SiteFooter({ lang }: { lang: Locale }) {
  const groups = resolveNav(lang);
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__top">
        <div className="site-footer__brand">
          <LogoBlock lang={lang} flat label={ui.logo[lang]} />
          <p>{ui.footerAbout[lang]}</p>
          <div className="site-footer__social" role="group" aria-label={ui.social[lang]}>
            {socialLinks.map((s) => (
              <a key={s.id} className="icon-btn" href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label[lang]}>
                <SocialIcon id={s.id} size={20} />
              </a>
            ))}
          </div>
        </div>
        <nav className="site-footer__cols" aria-label={ui.footerNav[lang]}>
          {groups.map((g) => (
            <div key={g.id}>
              <h2 className="site-footer__heading">{g.label}</h2>
              <ul className="site-footer__links">
                {g.items.map((i) => <li key={i.href}><Link href={i.href}>{i.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="site-footer__bottom">
        <div className="wrap site-footer__bottom-inner">
          <p>{ui.draft[lang]}</p>
          <ul>
            <li><Link href={`/${lang}/credits`}>{ui.credits[lang]}</Link></li>
            <li><Link href={`/${lang}/contribute`}>{ui.contribute[lang]}</Link></li>
            <li><AuthLink lang={lang} className="" /></li>
            <li><Link href={`/${lang}/manage`}>{ui.manage[lang]}</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
