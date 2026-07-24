// Applies the re-audit's required edits to the W7 rework, then assembles build data.
import fs from 'fs';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad';
const L = JSON.parse(fs.readFileSync(SP + '/w7-lausanne.json', 'utf8'));
const H = JSON.parse(fs.readFileSync(SP + '/w7-hospitality.json', 'utf8'));
const N = JSON.parse(fs.readFileSync(SP + '/w7-nyon-section.json', 'utf8'));

// generic deep string replace
function sub(obj, from, to) {
  let hits = 0;
  const walk = o => {
    if (Array.isArray(o)) o.forEach((v, i) => { if (typeof v === 'string') { if (v.includes(from)) { o[i] = v.split(from).join(to); hits++; } } else walk(v); });
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string') { if (v.includes(from)) { o[k] = v.split(from).join(to); hits++; } }
      else walk(v);
    }
  };
  walk(obj);
  return hits;
}
const report = [];
const fix = (obj, label, from, to) => { const n = sub(obj, from, to); report.push(`${n ? '✓' : '✗ MISS'} ${label}`); };

// ===================== LAUSANNE — 4 honesty edits =====================
// The studio has ONE Lausanne mandate; it cannot claim a pattern of incoming demand.
fix(L, 'L1 demand-pattern → market structure',
  "Trois familles de demandes reviennent à Lausanne, et elles n'ont pas du tout les mêmes besoins.",
  "Trois types d'entreprises structurent le tissu lausannois, et leurs besoins n'ont pas grand-chose en commun.");
fix(L, 'L2 "presque toujours sans marque" → hedged',
  "et presque toujours sans marque",
  "et parfois sans identité construite");
fix(L, 'L3 English-before-French → conditional',
  "et que l'anglais passe fréquemment avant le français",
  "et que l'anglais peut y précéder le français");
fix(L, 'L4 "dès le premier jour" → hedged',
  "bilingue FR/EN dès le premier jour",
  "souvent bilingue FR/EN");
fix(L, 'L5 FAQ frequency claim dropped',
  "C'est une configuration fréquente dans l'environnement académique lausannois",
  "C'est une configuration qui existe dans l'environnement académique lausannois");

// ===================== HOSPITALITY — 6 edits =====================
// H1: drop the region (competes with the /fr/agence-web-suisse-romande pillar) and align with the lede's exact match.
H.h1 = "Site web pour hôtel ou restaurant";
report.push('✓ H1 → "Site web pour hôtel ou restaurant" (region dropped, matches lede exact-match)');
// invented "six mois" figure + "la plupart" assertion
fix(H, 'H2 maintenance assertion de-quantified',
  "C'est le point où la plupart des sites d'établissement se dégradent, six mois après la livraison.",
  "C'est le point où un site d'établissement se dégrade le plus facilement une fois livré.");
// behavioural claim stated as fact before the hedge → conditional moved to the front
fix(H, 'H3 visitor-behaviour → leading conditional',
  "Un visiteur arrive rarement sur un site d'établissement par la page d'accueil. Il passe souvent par une fiche cartographique, une plateforme de réservation ou un lien partagé, et atterrit directement sur une page intérieure. Si c'est votre cas, deux conséquences suivent :",
  "Si vos visiteurs arrivent surtout par une fiche cartographique, une plateforme de réservation ou un lien partagé, ils atterrissent directement sur une page intérieure plutôt que sur l'accueil. Dans ce cas, deux conséquences suivent :");
// market ranges belong to /fr/tarifs + the pricing guide
fix(H, 'H4 market ranges removed → link out',
  "Sur le marché suisse, les fourchettes observées se situent autour de CHF 1'500 à CHF 4'000 pour un site vitrine et de CHF 5'000 à CHF 20'000 pour un e-commerce, avec un taux horaire agence de CHF 120 à CHF 180 par heure. Les prix du studio sont publiés et fixes : le détail est sur la page tarifs.",
  "Les prix du studio sont publiés et fixes : le détail figure sur la page tarifs, et les fourchettes observées sur le marché suisse sont détaillées dans le guide consacré au coût d'un site web.");
