# Soh village website

Village of Soh (سه), Murcheh Khvort Rural District, Shahin Shahr and Meymeh County, Isfahan, Iran. Persian (default, RTL) and English.

- `src/lib/site.ts`: all page text in Persian + English, by section (history, tourism, traditions, stay, shop, words, resources, banks, property, needs, careers), plus the contribute page and map data.
- `src/lib/photos.ts` + `public/photos/`: photos with caption, author, licence and source link. Five free-licence Wikimedia Commons photos of the area (none shows Soh itself; each is labelled "Region photo, not Soh"). Credits page: `/{fa,en}/credits`. Add Soh's own photos here with `scope: "soh"`.
- `content/content.json` + `scripts/build-artifact.mjs`: English research base and the private Claude Artifact (`node scripts/build-artifact.mjs`). Update `site.ts` when `content.json` changes (and vice versa).
- Routes: `/fa`, `/en`, `/{fa,en}/{credits,history,tourism,traditions,market,stay,shop,words,resources,banks,property,needs,careers,map,photos,contribute}` plus the account routes `/{fa,en}/{login,reset-password,profile,my}` (`/{fa,en}/manage` redirects to `my`).
- Run: `npm run dev` (port 3000) / `npm run build`. Deploy: import the GitHub repo in Vercel.

Rules: every fact has a source or a status label (reported / unverified / family); no listings, prices, names, phone numbers or photos of people in the repo unless the owner sent them (the people on the mock server are fake); nothing deployed without Al's go.

## Four boards, one table
`market` (بازارچه), `careers` (فرصت‌های شغلی), `needs` (نیازمندی‌ها) and `property` (خرید و فروش ملک) are the four **boards**. Each page shows the live approved ads of its board (read from the public view `public_listings`, filter `board=eq.<board>`) above the static text from `site.ts`, plus a posting form. Everything lives in ONE `listings` table with a `board` column; what each board calls its types, categories and fields is data in `src/lib/boards.ts` (the forms, validation, lists and detail view all read it). Careers keeps its work arrangement as a code in `quantity`; property keeps size in `quantity` and the deed type in `available`.

Research: `research/all-links.md` is the master list of every URL found (relevant or not); `research/urls.md` has statuses and notes; `research/photo-links.md` has every photo link; `research/2026-11-23-deep-search.md` is the findings log.

## Village market (بازارچه), no payments
- Boards: `src/lib/boards.ts` (config), `src/lib/market.ts` (types and static helpers), `src/components/market-board.tsx` and friends (lists, filters, detail), `src/components/listing-form.tsx` (one config-driven posting form for all four boards).
- **Approving posts:** every new or edited ad is `pending`. Check it (legal goods and services only, no upfront fees for jobs, no child labour, nothing offensive), then in Supabase > Table Editor > `listings` set `status` to `approved` (30-day expiry starts by trigger). Edits of an approved ad send it back to `pending`.
- **Money:** the site takes no payment and no commission. Buyer and seller agree and pay outside the site. Do not add checkout without legal advice (US sanctions rules on Iran; Iranian gateways need an Iranian business, e-Namad and usually Iranian hosting).
- `database/supabase-listings.sql`: the complete fresh-install schema (listings, profiles, rate limits, public view, buckets, grants). `database/migrations/`: the upgrade steps in order (002 manage codes and login, 003 photos, 004 service-role grants, **005 accounts, profiles, avatars, boards; retires manage codes**). All safe to run again.

