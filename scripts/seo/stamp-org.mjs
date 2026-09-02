/* ─────────────────────────────────────────────────────────────────
   stamp-org.mjs — ONE organisation, described the same way everywhere
   ─────────────────────────────────────────────────────────────────
   The audit found the same @id (#org) defined two different ways:

     the two homepages : sameAs present, ENGLISH description on both
                         (so the French homepage described itself in
                         English), areaServed "CH", no priceRange
     the other 34 pages: no sameAs, FRENCH description on English pages,
                         areaServed array, priceRange "CHF 390–2800"

   and seo-build.mjs hard-coded priceRange "CHF 490–2900", the July
   figures, so any regenerated page republished prices we do not charge.
   That is exactly the failure prices.mjs was created to prevent.

   This writes one canonical block per language onto every page, with the
   price range computed from prices.mjs. It replaces the existing #org
   script in place and leaves every other JSON-LD block (Service,
   FAQPage, Article, BreadcrumbList) untouched.

     node scripts/seo/stamp-org.mjs
     node scripts/seo/stamp-org.mjs --check
   ───────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { PRICES } from './prices.mjs';

const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const O = 'https://agencefritz.com';
const CHECK = process.argv.includes('--check');

// price range spans every published price, one-off and monthly
const ALL = [
  PRICES.identity, PRICES.vitrine, PRICES.ecommerce,
  ...Object.values(PRICES.marketing), ...Object.values(PRICES.growthOps),
];
// plain digits, no apostrophe grouping: this matches the value already live sitewide
const PRICE_RANGE = `CHF ${Math.min(...ALL)}–${Math.max(...ALL)}`;

// Every profile that is genuinely the studio's or its founder's.
// A LinkedIn company page goes in here the day it exists.
const SAME_AS = [
  'https://www.linkedin.com/in/th%C3%A9o-muller-90315517b',
];

const COPY = {
  en: {
    description: 'Independent studio in Geneva: brand identity, website design and AI growth systems. Built to last.',
    areaServed: ['Geneva', 'French-speaking Switzerland', 'Switzerland'],
    locality: 'Geneva',
    knowsAbout: ['Brand identity', 'Web design', 'Marketing', 'Growth operations', 'Artificial intelligence'],
  },
  fr: {
    description: "Studio indépendant à Genève : identité de marque, création de site web et systèmes de croissance propulsés par l'IA. Conçu pour durer.",
    areaServed: ['Genève', 'Suisse romande', 'Suisse'],
    locality: 'Genève',
    knowsAbout: ['Identité de marque', 'Création de site web', 'Marketing', 'Growth', 'Intelligence artificielle'],
  },
};

export function orgNode(lang) {
  const c = COPY[lang];
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${O}/#org`,
    name: 'Agence Fritz',
    alternateName: 'Fritz',
    url: `${O}/`,
    image: `${O}/assets/og.png`,
    description: c.description,
    email: 'contact@agencefritz.com',
    inLanguage: lang === 'fr' ? 'fr-CH' : 'en',
    areaServed: c.areaServed,
    address: { '@type': 'PostalAddress', addressLocality: c.locality, addressRegion: 'GE', addressCountry: 'CH' },
    geo: { '@type': 'GeoCoordinates', latitude: 46.2044, longitude: 6.1432 },
    sameAs: SAME_AS,
    priceRange: PRICE_RANGE,
    knowsAbout: c.knowsAbout,
  };
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href;
if (isMain) main();

function main() {
const files = execFileSync('git', ['ls-files', '*.html'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
let changed = 0, ok = 0, added = 0;

for (const file of files) {
  const src = readFileSync(`${ROOT}/${file}`, 'utf8');
  const lang = /<html[^>]+lang="fr/i.test(src) ? 'fr' : 'en';
  const wanted = JSON.stringify(orgNode(lang));

  // find every ld+json block and replace only the one that defines #org
  const blocks = [...src.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)];
  const target = blocks.find((m) => m[1].includes('"@id":"' + O + '/#org"') && !m[1].includes('"@graph"'));
  const graph = blocks.find((m) => m[1].includes('"@graph"'));

  let out = src;
  if (target) {
    if (target[1].trim() === wanted) { ok++; continue; }
    out = src.replace(target[0], `<script type="application/ld+json">\n${wanted}\n</script>`);
  } else if (graph) {
    // homepages: the org sits inside a @graph — swap that node, keep the rest
    const data = JSON.parse(graph[1]);
    const idx = data['@graph'].findIndex((n) => n['@id'] === `${O}/#org`);
    if (idx < 0) { console.log('   no #org node in graph, skipped', file); continue; }
    const node = orgNode(lang);
    delete node['@context'];
    // keep any keys the homepage adds on purpose (logo, etc.)
    data['@graph'][idx] = { ...node, logo: data['@graph'][idx].logo || `${O}/icon-512.png` };
    const next = JSON.stringify(data, null, 2);
    if (next === graph[1]) { ok++; continue; }
    out = src.replace(graph[0], `<script type="application/ld+json">\n${next}\n</script>`);
  } else {
    // 404.html carries no structured data by design
    continue;
  }

  if (out === src) { ok++; continue; }
  if (!CHECK) writeFileSync(`${ROOT}/${file}`, out);
  changed++;
}

console.log(`${CHECK ? 'would restamp' : 'restamped'}: ${changed} · already canonical: ${ok} · added: ${added} · pages: ${files.length}`);
console.log(`priceRange from prices.mjs: ${PRICE_RANGE}`);

// verification
if (!CHECK) {
  // Compare PARSED nodes, not raw text: the homepages are pretty-printed inside a
  // @graph while the other pages are compact, so a string comparison reports a
  // difference that does not exist.
  const seen = { en: new Set(), fr: new Set() };
  let bad = 0;
  for (const file of files) {
    const src = readFileSync(`${ROOT}/${file}`, 'utf8');
    const lang = /<html[^>]+lang="fr/i.test(src) ? 'fr' : 'en';

    let node = null;
    for (const m of src.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)) {
      let data;
      try { data = JSON.parse(m[1]); } catch { console.log('   FAIL unparseable JSON-LD in', file); bad++; continue; }
      const candidates = data['@graph'] || [data];
      const hit = candidates.find((n) => n && n['@id'] === `${O}/#org`);
      if (hit) node = hit;
    }
    if (!node) { if (file !== '404.html') { console.log('   FAIL no #org in', file); bad++; } continue; }

    if (node.priceRange !== PRICE_RANGE) { console.log(`   FAIL priceRange "${node.priceRange}" in`, file); bad++; }
    if (node.description !== COPY[lang].description) { console.log(`   FAIL ${lang} page carries the wrong-language description:`, file); bad++; }
    if (!(node.sameAs || []).includes(SAME_AS[0])) { console.log('   FAIL no sameAs in', file); bad++; }

    // Two legitimate differences are excluded from the shape comparison:
    // `logo`, which only the homepages carry, and `@context`, which belongs to
    // the top level of a @graph rather than to the node inside it.
    const { logo, '@context': _ctx, ...core } = node;
    seen[lang].add(JSON.stringify(core, Object.keys(core).sort()));
  }
  console.log(`distinct EN org shapes: ${seen.en.size} · distinct FR org shapes: ${seen.fr.size}`);
  if (seen.en.size > 1 || seen.fr.size > 1) { console.log('   FAIL more than one shape per language'); bad++; }
  if (bad) process.exitCode = 1;
  else console.log('verified: one canonical organisation per language across every page');
}
}
