# Soh village design system

Structure and rhythm follow a visitor-guide layout (utility bar, tall header with hanging emblem, full-bleed hero, dark-panel / pale-band alternation, square corners). Theme: turquoise. No text, photos, logo or fonts are copied. All CSS lives in `src/app/globals.css` (layers: base, components, then Tailwind utilities, so a utility class can override a component class).

## Tokens (CSS custom properties on `:root`; dark values under `prefers-color-scheme: dark`)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--ink` | #0b2f36 | #f2fbfa | headings |
| `--text` | #10252a | #e4f0ef | body |
| `--muted` | #4a6368 | #9db8b5 | secondary text (white, `--mist`, `--sage`) |
| `--panel` / `--panel-2` | #0b3a44 / #0f4b57 | #0e3039 / #14414c | dark panels, utility bar, footer, inactive tabs, cards / hover |
| `--action` / `--action-hover` | #077b80 / #055f63 | #1fb3ae / #3fd0cb | buttons, active tabs. Text on it: `--on-action` (white / #04262b) |
| `--turq` | #1fc8c3 | same | rules, icons, accents ON DARK panels only |
| `--sage`, `--mist` | #cfe3df, #eef6f6 | #12302f, #0e2429 | welcome band, pale sections |
| `--surface`, `--bg`, `--line` | #fff, #fff, #d3e3e1 | #10282e, #0a1c20, #23454a | cards, page, borders |
| `--apple` | #b0342c | #ee8279 | Persian wordmark on light, tiny accents |
| `--focus` | #0a6fd6 | #fff | focus ring (white inside dark panels) |
Extra tokens: `--white`, `--on-panel`, `--panel-muted` (secondary text on panels), `--focus-on-dark`, `--field-line` (input border, 3:1), `--scrim` (photo overlays, shadows), `--amber` (unverified), `--accent-text` / `--accent-line` (link text and rule colour; switch to turquoise automatically inside dark contexts), `--shadow-hover`. Legacy aliases: `--fg`, `--accent`, `--accent-fg`, `--accent-soft`, `--chip`, `--shadow`. Shape: `--radius` 0, `--radius-sm` 2px, `--container` 1240px, `--gutter` 24px (16px < 640), `--section-y`, `--header-h` 72px, `--logo` 76px, `--reading` 780px.
Dark contexts (`.ut-bar .panel .section--panel .site-footer .page-banner .navy-card .on-dark`) set white text, white focus ring, turquoise accents and a lighter `--muted`. Never put a hard-coded colour in a component; add a token.

## Typography
Headings: Fraunces 600 (en), Vazirmatn 700 (fa). Body: Poppins (en), Vazirmatn (fa). Fonts load in `[lang]/layout.tsx` (`--font-body`, `--font-serif`, `--font-fa`); `:lang(fa)` switches font, so an inline `<span lang="fa">` works inside English text. h1 `clamp(38px,5.2vw,60px)`, h2 `clamp(28px,3.4vw,38px)`, h3 24px, body 17-18px/1.65 (fa 1.8). Uppercase and letter-spacing apply to English only (`:lang(fa)` resets them in `.btn .eyebrow .tab .link-arrow .nav-trigger`).

