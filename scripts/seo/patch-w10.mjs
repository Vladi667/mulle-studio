// W10 patch: assemble the 3 new EN pages, and fix two integrity problems on ALREADY-LIVE pages.
//  (1) the live FR logo guide is built around an invented "CHF 50 / CHF 5" price point (no source)
//  (2) the site states two different logo-alone ranges: "CHF 500 à CHF 1'500" (FR logo guide, the page
//      that owns the topic) vs "sous CHF 1'200" (branding pages + the new EN logo page). hreflang pairs
//      must not contradict each other, so everything is standardised on CHF 500 to CHF 1'500.
import fs from 'fs';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad';
const rd = f => JSON.parse(fs.readFileSync(SP + '/' + f, 'utf8'));
const P = rd('w10-pricing.json'), L = rd('w10-logo-cost.json'), A = rd('w10-agency-freelance.json');
const w3 = rd('w3-data.json'), w5 = rd('w5-data.json'), w9 = rd('w9-data.json');
const report = [];
function sub(obj, from, to, label) {
  let hits = 0;
  const walk = o => {
    if (Array.isArray(o)) o.forEach((v, i) => { if (typeof v === 'string') { if (v.includes(from)) { o[i] = v.split(from).join(to); hits++; } } else walk(v); });
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string') { if (v.includes(from)) { o[k] = v.split(from).join(to); hits++; } } else walk(v);
    }
  };
  walk(obj);
  if (label) report.push(`${hits ? '✓' : '·'} ${label}${hits ? ` (${hits})` : ' — not present'}`);
  return hits;
}

// ---------- (A) new EN logo page: align logo-alone range with its FR hreflang counterpart ----------
sub(L, "typically quoted under CHF 1'200", "typically quoted between CHF 500 and CHF 1'500", 'EN logo page: logo-alone range aligned to FR pair');
sub(L, "under CHF 1'200", "between CHF 500 and CHF 1'500", 'EN logo page: remaining under-1200 phrasings');

// ---------- (B) LIVE FR logo guide: strip the invented CHF 50 / CHF 5 price points ----------
{
  const g = w3.find(x => x.slug === 'prix-logo-identite-visuelle-suisse').content;
  g.metaDesc = g.metaDesc.replace("le piège du logo à CHF 50.", "le piège du logo généré en ligne.");
  report.push('✓ FR logo guide: metaDesc de-fabricated');
  const s = g.sections[3];
  s.h2 = "Logo généré en ligne vs logo professionnel : ce que vous payez vraiment";
  sub(s, "Ce que vous obtenez réellement pour CHF 50", "Ce que vous obtenez réellement", 'FR logo guide: H3 figure removed');
  sub(s, "les places de marché à CHF 5 la prestation", "les places de marché à très bas prix", 'FR logo guide: invented CHF 5 removed');
  sub(s, "pour le prix d'un déjeuner", "pour une somme dérisoire", 'FR logo guide: "prix d\'un déjeuner" generalised');
  sub(s, "un logo à CHF 50 peut suffire", "un logo généré en ligne peut suffire", 'FR logo guide: closing CHF 50 removed');
  // NB: a naive "CHF 50" replace also matches inside "CHF 500" and destroys the guide's real prices.
  // Match only CHF 50 NOT followed by another digit.
  {
    let hits = 0;
    const walk = o => {
      if (Array.isArray(o)) o.forEach((v, i) => { if (typeof v === 'string') { const n = v.replace(/CHF 50(?!\d)/g, 'un tarif dérisoire'); if (n !== v) { o[i] = n; hits++; } } else walk(v); });
      else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
        if (typeof v === 'string') { const n = v.replace(/CHF 50(?!\d)/g, 'un tarif dérisoire'); if (n !== v) { o[k] = n; hits++; } } else walk(v);
      }
    };
    walk(g);
    report.push(`${hits ? '✓' : '·'} FR logo guide: residual CHF 50 (digit-safe)${hits ? ` (${hits})` : ' — none'}`);
  }
}

