// CORRECTION (owner-stated 2026-07-22): the three project engagements are SEPARATE purchases.
// Brand identity CHF 1'500 is NOT included in the CHF 1'700 website tier.
// This reverses yesterday's "cumulative ladder" edits AND fixes the pages that already claimed
// inclusion before I touched them. Rather than restoring the old ambiguous flat list, state
// explicitly that they are distinct engagements, so the page cannot be misread either way.
import fs from 'fs';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad';
const files = {};
const load = f => (files[f] ??= JSON.parse(fs.readFileSync(SP + '/' + f, 'utf8')));
const page = (f, slug) => load(f).find(x => x.slug === slug || x.file === slug).content;
let ok = 0; const missed = [];
function set(obj, path, from, to, label) {
  const keys = path.split('.'); let o = obj;
  for (const k of keys.slice(0, -1)) o = o[isNaN(k) ? k : +k];
  const last = keys.at(-1), i = isNaN(last) ? last : +last;
  if (typeof o[i] === 'string' && o[i].includes(from)) { o[i] = o[i].split(from).join(to); ok++; }
  else missed.push(label);
}

/* ---------- EN /pricing ---------- */
{
  const p = page('w10-data.json', 'pricing');
  set(p, 'sections.1.blocks.0.text',
    'They are a ladder rather than three separate purchases: the website tier contains the brand identity, and the e-commerce tier contains both. ',
    'They are three separate engagements, bought individually or together as needed. ',
    'pricing intro');
  const s = p.sections[1];
  const t = s.blocks.find(b => b.type === 'table');
  if (t) {
    t.tableHead = ['Engagement', 'Price', 'What it covers', 'Indicative timeline', 'Payment'];
    t.tableRows = [
      ["Brand identity", "CHF 1'500", "Logo system, palette, typography, stationery, guidelines, all source files", "~14 days", "One-off"],
      ["Brochure / marketing site", "CHF 1'700", "A custom-designed site you can edit yourself, built on an identity you already have", "2 to 4 weeks", "One-off"],
      ["E-commerce", "CHF 2'500", "A shop with product pages, checkout, payment and order handling", "6 to 8 weeks", "One-off"],
    ];
    ok++;
  } else missed.push('pricing table');
  // remove the ladder-explainer paragraph I added yesterday
  const i = s.blocks.findIndex(b => (b.text || '').includes('Read the ladder from the bottom up'));
  if (i >= 0) {
    s.blocks[i] = { type: 'p', text: "The three are priced independently. If you already have a brand you are happy with, the website engagement stands on its own. If you do not, the identity is designed first and the site is built on it, and the two are quoted as two engagements." };
    ok++;
  } else missed.push('pricing ladder note');
}

/* ---------- EN /web-design-agency-geneva ---------- */
{
  const p = page('w9-data.json', 'web-design-agency-geneva');
  const t = p.sections.flatMap(s => s.blocks).find(b => b.type === 'table' && JSON.stringify(b).includes("1'700"));
  if (t) {
    t.tableHead = ['Engagement', 'What it covers', 'Indicative timeline', 'Published price'];
    t.tableRows = [
      ["Brand identity", "Logo system, palette, typography, stationery, source files", "About 14 days", "CHF 1'500"],
      ["Brochure or marketing website", "A custom-designed site you can edit yourself", "2 to 4 weeks", "CHF 1'700"],
      ["E-commerce", "A shop with product pages, checkout and order handling", "6 to 8 weeks", "CHF 2'500"],
    ];
    ok++;
  } else missed.push('geneva EN table');
}

/* ---------- FR pages: reverse the cumulative wording ---------- */
set(page('w2-data.json', 'creation-site-web-geneve'), 'faq.0.a',
  " Une identité de marque seule revient à CHF 1'500. Les trois paliers se cumulent : le site vitrine comprend l'identité de marque, et l'e-commerce comprend les deux.",
  " Une identité de marque revient à CHF 1'500. Ce sont trois prestations distinctes, prises séparément ou ensemble selon le besoin.",
  'creation FAQ');

set(page('w5-data.json', 'agence-web-suisse-romande'), 'sections.2.blocks.1.text',
  " Ce sont des paliers qui se cumulent, non trois achats séparés : le site vitrine comprend l'identité, et l'e-commerce comprend les deux.",
  " Ce sont trois prestations distinctes, prises séparément ou ensemble selon le besoin.",
  'romande pillar');

set(page('w2-data.json', 'prix-site-web-geneve'), 'sections.1.blocks.1.text',
  "l'identité de marque seule à CHF 1'500, en paiement unique, chaque palier incluant le précédent.",
  "l'identité de marque à CHF 1'500, en paiement unique, chacune étant une prestation distincte.",
  'prix-geneve guide');

set(page('w3-data.json', 'combien-coute-site-web-suisse'), 'sections.0.blocks.2.text',
  "CHF 1'500 pour une identité de marque seule, CHF 1'700 pour le site vitrine qui l'inclut, CHF 2'500 pour l'e-commerce qui inclut les deux, en paiement unique.",
  "CHF 1'500 pour une identité de marque, CHF 1'700 pour un site vitrine, CHF 2'500 pour un e-commerce, en paiement unique, chacune étant une prestation distincte.",
  'combien guide');

set(page('w3-data.json', 'agence-ou-freelance-suisse'), 'sections.4.blocks.2.text',
  "des prix publiés et cumulatifs, identité de marque seule à CHF 1'500, site vitrine à CHF 1'700 identité comprise, e-commerce à CHF 2'500 comprenant les deux, en paiement unique,",
  "des prix publiés, identité de marque à CHF 1'500, site vitrine à CHF 1'700, e-commerce à CHF 2'500, en paiement unique et par prestation distincte,",
  'agence-freelance');

for (const [f, d] of Object.entries(files)) fs.writeFileSync(SP + '/' + f, JSON.stringify(d, null, 2));
console.log(`data files — applied: ${ok}` + (missed.length ? `   MISSED: ${missed.join(', ')}` : '   (no misses)'));

/* ---------- build-tarifs.mjs : remove the false "Identité de marque incluse" bullet ---------- */
{
  const p = SP + '/build-tarifs.mjs';
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  s = s.replace("'Identité de marque incluse', ", "");
  s = s.replace("['Identité de marque incluse',", "[");
  if (s !== before) { fs.writeFileSync(p, s); console.log('build-tarifs.mjs — removed "Identité de marque incluse" bullet'); }
  else console.log('build-tarifs.mjs — BULLET NOT MATCHED, inspect manually');
}

const blob = JSON.stringify(files);
console.log('\nverify (all inclusion language should be gone):');
for (const [k, re] of Object.entries({
  'FR cumulative wording': /se cumulent|incluant le précédent|qui l'inclut|cumulatifs|identité comprise/,
  'EN "Everything in"': /Everything in Brand identity|Everything in Brochure/,
  'EN ladder note': /Read the ladder from the bottom up/,
  'explicit "distinctes" present': /prestations? distinctes?/,
  'explicit "separate engagements" present': /three separate engagements/,
})) {
  const hit = re.test(blob);
  const want = k.includes('present');
  console.log(`  ${hit === want ? '·' : '✗'} ${k}: ${hit ? 'present' : 'absent'}`);
}