## Class catalogue
Layout
- `.wrap` / `.container`: 1240px content width with gutters. `.narrow`, `.reading`: 780px column. `.split` (3fr 2fr from 1024px; `.split--even`, `.split--wide-end`), `.grid-cards`, `.stack`.
- `.section` + `.section--mist | --sage | --panel | --action | --tight`: `<section className="section section--mist"><div className="wrap">...</div></section>`.
- `.panel` (dark, padding 48px), `.on-dark` (dark context on any element).
Buttons and links
- `.btn` + `.btn--primary | --dark | --light | --ghost`: `<Link className="btn btn--primary" href="/fa/history">...</Link>`. Old `.btn-primary .btn-ghost` still work.
- `.btn-corner`: wrap an image in `.media-wrap` (position relative) and add `<Link className="btn btn--primary btn-corner">`.
- `.icon-btn` (44px icon button), `.icon-btn--solid`, `.link`, `.link-arrow`: `<Link className="link-arrow" href="..">Browse all <Arrow /></Link>`.
- `.eyebrow`: `<p className="eyebrow">Welcome to Soh village</p>` (rule line fills the row). `.section-title`, `.lede`.
Cards and rows
- `.card`, `.item`, `.lift` / `.card-hover` (hover lift), `.post-card` (`__body`, `__meta`), `.feature-card`, `.media` (set `style={{"--ar":"4 / 3"}}`; reserves space), `.media-wrap`.
- `.navy-card` (96px row): `<a className="navy-card"><span className="navy-card__thumb"><Image .../></span><span className="navy-card__body"><span className="navy-card__title">..</span><span className="navy-card__meta">..</span></span></a>`; for events put `<span className="date-block"><span className="date-block__big">8-10</span><span className="date-block__small">Muharram</span></span>` first.
- `.tabs` + `.tab[aria-selected="true"]` (or `.is-active`): `<div role="tablist" className="tabs"><button role="tab" aria-selected className="tab">History</button></div>`. Behaviour (arrow keys) is the component's job. `.tab-count` for "Showing 3 of 9".
- `.chip`, `.tag` (square), `.pill`, `.notice`, `.todo`, `.table` (dark header, zebra), `.breadcrumb`.
- `.page-banner` (+ `__bg`, `__inner`, `__intro`, `__credit`): `<header className="page-banner"><div className="page-banner__bg"><Image fill priority alt=".." sizes="100vw"/></div><div className="page-banner__credit"><Credit .../></div><div className="wrap page-banner__inner"><ol className="breadcrumb">..</ol><h1>..</h1><p className="page-banner__intro">..</p></div></header>`. Always render `Credit` for region photos.
- `.hero` (+ `__slide[data-active]`, `__caption`, `__control`, `__dots`, `__dot`): styling only; the slideshow component supplies state, pause button and reduced-motion handling.
Forms
- `.field` > `.label` + `.input | .select | .textarea` (+ `.field-hint`). 2px radius, 3:1 border, 3px focus ring.
Shell (already in the layout)
- `.ut-bar`, `.ut-bar__inner`, `.ut-link`, `.site-header`, `.logo-block` (`--light`, `--flat`), `.nav-primary .nav-item .nav-trigger[aria-expanded] .mega`, `.drawer`, `.site-footer`, `.skip-link`, `.sr-only`, `.scroll-lock`.
Legacy (restyled, still valid): `card item btn btn-primary btn-ghost chip tag link todo muted wrap narrow pill eyebrow section-title hero-photo fa-display site-header nav menu lift region-badge pager-link section-pager footer-links`.

## Shell components and nav data
- `src/lib/nav.ts`: `navGroups` = `[{ id, label: {fa,en}, description: {fa,en}, items: [{ slug, label? }] }]`. `slug` is a section from `site.ts` (label taken from its title) or a standalone route (`photos map references credits contribute manage`, labels in `routeLabels`). `resolveNav(lang)` returns plain strings with hrefs (`/fa/history`) for client components. `ui` holds shell microcopy. Do not import `nav.ts` runtime values from client components (it pulls `site.ts`); pass resolved data as props.
- `src/lib/social.ts` (`socialLinks`), `icons.tsx` (`SearchIcon Chevron ChevronEnd Arrow PauseIcon PlayIcon CloseIcon MenuIcon FacebookIcon InstagramIcon TelegramIcon SocialIcon`), `site-header.tsx`, `nav-menu.tsx`, `mobile-drawer.tsx`, `site-footer.tsx`, `logo-block.tsx`, `lang-switch.tsx`, `auth-link.tsx`, `nav-link.tsx`, `site-search.tsx`, `src/lib/use-live-listings.ts` (`useLiveListings(): Listing[]`, [] when Supabase is not configured).

