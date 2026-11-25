import type { ReactNode, SVGProps } from "react";

// Rounded, friendly line icons for the market (own set: the shared icons are square-cut). Decorative; the button names them.
type P = SVGProps<SVGSVGElement> & { size?: number };
function I({ size = 20, children, className, ...r }: P & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={`mkb-i ${className ?? ""}`.trim()} {...r}>
      {children}
    </svg>
  );
}

const cat: Record<string, ReactNode> = {
  fruit: <><path d="M12 8c-2-1.6-6-1.4-7.2 2.2-1.2 3.6 1 9.8 4.2 9.8 1.2 0 1.8-.6 3-.6s1.8.6 3 .6c3.2 0 5.4-6.2 4.2-9.8C17.8 6.6 14 6.4 12 8z" /><path d="M12 8c0-2 .8-3.6 2.6-4.4" /></>,
  nuts: <><path d="M12 3c4.4 0 7.5 3.4 7.5 7.6 0 5-3.4 9.4-7.5 10.4-4.1-1-7.5-5.4-7.5-10.4C4.5 6.4 7.6 3 12 3z" /><path d="M12 3v18M8.2 8.2c1.4 1 2.4 2.6 3.8 2.6s2.4-1.6 3.8-2.6" /></>,
  bread: <><path d="M5 10.5C3.6 9.6 3.4 7 5.4 5.8c2-1.2 3.6-1.6 6.6-1.6s4.6.4 6.6 1.6c2 1.2 1.8 3.8.4 4.7V18a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 18z" /><path d="M9 8.5l1.2 2M13 8.5l1.2 2" /></>,
  dairy: <><path d="M9 3h6M10 3v3.2L7.5 9.6c-.4.6-.5 1.2-.5 1.8V19a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-7.6c0-.6-.1-1.2-.5-1.8L14 6.2V3" /><path d="M7 12.5h10" /></>,
  crafts: <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M12 7.8l3.6 4.2-3.6 4.2L8.4 12z" /><path d="M4 9h2M18 9h2M4 15h2M18 15h2" /></>,
  garden: <><path d="M12 21v-9" /><path d="M12 12c0-4 2.6-6.6 7-6.8.1 4.4-2.4 7-7 6.8z" /><path d="M12 15c0-3-2-5-5.5-5.2-.1 3.4 1.8 5.4 5.5 5.2z" /></>,
  labour: <><path d="M12 21V8" /><path d="M12 8c-2.6-.4-3.8-2-3.8-4.2 2.4.2 3.8 1.6 3.8 4.2zM12 8c2.6-.4 3.8-2 3.8-4.2-2.4.2-3.8 1.6-3.8 4.2zM12 13.5c-2.6-.4-3.8-2-3.8-4.2 2.4.2 3.8 1.6 3.8 4.2zM12 13.5c2.6-.4 3.8-2 3.8-4.2-2.4.2-3.8 1.6-3.8 4.2z" /></>,
  building: <><path d="M14.5 6.5l3 3M13 8l-8.2 8.2a2 2 0 0 0 2.8 2.8L15.8 10.8" /><path d="M13.6 4.4l1.4-1.4 5 5-1.4 1.4a2 2 0 0 1-2.8 0l-2.2-2.2a2 2 0 0 1 0-2.8z" /></>,
  driving: <><path d="M3 6.5h11V16H3zM14 9.5h3.6l3.4 3.4V16h-7" /><circle cx="7.5" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  farm: <><path d="M12 21v-9" /><path d="M12 12c0-4 2.6-6.6 7-6.8.1 4.4-2.4 7-7 6.8z" /><path d="M12 15c0-3-2-5-5.5-5.2-.1 3.4 1.8 5.4 5.5 5.2z" /></>,
  craft: <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M12 7.8l3.6 4.2-3.6 4.2L8.4 12z" /><path d="M4 9h2M18 9h2M4 15h2M18 15h2" /></>,
  tourism: <><path d="M12 21s-6.5-5.6-6.5-10.8a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" /><circle cx="12" cy="10" r="2.4" /></>,
  remote: <><rect x="3.5" y="5" width="17" height="11" rx="2" /><path d="M8.5 20h7M12 16v4" /></>,
  stay: <><path d="M3.5 18.5V8M3.5 14h17v4.5M20.5 14v-2.5A2.5 2.5 0 0 0 18 9h-7v5" /><circle cx="7" cy="11.2" r="1.7" /></>,
  transport: <><path d="M3 6.5h11V16H3zM14 9.5h3.6l3.4 3.4V16h-7" /><circle cx="7.5" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  repair: <><path d="M14.5 6.5l3 3M13 8l-8.2 8.2a2 2 0 0 0 2.8 2.8L15.8 10.8" /><path d="M13.6 4.4l1.4-1.4 5 5-1.4 1.4a2 2 0 0 1-2.8 0l-2.2-2.2a2 2 0 0 1 0-2.8z" /></>,
  food: <><path d="M9 3h6M10 3v3.2L7.5 9.6c-.4.6-.5 1.2-.5 1.8V19a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-7.6c0-.6-.1-1.2-.5-1.8L14 6.2V3" /><path d="M7 12.5h10" /></>,
  guide: <><circle cx="12" cy="12" r="8.5" /><path d="M15.2 8.8l-1.8 4.6-4.6 1.8 1.8-4.6z" /></>,
  help: <><path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" /><path d="M14 3.5V8h4M9 12.5h6M9 16h6" /></>,
  house: <><path d="M4 11l8-6.5 8 6.5" /><path d="M6 9.8V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.8" /><path d="M10 20v-5.5h4V20" /></>,
  orchard: <><circle cx="12" cy="9" r="5.5" /><path d="M12 14.5V21M9 21h6" /></>,
  farmland: <><path d="M3.5 18.5c3-1 5-4 8.5-4s5.500 3 8.500 4M3.5 13.500c3-1 5-4 8.500-4s5.500 3 8.500 4M3.5 8.500c3-1 5-4 8.500-4s5.500 3 8.500 4" /></>,
  plot: <><path d="M4 8l8-4 8 4v8l-8 4-8-4z" /><path d="M4 8l8 4 8-4M12 12v8" /></>,
  shop: <><path d="M4 9.5L5.500 4.500h13L20 9.500" /><path d="M4 9.500a2.700 2.700 0 0 0 5.300 0 2.700 2.700 0 0 0 5.400 0 2.700 2.700 0 0 0 5.300 0V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /></>,
  other: <><path d="M3.8 12.4V5.6c0-.9.7-1.6 1.6-1.6h6.8c.4 0 .8.2 1.1.5l7.1 7.1a1.6 1.6 0 0 1 0 2.2l-6.8 6.8a1.6 1.6 0 0 1-2.2 0l-7.1-7.1a1.6 1.6 0 0 1-.5-1.1z" /><circle cx="8.3" cy="8.3" r="1.3" /></>,
  all: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" /></>,
};
export const hasCatIcon = (c: string) => c in cat && c !== "all";
export const CatIcon = ({ cat: c, ...p }: P & { cat: string }) => <I {...p}>{cat[c] ?? cat.other}</I>;

