"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import type { NavGroup } from "@/lib/nav";
import { socialLinks } from "@/lib/social";
import { AccountControl } from "@/components/account-control";
import { Chevron, CloseIcon, MenuIcon, SocialIcon } from "@/components/icons";
import { LangSwitch } from "@/components/lang-switch";
import { LogoBlock } from "@/components/logo-block";

export type DrawerLabels = { menu: string; close: string; contribute: string; logo: string; social: string };

/** Full-height navigation drawer for < 1024px: accordion groups, 44px targets, focus trap, Escape, scroll lock. */
export function MobileDrawer({ lang, groups, labels }: { lang: Locale; groups: NavGroup[]; labels: DrawerLabels }) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<string | null>(null);
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => { setOpen(false); }, [pathname]);

  // Scroll lock, initial focus, return focus on close, close when the viewport becomes desktop
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("scroll-lock");
    closeBtn.current?.focus();
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => { if (mq.matches) setOpen(false); };
    mq.addEventListener("change", onMq);
    const btn = toggle.current;
    return () => {
      document.documentElement.classList.remove("scroll-lock");
      mq.removeEventListener("change", onMq);
      btn?.focus();
    };
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") { e.stopPropagation(); setOpen(false); return; }
    if (e.key !== "Tab") return;
    const f = Array.from(panel.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  return (
    <>
      <button ref={toggle} type="button" className="icon-btn menu-toggle" aria-label={labels.menu} aria-expanded={open} aria-controls="mobile-drawer" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <MenuIcon size={24} />
      </button>
      {open && (
        <div ref={panel} id="mobile-drawer" className="drawer" role="dialog" aria-modal="true" aria-label={labels.menu} onKeyDown={onKeyDown}>
          <div className="drawer__head">
            <LogoBlock lang={lang} flat label={labels.logo} />
            <button ref={closeBtn} type="button" className="icon-btn" aria-label={labels.close} onClick={() => setOpen(false)}>
              <CloseIcon size={24} />
            </button>
          </div>
          <nav className="drawer__body" aria-label={labels.menu}>
            {groups.map((g) => (
              <div key={g.id} className="drawer__group">
                <button type="button" className="drawer__trigger" aria-expanded={group === g.id} aria-controls={`drawer-${g.id}`} onClick={() => setGroup(group === g.id ? null : g.id)}>
                  {g.label}
                  <Chevron />
                </button>
                <ul id={`drawer-${g.id}`} className="drawer__list" hidden={group !== g.id}>
                  {g.items.map((i) => (
                    <li key={i.href}>
                      <Link href={i.href} aria-current={pathname === i.href ? "page" : undefined}>{i.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="drawer__foot">
            <Link href={`/${lang}/contribute`} className="btn btn--primary">{labels.contribute}</Link>
            <LangSwitch lang={lang} />
            <AccountControl lang={lang} className="ut-link" variant="drawer" />
            <span className="ut-bar__group" role="group" aria-label={labels.social}>
              {socialLinks.map((s) => (
                <a key={s.id} className="icon-btn" href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label[lang]}>
                  <SocialIcon id={s.id} size={20} />
                </a>
              ))}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
