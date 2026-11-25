import { notFound, redirect } from "next/navigation";
import { hasLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// Manage codes are retired: "Manage a listing" is now the logged-in "My ads" page. Old links and bookmarks keep working.
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  redirect(`/${lang}/my`);
}
