# SEO build scripts (W1)

Run from repo root after `npm i cheerio playwright`:
- `node scripts/seo/seo-build.mjs` — regenerate /fr twins from EN + assets/i18n.js dictionary
- `node scripts/seo/build-tarifs.mjs` — regenerate /fr/tarifs
- `node scripts/seo/build-sitemap.mjs` — regenerate sitemap.xml

Excluded from Vercel deploy via .vercelignore.
