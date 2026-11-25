# Soh village website

Village of Soh (سه), Murcheh Khvort Rural District, Shahin Shahr and Meymeh County, Isfahan, Iran. Persian (default, RTL) and English.

- `src/lib/site.ts`: all page text in Persian + English, by section (history, tourism, traditions, stay, shop, words, resources, banks, property, needs, careers), plus the contribute page and map data.
- `src/lib/photos.ts` + `public/photos/`: photos with caption, author, licence and source link. Five free-licence Wikimedia Commons photos of the area (none shows Soh itself; each is labelled "Region photo, not Soh"). Credits page: `/{fa,en}/credits`. Add Soh's own photos here with `scope: "soh"`.
- `content/content.json` + `scripts/build-artifact.mjs`: English research base and the private Claude Artifact (`node scripts/build-artifact.mjs`). Update `site.ts` when `content.json` changes (and vice versa).
- Routes: `/fa`, `/en`, `/{fa,en}/{credits,history,tourism,traditions,market,stay,shop,words,resources,banks,property,needs,careers,map,photos,contribute}`.
- Run: `npm run dev` (port 3000) / `npm run build`. Deploy: import the GitHub repo in Vercel.

Rules: every fact has a source or a status label (reported / unverified / family); no listings, prices, names, phone numbers or photos of people unless the owner sent them; nothing deployed without Al's go.

`needs` (نیازمندی‌ها) and `careers` (فرصت‌های شغلی) have a message-builder form (`src/components/post-form.tsx`): the site has no server yet, so people copy the finished text and send it via the Contribute channel. Add approved posts to the empty tables in `site.ts` by hand until a database exists.

Research: `research/all-links.md` is the master list of every URL found (relevant or not); `research/urls.md` has statuses and notes; `research/photo-links.md` has every photo link; `research/2026-11-23-deep-search.md` is the findings log.

## Village market (بازارچه), no payments
- `src/lib/market.ts`: listing types, categories and the approved `listings` array. `src/components/market-board.tsx` shows them with filters and hides expired ones; `market-form.tsx` builds the message people send.
- **Approving posts:** a poster sends the generated text (and a photo) through the Contribute channel. Check it (legal goods and services only, no upfront fees for jobs, no child labour, no contact details unless the poster agreed), then add one object to `listings` with `postedAt` and `expiresAt` (30 days). Rebuild and deploy.
- **Money:** the site takes no payment and no commission. Buyer and seller agree and pay outside the site. Do not add checkout without legal advice (US sanctions rules on Iran; Iranian gateways need an Iranian business, e-Namad and usually Iranian hosting).
- `database/supabase-listings.sql`: a ready schema (pending, approved, expired, contact only if allowed) for when hosting is decided and tested from inside Iran. Not applied.

## Connecting Supabase (free plan, no charges)
Until these steps are done the site uses the local `listings` array and the copy-text form. Nothing breaks.
1. Create a free project at supabase.com. Choose the region closest to your visitors.
2. SQL Editor: paste and run `database/supabase-listings.sql` once. If you set the project up before manage codes and login existed, run `database/migrations/002-manage-codes-and-login.sql` instead (it adds the new columns and the `rate_events` table). For photos on an existing project also run `database/migrations/003-listing-images.sql` (safe to repeat).
3. Project Settings > API: copy the Project URL, the `anon` public key and the `service_role` key.
4. Vercel > Project > Settings > Environment Variables: add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secret, server only), `IP_HASH_SALT`, `MANAGE_CODE_SALT` and `CRON_SECRET` (the last three: any long random text; never change `MANAGE_CODE_SALT` later, it would invalidate existing manage codes). See `.env.example`. For local runs copy it to `.env.local`.
5. Redeploy. The form now shows a **Send listing** button. Posts arrive as `pending`.
6. Approve posts in Supabase > Table Editor > `listings`: set `status` to `approved`. A trigger starts the 30-day expiry. Set `rejected` or `removed` to hide one. Only approved, unexpired rows are public, and a contact is shown only if the poster ticked permission.
7. `vercel.json` runs `/api/keepalive` daily so the free project is not paused for inactivity.

