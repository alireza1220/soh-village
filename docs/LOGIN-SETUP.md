# Accounts and login: Supabase setup

To add anything to the site (a market ad, a job post, a request, a property ad, or a change to a post) a person must **log in first**. Looking at the boards needs no login. This guide sets up the Supabase side of that.

People can log in two ways, both on `/fa/login` and `/en/login`:
- **Email + password** (sign up, log in, forgot password).
- **Email link** ("magic link"): no password needed. Someone who logged in by link can set a password later on their profile page.

After the first login the site asks for a small profile: first name, family name, mobile number, **home address** and, if they like, a tiny picture. Until the profile is complete (including phone and address) nobody can post.

Labels in the Supabase dashboard change over time. Where unsure, this guide names the general area (for example "Authentication"); look for the closest match.

## 0. Order of work (do this once)

1. **Run the SQL first**: Supabase, SQL Editor, run `database/migrations/005-accounts-boards.sql` (existing project) or `database/supabase-listings.sql` (brand-new project). Both are safe to run again.
   - Migration 005 **drops** the old `manage_hash` and `poster_name` columns for good. Everyone who posted before keeps their rows; the old manage codes stop working (they are retired).
   - **Before you run it, check the old ads.** Rows posted with a manage code have no owner (`owner_id` is empty), so after the migration their posters can no longer edit, renew or delete them: they stay public until they expire. Count them in the SQL Editor: `select count(*) from public.listings where owner_id is null and status in ('pending','approved');`. If the number matters, export them first (`select id, title, contact_kind, contact_value, status from public.listings where owner_id is null;`, then Download CSV) so you can reach those posters. To take such an ad down, set its `status` to `removed` in the Table Editor. To hand one to a person who now has an account, set its `owner_id` to their user id (Authentication > Users). The manage hash itself is not needed after that, and the drop cannot be undone.
2. **Then deploy the new site version.** The new code needs the new columns, the `profiles` table and the new view. If the site goes out first, the boards show an error and posting fails until the SQL is run.
3. Do sections 1 to 5 below (Auth settings) before you test.
4. Optional cleanup: delete `MANAGE_CODE_SALT` from Vercel. The site no longer reads it. `IP_HASH_SALT` stays (see `docs/SECRETS.md`).

## 1. Enable the Email provider
Authentication, Sign In / Providers (older: Providers), **Email**. Turn it on. Keep **Allow new users to sign up** on (the sign-up form and the email link both create accounts).

## 2. Password rules: set the minimum to 8
The site checks "at least 8 characters" in the form, but **Supabase has its own minimum (often 6) and the server there decides**. Set it to match:

Authentication, Sign In / Providers, Email: **Minimum password length = 8**. Leave "Password requirements" (letters, digits, symbols) as you like; the site shows Supabase's message as "this password is too weak" if it refuses one.

Optional but recommended: turn on **Prevent use of leaked passwords** if your plan offers it.

## 3. "Confirm email": ON or OFF (a real trade-off)
Authentication, Sign In / Providers, Email, **Confirm email**.

| Setting | What happens when someone creates an account | Good | Bad |
|---|---|---|---|
| **ON** | Supabase emails a confirmation link. The person cannot log in with the password until they click it. The site shows "check your email to confirm, then log in". | Nobody can register with someone else's address. | Needs working email. With **Supabase's built-in sender** (a few emails per hour, often in spam) confirmation mails are **unreliable**: people get stuck. |
| **OFF** | The account works at once and the person continues to the profile page. | Simple, works without email. | Anyone can register with any address, including one that is not theirs (they just cannot read mail sent there). The email link login is unaffected: it still proves the address. |

Recommendation:
- **With custom SMTP (section 5): keep Confirm email ON.**
- **Before custom SMTP works: turn it OFF** so sign-up is not blocked, and turn it ON once real email delivery is tested. Ads go live at once (no approval step), so a fake address can publish an ad; the ribbon "Not verified by admin" tells readers it was not checked, and you can take it down afterwards.

The site handles both settings without any code change. With ON, signing up again with an address that already exists looks the same as a first sign-up ("check your email"): that is Supabase hiding which addresses have accounts, on purpose.

## 4. Site URL and Redirect URLs
Authentication, **URL Configuration**:

- **Site URL**: `https://soh-village.site` (your real domain).
- **Redirect URLs** (allow list), add **exactly** these (replace the domain if it differs):
  - `https://soh-village.site/fa/login`
  - `https://soh-village.site/en/login`
  - `https://soh-village.site/fa/reset-password`
  - `https://soh-village.site/en/reset-password`
  - If you also serve `www`, add the same four with `https://www.soh-village.site/...`.
  - **Development only, and only in a separate development Supabase project, never in production:** `http://localhost:3000/fa/login`, `http://localhost:3000/en/login`, `http://localhost:3000/fa/reset-password`, `http://localhost:3000/en/reset-password`.
  - Vercel previews: skip them, or add the exact address of one preview while you test it. Never add a bare `https://*.vercel.app/**`: any stranger's Vercel app could then receive users' login tokens.

Why exact addresses with no `?query`: the allow list matches the whole address. The site never puts a query string in `redirect_to`; where to go after login is remembered in the browser instead. If a link opens the wrong page or shows a "redirect" error, this list is almost always the cause.

## 5. Sending email: why the built-in sender is limited
Supabase's built-in sender is for testing only. It allows only a few emails per hour, may only deliver to members of your own team, and often lands in spam. That affects **sign-up confirmation, password-reset and login-link mails alike**. For real visitors, **attach your own SMTP service**. Free tiers exist at Resend and Brevo (check their current limits).

Steps (general):
1. Create an account at Resend or Brevo and verify your sending domain (add the DNS records they show). Create an SMTP credential or API key.
2. In Supabase, Authentication, Emails (older: Settings), **SMTP Settings**: enable custom SMTP.
3. Enter sender email and name, host, port, username and password from the provider (their SMTP page lists them; exact values for both providers are in `docs/ENV-VARIABLES.md`, section 4).
4. Save, then send yourself a test (section 8).
5. After Supabase's per-hour email limit shown under Authentication, rate limits is raised, it is fine for a village site.

The SMTP password is a secret. It goes only into the Supabase dashboard, never into this repo (see `docs/SECRETS.md`).

## 6. Email templates (Persian and English)
Authentication, Emails, **Templates**. There is one template per type, so each one is a bilingual text. Keep the link variable `{{ .ConfirmationURL }}` unchanged. Three templates matter:

### 6a. Confirm signup
Subject:
```
تأیید ایمیل در وب‌سایت سه | Confirm your email for Soh village
```
Body (HTML):
```html
<div dir="rtl" style="font-family:Tahoma,sans-serif">
  <p>سلام،</p>
  <p>برای ساختن حساب در وب‌سایت روستای سه، روی پیوند زیر بزنید تا ایمیل شما تأیید شود. بعد از آن می‌توانید وارد شوید و آگهی بگذارید.</p>
  <p><a href="{{ .ConfirmationURL }}">تأیید ایمیل</a></p>
  <p>اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.</p>
</div>
<hr>
<div dir="ltr" style="font-family:Arial,sans-serif">
  <p>Hello,</p>
  <p>Click the link below to confirm your email and finish creating your account on the Soh village website. After that you can log in and post.</p>
  <p><a href="{{ .ConfirmationURL }}">Confirm email</a></p>
  <p>If you did not request this, ignore this email.</p>
</div>
```

### 6b. Magic link (login link)
Subject:
```
ورود به وب‌سایت سه | Log in to Soh village
```
Body (HTML):
```html
<div dir="rtl" style="font-family:Tahoma,sans-serif">
  <p>سلام،</p>
  <p>برای ورود به وب‌سایت روستای سه روی پیوند زیر بزنید. ورود فقط برای گذاشتن و مدیریت آگهی لازم است؛ دیدن آگهی‌ها نیازی به ورود ندارد.</p>
  <p><a href="{{ .ConfirmationURL }}">ورود</a></p>
  <p>اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.</p>
</div>
<hr>
<div dir="ltr" style="font-family:Arial,sans-serif">
  <p>Hello,</p>
  <p>Click the link below to log in to the Soh village website. Logging in is only needed to post and manage ads; looking at ads needs no login.</p>
  <p><a href="{{ .ConfirmationURL }}">Log in</a></p>
  <p>If you did not request this, ignore this email.</p>
</div>
```
(New people who use the link are created on first use, so this link also serves as their confirmation. If your dashboard shows a separate "Confirm signup" template, section 6a covers it.)