## Connecting Supabase (free plan, no charges)
Until these steps are done the boards show only the built-in text and the log-in and post forms say "not available yet". Nothing breaks.
1. Create a free project at supabase.com. Choose the region closest to your visitors.
2. SQL Editor: new project: run `database/supabase-listings.sql` once. Existing project: run the missing migrations in order (`002`, `003`, `004`, then **`005-accounts-boards.sql`**). **Run migration 005 BEFORE deploying this version of the site**: it adds the profiles table, the `avatars` bucket, boards and the new view, and drops `manage_hash` / `poster_name` for good.
3. Project Settings > API: copy the Project URL, the publishable (anon) key and the secret (service_role) key.
4. Vercel > Project > Settings > Environment Variables: add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secret, server only), `IP_HASH_SALT` (32+ random characters) and `CRON_SECRET`. `MANAGE_CODE_SALT` is retired: delete it if it is still there. See `.env.example`. For local runs copy it to `.env.local`.
5. Supabase > Authentication: set up email + password and the email link, minimum password length 8, the exact redirect URLs and (strongly recommended) custom SMTP: see `docs/LOGIN-SETUP.md`.
6. Redeploy. Posts arrive as `pending`; approve them in Table Editor > `listings` (`status = approved`).
7. `vercel.json` runs `/api/keepalive` daily so the free project is not paused for inactivity.

Never commit or paste the `service_role` key.

## Accounts, profile, avatar
- **Reading is public; every write needs a login.** Creating, editing, renewing and deleting an ad, signing photo uploads, and every profile change go through our API, which verifies the Supabase access token itself and answers `401 unauthorized` without one (the page only mirrors this with a friendly "log in to post" card and returns the visitor to where they wanted to go).
- **Login** at `/{fa,en}/login`: email + password (create account, log in, forgot password), or an email link. `/{fa,en}/reset-password` is where the reset mail lands. A person who logged in by link can set a password later on `/{fa,en}/profile`. Passwords go only to Supabase Auth over HTTPS; this site never stores or logs them.
- **Profile** at `/{fa,en}/profile` (table `public.profiles`, one row per user, server-only access): first name, family name, mobile (`09XXXXXXXXX`; Persian digits, `+98`, `0098`, spaces and dashes accepted; **format-checked only, not verified by SMS**), optional tiny picture, and "show my first name and picture on my ads" (default on). Until the profile exists nobody can post (`403 profile_required`).
- **Avatar:** cropped square and shrunk to 96x96 WebP/JPEG (at most 12 KB) in the browser, uploaded through a server-signed URL to the public bucket `avatars` (`<user id>/<random>.<webp|jpg>`, 20 KB limit, no storage policies). One avatar per user: a new one deletes the old object.
- **Privacy:** the phone is never public unless the poster ticks "show my contact on this ad" for that ad (prefilled from the profile, editable). The family name is never public. The first name and avatar appear on public ads only if `show_on_ads`. The browser reads only the explicit columns of the `public_listings` view.
- **My ads** at `/{fa,en}/my` (`/manage` redirects there): the logged-in user's own ads on every board, with edit, photos, renew (near expiry, up to 4 times) and delete. Manage codes are **retired**: nothing issues or accepts them, and ownership is the verified user id (`owner_id`, required on new rows).
- Limits: per IP (generous: carrier NAT in Iran) and per user (6 new ads per hour, 60 manage calls, 12 photo signings, 30 profile calls, 10 avatar signings), `src/lib/limits.ts`.
- Setup guides: `docs/SECRETS.md` (secrets), `docs/ENV-VARIABLES.md` (every variable and dashboard setting), `docs/LOGIN-SETUP.md` (Auth, redirect URLs, Confirm email trade-off, custom SMTP, email templates, privacy note).

## API summary
All routes are `POST`, JSON, header `Authorization: Bearer <Supabase access token>`; errors are `{error: <code>}` (codes and friendly texts in `src/lib/api-errors.ts`; shapes in `src/lib/api-types.ts`).
- `POST /api/listings`: create (needs a complete profile). Body `{board, type, category, title, quantity?, price?, area?, available?, details?, contactKind?, contactValue?, contactPublic?}`. Answer `{ok:true, id}`.
- `POST /api/my/listings`: `{action:"list"}`; `{action:"update", id, fields}`; `{action:"renew", id}`; `{action:"delete", id}`.
- `POST /api/listings/images`: `{listingId, items:[{ext:"webp"|"jpg"}]}` returns one-time signed upload URLs.
- `POST /api/profile`: `{action:"get"}`; `{action:"save", fields}`; `{action:"avatar_sign", ext}`.
- `GET /api/keepalive`: cron only (`CRON_SECRET`).
Gate order in every write route: configured (503) > Bearer present (401) > per-IP limit (429) > token valid (401) > per-user limit (429) > JSON (400) > profile (403) > logic. Code: `src/lib/server-guard.ts`.