Safeguards in `src/app/api/listings/route.ts`: hidden spam field, a 3-second minimum, field limits, at most 5 posts per hour per person (hashed IP), contact required (private unless allowed), nothing public until approved. The base table is locked; the public reads only the `public_listings` view.
Never commit or paste the `service_role` key.

## Manage codes and optional login
- After sending a listing, the poster gets a one-time **manage code** (format `XXXX-XXXX-XXXX`). Only a salted hash is stored. With the code, at `/{fa,en}/manage`, they can edit, renew (once it is near expiry, up to 4 times) or delete the listing. Edits to an approved listing go back to `pending` for re-checking.
- **Optional login** by email link at `/{fa,en}/login`. Logged-in posters see all their listings at `/{fa,en}/my`. Posting without an account always works.
- Everything is server-side: the base tables stay locked and only the API routes (service role key) touch them.
- Setup guides: `docs/SECRETS.md` (which values are secret, how to set, rotate and add secrets) and `docs/LOGIN-SETUP.md` (Supabase Auth, redirect URLs, custom SMTP, email templates, privacy note).

## Photos
- Up to **10 photos per listing**, stored in one public Supabase Storage bucket `listing-images` (created by the SQL file or migration 003: public, 600 KB per file, webp/jpeg only, no policies on `storage.objects`, so the public cannot write, delete or list). No new environment variable.
- Per photo two files: `<listing id>/<id>.<webp|jpg>` (long edge at most 1280 px) and `<listing id>/<id>-t.<webp|jpg>` (thumbnail, 400 px). The browser resizes and re-encodes (this also strips EXIF/GPS) until each file is under 600 KB. The ordered names live in `listings.images`; the first is the cover. Contract: `src/lib/listing-images.ts`.
- Upload flow: create the listing (`POST /api/listings`), ask `POST /api/listings/images` for signed upload URLs (manage code or login), upload straight to Supabase (Vercel Hobby limits request bodies to 4.5 MB), then save the names with the normal `update` action (`fields.images`). The server checks names, the 10 limit and that both files exist. Errors: `too_many_images`, `bad_images`, `upload_failed`, `rate_limited`, `not_found`, `not_editable`.
- **Reviewing photos before approving:** any photo change sends an approved listing back to `pending`. In Supabase > Storage > `listing-images` > folder named by the listing `id`, open the files; or open `{SUPABASE_URL}/storage/v1/object/public/listing-images/<listing id>/<file name>` (names are in the row's `images` column). Reject or remove the listing if a photo is not acceptable.
- **Cleanup:** deleting a listing removes its photos; replacing or dropping a photo removes the old files. The daily `/api/keepalive` also removes photos of listings that are removed or rejected, or expired more than 14 days ago (at most 20 listings per run).
- **Free-plan numbers:** Storage 1 GB total, 5 GB egress per month. At about 200 KB per full photo plus 40 KB per thumbnail, 10 photos are roughly 2.4 MB per listing, so about 400 full listings fit. Thumbnails keep the board light for visitors on slow phones.
- **Local visual checks without Supabase:** `node scripts/dev-mock.mjs` runs the app on http://localhost:3333 against an in-memory mock seeded with sample listings and photos (a separate port and a throwaway copy of the project, so your own dev server keeps running).

## Photos: things to know

- Photos are cached for a year (`cacheControl` 31536000 in `src/lib/photo-upload.ts`). Deleting a photo does not purge the CDN copy on the free plan, so a removed photo can stay reachable at its old (unguessable) URL for a while. Do not rely on deletion for a privacy takedown; if that matters, lower the cache time (for example 86400).
- After the secrets are set, upload one photo end to end against the real project. If Supabase answers 401 to the signed upload, add the public anon key as an `apikey` header in `putOnce`.
- Cleanup: saving a photo list deletes files the list no longer uses; the nightly keepalive job removes leftovers of abandoned uploads (older than a day), photos of removed/rejected/long-expired listings, and files uploaded late through an old signed link.
