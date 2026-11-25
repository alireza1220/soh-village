import type { L } from "./i18n";

// Official community channels. Icons live in src/components/icons.tsx (SocialIcon, by id).
export type SocialLink = { id: "facebook" | "instagram" | "telegram"; href: string; label: L };

export const socialLinks: SocialLink[] = [
  { id: "facebook", href: "https://www.facebook.com/sohiran", label: { fa: "فیس‌بوک سُه", en: "Soh on Facebook" } },
  { id: "instagram", href: "https://www.instagram.com/soh_village/", label: { fa: "اینستاگرام سُه", en: "Soh on Instagram" } },
  { id: "telegram", href: "https://t.me/esfahansohi", label: { fa: "تلگرام سُه", en: "Soh on Telegram" } },
];
