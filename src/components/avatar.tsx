import type { ReactElement } from "react";
import { initialOf } from "@/lib/profile";
import "@/styles/account.css";

/** Round picture of a person. Decorative: the name is always printed next to it, so alt is empty. No picture = initial on a tokens-coloured circle. */
export function Avatar({ name, src, size = 40, className }: { name: string; src?: string | null; size?: number; className?: string }): ReactElement {
  const style = { "--acc-av": `${size}px` } as React.CSSProperties;
  const cls = `acc-avatar${className ? ` ${className}` : ""}`;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={cls} style={style} src={src} alt="" width={size} height={size} loading="lazy" decoding="async" />;
  }
  return (
    <span className={`${cls} acc-avatar--initial`} style={style} aria-hidden="true">
      {initialOf(name)}
    </span>
  );
}
