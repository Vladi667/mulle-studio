# Mulle® Studio

Marketing site for Mulle — a Geneva studio for brand, web and growth systems.

Static site (HTML/CSS/JS), no build step. Liquid-mercury design system:
all-monospace type, an SVG technical-drawing hero, Three.js liquid-metal scenes,
GSAP ScrollTrigger + Lenis motion.

## Structure
- `index.html` and the six section pages (`marketing`, `brand-web`, `growth-ops`, `about`, `our-work`, `contact`) + `404.html`
- `assets/` — `mulle.css`, `mulle.js` (Lenis + GSAP), `mulle-machined.js` (SVG hero drawing), `mulle-three.js` (Three.js mercury), logos, fonts via Google Fonts CDN
- `favicon.ico` (5 frames), `apple-touch-icon.png`, `icon-192/512.png`, `site.webmanifest` at the root — the hero in miniature: the wordmark's `f` as a technical drawing on paper, generated from the hero's `PATH_D` by `tools/favicon/` (see its README to regenerate)

## Run locally
Any static server, e.g. `npx http-server -p 4178 -c-1 .`

## Deploy
Static deploy on Vercel plus one Edge function (`api/contact.js`).
Pushing to `main` deploys to production automatically.

### Page-generation order
Anything that rebuilds a page from its shell drops what a later step injected, so
when you run more than one, run them in this order and never hand-edit a
generated page:

```
build-landers → build-tarifs → add-inbound → inject-estimator → patch-twin-schema → inject-analytics
```

`scripts/seo/inject-analytics.mjs` is idempotent and must run **last**: it puts the
Vercel Web Analytics + Speed Insights snippets and `assets/analytics.js` on every
page. Run it after any page rebuild, then `scripts/seo/indexnow.mjs`.

`npm run rebuild-meta` runs the four idempotent metadata scripts in order
(org schema, analytics, sitemap, schema dates). None of them invents anything:
prices come from `prices.mjs` and dates from git.

`scripts/seo/patch-pricing-lane.mjs` runs **after `patch-dates`** and before
`inject-analytics`: it writes the visible "Mis à jour le …" byline on the ten
guides from each page's `dateModified`, and keeps the "Autres questions" FAQ
items in sync with their FAQPage schema. Because the byline reads the date
patch-dates wrote, the honest order after a content change is: commit →
`patch-dates` → `patch-pricing-lane` → commit again.

### After every deploy

```
npm run verify-live
```

It fetches production and fails on a regression: a retired client claim, a
superseded price, a missing organisation schema or analytics tag, a broken
hreflang pair, a sitemap with one hard-coded date, or `/api/contact` not
answering. `npm run verify-patterns` proves each pattern still fires.

**`seo-build.mjs` regenerates the three FR service twins from English and will
strip their SEO bands.** It refuses to run on import, but when you run it
deliberately, re-inject the bands afterwards and re-run `npm run rebuild-meta`.

Until 2026-08-16 the Vercel project had **no Git repository connected**, so pushes deployed
nothing and every release was a manual CLI deploy. Production silently served a stale build
for days at a time before anyone noticed. If that ever recurs, the symptom is: commits on
`main`, nothing live, and no error anywhere.

Check what is actually live before assuming a push shipped:

```
npx vercel ls --yes | head -4                                   # newest deployment + its age
curl -sI https://agencefritz.com/ | grep -iE "age|last-modified"
```

Manual deploy, if the Git integration is ever disconnected again:

```
npx vercel --prod --yes
```

The contact form posts to `api/contact.js` (Edge function), which records the
enquiry in Supabase `fritz_leads`, emails the studio through Resend and sends the
visitor a receipt. If that call fails, or while Resend is unconfigured, the page
also posts to FormSubmit, so the studio is notified by at least one channel;
`mailto:contact@agencefritz.com` is the last resort shown to the visitor. With
JavaScript disabled the form posts itself and the function answers `303` back to
`?sent=1`. Required env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Optional:
`RESEND_API_KEY`, `RESEND_FROM`, `RESEND_TO`. The client logic is
`assets/contact-form.js`, shared by `/contact` and `/fr/contact`.
