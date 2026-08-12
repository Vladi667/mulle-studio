import fs from 'fs';
const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const O = 'https://agencefritz.com';
const LM = '2026-07-19';

// [enPath, frPath, priority]  (frPath null = EN-only; enPath null = FR-only)
const PAIRS = [
  ['/', '/fr/', '1.0'],
  ['/brand-web', '/fr/agence-branding-geneve', '0.9'],
  ['/marketing', '/fr/agence-marketing-geneve', '0.9'],
  ['/growth-ops', '/fr/systemes-croissance-ia', '0.9'],
  ['/pricing', '/fr/tarifs', '0.9'],
  ['/web-design-agency-geneva', '/fr/creation-site-web-geneve', '0.9'],
  [null, '/fr/agence-web-suisse-romande', '0.9'],
  ['/branding-agency-switzerland', '/fr/agence-branding-suisse', '0.9'],
  [null, '/fr/guides/prix-site-web-geneve', '0.8'],
  ['/website-cost-switzerland', '/fr/guides/combien-coute-site-web-suisse', '0.8'],
  ['/logo-design-cost-switzerland', '/fr/guides/prix-logo-identite-visuelle-suisse', '0.8'],
  ['/web-agency-vs-freelancer-switzerland', '/fr/guides/agence-ou-freelance-suisse', '0.8'],
  [null, '/fr/sites-web-hotellerie-restauration', '0.8'],
  [null, '/fr/guides/wix-ou-site-sur-mesure', '0.8'],
  [null, '/fr/guides/creer-un-site-internet-en-suisse', '0.8'],
  [null, '/fr/guides/refonte-site-web-suisse', '0.8'],
  [null, '/fr/agence-web-fribourg', '0.7'],
  [null, '/fr/agence-web-neuchatel', '0.7'],
  ['/our-work', '/fr/realisations', '0.7'],
  ['/about', '/fr/a-propos', '0.7'],
  ['/contact', '/fr/contact', '0.7'],
  ['/privacy', '/fr/confidentialite', '0.3'],
];

function alts(en, fr) {
  let s = '';
  if (en) s += `\n    <xhtml:link rel="alternate" hreflang="en" href="${O}${en}"/>`;
  if (fr) s += `\n    <xhtml:link rel="alternate" hreflang="fr-CH" href="${O}${fr}"/>`;
  s += `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${O}${en || fr}"/>`;
  return s;
}
function url(loc, pr, en, fr) {
  return `  <url>\n    <loc>${O}${loc}</loc>${alts(en, fr)}\n    <lastmod>${LM}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${pr}</priority>\n  </url>`;
}

const urls = [];
for (const [en, fr, pr] of PAIRS) {
  if (en) urls.push(url(en, pr, en, fr));
  if (fr) urls.push(url(fr, pr, en, fr));
}
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
fs.writeFileSync(ROOT + '/sitemap.xml', xml);
console.log(`sitemap: ${urls.length} URLs`);
