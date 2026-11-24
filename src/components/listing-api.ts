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
};

const ERRORS: Record<string, { fa: string; en: string }> = {
  not_found: { fa: "آگهی پیدا نشد. کد را دوباره بررسی کنید.", en: "Listing not found. Please check the code." },
  rate_limited: { fa: "تلاش‌های زیادی شد. کمی بعد دوباره امتحان کنید.", en: "Too many attempts. Please try again a little later." },
  cannot_renew: { fa: "هنوز نمی‌شود تمدید کرد. تمدید فقط برای آگهی تأییدشده و در هفته‌ی آخر اعتبار (یا پس از پایان آن) ممکن است و بیش از ۴ بار نمی‌شود.", en: "This listing cannot be renewed yet. Renewal works only for approved listings in their last 7 days (or after they expire), up to 4 times." },
  not_editable: { fa: "این آگهی دیگر قابل ویرایش نیست.", en: "This listing can no longer be edited." },
  unauthorized: { fa: "نشست شما تمام شده است. دوباره وارد شوید.", en: "Your session has ended. Please log in again." },
  not_configured: { fa: "این بخش هنوز فعال نشده است.", en: "This feature is not available yet." },
  network: { fa: "اتصال برقرار نشد. اینترنت را بررسی کنید و دوباره امتحان کنید.", en: "Could not connect. Check your internet and try again." },
  contact_required: { fa: "راه تماس لازم است.", en: "A way to contact you is required." },
  bad_email: { fa: "نشانی ایمیل درست نیست.", en: "That email address does not look right." },
  send_failed: { fa: "ارسال لینک ورود ممکن نشد. کمی بعد دوباره امتحان کنید.", en: "Could not send the login link. Please try again later." },
};
const GENERIC = { fa: "مشکلی پیش آمد. دوباره امتحان کنید.", en: "Something went wrong. Please try again." };

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
