"use client";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { publicSupabase } from "@/lib/supabase";
import { useSession } from "@/components/use-session";

// Header and footer account link. Login stays visible even before Supabase is connected; the login page explains that.
export function AuthLink({ lang, className }: { lang: Locale; className?: string }) {
  const { session, ready } = useSession();
  const loggedIn = !!publicSupabase() && ready && !!session;
  const href = loggedIn ? `/${lang}/my` : `/${lang}/login`;
  const text = loggedIn ? (lang === "fa" ? "آگهی‌های من" : "My listings") : lang === "fa" ? "ورود" : "Log in";
  return <Link href={href} className={className ?? "btn btn-ghost"}>{text}</Link>;
}
