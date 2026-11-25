import Link from "next/link";
import { dirOf, type Locale } from "@/lib/i18n";
import { resolveNav, ui } from "@/lib/nav";
import { socialLinks } from "@/lib/social";
import { siteName } from "@/lib/site";
import { AuthLink } from "@/components/auth-link";
import { SocialIcon } from "@/components/icons";
import { LangSwitch } from "@/components/lang-switch";
import { LogoBlock } from "@/components/logo-block";
import { MobileDrawer } from "@/components/mobile-drawer";
import { NavMenu } from "@/components/nav-menu";
import { SiteSearch } from "@/components/site-search";

/** Utility bar + header. Server component; interactive parts are client components. */
export function SiteHeader({ lang }: { lang: Locale }) {
  const groups = resolveNav(lang);
  return (
    <>
      <div className="ut-bar">
        <div className="wrap ut-bar__inner">
          <div className="ut-bar__group"><LangSwitch lang={lang} /></div>
          <div className="ut-bar__group">
            <span className="ut-bar__group" role="group" aria-label={ui.social[lang]}>
              {socialLinks.map((s) => (
                <a key={s.id} className="icon-btn" href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label[lang]}>
                  <SocialIcon id={s.id} size={18} />
                </a>
              ))}
            </span>
            <AuthLink lang={lang} className="ut-link" />
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="wrap site-header__inner">
          <LogoBlock lang={lang} label={ui.logo[lang]} />
          <Link href={`/${lang}`} className="site-title">{siteName[lang]}</Link>
          <NavMenu groups={groups} label={ui.mainNav[lang]} dir={dirOf(lang)} />
          <div className="site-header__actions">
            <SiteSearch lang={lang} />
            <Link href={`/${lang}/contribute`} className="btn btn--primary hidden sm:inline-flex">{ui.contribute[lang]}</Link>
            <MobileDrawer
              lang={lang}
              groups={groups}
              labels={{ menu: ui.menu[lang], close: ui.closeMenu[lang], contribute: ui.contribute[lang], logo: ui.logo[lang], social: ui.social[lang] }}
            />
          </div>
        </div>
      </header>
    </>
  );
}