## RTL rules
`<html dir>` follows the route. Use logical properties only: `margin-inline`, `padding-inline`, `inset-inline-start/end`, `border-inline-*`, `text-align: start`; Tailwind `ms- me- ps- pe- start- end-`. Arrows and end chevrons use `.icon-arrow` / `.icon-chevron-end` and flip in RTL by CSS. The hanging emblem sits at the inline start. Numbers, URLs and Latin tokens inside Persian text get `dir="ltr"`. Inline Persian in English pages needs `lang="fa"`. Persian never gets uppercase or letter-spacing.

## Accessibility checklist (WCAG 2.2 AA)
- Skip link first in the tab order, target `<main id="main">`; landmarks header, nav (with aria-label), main, footer.
- 3px `--focus` outline with 2px offset on everything interactive (white on dark panels). Touch targets at least 44x44.
- Contrast at least 4.5:1 (large text 3:1) for every token pair in both modes; check new pairs. Use `--accent-text`, not `--turq`, for text on light.
- Colour is never the only signal (active tab also has colour block + `aria-selected`; honesty labels are text).
- Dropdowns: `aria-expanded` + `aria-controls`, Escape closes and returns focus, arrows move, focus leaving closes. Drawer: `role="dialog" aria-modal`, focus trap, Escape, scroll lock.
- Carousels: pause control, pause on keyboard focus, no autoplay under `prefers-reduced-motion`. Global reduced-motion rule disables transitions.
- Every image has alt text from the data; region photos always show the "Region photo, not Soh" label via `Credit`.
- Forms keep visible labels and `aria-live` status messages. `html lang` follows the route.

## Illustrations (AI-made, not photos)
`src/lib/illustrations.ts` holds 14 generated illustrations (`public/illustrations/<slug>.jpg`, 1536x1024, alt text fa/en); `illustrationFor(slug)` maps a section slug, plus the separate key `tasua`. They are not photographs and not real places or people. Labelling rule: every place that shows one carries `<IllustrationLabel lang />` (EN "Illustration, not a photo", FA «تصویرسازی، نه عکس»): `overlay` as a badge on the image corner (`small` for the 96px thumbnails), or inline in `.page-banner__credit` on banners. A real photo of a section always wins; the illustration is the fallback (see `[section]/page.tsx`). Never use one without the label.

## Videos and posts (previews)
One shared client component, `src/components/media-preview.tsx` (`MediaCard`), shows every third-party YouTube video and Facebook / Instagram post, on section pages, the references page and the gallery. Data: `src/lib/youtube.ts` and `src/lib/social-embeds.ts`, merged by `src/lib/media.ts` (`mediaFor(section, lang, blocks)`, `allMedia(lang)`, `withoutPreviewed`); plain-string type in `media-types.ts` (safe for client bundles). Nothing loads from the platform until the visitor presses play / "Show the post"; the only early request is the lazy YouTube thumbnail (`i.ytimg.com`), with a tidy panel if it fails. Playing swaps in the `youtube-nocookie.com` iframe.
- `MediaBlock` (server, `media-block.tsx`): the single "Videos and posts" block of a section page, videos first, 6 up front, rest inside `.ms-details` ("Show all N"). `MediaList`: the same cards for the references page.
- Classes (misc.css): `.mp-grid` (card grid; an opened post spans the row), `.mp-stage` (16/9 box, `--tile` 4/3 in the gallery), `.mp-poster` (+ `__img`), `.mp-play` (play badge), `.mp-kind` (corner label), `.mp-stage--post` + `.mp-post__icon` (post panel with the "Show the post" button), `.mp-frame`, `.mp-title`, `.mp-tile` (gallery tile; `.ms-tile` look), `.mp-filter` (gallery filter: `.tabs` + `.tab[aria-pressed]`), `.mp-more`.
- Gallery (`/photos`, label "Photos and videos"): `Gallery` takes `groups` of photos plus media; a video or post joins the first of its sections that has photos, else a group named by its section is added; filter All / Photos / Videos and posts.
