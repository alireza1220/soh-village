"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/lib/nav";
import { Arrow, Chevron } from "@/components/icons";

/**
 * Desktop primary navigation with mega dropdowns (disclosure pattern).
 * Open: hover (mouse), click, Enter, Space, ArrowDown. Close: Escape (focus returns to the trigger),
 * focus leaving, click outside, route change. Only one open at a time.
 * Arrows: Up/Down/Home/End inside a panel; Left/Right between triggers (direction aware).
 */
export function NavMenu({ groups, label, dir }: { groups: NavGroup[]; label: string; dir: "rtl" | "ltr" }) {
  const [open, setOpen] = useState<string | null>(null);
  const pathname = usePathname() ?? "";
  const root = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pointer = useRef<string>("");

  const close = useCallback(() => setOpen(null), []);
  const triggers = () => Array.from(root.current?.querySelectorAll<HTMLButtonElement>("button.nav-trigger") ?? []);

  useEffect(() => { close(); }, [pathname, close]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) close(); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  const wantFocus = useRef(false);
  useEffect(() => {
    if (open && wantFocus.current) { wantFocus.current = false; document.querySelector<HTMLElement>(`#mega-${open} a`)?.focus(); }
  }, [open]);
  const focusFirst = () => { wantFocus.current = true; };
  const isCurrent = (g: NavGroup) => g.items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"));

  function onTriggerKey(e: React.KeyboardEvent<HTMLButtonElement>, g: NavGroup) {
    if (e.key === "ArrowDown") { e.preventDefault(); if (open === g.id) document.querySelector<HTMLElement>(`#mega-${g.id} a`)?.focus(); else { setOpen(g.id); focusFirst(); } }
    else if (e.key === "Escape") { close(); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const list = triggers();
      const i = list.indexOf(e.currentTarget);
      const forward = (e.key === "ArrowRight") === (dir === "ltr");
      const next = list[(i + (forward ? 1 : -1) + list.length) % list.length];
      next?.focus();
      if (open) setOpen(next?.dataset.group ?? null);
    }
  }

  function onPanelKey(e: React.KeyboardEvent<HTMLDivElement>, g: NavGroup) {
    const links = Array.from(e.currentTarget.querySelectorAll<HTMLAnchorElement>("a"));
    const i = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === "Escape") { e.preventDefault(); close(); document.getElementById(`trigger-${g.id}`)?.focus(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); links[(i + 1) % links.length]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); links[(i - 1 + links.length) % links.length]?.focus(); }
    else if (e.key === "Home") { e.preventDefault(); links[0]?.focus(); }
    else if (e.key === "End") { e.preventDefault(); links[links.length - 1]?.focus(); }
  }

  return (
    <nav ref={root} className="nav-primary" aria-label={label}>
      <ul>
        {groups.map((g) => (
          <li
            key={g.id}
            className="nav-item"
            onPointerEnter={(e) => { if (e.pointerType === "mouse") { clearTimeout(timer.current); setOpen(g.id); } }}
            onPointerLeave={(e) => { if (e.pointerType === "mouse") { clearTimeout(timer.current); timer.current = setTimeout(close, 140); } }}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen((o) => (o === g.id ? null : o)); }}
          >
            <button
              type="button" id={`trigger-${g.id}`} data-group={g.id} className="nav-trigger"
              aria-expanded={open === g.id} aria-controls={`mega-${g.id}`} data-current={isCurrent(g) ? "true" : undefined}
              onPointerDown={(e) => { pointer.current = e.pointerType; }}
              onClick={(e) => {
                const byMouse = e.detail > 0 && pointer.current === "mouse";
                setOpen((o) => (byMouse ? g.id : o === g.id ? null : g.id));
              }}
              onKeyDown={(e) => onTriggerKey(e, g)}
            >
              {g.label}
              <Chevron />
            </button>
            <div id={`mega-${g.id}`} role="group" aria-labelledby={`trigger-${g.id}`} className="mega" hidden={open !== g.id} onKeyDown={(e) => onPanelKey(e, g)}>
              <div>
                <p className="mega__title">{g.label}</p>
                <p className="mega__desc">{g.description}</p>
              </div>
              <ul className="mega__list">
                {g.items.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} aria-current={pathname === i.href ? "page" : undefined} onClick={close}>
                      <span>{i.label}</span>
                      <Arrow size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
}
