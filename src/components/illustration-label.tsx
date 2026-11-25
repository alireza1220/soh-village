import "@/styles/pages.css";
import type { Locale } from "@/lib/i18n";

export const illustrationLabelText = { fa: "تصویرسازی، نه عکس", en: "Illustration, not a photo" } as const;

// Square badge shown on every AI-made illustration. Same look as the region-photo label.
// overlay = sits on the image corner (absolute, needs a positioned parent); otherwise inline (banner credit line).
export function IllustrationLabel({ lang, overlay, small }: { lang: Locale; overlay?: boolean; small?: boolean }) {
  return <b className={`ill-label${overlay ? " ill-label--overlay" : ""}${small ? " ill-label--sm" : ""}`}>{illustrationLabelText[lang]}</b>;
}
