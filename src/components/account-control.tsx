"use client";
import Link from "next/link";
import "@/styles/forms.css";
import type { Locale } from "@/lib/i18n";
import { publicSupabase } from "@/lib/supabase";
import { avatarUrl } from "@/lib/profile";
import { signOut } from "@/lib/auth";
import { Avatar } from "@/components/avatar";
import { useSession } from "@/components/use-session";
import { useProfile } from "@/lib/use-profile";

const T = {
  login: { fa: "ورود", en: "Log in" },
  my: { fa: "آگهی‌های من", en: "My ads" },
  profile: { fa: "مشخصات من", en: "My profile" },
  out: { fa: "خروج", en: "Log out" },
};

/** Header / drawer account control. Logged out: "Log in". Logged in: avatar + first name (-> profile) and "My ads". */
export function AccountControl({ lang, className = "ut-link", variant = "bar" }: { lang: Locale; className?: string; variant?: "bar" | "drawer" }) {
  const { session, ready } = useSession();
  const { profile } = useProfile();
  const sb = publicSupabase();
  if (!sb || !ready || !session) {
    return <Link href={`/${lang}/login`} className={`${className} acct__login`}>{T.login[lang]}</Link>;
  }
  const name = profile?.firstName || session.user.email.split("@")[0] || "?";
  const src = profile?.avatar ? avatarUrl(sb.url, `${session.user.id}/${profile.avatar}`) : null;
  return (
    <span className={`acct${variant === "drawer" ? " acct--drawer" : ""}`}>
      <Link href={`/${lang}/profile`} className={`${className} acct__who`} aria-label={`${T.profile[lang]}: ${name}`}>
        <Avatar name={name} src={src} size={variant === "drawer" ? 32 : 26} />
        <bdi className="acct__name">{name}</bdi>
      </Link>
      <Link href={`/${lang}/my`} className={`${className} acct__my`}>{T.my[lang]}</Link>
      {variant === "drawer" && <button type="button" className={`${className} acct__out`} onClick={() => void signOut()}>{T.out[lang]}</button>}
    </span>
  );
}
