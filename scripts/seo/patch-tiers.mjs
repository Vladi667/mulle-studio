// The three engagements are a CUMULATIVE LADDER, not three independent purchases.
// Ground truth = the owner's own original brand-web.html:
//   Brand Identity CHF 1'500
//   Business Website CHF 1'700 — "Everything in Brand Identity"
//   E-commerce CHF 2'500 — "Everything in Business Website"
// The pages I generated listed them as a flat parallel list, which misrepresents the offer.
// Targeted exact-match edits only. No global replaces.
import fs from 'fs';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad';
const files = {};
const load = f => (files[f] ??= JSON.parse(fs.readFileSync(SP + '/' + f, 'utf8')));
const page = (f, slug) => load(f).find(x => x.slug === slug || x.file === slug).content;
let ok = 0; const missed = [];
function set(obj, path, from, to, label) {
  const keys = path.split('.'); let o = obj;
  for (const k of keys.slice(0, -1)) o = o[isNaN(k) ? k : +k];
  const last = keys.at(-1), cur = o[isNaN(last) ? last : +last];
  if (typeof cur === 'string' && cur.includes(from)) { o[isNaN(last) ? last : +last] = cur.split(from).join(to); ok++; }
  else missed.push(label);
}

/* ---------- EN /pricing : the dedicated pricing page. Show the ladder in the table itself. ---------- */
{
  const p = page('w10-data.json', 'pricing');
  const s = p.sections[1];
  // intro paragraph: state the ladder before the table
  set(p, 'sections.1.blocks.0.text',
    'Three engagements are paid once, not monthly. Each has a fixed price and an indicative timeline.',
    'Three engagements are paid once, not monthly. They are a ladder rather than three separate purchases: the website tier contains the brand identity, and the e-commerce tier contains both. Each has a fixed price and an indicative timeline.',
    'pricing intro ladder');
  // table: add an explicit "Includes" column
  const t = s.blocks.find(b => b.type === 'table');
  if (t && !t.tableHead.includes('Includes')) {
    t.tableHead = ['Engagement', 'Price', 'Includes', 'Indicative timeline', 'Payment'];
    t.tableRows = [
      ["Brand identity", "CHF 1'500", "Logo system, palette, typography, stationery, guidelines, all source files", "~14 days", "One-off"],
      ["Brochure / marketing site", "CHF 1'700", "Everything in Brand identity, plus the website", "2 to 4 weeks", "One-off"],
      ["E-commerce", "CHF 2'500", "Everything in Brochure / marketing site, plus the shop", "6 to 8 weeks", "One-off"],
    ];
    ok++;
  } else missed.push('pricing table Includes column');
  // the "how to read this" note
  s.blocks.splice(s.blocks.indexOf(t) + 1, 0, { type: 'p', text: "Read the ladder from the bottom up. A brand identity on its own is CHF 1'500. Adding the website to it brings the total to CHF 1'700, not CHF 3'200. Adding the shop on top brings it to CHF 2'500. That is why the steps between tiers look small: each price is the whole engagement, not a line item added to the one before it." });
  ok++;
}

/* ---------- EN /web-design-agency-geneva : same table shape ---------- */
{
  const p = page('w9-data.json', 'web-design-agency-geneva');
  const t = p.sections.flatMap(s => s.blocks).find(b => b.type === 'table' && JSON.stringify(b).includes("1'700"));
  if (t) {
    t.tableHead = ['Engagement', 'Includes', 'Indicative timeline', 'Published price'];
    t.tableRows = [
      ["Brand identity", "Logo system, palette, typography, stationery, source files", "About 14 days", "CHF 1'500"],
      ["Brochure or marketing website", "Everything in Brand identity, plus the website", "2 to 4 weeks", "CHF 1'700"],
      ["E-commerce", "Everything in the website tier, plus the shop", "6 to 8 weeks", "CHF 2'500"],
    ];
    ok++;
  } else missed.push('geneva EN table');
}

