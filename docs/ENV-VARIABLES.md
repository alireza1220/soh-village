# Environment variables and settings: where each lives and how to get it

Written 24 Nov 2026 for the repo `alireza1220/soh-village` (Next.js 16 on Vercel, Supabase for the database). It lists every variable the code reads (checked against `src/` and `scripts/` on `main`), then every setting that lives in Supabase, GitHub or the domain registrar instead of an environment variable. Each row says exactly where to click, so a person or an automated agent can follow it without guessing.

Rules that apply to every row:
- A value is **public** only if it starts with `NEXT_PUBLIC_`. Those are copied into the website's browser code. Everything else is **secret**, server-only.
- Never paste a secret into chat, an issue, a commit, a screenshot or a file inside the repo. `.env.local` is ignored by git (`.gitignore` has `.env*` and `!.env.example`).
- Dashboard labels change over time. Where a label may read differently, both are given. The project address (`<REF>`) method for the URL works even if the labels move.

---

## 1. At a glance: which variable goes where

| Variable | Public or secret | Vercel (Production + Preview) | Local `.env.local` | GitHub | Supabase | Needed for |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | **Yes** | Optional | No | It is Supabase's own value | Market board, listing form, login |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public (the publishable key) | **Yes** | Optional | No | It is Supabase's own value | Reading approved listings, login link |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret** (the secret key) | **Yes, Sensitive** | Only if you test against the real database | No | It is Supabase's own value | Saving, editing and deleting listings (server only) |
| `IP_HASH_SALT` | **secret** | **Yes, Sensitive** | Optional (dev default exists) | No | No | Spam limits (hashed IPs) |
| `MANAGE_CODE_SALT` | **secret** | **Yes, Sensitive** | Optional (dev default exists) | No | No | Hashing the manage codes people get |
| `CRON_SECRET` | **secret** | **Yes, Sensitive, Production** | Only to test the keep-alive route by hand | No | No | The daily keep-alive job that stops Supabase pausing |

Not environment variables, but settings you must make elsewhere (details in sections 4 to 6):

| Setting | Where | Needed for |
|---|---|---|
| Site URL and redirect URLs | Supabase → Authentication → URL Configuration | Email-link login |
| Email provider on, custom SMTP, email template | Supabase → Authentication | Email-link login that actually sends mail |
| Database tables (run `database/supabase-listings.sql` once) | Supabase → SQL Editor | Everything that stores listings |
| Domain `soh-village.site` and its DNS records | Vercel → Settings → Domains, and your domain registrar | The live address |
| GitHub | Nothing to set (see section 5) | |

---

## 2. Master table: every variable with exact retrieval steps

Use the numbered steps literally. "Click X" means the visible text or icon named X.

