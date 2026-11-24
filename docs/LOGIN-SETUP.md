# Optional email-link login: Supabase setup

The site lets people log in with an email link ("magic link") so they can see all their listings in one place. Logging in is **optional**: posting without an account always works, and every listing gets a manage code. Email may be less common among villagers, so never make login a requirement.

Labels in the Supabase dashboard change over time. Where unsure, this guide names the general area (for example "Authentication settings"); look for the closest match.

## 1. Enable the Email provider
Open your Supabase project, then Authentication settings, then the Providers (sign-in methods) area. Make sure **Email** is enabled. Other providers are not needed.

## 2. Link-only login
This site sends a link and has no password field. If the dashboard offers it, you may turn off password sign-in for the Email provider so only links work. Keep "confirm email" behaviour as the dashboard suggests; the link itself proves the address. The site asks Supabase to create the user on first use.

## 3. Site URL and Redirect URLs
In Authentication settings, find URL Configuration:
- **Site URL**: your production domain, for example `https://your-domain.com`.
- **Redirect URLs** (allow list), add all of these:
  - `http://localhost:3000/fa/login` and `http://localhost:3000/en/login`: only in a separate development Supabase project, NOT in the production project.
  - `https://your-domain.com/fa/login`
  - `https://your-domain.com/en/login`
  - Vercel previews: either skip them, or add a pattern tied to YOUR project's own preview hostname (for example `https://soh-village-*-your-team.vercel.app/**`). Never add a bare `https://*.vercel.app/**`: any stranger's Vercel app could then receive users' login tokens.

If a link opens the wrong page or shows a redirect error, this list is almost always the cause.

## 4. Sending email: why the built-in sender is limited
Supabase's built-in email sender is meant for testing. It sends only a few emails per hour, may only deliver to members of your own team, and often lands in spam. For real visitors attach your own SMTP service. Free tiers exist at Resend and Brevo (check their current limits).

Steps (general):
1. Create an account at Resend or Brevo and verify your sending domain (add the DNS records they show). Create an SMTP credential or API key.
2. In Supabase, Authentication settings, find SMTP Settings and enable custom SMTP.
3. Enter sender email and name, the host, port, username and password from the provider (the provider's SMTP page lists them).
4. Save and send a test login.

The SMTP password is a secret. It goes only into the Supabase dashboard, never into this repo (see `docs/SECRETS.md`).

## 5. Email template (Persian and English)
In Authentication settings, find Email Templates and the template used for the magic link (and the one for confirming a signup, since new users are created on first login). Supabase has one template per type, so use one bilingual text. Keep the link variable `{{ .ConfirmationURL }}` unchanged.

Subject:
```
ورود به وب‌سایت سه | Log in to Soh village
```

Body (HTML):
```html
<div dir="rtl" style="font-family:Tahoma,sans-serif">
  <p>سلام،</p>
  <p>برای ورود به وب‌سایت روستای سه روی پیوند زیر بزنید. ورود اختیاری است و فقط برای دیدن آگهی‌های شما در یک جا لازم است.</p>
  <p><a href="{{ .ConfirmationURL }}">ورود</a></p>
  <p>اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.</p>
</div>
<hr>
<div dir="ltr" style="font-family:Arial,sans-serif">
  <p>Hello,</p>
  <p>Click the link below to log in to the Soh village website. Logging in is optional; it only lets you see your listings in one place.</p>
  <p><a href="{{ .ConfirmationURL }}">Log in</a></p>
  <p>If you did not request this, ignore this email.</p>
</div>
```

## 6. Rate limits
Supabase limits how many login emails can be sent per hour and how often one address can ask for a link (look under Authentication settings, rate limits). With the built-in sender the limit is very low; with custom SMTP you can raise it, but the email provider's own limit still applies. Keep it modest to avoid abuse. The anon key is public, so anyone can script login-email requests to arbitrary addresses and use up the hourly quota. Turn on Supabase Auth CAPTCHA (Turnstile or hCaptcha) under Authentication settings if abuse appears; note the site would then also need to send the CAPTCHA token with the login request (a code change) or proxy it through a rate-limited route. If someone sees a "too many requests" message, ask them to wait a few minutes.

## 7. Testing the flow
1. Set the environment variables (`docs/SECRETS.md`), run `npm run dev`.
2. Open `http://localhost:3000/en/login`, enter your email, send.
3. Open the email and click the link. You should land on `/en/login` already logged in, with your email shown and a link to "My listings".
4. Post a listing while logged in; it should appear under My listings (with status pending until approved).
5. Sign out, then try the manage page with a manage code.
6. Repeat on the production domain after deploying.

If the link fails: check the Redirect URLs (section 3), check spam, and note that links are single-use and expire after a while; request a new one.

## 8. Privacy note

Persian:
> ورود اختیاری است. اگر وارد شوید، فقط نشانی ایمیل شما ذخیره می‌شود و فقط برای ورود و پیدا کردن آگهی‌های خودتان به کار می‌رود. کد مدیریت آگهی هرگز به‌صورت اصلی ذخیره نمی‌شود؛ فقط یک اثر رمزگذاری‌شده (هش) از آن نگه داشته می‌شود. برای ثبت آگهی نیازی به حساب کاربری نیست.

English:
> Logging in is optional. If you log in, we store only your email address, and use it only for logging in and for finding your own listings. Manage codes are never stored as they are; only a one-way hash of each code is kept. You do not need an account to post a listing.

Add this text to the login page or the site's privacy section.
