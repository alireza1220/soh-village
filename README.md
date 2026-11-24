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
2. SQL Editor: paste and run `database/supabase-listings.sql` once.
3. Project Settings > API: copy the Project URL, the `anon` public key and the `service_role` key.
4. Vercel > Project > Settings > Environment Variables: add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secret, server only), `IP_HASH_SALT` and `CRON_SECRET` (any long random text). See `.env.example`. For local runs copy it to `.env.local`.
5. Redeploy. The form now shows a **Send listing** button. Posts arrive as `pending`.
6. Approve posts in Supabase > Table Editor > `listings`: set `status` to `approved`. A trigger starts the 30-day expiry. Set `rejected` or `removed` to hide one. Only approved, unexpired rows are public, and a contact is shown only if the poster ticked permission.
7. `vercel.json` runs `/api/keepalive` daily so the free project is not paused for inactivity.

Safeguards in `src/app/api/listings/route.ts`: hidden spam field, a 3-second minimum, field limits, at most 5 posts per hour per person (hashed IP), contact required (private unless allowed), nothing public until approved. The base table is locked; the public reads only the `public_listings` view.
Never commit or paste the `service_role` key.
