// Restore the Service + FAQPage + BreadcrumbList schema on the three FR service twins.
//
// WHY THIS EXISTS: the W4 band (visible content + FAQ) is still on those pages, but the
// <head> schema block that enhance-twins.mjs injects had been wiped — seo-build.mjs
// regenerates the twins from the EN source and rewrites <head>, which drops it.
//
// WHY NOT JUST RE-RUN enhance-twins.mjs: w4-data.json still carries the PRE-CUT prices
// (1'500 / 1'700 / 2'500). Re-running it would regenerate the bands from that file and push
// stale prices back onto three live commercial pages, and would also undo patch-w4.mjs.
//
// So this script is additive only. It never touches the band; it reads the FAQ and heading
// that are ACTUALLY RENDERED and builds the schema from them, which also guarantees the
// structured data matches the visible content (Google requires that).
//
//   node patch-twin-schema.mjs w4-data.json
import { load } from 'cheerio';
import fs from 'fs';

const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const O = 'https://agencefritz.com';
const DATA = JSON.parse(fs.readFileSync(process.argv[2] || 'w4-data.json', 'utf8'));

let changed = 0;
for (const P of DATA) {
  const file = `${ROOT}/fr/${P.file}.html`;
  if (!fs.existsSync(file)) { console.log(`- skip (missing): ${P.file}`); continue; }
  const $ = load(fs.readFileSync(file, 'utf8'), { decodeEntities: false });

  const band = $('.lp-seo').first();
  if (!band.length) { console.log(`! no .lp-seo band in ${P.file} — run enhance-twins first`); continue; }

  const h2 = band.find('h2').first().text().trim();
  const faq = band.find('.lp-faq-item').map((_, el) => ({
    q: $(el).find('h3').first().text().trim(),
    a: $(el).find('p').first().text().trim()
  })).get().filter(f => f.q && f.a);

  if (!h2 || !faq.length) { console.log(`! ${P.file}: h2="${h2}" faq=${faq.length} — refusing to write partial schema`); continue; }

  const url = O + P.canonical;
  const graph = [
    { '@type': 'Service', name: h2, serviceType: P.serviceType, areaServed: ['Genève', 'Suisse romande'], provider: { '@id': O + '/#org' }, url },
    { '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: O + '/fr/' },
      { '@type': 'ListItem', position: 2, name: h2, item: url }
    ] }
  ];

  $('script[type="application/ld+json"].lp-seo-ld').remove(); // idempotent
  $('head').append(`\n<script type="application/ld+json" class="lp-seo-ld">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`);
  fs.writeFileSync(file, $.html());
  changed++;
  console.log(`✓ ${P.file}: Service + FAQPage(${faq.length}) + BreadcrumbList · h2 "${h2}"`);
}
console.log(`\n${changed} page(s) updated.`);