/* ---------- FR flagship lander ---------- */
{
  const p = page('w2-data.json', 'creation-site-web-geneve');
  set(p, 'faq.0.a',
    "À Genève, un site vitrine professionnel coûte CHF 1'700 en paiement unique chez Fritz, et une boutique e-commerce CHF 2'500. Une identité de marque revient à CHF 1'500.",
    "À Genève, un site vitrine professionnel coûte CHF 1'700 en paiement unique chez Fritz, et une boutique e-commerce CHF 2'500. Une identité de marque seule revient à CHF 1'500. Les trois paliers se cumulent : le site vitrine comprend l'identité de marque, et l'e-commerce comprend les deux.",
    'creation FAQ ladder');
}

/* ---------- FR regional pillar ---------- */
{
  const p = page('w5-data.json', 'agence-web-suisse-romande');
  set(p, 'sections.2.blocks.1.text',
    "Les trois prestations de projet, en paiement unique : identité de marque CHF 1'500, site vitrine CHF 1'700, site e-commerce CHF 2'500.",
    "Les trois prestations de projet, en paiement unique : identité de marque CHF 1'500, site vitrine CHF 1'700, site e-commerce CHF 2'500. Ce sont des paliers qui se cumulent, non trois achats séparés : le site vitrine comprend l'identité, et l'e-commerce comprend les deux.",
    'romande pillar ladder');
}

/* ---------- FR Geneva pricing guide ---------- */
{
  const p = page('w2-data.json', 'prix-site-web-geneve');
  set(p, 'sections.1.blocks.1.text',
    "le site vitrine est à CHF 1'700, l'e-commerce à CHF 2'500, l'identité de marque à CHF 1'500, en paiement unique.",
    "le site vitrine est à CHF 1'700, l'e-commerce à CHF 2'500, l'identité de marque seule à CHF 1'500, en paiement unique, chaque palier incluant le précédent.",
    'prix-geneve guide ladder');
}

/* ---------- FR national pricing guide ---------- */
{
  const p = page('w3-data.json', 'combien-coute-site-web-suisse');
  set(p, 'sections.0.blocks.2.text',
    "À titre de repère, un studio comme Fritz publie ses prix : CHF 1'700 pour un site vitrine, CHF 2'500 pour un e-commerce, CHF 1'500 pour une identité de marque, en paiement unique.",
    "À titre de repère, un studio comme Fritz publie ses prix : CHF 1'500 pour une identité de marque seule, CHF 1'700 pour le site vitrine qui l'inclut, CHF 2'500 pour l'e-commerce qui inclut les deux, en paiement unique.",
    'combien guide ladder');
}

/* ---------- FR agence-ou-freelance guide ---------- */
{
  const p = page('w3-data.json', 'agence-ou-freelance-suisse');
  set(p, 'sections.4.blocks.2.text',
    "des prix publiés, site vitrine à CHF 1'700, e-commerce à CHF 2'500, identité de marque à CHF 1'500, en paiement unique,",
    "des prix publiés et cumulatifs, identité de marque seule à CHF 1'500, site vitrine à CHF 1'700 identité comprise, e-commerce à CHF 2'500 comprenant les deux, en paiement unique,",
    'agence-freelance ladder');
}

/* ---------- write + verify ---------- */
for (const [f, d] of Object.entries(files)) fs.writeFileSync(SP + '/' + f, JSON.stringify(d, null, 2));
console.log(`applied: ${ok}` + (missed.length ? `   MISSED: ${missed.join(', ')}` : '   (no misses)'));
const blob = JSON.stringify(files);
console.log('\nverify:');
for (const [k, re] of Object.entries({
  'ladder stated (FR)': /se cumulent|incluant le précédent|qui l'inclut|cumulatifs/,
  'ladder stated (EN)': /Everything in Brand identity/,
  'pricing table has Includes': /"Includes"/,
  'read-the-ladder note': /Read the ladder from the bottom up/,
})) console.log(`  ${re.test(blob) ? '·' : '✗'} ${k}: ${re.test(blob) ? 'present' : 'MISSING'}`);