### 6c. Reset password
Subject:
```
تغییر رمز عبور در وب‌سایت سه | Reset your password for Soh village
```
Body (HTML):
```html
<div dir="rtl" style="font-family:Tahoma,sans-serif">
  <p>سلام،</p>
  <p>برای انتخاب رمز عبور تازه در وب‌سایت روستای سه روی پیوند زیر بزنید.</p>
  <p><a href="{{ .ConfirmationURL }}">انتخاب رمز تازه</a></p>
  <p>اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید؛ رمز شما عوض نمی‌شود.</p>
</div>
<hr>
<div dir="ltr" style="font-family:Arial,sans-serif">
  <p>Hello,</p>
  <p>Click the link below to choose a new password for the Soh village website.</p>
  <p><a href="{{ .ConfirmationURL }}">Choose a new password</a></p>
  <p>If you did not request this, ignore this email; your password stays the same.</p>
</div>
```

## 7. Rate limits and bots
Keep **Allow anonymous sign-ins** OFF (Authentication > Sign In / Providers). The site also refuses tokens without an email address, so an anonymous user could not post, but there is no reason to allow them.

A note on login links: the page reads a session from the address after the "#" when someone opens a login or reset link. That is how Supabase's own library works too. It means a link someone else made for their own account would log you in as them if you opened it; the site cannot tell your links from theirs without breaking links opened on another device or in a mail app's browser, so this is an accepted small risk. Do not open login links you did not ask for.

Supabase limits how many emails can be sent per hour and how often one address can ask for one (Authentication, rate limits). With the built-in sender the limit is very low; with custom SMTP you can raise it, but your email provider's own limit still applies. Keep it modest. Sign-in attempts with a password are also rate-limited by Supabase per IP.

The anon key is public, so anyone can script sign-up or reset requests for arbitrary addresses and use up the hourly email quota. Turn on **Supabase Auth CAPTCHA** (Turnstile or hCaptcha) under Authentication if abuse appears; note the site would then also need to send the CAPTCHA token with the request (a code change). If someone sees "too many attempts", ask them to wait a few minutes.

The site adds its own limits on top for everything that writes: per IP (generous, because many phones in Iran share one carrier address) and per logged-in user (the real budget, for example 6 new ads per hour). Without a valid login every write is refused with 401 before anything is stored.

## 8. Testing the flow
Do this on `http://localhost:3000` against a **development** Supabase project, then again on the production domain.

1. Set the environment variables (`docs/SECRETS.md`), run `npm run dev`.
2. **Sign up**: `/en/login`, "Create account", email + password (8+ characters). With Confirm email ON, open the email and click the link (you land on `/en/login`), then log in. With it OFF you go straight on.
3. **Profile**: you are sent to `/en/profile`. Fill first name, family name, mobile (try `0912 123 4567`, `+98 912 123 4567` and Persian digits: all save as `09121234567`). Pick a picture: it is cropped, shrunk to 96x96 and uploaded; the file is under 12 KB. Save. You continue to where you wanted to go (or My ads).
4. **Post**: open `/en/market`, `/en/careers`, `/en/needs` or `/en/property`, fill the form, send. It is live at once and appears in "My ads". In Supabase, Table Editor, `listings`: one new row with `status = approved`, a 30-day `expires_at` and your `owner_id`.
5. **Check**: reload the board: the ad is already there (with the "Not verified by admin" ribbon unless your profile is verified) with your first name and picture (unless you switched that off on your profile). Your phone is **not** shown unless you ticked "show my contact on this ad".
6. **Edit / renew / delete** from My ads. Editing keeps it live. **Archive** hides it (photos kept) and **Restore** brings it back.
7. **Forgot password**: log out, `/en/login`, "Forgot password", enter the email. The mail's link opens `/en/reset-password`; choose a new password; log in with it. An expired or already-used link shows a friendly "link expired" message.
8. **Set a password after a link login**: log in with an email link, open `/en/profile`, section Password: set one. Log out and log in with email + password.
9. **Logged out**: open a board in a private window: you can read everything; the form is replaced by "To post an ad, log in first". After logging in you come back to that board.
10. Check the **Redirect URLs** if any link fails (section 4). Links are single-use and expire; request a new one.

