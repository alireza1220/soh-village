// SHARED CONTRACT. Every error code the site's API routes, the auth client and the photo/avatar helpers can produce,
// with a friendly bilingual message for each. Plain, short, no blame. Owned by the architect.
// Server routes answer { error: <code> } with the HTTP status listed in the contract; the UI shows errorText(code, lang).
import type { L, Locale } from "./i18n";

export const API_ERRORS = {
  // ---- generic / API ----
  bad_json: { fa: "درخواست درست نبود. دوباره امتحان کنید.", en: "That request was not valid. Try again." },
  unauthorized: { fa: "مدت ورود شما تمام شده. دوباره وارد شوید.", en: "Your session ended. Log in again." },
  profile_required: { fa: "اول مشخصات خود را کامل کنید.", en: "Complete your profile first." },
  not_found: { fa: "آگهی پیدا نشد.", en: "Listing not found." },
  not_editable: { fa: "این آگهی دیگر قابل ویرایش نیست.", en: "This listing can no longer be edited." },
  cannot_renew: { fa: "هنوز نمی‌شود تمدیدش کرد. آگهی تأییدشده را می‌توانید در هفته‌ی آخر اعتبار یا بعد از آن، تا ۴ بار تمدید کنید.", en: "You cannot renew this yet. An approved ad can be renewed in its last 7 days or after it expires, up to 4 times." },
  conflict: { fa: "آگهی همین حالا تغییر کرد. صفحه را تازه کنید و دوباره امتحان کنید.", en: "The listing just changed. Refresh and try again." },
  rate_limited: { fa: "تلاش‌های زیادی شد. کمی بعد دوباره امتحان کنید.", en: "Too many attempts. Try again in a little while." },
  not_configured: { fa: "این بخش هنوز فعال نیست.", en: "This feature is not available yet." },
  store_failed: { fa: "ذخیره نشد. کمی بعد دوباره امتحان کنید.", en: "Could not save. Try again in a little while." },
  network: { fa: "اتصال برقرار نشد. اینترنت را بررسی کنید.", en: "Could not connect. Check your internet." },
  forbidden: { fa: "این بخش فقط برای مدیران است.", en: "This area is for admins only." },
  // ---- admin ----
  bad_action: { fa: "این کار شناخته نشد.", en: "That action is not known." },
  bad_status: { fa: "وضعیت درست نیست.", en: "That status is not valid." },
  bad_kind: { fa: "نوع مطلب را انتخاب کنید (خبر، یادداشت یا رویداد).", en: "Pick the kind of post (news, blog or event)." },
  bad_date: { fa: "تاریخ و ساعت درست نیست.", en: "That date and time are not valid." },
  event_date_required: { fa: "برای رویداد، تاریخ و ساعت را بنویسید.", en: "An event needs a date and time." },
  too_long: { fa: "متن از حد مجاز بلندتر است.", en: "That text is longer than allowed." },
  // ---- listing fields ----
  bad_board: { fa: "این بخش درست نیست.", en: "That section is not valid." },
  bad_type: { fa: "نوع آگهی را انتخاب کنید.", en: "Pick the type of ad." },
  bad_category: { fa: "دسته را انتخاب کنید.", en: "Pick a category." },
  bad_arrangement: { fa: "نوع همکاری را انتخاب کنید.", en: "Pick the kind of work arrangement." },
  title_required: { fa: "عنوان را بنویسید.", en: "Write a title." },
  contact_required: { fa: "برای نمایش راه تماس، شماره یا شناسه را بنویسید.", en: "To show a contact, write the number or ID." },
  bad_contact: { fa: "راه تماس را انتخاب کنید.", en: "Pick a contact method." },
  bad_fields: { fa: "بعضی خانه‌ها درست پر نشده‌اند.", en: "Some fields are not filled in correctly." },
  // ---- photos ----
  too_many_images: { fa: "حداکثر ۱۰ عکس می‌شود گذاشت.", en: "You can add up to 10 photos." },
  bad_images: { fa: "بعضی عکس‌ها ذخیره نشدند. دوباره امتحان کنید.", en: "Some photos did not save. Try again." },
  upload_failed: { fa: "عکس فرستاده نشد. دوباره امتحان کنید.", en: "A photo did not upload. Try again." },
  not_image: { fa: "این فایل عکس نیست.", en: "This file is not a photo." },
  unreadable: { fa: "این عکس باز نشد. یک عکس JPG یا PNG انتخاب کنید یا دوباره عکس بگیرید.", en: "Could not open this photo. Pick a JPG or PNG, or take a new one." },
  too_big_original: { fa: "این عکس خیلی بزرگ است (بیشتر از ۳۰ مگابایت).", en: "This photo is too big (over 30 MB)." },
  encode_failed: { fa: "عکس آماده نشد. عکس دیگری را امتحان کنید.", en: "Could not prepare this photo. Try another." },
  // ---- profile ----
  first_name_required: { fa: "نام را بنویسید.", en: "Write your first name." },
  family_name_required: { fa: "نام خانوادگی را بنویسید.", en: "Write your family name." },
  bad_phone: { fa: "شماره‌ی موبایل درست نیست. مثلاً ۰۹۱۲۱۲۳۴۵۶۷", en: "That mobile number does not look right. Example: 09121234567" },
  bad_avatar: { fa: "عکس پروفایل ذخیره نشد. دوباره امتحان کنید.", en: "Your picture did not save. Try again." },
  avatar_too_big: { fa: "این عکس را نتوانستیم به اندازه‌ی کافی کوچک کنیم. عکس دیگری را امتحان کنید.", en: "We could not make this picture small enough. Try another." },
  // ---- login / password (client side, from Supabase Auth) ----
  bad_email: { fa: "نشانی ایمیل درست نیست.", en: "That email address is not valid." },
  password_required: { fa: "رمز عبور را بنویسید.", en: "Write your password." },
  wrong_credentials: { fa: "ایمیل یا رمز عبور درست نیست.", en: "Wrong email or password." },
  email_not_confirmed: { fa: "ایمیلتان هنوز تأیید نشده. روی لینک داخل ایمیلی که فرستادیم بزنید.", en: "Your email is not confirmed yet. Open the link in the email we sent." },
  already_registered: { fa: "با این ایمیل قبلاً حساب ساخته‌اید. وارد شوید، یا اگر رمزتان را فراموش کرده‌اید، رمز جدید بگیرید.", en: "This email already has an account. Log in, or reset your password if you forgot it." },
  weak_password: { fa: "این رمز ضعیف است. دست‌کم ۸ حرف یا عدد بگذارید و آن را کمی پیچیده‌تر کنید.", en: "That password is too weak. Use at least 8 characters and mix them up." },
  password_short: { fa: "رمز عبور دست‌کم ۸ حرف یا عدد باشد.", en: "The password must have at least 8 characters." },
  password_long: { fa: "رمز عبور خیلی بلند است (حداکثر ۷۲ کاراکتر).", en: "The password is too long (72 characters at most)." },
  password_mismatch: { fa: "دو رمز یکی نیستند.", en: "The two passwords do not match." },
  same_password: { fa: "رمز جدید باید با رمز قبلی فرق کند.", en: "The new password must be different from the old one." },
  reauth_needed: { fa: "برای تغییر رمز، یک بار دوباره وارد شوید و بعد امتحان کنید.", en: "To change your password, log in again once, then try." },
  link_expired: { fa: "این لینک تمام شده یا قبلاً استفاده شده. یک لینک جدید بگیرید.", en: "This link has expired or was already used. Get a new one." },
  signup_disabled: { fa: "ساخت حساب فعلاً ممکن نیست.", en: "Creating accounts is closed for now." },
  send_failed: { fa: "ایمیل فرستاده نشد. بعداً امتحان کنید.", en: "Could not send the email. Try later." },
} as const satisfies Record<string, L>;

export type ErrorCode = keyof typeof API_ERRORS;
const GENERIC: L = { fa: "مشکلی پیش آمد. دوباره امتحان کنید.", en: "Something went wrong. Try again." };

/** Friendly message for any error code (unknown or missing codes get a generic one). */
export function errorText(code: string | undefined, lang: Locale): string {
  return (code && code in API_ERRORS ? API_ERRORS[code as ErrorCode] : GENERIC)[lang];
}
