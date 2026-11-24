# Soh village website

Village of Soh (سه), Murcheh Khvort Rural District, Shahin Shahr and Meymeh County, Isfahan, Iran.

- `content/content.json`: the single source of facts (each with a source and a status). Edit this when new information arrives.
- `scripts/build-artifact.mjs`: `node scripts/build-artifact.mjs` builds `artifact/soh.html`, the private Claude Artifact.
- `src/app/page.tsx`: the Next.js (Vercel template) site, a placeholder that reads the same content.json. Not deployed.

Rules: label every fact (census, reported, unverified, family); no photos, family names or contact details without Al's OK; nothing deployed or shared without his go.