| # | Variable | What it does | Secret? | Set it in | How to get the value (exact steps) |
|---|---|---|---|---|---|
| 1 | `NEXT_PUBLIC_SUPABASE_URL` | The web address of your Supabase project. The website calls it for listings and login. | No (public) | Vercel (Production and Preview). Local optional. | 1. Open https://supabase.com/dashboard and sign in.<br>2. Click the project named **soh-village** in the project list.<br>3. Read your browser's address bar. It looks like `https://supabase.com/dashboard/project/abcdefghijklmnopqrst`. The last part (`abcdefghijklmnopqrst`, about 20 lowercase letters) is the **project reference**, written `<REF>` below.<br>4. The value is `https://<REF>.supabase.co`. No trailing slash. Nothing after `.co`.<br>5. Cross-check: click the gear icon **Project Settings** at the bottom of the left sidebar, then **Data API** (older dashboards: **API**). The field **Project URL** (or **API URL**) must show exactly the same address. |
| 2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The browser-safe key. The name says "anon" for historical reasons. In a new project it is the **publishable key**. | No (public by design) | Vercel (Production and Preview). Local optional. | 1. Open https://supabase.com/dashboard and click the **soh-village** project.<br>2. Click the gear icon **Project Settings** in the left sidebar.<br>3. Click **API Keys**.<br>4. On the tab **Publishable and secret API keys**, find the row **Publishable key** (name `default`). Click the copy icon. The value starts with `sb_publishable_`.<br>5. If your dashboard only offers the older keys, click the tab **Legacy anon, service_role API keys** and copy **anon** (public). It starts with `eyJ`. Either kind works; the code handles both.<br>6. Paste into Vercel as the value of `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| 3 | `SUPABASE_SERVICE_ROLE_KEY` | The key that can read and write the locked `listings` table. Used only by the server routes (`/api/listings`, `/api/listings/manage`, `/api/my/listings`, `/api/keepalive`). The name says "service role" for historical reasons. In a new project it is the **secret key**. | **Yes** | Vercel (Production and Preview, **Sensitive**). Local only if you test against the real database. | 1. Open https://supabase.com/dashboard and click the **soh-village** project.<br>2. Gear icon **Project Settings** → **API Keys**.<br>3. On the tab **Publishable and secret API keys**, find the section **Secret keys**, the row named `default`.<br>4. Click the eye (**Reveal**) icon, then the copy icon. The value starts with `sb_secret_`.<br>5. Older dashboards: tab **Legacy anon, service_role API keys** → **service_role** (secret) → **Reveal** → copy (starts with `eyJ`).<br>6. Paste straight into Vercel; never into chat, a file in the repo or a variable starting with `NEXT_PUBLIC_`.<br>7. To rotate it later: **API Keys** → **Secret keys** → create a new key, put it in Vercel, redeploy, then delete the old key. |
| 4 | `IP_HASH_SALT` | Random text mixed into people's IP addresses before the spam limiter stores them, so the stored value cannot be reversed. At least 32 characters in production or the listing routes answer `503 not_configured`. | **Yes** | Vercel (Production and Preview, **Sensitive**). Local optional (a dev default exists). | You make it yourself; nothing to look up.<br>1. Open **Terminal** on your Mac.<br>2. Run `openssl rand -base64 32 \| pbcopy`. This copies a fresh 44-character random value to the clipboard and prints nothing.<br>3. In Vercel's value field, paste with Cmd+V.<br>4. Save the same value in your password manager under "soh-village IP_HASH_SALT" (Vercel will not show Sensitive values again).<br>5. If you lose it, run step 2 again and replace it: nothing breaks. |
| 5 | `MANAGE_CODE_SALT` | Secret that turns each listing's manage code into the stored hash. At least 32 characters in production or the site refuses to post or manage listings. **Changing it later makes every existing manage code stop working.** | **Yes** | Vercel (Production and Preview, **Sensitive**). Local optional (a dev default exists). | Same method, but a different value from #4.<br>1. Terminal: `openssl rand -base64 32 \| pbcopy`.<br>2. Paste into Vercel as `MANAGE_CODE_SALT`.<br>3. Save it in your password manager under "soh-village MANAGE_CODE_SALT".<br>4. Set it once and never change it after people have posted. |
| 6 | `CRON_SECRET` | Proves that a call to `/api/keepalive` really comes from Vercel's daily cron job (`vercel.json`, 06:00 UTC). The job keeps the free Supabase project from pausing after a week of inactivity. Without it the route answers `401`. | **Yes** | Vercel (**Production**, Sensitive). Local only to test the route by hand. | Same method, a third different value.<br>1. Terminal: `openssl rand -base64 32 \| pbcopy`.<br>2. Paste into Vercel as `CRON_SECRET` (Production ticked).<br>3. Vercel then sends `Authorization: Bearer <CRON_SECRET>` automatically on every scheduled call. You never type it elsewhere.<br>4. Check it works after the next deploy: Vercel → project → **Settings** → **Cron Jobs** → the `/api/keepalive` row → **Run**. Expect a 200 response. |

Automatic values you do **not** set: `NODE_ENV` (Next.js sets it: `development` locally, `production` on Vercel including previews) and `MOCK_PORT` / `PORT` (only used by the test mock `scripts/mock-supabase.mjs`).

---

## 3. How to put the values where they belong

