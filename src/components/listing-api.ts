// Shared client helpers for the listing manager: API call + friendly bilingual error messages.
import type { Locale } from "@/lib/i18n";

export type ManagedListing = {
  id: string;
  type: string;
  category: string;
  title: string;
  quantity?: string | null;
  price?: string | null;
  area?: string | null;
  available?: string | null;
  details?: string | null;
  posterName?: string | null;
  contactKind?: string | null;
  contactValue?: string | null;
  contactPublic?: boolean;
  status: string;
  createdAt?: string | null;
  expiresAt?: string | null;
  renewals?: number;
  /** ordered photo file names (first = cover); see src/lib/listing-images.ts */
  images?: string[];
};

const ERRORS: Record<string, { fa: string; en: string }> = {
  not_found: { fa: "آگهی پیدا نشد. کد را بررسی کنید.", en: "Listing not found. Check the code." },
  rate_limited: { fa: "تلاش‌های زیادی شد. بعداً امتحان کنید.", en: "Too many attempts. Try again later." },
  cannot_renew: { fa: "هنوز قابل تمدید نیست. فقط آگهی تأییدشده، در هفته‌ی آخر اعتبار یا پس از آن، حداکثر ۴ بار.", en: "Cannot renew yet. Approved listings only, in the last 7 days or after expiry, up to 4 times." },
  not_editable: { fa: "این آگهی دیگر قابل ویرایش نیست.", en: "This listing can no longer be edited." },
  unauthorized: { fa: "نشست تمام شد. دوباره وارد شوید.", en: "Session ended. Log in again." },
  not_configured: { fa: "این بخش هنوز فعال نیست.", en: "This feature is not available yet." },
  network: { fa: "اتصال برقرار نشد. اینترنت را بررسی کنید.", en: "Could not connect. Check your internet." },
  contact_required: { fa: "راه تماس لازم است.", en: "A contact method is required." },
  bad_email: { fa: "نشانی ایمیل درست نیست.", en: "Invalid email address." },
  too_many_images: { fa: "حداکثر ۱۰ عکس می‌شود گذاشت.", en: "You can add up to 10 photos." },
  bad_images: { fa: "بعضی عکس‌ها ذخیره نشدند. دوباره امتحان کنید.", en: "Some photos did not save. Try again." },
  upload_failed: { fa: "عکس فرستاده نشد. دوباره امتحان کنید.", en: "A photo did not upload. Try again." },
  not_image: { fa: "این فایل عکس نیست.", en: "This file is not a photo." },
  unreadable: { fa: "این عکس باز نشد. یک عکس JPG یا PNG انتخاب کنید یا دوباره عکس بگیرید.", en: "Could not open this photo. Pick a JPG or PNG, or take a new one." },
  too_big_original: { fa: "این عکس خیلی بزرگ است (بیشتر از ۳۰ مگابایت).", en: "This photo is too big (over 30 MB)." },
  encode_failed: { fa: "عکس آماده نشد. عکس دیگری را امتحان کنید.", en: "Could not prepare this photo. Try another." },
  send_failed: { fa: "لینک ورود ارسال نشد. بعداً امتحان کنید.", en: "Could not send the link. Try later." },
};
const GENERIC = { fa: "مشکلی پیش آمد. دوباره امتحان کنید.", en: "Something went wrong. Try again." };

export function errorText(code: string | undefined, lang: Locale): string {
  return (code && ERRORS[code] ? ERRORS[code] : GENERIC)[lang];
}

export type ApiResult = { ok: boolean; status: number; data: Record<string, unknown> };

export async function postJson(url: string, body: unknown, token?: string): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok && data.ok !== false, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "network" } };
  }
}