## Photos
- Up to **10 photos per listing**, stored in one public Supabase Storage bucket `listing-images` (created by the SQL file or migration 003: public, 600 KB per file, webp/jpeg only, no policies on `storage.objects`, so the public cannot write, delete or list). No new environment variable.
- Per photo two files: `<listing id>/<id>.<webp|jpg>` (long edge at most 1280 px) and `<listing id>/<id>-t.<webp|jpg>` (thumbnail, 400 px). The browser resizes and re-encodes (this also strips EXIF/GPS) until each file is under 600 KB. The ordered names live in `listings.images`; the first is the cover. Contract: `src/lib/listing-images.ts`.
- Upload flow: create the listing (`POST /api/listings`), ask `POST /api/listings/images` for signed upload URLs (login, own listing), upload straight to Supabase (Vercel Hobby limits request bodies to 4.5 MB), then save the names with the `update` action of `/api/my/listings` (`fields.images`). The server checks names, the 10 limit and that both files exist. Errors: `too_many_images`, `bad_images`, `upload_failed`, `rate_limited`, `not_found`, `not_editable`.
- **Reviewing photos before approving:** any photo change sends an approved listing back to `pending`. In Supabase > Storage > `listing-images` > folder named by the listing `id`, open the files; or open `{SUPABASE_URL}/storage/v1/object/public/listing-images/<listing id>/<file name>` (names are in the row's `images` column). Reject or remove the listing if a photo is not acceptable.
- **Cleanup:** deleting a listing removes its photos; replacing or dropping a photo removes the old files. The daily `/api/keepalive` also removes photos of listings that are removed or rejected, or expired more than 14 days ago (at most 20 listings per run).
- **Free-plan numbers:** Storage 1 GB total, 5 GB egress per month. At about 200 KB per full photo plus 40 KB per thumbnail, 10 photos are roughly 2.4 MB per listing, so about 400 full listings fit. Thumbnails keep the board light for visitors on slow phones.
- **Local visual checks without Supabase:** `node scripts/dev-mock.mjs` runs the app on http://localhost:3333 against an in-memory mock Supabase (port 54398) seeded with fake people, profiles (one with a picture, one hiding their name) and sample ads with photos on all four boards. Demo logins: `maryam.demo@example.com`, `reza.demo@example.com`, `sara.demo@example.com`, password `demo-pass-1234` (fake, mock only); sign up with any new address too. `http://localhost:54398/__admin/set-confirm?on=1` switches the mock to "Confirm email ON"; `/__admin/dump` lists the mails Supabase would have sent. Separate port and a throwaway copy of the project, so your own dev server keeps running. Stop it with `pkill -f scripts/dev-mock.mjs`.
- **Admin area:** admins are made only by editing `profiles.role` in Supabase (after running migration 006); they can approve / remove ads, see users and write news, blog posts and events in Markdown, with one cover image and a priority (urgent = top banner on the home page, featured = lower band); run migration `007-post-priority-cover.sql` for that. See `docs/ADMIN.md`; test with `node scripts/test-admin.mjs`.
- **Tests:** `node scripts/test-market.mjs` (accounts, profile, avatar, boards, privacy, rate limits, SQL checks; starts its own servers) and `node scripts/test-photos.mjs` (photo helpers).

## Photos: things to know

- Photos are cached for a year (`cacheControl` 31536000 in `src/lib/photo-upload.ts`). Deleting a photo does not purge the CDN copy on the free plan, so a removed photo can stay reachable at its old (unguessable) URL for a while. Do not rely on deletion for a privacy takedown; if that matters, lower the cache time (for example 86400).
- After the secrets are set, upload one photo end to end against the real project. If Supabase answers 401 to the signed upload, add the public anon key as an `apikey` header in `putOnce`.
- Cleanup: saving a photo list deletes files the list no longer uses; the nightly keepalive job removes leftovers of abandoned uploads (older than a day), photos of removed/rejected/long-expired listings, and files uploaded late through an old signed link.
