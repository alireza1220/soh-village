"use client";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { publicSupabase } from "@/lib/supabase";
import { useSession } from "@/components/use-session";

// Small header/footer link: "Log in" or "My listings". Renders nothing when login is not set up.
export function AuthLink({ lang, className }: { lang: Locale; className?: string }) {
  const { session, ready } = useSession();
  if (!publicSupabase()) return null;
  const loggedIn = ready && !!session;
  const href = loggedIn ? `/${lang}/my` : `/${lang}/login`;
  const text = loggedIn ? (lang === "fa" ? "آگهی‌های من" : "My listings") : lang === "fa" ? "ورود" : "Log in";
  return <Link href={href} className={className ?? "btn btn-ghost"}>{text}</Link>;
}
