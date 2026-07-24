// Applies the W8 critique's 13 required fixes, then assembles build data.
import fs from 'fs';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad';
const W = JSON.parse(fs.readFileSync(SP + '/w8-wix.json', 'utf8'));
const C = JSON.parse(fs.readFileSync(SP + '/w8-creer.json', 'utf8'));
const R = JSON.parse(fs.readFileSync(SP + '/w8-refonte.json', 'utf8'));
const report = [];
function sub(obj, from, to) {
  let hits = 0;
  const walk = o => {
    if (Array.isArray(o)) o.forEach((v, i) => { if (typeof v === 'string') { if (v.includes(from)) { o[i] = v.split(from).join(to); hits++; } } else walk(v); });
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string') { if (v.includes(from)) { o[k] = v.split(from).join(to); hits++; } } else walk(v);
    }
  };
  walk(obj); return hits;
}
const fix = (o, label, from, to) => report.push(`${sub(o, from, to) ? '✓' : '✗ MISS'} ${label}`);

// ============ WIX ============
// (1) migration mechanics are the refonte guide's declared core — collapse to a pointer
W.sections[7] = {
  h2: "Quitter un constructeur : ce que la sortie implique",
  blocks: [
    { type: 'p', text: "Quitter un constructeur n'est pas un transfert, c'est une reconstruction accompagnée d'une opération de conservation. Le contenu se récupère, la mise en forme se refait, et surtout les adresses existantes doivent être préservées : ce sont elles qui portent le référencement acquis, et une sortie mal préparée le laisse sur place." },
    { type: 'p', text: "La mécanique complète de cette bascule, de l'inventaire des adresses au plan de redirections et aux vérifications d'après mise en ligne, est traitée dans notre guide de la refonte de site web. Elle s'applique telle quelle au départ d'un constructeur, à une différence près : le contenu doit d'abord être extrait d'un système qui ne le rend pas toujours facilement." },
    { type: 'p', text: "Sur le référencement, la formulation honnête est celle-ci : une migration correctement redirigée vise à conserver l'acquis, pas à le multiplier. Une migration sans redirections, elle, le perd." },
  ],
};
report.push('✓ W1 migration section collapsed → pointer to refonte guide');
// (1b) same duplication in the migration-cost FAQ
W.faq[4].a = "Le coût est essentiellement celui d'un nouveau site, auquel s'ajoute un travail de conservation : récupérer le contenu et les données, puis préserver les adresses existantes pour ne pas perdre le référencement acquis. Pour un site vitrine de quelques pages, cette partie reste modeste au regard de la conception ; nos sites vitrine sont publiés à CHF 1'700 en paiement unique, code et fichiers sources livrés. Ce qui fait réellement monter le devis, ce sont les catalogues volumineux, les historiques de blog et les sites dont les adresses ont déjà changé plusieurs fois. Le détail de la bascule figure dans notre guide de la refonte, et les fourchettes de prix dans nos guides de prix.";
report.push('✓ W1b migration-cost FAQ de-duplicated');
// (2) ranking-mechanics asserted as measured fact → working assumption
fix(W, 'W2 ranking claim (body) → hedged',
  "Un site de constructeur bien tenu, avec un contenu écrit pour une intention réelle, dépassera un site sur mesure au contenu creux. Le contenu reste le premier facteur, et il ne dépend d'aucune technologie.",
  "À contenu inégal, un site de constructeur bien tenu et écrit pour une intention réelle peut devancer un site sur mesure au contenu creux. Nous travaillons sur l'hypothèse que le contenu pèse davantage que la technologie employée, et cette hypothèse ne dépend d'aucune plateforme.");
fix(W, 'W2b ranking claim (FAQ) → hedged',
  "L'affirmation générale selon laquelle un constructeur ne peut pas se référencer est dépassée, et le contenu reste le premier facteur.",
  "L'affirmation générale selon laquelle un constructeur ne peut pas se référencer est dépassée, et le contenu pèse selon nous davantage que la plateforme.");
