import type { SVGProps } from "react";

// Small inline SVG icons. All are decorative by default (aria-hidden); put the accessible name on the
// button or link that contains them. Arrow and end-pointing chevrons mirror in RTL through globals.css
// ([dir="rtl"] .icon-arrow, .icon-chevron-end).
export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, className, children, ...rest }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter"
      aria-hidden="true" focusable="false" className={`icon ${className ?? ""}`.trim()} {...rest}
    >
      {children}
    </svg>
  );
}
function Filled({ size = 20, className, children, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={`icon ${className ?? ""}`.trim()} {...rest}>
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></Svg>
);
/** Points down; flips up when its button has aria-expanded="true". */
export const Chevron = ({ className, ...p }: IconProps) => (
  <Svg size={14} strokeWidth={2.5} className={`icon-chevron ${className ?? ""}`.trim()} {...p}><path d="m5 9 7 7 7-7" /></Svg>
);
/** Points in the reading direction (right in LTR, left in RTL). */
export const ChevronEnd = ({ className, ...p }: IconProps) => (
  <Svg size={14} strokeWidth={2.5} className={`icon-chevron-end ${className ?? ""}`.trim()} {...p}><path d="m9 5 7 7-7 7" /></Svg>
);
/** Points in the reading direction (right in LTR, left in RTL). */
export const Arrow = ({ className, ...p }: IconProps) => (
  <Svg size={16} className={`icon-arrow ${className ?? ""}`.trim()} {...p}><path d="M4 12h15M13 6l6 6-6 6" /></Svg>
);
export const PauseIcon = (p: IconProps) => (
  <Filled {...p}><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></Filled>
);
export const PlayIcon = (p: IconProps) => (
  <Filled {...p}><path d="M7 4.5v15l13-7.5z" /></Filled>
);
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 5l14 14M19 5 5 19" /></Svg>
);
export const MenuIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3 6h18M3 12h18M3 18h18" /></Svg>
);
export const FacebookIcon = (p: IconProps) => (
  <Filled {...p}><path d="M13.5 21v-8h2.7l.5-3.3h-3.2V7.6c0-.9.4-1.7 1.8-1.7h1.5V3.1S15.1 3 13.9 3C11.4 3 9.9 4.5 9.9 7.2v2.5H7.2V13h2.7v8z" /></Filled>
);
export const InstagramIcon = (p: IconProps) => (
  <Svg strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
  </Svg>
);
export const TelegramIcon = (p: IconProps) => (
  <Filled {...p}><path d="M21.4 4.1 2.9 11.2c-1 .4-1 1.3-.2 1.6l4.7 1.5 1.8 5.6c.2.6.9.8 1.4.3l2.6-2.4 4.8 3.6c.8.5 1.6.2 1.8-.8l3-14.8c.3-1.1-.4-1.9-1.4-1.7zM8.7 13.6l9.6-6c.4-.3.8-.1.5.2l-7.9 7.3-.3 3.3z" /></Filled>
);

/** Social icon by id (see src/lib/social.ts). */
export function SocialIcon({ id, ...p }: IconProps & { id: string }) {
  if (id === "facebook") return <FacebookIcon {...p} />;
  if (id === "instagram") return <InstagramIcon {...p} />;
  return <TelegramIcon {...p} />;
}