### 3a. Vercel (the live site)
1. Open https://vercel.com/dashboard and sign in. If you belong to more than one team, choose the right one in the top-left selector.
2. Click the project **soh-village**.
3. Click the **Settings** tab, then **Environment Variables** in the left menu.
4. In the **Create new** form, for each variable in section 2:
   1. **Key**: type the name exactly as written (case-sensitive).
   2. **Value**: paste the value.
   3. **Environments**: tick **Production** and **Preview**. Leave **Development** unticked for secrets (Sensitive values cannot be used in Development). For `CRON_SECRET`, **Production** is enough.
   4. Turn on **Sensitive** for #3, #4, #5 and #6. Leave it off for #1 and #2 (they are public).
   5. Click **Save**.
5. Click the **Deployments** tab, open the **⋯** menu on the latest row and click **Redeploy**, then confirm. The two `NEXT_PUBLIC_` values are baked into the site while it builds, so they only take effect on a new build.
6. Preview deployments (pull requests and branches) also run with `NODE_ENV=production`. That is why the two salts must be ticked for **Preview** too, or previews answer `503 not_configured` when you post.

Command-line alternative (needs Node): `npm i -g vercel`, `vercel login`, in the repo folder run `vercel link`, then for each variable `vercel env add NAME production` (and again with `preview`) and paste the value when asked; add `--sensitive` for secrets. Redeploy with `vercel --prod` or from the dashboard.

### 3b. Local (your computer)
Local values are optional. With none set, the site runs in a safe fallback mode (listings from the local file, copy-text form), and `node scripts/test-market.mjs` supplies its own fake values.
1. In Terminal: `cd ~/code/alireza1220/soh-village`.
2. `cp .env.example .env.local`.
3. Open it: `open -e .env.local`. Replace each `your-...` placeholder with the real value from section 2. For a safer setup, leave the secrets empty and only set #1 and #2.
4. Restart the dev server (`npm run dev`) so it reloads the file.
5. Never commit `.env.local`. Check with `git status`: it must not appear.
6. `vercel env pull .env.local` can fill the file from Vercel, but Sensitive values are not returned, so it only gives you the public ones.

### 3c. GitHub
Nothing to set. Deployments run through Vercel's GitHub connection, which stores no secrets in GitHub, and the repo has no GitHub Actions workflows (`.github/` does not exist). If you add Actions later, the tests need no real keys (they use fake values). Because the repo is public, GitHub's secret scanning and push protection are on by default and will warn you if a key is ever committed. If that happens, rotate that key at once (section 2, row 3).

---

## 4. Settings in Supabase (not environment variables)

Open https://supabase.com/dashboard → project **soh-village** for all of these.

| Setting | Exact steps | Value |
|---|---|---|
| Database tables | Left sidebar **SQL Editor** → **New query** → paste the whole file `database/supabase-listings.sql` → **Run**. Then **Table Editor**: you should see `listings` and `rate_events`. | The file contents (done once; safe to run again) |
| Site URL | **Authentication** → **URL Configuration** → **Site URL** → type the address → **Save changes**. | `https://soh-village.site` |
| Redirect URLs | Same page → **Redirect URLs** → **Add URL** for each → **Save**. | `https://soh-village.site/fa/login` and `https://soh-village.site/en/login`. If you also serve `www`, add the same two with `https://www.`. Do not add a bare `*.vercel.app` wildcard. For a preview deployment add its exact address from Vercel, only while you test it. |
| Email sign-in on | **Authentication** → **Sign In / Providers** (older: **Providers**) → **Email** → switch **Enable Email provider** on. Keep **Allow new users to sign up** on (the login form creates accounts by email link). | On |
| Real email sending (custom SMTP) | **Authentication** → **Emails** (older: **Settings**) → **SMTP Settings** → switch **Enable Custom SMTP** on → fill **Sender email**, **Sender name**, **Host**, **Port number**, **Username**, **Password** → **Save**. Without this Supabase's built-in sender is rate-limited to a handful of emails an hour and is not meant for real use. | Values come from your mail provider: see the next table |
| Email template | **Authentication** → **Emails** → **Templates** → **Magic Link** → paste the Persian and English text from `docs/LOGIN-SETUP.md` → **Save**. | Text from the docs |
| Database password | Only for direct database tools; the website does not use it. It was chosen when you created the project. To reset: **Project Settings** → **Database** → **Reset database password**. Store it in a password manager. | Never in the repo or Vercel |