// (3) asserted market behaviour → conditional
fix(W, 'W3 template-similarity → conditional',
  "Le second signal est la ressemblance. Les familles de gabarits les plus utilisées se reconnaissent, et vos concurrents piochent dans les mêmes.",
  "Le second signal est la ressemblance. Les familles de gabarits les plus diffusées finissent par se reconnaître, et si vos concurrents puisent dans les mêmes, votre site leur ressemblera.");

// ============ CREER ============
// (5) invented behavioural threshold
fix(C, 'C5 "six entrées" threshold removed',
  "La navigation principale reste courte. Au-delà de six entrées, le visiteur ne lit plus, il devine.",
  "La navigation principale reste courte : une liste d'entrées trop longue se parcourt mal et pousse le visiteur à deviner plutôt qu'à lire.");
// (6) unmeasurable comparatives → conditional
fix(C, 'C6 photo/stock-image assertions → conditional',
  "Les images génériques achetées en banque d'images se repèrent immédiatement et affaiblissent exactement ce qu'un site doit installer, la confiance. Pour un commerce, un atelier, un restaurant ou un cabinet, une séance photo dédiée change davantage la perception qu'une refonte graphique.",
  "Les images génériques de banque d'images sont souvent reconnaissables, et lorsqu'elles le sont elles affaiblissent exactement ce qu'un site doit installer, la confiance. Pour un commerce, un atelier, un restaurant ou un cabinet, une séance photo dédiée pèse généralement plus lourd dans la perception qu'un simple habillage graphique.");
// (7) multilingual mechanics belong to /fr/agence-web-fribourg
fix(C, 'C7 multilingual mechanics → timing + link Fribourg',
  "La question se tranche maintenant, jamais après. Ajouter une langue à un site déjà construit implique de revoir la structure des adresses, la navigation, les balises de langue et la gestion des contenus, et cela coûte davantage que de l'avoir prévu dès le premier jour.",
  "La question se tranche maintenant, jamais après : ajouter une langue à un site déjà construit coûte nettement plus cher que de l'avoir prévu dès le premier jour. La mécanique détaillée d'un site bilingue est traitée sur notre page consacrée aux sites bilingues français-allemand.");
// (9) strip empty table keys off ul blocks (cosmetic, avoids confusing data)
{
  let n = 0;
  for (const s of C.sections) for (const b of s.blocks) if (b.type === 'ul' && ('tableHead' in b || 'tableRows' in b)) { delete b.tableHead; delete b.tableRows; n++; }
  report.push(`✓ C9 stripped empty table keys off ${n} ul blocks`);
}

// ============ REFONTE ============
// (10) invented offer term: "refonte comprise" is not in the published price list
fix(R, 'R10 invented "refonte comprise" (body)',
  "Chez Fritz, un site vitrine est publié à CHF 1'700, refonte comprise lorsque le périmètre correspond, et les fourchettes observées sur le marché sont détaillées dans le guide sur le coût d'un site web en Suisse.",
  "Chez Fritz, le site vitrine est publié à CHF 1'700 : une refonte est devisée depuis ce même prix publié lorsque le périmètre correspond, et fait l'objet d'un devis si l'inventaire ou la migration sortent de ce cadre. Les fourchettes observées sur le marché sont détaillées dans le guide sur le coût d'un site web en Suisse.");
fix(R, 'R10b invented "refonte comprise" (FAQ)',
  "Chez Fritz, un site vitrine est publié à CHF 1'700, refonte comprise lorsque le périmètre correspond.",
  "Chez Fritz, le site vitrine est publié à CHF 1'700, et une refonte est devisée depuis ce même prix publié lorsque le périmètre correspond ; au-delà, elle fait l'objet d'un devis.");
// (11) market fact → conditional on the reader's own traffic
fix(R, 'R11 mobile-dominance claim → conditional',
  "Si votre site a été conçu avant que le mobile devienne le contexte de lecture dominant pour la plupart des sites de services, la version téléphone est souvent une réduction de la version bureau plutôt qu'une conception à part entière.",
  "Si votre site a quelques années et que vos propres statistiques montrent une majorité de visites depuis un téléphone, la version mobile est souvent une réduction de la version bureau plutôt qu'une conception à part entière.");