// ---------- (C) branding pages: align logo-alone range (both languages) ----------
{
  const frB = w5.find(x => x.slug === 'agence-branding-suisse').content;
  sub(frB, "Généralement sous CHF 1'200", "CHF 500 à CHF 1'500", 'FR branding-suisse: logo-alone range aligned');
  sub(frB, "sous CHF 1'200", "CHF 500 à CHF 1'500", 'FR branding-suisse: residual');
  const enB = w9.find(x => x.slug === 'branding-agency-switzerland').content;
  sub(enB, "under CHF 1'200", "between CHF 500 and CHF 1'500", 'EN branding-switzerland: logo-alone range aligned');
  sub(enB, "below CHF 1'200", "between CHF 500 and CHF 1'500", 'EN branding-switzerland: residual');
}
fs.writeFileSync(SP + '/w3-data.json', JSON.stringify(w3, null, 2));
fs.writeFileSync(SP + '/w5-data.json', JSON.stringify(w5, null, 2));
fs.writeFileSync(SP + '/w9-data.json', JSON.stringify(w9, null, 2));

// ---------- (D) assemble the 3 new EN pages ----------
const OFFER = {
  '@type': 'OfferCatalog', name: 'Agence Fritz pricing', url: 'https://agencefritz.com/pricing',
  provider: { '@id': 'https://agencefritz.com/#org' },
  itemListElement: [
    { '@type': 'Offer', name: 'Brand identity', price: '1500', priceCurrency: 'CHF' },
    { '@type': 'Offer', name: 'Brochure or marketing website', price: '1700', priceCurrency: 'CHF' },
    { '@type': 'Offer', name: 'E-commerce website', price: '2500', priceCurrency: 'CHF' },
    { '@type': 'Offer', name: 'Marketing programme (monthly, from)', price: '490', priceCurrency: 'CHF' },
    { '@type': 'Offer', name: 'Growth Ops programme (monthly, from)', price: '490', priceCurrency: 'CHF' },
  ],
};
const en = (content, slug, type, altFr, place, serviceType, crumb, extraSchema) => ({
  slug, type, lang: 'en', dir: '', altFr, place, serviceType, priceBlock: '', extraSchema,
  breadcrumb: [{ name: 'Home', path: '/' }, { name: crumb, path: '/' + slug }], content,
});
fs.writeFileSync(SP + '/w10-data.json', JSON.stringify([
  en(P, 'pricing', 'lander', '/fr/tarifs', 'Geneva', 'Web design and brand identity', 'Prices', [OFFER]),
  en(L, 'logo-design-cost-switzerland', 'guide', '/fr/guides/prix-logo-identite-visuelle-suisse', 'Switzerland', null, 'Logo design cost in Switzerland'),
  en(A, 'web-agency-vs-freelancer-switzerland', 'guide', '/fr/guides/agence-ou-freelance-suisse', 'Switzerland', null, 'Web agency vs freelancer'),
], null, 1));

// ---------- verify ----------
console.log(report.join('\n'));
const newPages = JSON.stringify([P, L, A]);
const liveFixed = JSON.stringify([w3, w5, w9]);
const checks = {
  'new pages: CHF 50 / CHF 5 invented': /CHF 50\b|CHF 5 la prestation|fifty franc/i.test(newPages) ? 'FAIL' : 'ok',
  'live FR guide: CHF 50 gone': /CHF 50\b/.test(liveFixed) ? 'FAIL' : 'ok',
  'live FR guide: CHF 5 la prestation gone': /CHF 5 la prestation/.test(liveFixed) ? 'FAIL' : 'ok',
  'logo-alone range consistent (no under-1200 left)': (/under CHF 1'200|sous CHF 1'200/.test(newPages + liveFixed)) ? 'FAIL' : 'ok',
  'canonical logo range present EN': /between CHF 500 and CHF 1'500/.test(newPages) ? 'ok' : 'FAIL',
  'em dash': /—/.test(newPages) ? 'FAIL' : 'ok',
  'pricing H1 keyword': /web design price/i.test(P.h1) ? 'ok' : 'FAIL',
};
console.log('\n' + Object.entries(checks).map(([k, v]) => `  ${v === 'FAIL' ? '✗' : '·'} ${k}: ${v}`).join('\n'));
console.log(`\nassembled: pricing ${P.wordCount}w · logo ${L.wordCount}w · agency ${A.wordCount}w`);