### Getting the SMTP values (pick one provider)

| Provider | Exact steps | Values for Supabase |
|---|---|---|
| Resend (resend.com) | 1. Sign in at https://resend.com.<br>2. **Domains** → **Add Domain** → `soh-village.site` → add the DNS records Resend shows (SPF and DKIM) at your domain registrar → **Verify**.<br>3. **API Keys** → **Create API Key** → name `supabase-smtp`, permission **Sending access**, domain `soh-village.site` → **Add** → copy the key now (`re_...`); it is shown once.<br>4. In Supabase enter: | Host `smtp.resend.com`, port `465`, username `resend`, password = the API key, sender e.g. `no-reply@soh-village.site`. (Check Resend's SMTP page if any of these have changed.) |
| Brevo (brevo.com) | 1. Sign in at https://app.brevo.com.<br>2. Open your account menu → **SMTP & API** → tab **SMTP** → note the **Login**, then **Generate a new SMTP key** and copy it.<br>3. **Senders, Domains & Dedicated IPs** → add and verify your sender address or domain.<br>4. In Supabase enter: | Host `smtp-relay.brevo.com`, port `587`, username = your Brevo SMTP login, password = the SMTP key, sender = the verified sender. |

---

## 5. Settings at the domain registrar (`soh-village.site`)
1. In Vercel: project → **Settings** → **Domains** → **Add** → `soh-village.site` (and `www.soh-village.site` if you want it).
2. Vercel shows the DNS records it needs. Use exactly what it shows (typically an **A** record for the bare domain pointing to Vercel's IP, and a **CNAME** for `www` pointing to `cname.vercel-dns.com`; newer projects show project-specific values).
3. At your registrar's **DNS** page add those records (remove any old A/CNAME records for the same names).
4. Back in Vercel the domain shows **Valid Configuration** within minutes to a few hours. Choose which of the two names is primary and let the other redirect to it.

---

## 6. Check that everything is connected
1. Vercel → **Deployments**: the latest row says **Ready**.
2. Open `https://soh-village.site/en/market`, scroll to the form, fill the title and a contact, click **Send listing**. You should see a manage code like `ABCD-EFGH-JKMN`. Copy it.
3. Supabase → **Table Editor** → `listings`: one new row with `status = pending`, a long `manage_hash`, and no readable code anywhere.
4. In that row change `status` to `approved` and save. Reload the market page: the listing appears within a minute. Its contact is shown only if you ticked permission.
5. Open `/en/manage`, enter the code: the listing loads and edit, renew and delete work.
6. Vercel → **Settings** → **Cron Jobs**: `/api/keepalive` is listed; **Run** returns 200.
7. Optional login: `/en/login` → enter your email → the email arrives → the link brings you back signed in → **My listings** shows your posts.

### If something fails
| Symptom | Likely cause | Fix |
|---|---|---|
| Sending a listing says it could not send, or the API answers `503 not_configured` | A salt is missing or under 32 characters, or `SUPABASE_SERVICE_ROLE_KEY` is missing, in the environment you are using (Production vs Preview) | Re-check section 2, rows 3 to 5; tick both Production and Preview; redeploy |
| Market board is empty and approved rows exist | Publishable key or URL wrong, not redeployed after adding them, or the `public_listings` view is missing | Re-copy rows 1 and 2; redeploy; re-run the SQL file |
| `Invalid API key` in the browser console | A different project's key, or a stray space copied with it | Re-copy from the same project; paste without spaces |
| `/api/keepalive` returns 401 | `CRON_SECRET` not set for Production | Set it (row 6) and redeploy |
| Login email never arrives | Built-in sender limit or no custom SMTP | Section 4, custom SMTP |
| Login link ends on an error page ("requested path is invalid") | The redirect URL is not in Supabase's list | Section 4, Redirect URLs |
| Everyone's old manage codes stopped working | `MANAGE_CODE_SALT` was changed | Restore the old value if you saved it |