// (13) hyphenation must match the destination guide's own wording — normalise across ALL three
fix(R, 'R13 "sur-mesure" → "sur mesure" (refonte)', "sur-mesure", "sur mesure");
fix(C, 'R13b "sur-mesure" → "sur mesure" (creer)', "sur-mesure", "sur mesure");
fix(W, 'R13c "sur-mesure" → "sur mesure" (wix)', "sur-mesure", "sur mesure");

// ============ (4)(8)(12) sibling reciprocity ============
const link = (o, label, anchor, href) => {
  if (!o.internalLinks.some(l => l.href === href)) { o.internalLinks.splice(1, 0, { anchor, href }); report.push(`✓ ${label}`); }
  else report.push(`= ${label} (already present)`);
};
link(W, 'W4 wix → creer', "Créer un site internet en Suisse", "/fr/guides/creer-un-site-internet-en-suisse");
link(C, 'C8 creer → refonte', "Refonte de site web", "/fr/guides/refonte-site-web-suisse");
link(R, 'R12 refonte → creer', "Créer un site internet en Suisse", "/fr/guides/creer-un-site-internet-en-suisse");
// creer's multilingual pointer now needs the Fribourg link
link(C, 'C7b creer → fribourg (bilingue)', "sites bilingues français-allemand", "/fr/agence-web-fribourg");

// ============ assemble ============
const wrap = (content, slug, crumb) => ({
  slug, type: 'guide', dir: 'guides', hreflangEn: null, langEn: '/', priceBlock: '',
  breadcrumb: [{ name: 'Accueil', path: '/fr/' }, { name: crumb, path: '/fr/guides/' + slug }],
  content,
});
fs.writeFileSync(SP + '/w8-data.json', JSON.stringify([
  wrap(W, 'wix-ou-site-sur-mesure', "Guide — Wix ou site sur mesure"),
  wrap(C, 'creer-un-site-internet-en-suisse', "Guide — Créer un site internet en Suisse"),
  wrap(R, 'refonte-site-web-suisse', "Guide — Refonte de site web"),
], null, 1));

// ============ verify ============
console.log(report.join('\n'));
const all = JSON.stringify([W, C, R]);
const checks = {
  'em dash': /—/.test(all) ? 'FAIL' : 'ok',
  'curly apostrophe': /’/.test(all) ? 'FAIL' : 'ok',
  'exclamation': /!/.test(all) ? 'FAIL' : 'ok',
  'CHF bare 2nd bound': /CHF [\d']+ à [\d']+/.test(all) ? 'FAIL' : 'ok',
  '"refonte comprise"': /refonte comprise/.test(all) ? 'FAIL' : 'ok',
  '"premier facteur"': /premier facteur/.test(all) ? 'FAIL' : 'ok',
  '"six entrées" threshold': /Au-delà de six entrées/.test(all) ? 'FAIL' : 'ok',
  '"sur-mesure" hyphen': /sur-mesure/.test(all) ? 'FAIL' : 'ok',
  'wix migration deep-dive': /bascule DNS/.test(JSON.stringify(W)) ? 'FAIL' : 'ok',
};
for (const [k, p] of [['wix', W], ['creer', C], ['refonte', R]]) {
  const kw = { wix: 'wix ou site sur mesure', creer: 'créer un site internet en suisse', refonte: 'refonte de site web' }[k];
  checks[`${k} kw in lede`] = p.lede.toLowerCase().includes(kw) ? 'ok' : 'FAIL';
  checks[`${k} sibling links`] = p.internalLinks.filter(l => l.href.startsWith('/fr/guides/')).length >= 2 ? 'ok' : 'FAIL';
}
console.log('\n' + Object.entries(checks).map(([k, v]) => `  ${v === 'FAIL' ? '✗' : '·'} ${k}: ${v}`).join('\n'));
console.log(`\nwix ${W.wordCount}w · creer ${C.wordCount}w · refonte ${R.wordCount}w`);