export const SearchI = (p: P) => <I {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></I>;
export const HeartI = ({ filled, ...p }: P & { filled?: boolean }) => (
  <I {...p} fill={filled ? "currentColor" : "none"}><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.7a4.3 4.3 0 0 1 7.5 2.6c0 5.6-7.5 10.2-7.5 10.2z" /></I>
);
export const CameraI = (p: P) => <I {...p}><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.3-2h5.4L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" /><circle cx="12" cy="13" r="3.4" /></I>;
export const ListI = (p: P) => <I {...p}><path d="M9 6.5h11M9 12h11M9 17.5h11" /><circle cx="4.6" cy="6.5" r=".6" /><circle cx="4.6" cy="12" r=".6" /><circle cx="4.6" cy="17.5" r=".6" /></I>;
export const GridI = (p: P) => <I {...p}><rect x="4" y="4" width="6.5" height="6.5" rx="1.4" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" /></I>;
export const CloseI = (p: P) => <I {...p}><path d="M6 6l12 12M18 6L6 18" /></I>;
export const ChevL = (p: P) => <I {...p}><path d="M14.5 5.5L8 12l6.5 6.5" /></I>;
export const ChevR = (p: P) => <I {...p}><path d="M9.5 5.5L16 12l-6.5 6.5" /></I>;
export const CopyI = (p: P) => <I {...p}><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" /></I>;
export const ShareI = (p: P) => <I {...p}><path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12" /></I>;
export const PhoneI = (p: P) => <I {...p}><path d="M6.6 3.5h2.7l1.4 4-1.8 1.3a11 11 0 0 0 5.8 5.8l1.3-1.8 4 1.4v2.7a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" /></I>;
export const SendI = (p: P) => <I {...p}><path d="M20.5 4L3.5 11l6 2.5L11 20l3-4.5 4.5 3z" /><path d="M9.5 13.5L20.5 4" /></I>;
export const ChatI = (p: P) => <I {...p}><path d="M4.5 19.5l1.2-3.7A8 8 0 1 1 8.4 18.6z" /></I>;
export const ZoomI = (p: P) => <I {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21M10.5 8v5M8 10.5h5" /></I>;
export const CheckI = (p: P) => <I {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></I>;
export const PlusI = (p: P) => <I {...p}><path d="M12 5v14M5 12h14" /></I>;
export const RefreshI = (p: P) => <I {...p}><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v5h-5" /></I>;
export const ImageI = (p: P) => <I {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.7" /><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5" /></I>;
