# Soh village website

Village of Soh (سه), Murcheh Khvort Rural District, Shahin Shahr and Meymeh County, Isfahan, Iran. Persian (default, RTL) and English.

- `src/lib/site.ts`: all page text in Persian + English, by section (history, tourism, traditions, stay, shop, words, resources, banks, property), plus the contribute page and map data.
- `src/lib/photos.ts` + `public/photos/`: add photos here (alt text, caption, credit). Empty for now.
- `content/content.json` + `scripts/build-artifact.mjs`: English research base and the private Claude Artifact (`node scripts/build-artifact.mjs`). Update `site.ts` when `content.json` changes (and vice versa).
- Routes: `/fa`, `/en`, `/{fa,en}/{history,tourism,traditions,stay,shop,words,resources,banks,property,map,photos,contribute}`.
- Run: `npm run dev` (port 3000) / `npm run build`. Deploy: import the GitHub repo in Vercel.

Rules: every fact has a source or a status label (reported / unverified / family); no listings, prices, names, phone numbers or photos of people unless the owner sent them; nothing deployed without Al's go.