## 9. Admin: approving and hand-inserting rows
There is no approval step any more (migration 009): new and edited ads are live at once and you moderate afterwards. `rejected` or `removed` hides an ad; `archived` is the owner's own hide. Rows you insert by hand should set `status`, `approved_at` and `expires_at` yourself (the trigger only runs on update).

If you **insert a row by hand** in the Table Editor it now needs an **`owner_id`** (any user id from Authentication, Users; any uuid works). A database trigger refuses rows without one, because every ad belongs to a logged-in user.

Phone numbers, home addresses and family names are stored only in `public.profiles`, which the browser can never read. The public view `public_listings` shows only the explicit columns listed in the SQL file.

## 9b. Migration 008: address, verified sellers, phone on request

Run `database/migrations/008-address-verified-contact.sql` in the SQL Editor (after 007, before deploying; safe to repeat). What changes:
- `profiles.address` (5 to 200 characters, private: only admins see it), `profiles.verified` and `profiles.verified_at` ("Verified seller", set by admins in the admin Users tab, see `docs/ADMIN.md` section 12).
- `public_listings` no longer returns any phone or contact (`contact_kind` and `contact_value` are always null) and gains `poster_verified`.
- New route `POST /api/listings/contact` {id}: public, no login, returns the poster's current profile phone for an approved, unexpired ad; anything else answers 404. It is rate limited per hashed IP, kind `reveal`, 300 per hour (shared carrier IPs are common, so it is generous; it only stops bulk collecting). Response is `Cache-Control: no-store` and contains nothing but `{ok, contact:{kind, value}}`.
- New ads always store the poster's profile phone as a private legacy contact; any contact a client sends is ignored.

**Existing users** have no address. They can still log in and look at everything, but when they try to post, edit or renew, the site asks them to add an address first.

Honest note: "Show phone" makes copying harder, it does not make it impossible. Anyone can tap it and write the number down.

## 10. Privacy note (for the login page or the site's privacy section)

Persian:
> برای گذاشتن آگهی باید وارد شوید؛ دیدن آگهی‌ها نیازی به ورود ندارد. هنگام ساختن حساب نام، نام خانوادگی و شماره‌ی موبایل شما را می‌پرسیم و (اگر بخواهید) یک عکس کوچک. شماره‌ی موبایل با پیامک تأیید نمی‌شود؛ فقط شکل آن بررسی می‌شود. نام خانوادگی و شماره‌ی موبایل هرگز به‌طور خودکار نمایش داده نمی‌شوند. شماره‌ی تماس فقط وقتی روی آگهی دیده می‌شود که شما برای همان آگهی بزنید «راه تماس من در آگهی دیده شود». نام کوچک و عکس شما کنار آگهی‌هایتان دیده می‌شوند، مگر در صفحه‌ی مشخصات خاموش کنید. عکس پیش از فرستادن در دستگاه خودتان کوچک و بازنویسی می‌شود (۹۶ در ۹۶ نقطه) و اطلاعات پنهان آن، مثل مکان، پاک می‌شود. رمز عبور را فقط خود سرویس ورود نگه می‌دارد، آن هم به‌صورت رمزگذاری‌شده؛ ما آن را نمی‌بینیم و ذخیره نمی‌کنیم.

English:
> You must log in to post an ad; looking at ads needs no login. When you create an account we ask for your first name, family name and mobile number and, if you like, a tiny picture. The mobile number is not verified by SMS; only its format is checked. Your family name and mobile number are never shown automatically. Your home address is never shown to the public (only the site team sees it, to verify sellers). Your phone number is not on the ad: a visitor must tap "Show phone" to see it. Your first name and picture appear next to your ads unless you switch that off on your profile. The picture is shrunk and re-encoded on your own device (96 by 96 pixels), which also removes hidden data such as location. Your password is held only by the login service, in encrypted form; we never see or store it.

Notes for the owner:
- The mobile number is **not** verified. Do not rely on it as proof of identity; the site team can see it in the database.
- An avatar's public address contains the user's id (`.../avatars/<user id>/<file>`) for people who show a picture. The id is not a secret and gives no access, but it is visible. The `owner_id` column itself is never exposed.
- Add the text above to the login page or the site's privacy section.