// brief instruction leaked into a visible heading
fix(H, 'H5 leaked brief text in heading',
  "Langues : deux phrases, puis le détail ailleurs",
  "Langues");
// em dashes: paired first, then any stragglers
{
  let j = JSON.stringify(H);
  const before = (j.match(/—/g) || []).length;
  j = j.replace(/ — ([^—]{1,90}?) — /g, ' ($1) ');   // paired → parentheses
  j = j.replace(/ — /g, ', ');                        // remaining → comma
  const after = (j.match(/—/g) || []).length;
  Object.assign(H, JSON.parse(j));
  report.push(`${after === 0 ? '✓' : '✗'} H6 em dashes ${before} → ${after}`);
}
// add the pricing guide now that we point at it
if (!H.internalLinks.some(l => l.href.includes('combien-coute')))
  H.internalLinks.splice(3, 0, { anchor: "combien coûte un site web en Suisse", href: "/fr/guides/combien-coute-site-web-suisse" });

// ===================== NYON SECTION — 2 edits =====================
fix(N, 'N1 implied Lausanne base removed',
  "depuis Genève comme depuis Lausanne",
  "depuis Genève");
fix(N, 'N2 basin assertion softened',
  "les deux bassins économiques ne se recouvrent pas.",
  "les deux bassins économiques ne se recouvrent pas nécessairement.");

// ===================== assemble =====================
const wrap = (content, slug, crumb) => ({
  slug, type: 'lander', dir: '', hreflangEn: null, langEn: '/', priceBlock: '',
  breadcrumb: [{ name: 'Accueil', path: '/fr/' }, { name: 'Agence web en Suisse romande', path: '/fr/agence-web-suisse-romande' }, { name: crumb, path: '/fr/' + slug }],
  content,
});
fs.writeFileSync(SP + '/w7-data.json', JSON.stringify([
  wrap(L, 'agence-web-lausanne', 'Agence web à Lausanne'),
  wrap(H, 'sites-web-hotellerie-restauration', 'Sites web hôtellerie et restauration'),
], null, 1));
fs.writeFileSync(SP + '/w7-nyon-final.json', JSON.stringify(N, null, 1));

// ===================== verify =====================
console.log(report.join('\n'));
const all = JSON.stringify([L, H, N]);
const checks = {
  'em dash': /—/.test(all) ? 'FAIL' : 'ok',
  'curly apostrophe': /’/.test(all) ? 'FAIL' : 'ok',
  'exclamation': /!/.test(all) ? 'FAIL' : 'ok',
  'demand-pattern claim': /familles de demandes reviennent/.test(all) ? 'FAIL' : 'ok',
  '"six mois" figure': /six mois après la livraison/.test(all) ? 'FAIL' : 'ok',
  'leaked brief heading': /deux phrases, puis le détail/.test(all) ? 'FAIL' : 'ok',
  'implied Lausanne base': /comme depuis Lausanne/.test(all) ? 'FAIL' : 'ok',
  'market ranges on hospitality': /fourchettes observées se situent autour/.test(JSON.stringify(H)) ? 'FAIL' : 'ok',
  'hospitality H1 has region': /Suisse romande/.test(H.h1) ? 'FAIL' : 'ok',
  'lausanne kw in h1': L.h1.toLowerCase().includes('agence web à lausanne') ? 'ok' : 'FAIL',
  'hospitality kw in lede': H.lede.toLowerCase().includes('site web pour hôtel ou restaurant') ? 'ok' : 'FAIL',
  'no price table': [L, H].some(p => p.sections.some(s => s.blocks.some(b => b.type === 'table' && /1'700|2'500/.test(JSON.stringify(b))))) ? 'FAIL' : 'ok',
};
console.log('\n' + Object.entries(checks).map(([k, v]) => `  ${v === 'FAIL' ? '✗' : '·'} ${k}: ${v}`).join('\n'));
console.log(`\nlausanne ${L.wordCount}w · hospitality ${H.wordCount}w · nyon-section ${N.wordCount}w`);
