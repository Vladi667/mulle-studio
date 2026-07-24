import fs from 'fs';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad';
const branding = JSON.parse(fs.readFileSync(SP + '/w4-branding.json', 'utf8'));
const marketing = JSON.parse(fs.readFileSync(SP + '/w4-marketing.json', 'utf8'));
const growth = JSON.parse(fs.readFileSync(SP + '/w4-growth.json', 'utf8'));
const sec = (page, needle) => page.sections.find(s => s.h3.includes(needle));

// ===== GROWTH =====
// #1 strip per-tier price enumeration (grid already shown above); keep escalation logic
{
  const s = sec(growth, 'Trois forfaits');
  s.blocks = [
    { type: 'p', text: "L'engagement se choisit selon la profondeur du système que vous voulez faire tourner, en paiement mensuel. Les montants des trois paliers figurent dans la grille ci-dessus ; ce qui change d'un palier à l'autre, c'est l'amplitude." },
    { type: 'ul', items: [
      "La couche d'observation : tableau de bord unifié, suivi hebdomadaire et fondations de données, le socle sur lequel tout le reste s'appuie.",
      "Les systèmes qui agissent : agents de qualification, relances, contenu et déclencheurs de cycle de vie, en plus de l'observation.",
      "Des opérations pilotées de bout en bout : intégrations sur mesure, tableaux de bord multi-équipes et heures d'ingénierie dédiées.",
    ] },
    { type: 'p', text: "On démarre rarement au niveau le plus haut. Le bon réflexe est d'installer la couche d'observation, de laisser les données parler, puis d'automatiser ce qui le mérite vraiment." },
  ];
}
// #4 give the orphaned branding page an inbound sibling link
growth.internalLinks.splice(1, 0, { anchor: "identité de marque à Genève", href: "/fr/agence-branding-geneve" });
// #2 fr-CH colon spacing: non-space before ':' → space before ':' (idempotent; matches siblings)
function frColons(page) {
  const fix = s => typeof s === 'string' ? s.replace(/([^\s]):(\s)/g, '$1 :$2') : s;
  page.intro = fix(page.intro);
  for (const s of page.sections) for (const b of s.blocks) {
    if (b.text) b.text = fix(b.text);
    if (b.items) b.items = b.items.map(fix);
  }
  for (const f of page.faq) { f.q = fix(f.q); f.a = fix(f.a); }
}
frColons(growth);

// ===== MARKETING =====
// #3 remove the "campaign stops / system compounds" frame (that identity belongs to Growth);
//    differentiate on coordination/legibility of acquisition instead
{
  const s = sec(marketing, "moteur d'acquisition, pas une campagne");
  s.blocks[0].text = "La différence entre des actions isolées et un moteur d'acquisition tient à la coordination. Des annonces lancées séparément se concurrencent et se mesurent mal. Un moteur relie le référencement naturel, le contenu, les réseaux sociaux et la publicité payante en un seul circuit où chaque canal éclaire les autres : le contenu SEO capte une demande déjà présente, le social entretient la notoriété, le payant accélère les segments qui convertissent déjà. Une agence marketing digital à Genève qui traite ces leviers séparément paie plus cher pour des résultats qu'elle ne parvient pas à relier.";
}
// #1 strip the CHF tier enumeration from the escalation section
{
  const s = sec(marketing, 'montent en puissance');
  s.blocks[0].text = "Les trois forfaits ne changent pas de nature, ils changent d'amplitude. Le premier palier tient une présence régulière et cohérente : positionnement posé, cadence de contenu maîtrisée, mesure de base. Le deuxième ajoute du volume de création et ouvre la diffusion payante pilotée. Le troisième fait tourner le moteur complet, plusieurs canaux en parallèle, avec une boucle de test et d'optimisation resserrée. Les montants de chaque palier figurent dans la grille ci-dessus.";
}
// #4 branding inbound link
marketing.internalLinks.splice(1, 0, { anchor: "identité de marque à Genève", href: "/fr/agence-branding-geneve" });

// ===== BRANDING =====
// #1 drop the price bait from the H3 title (CHF 1'500 stays once in the prose below) + strip the 1'700/2'500 restatement from body (kept in FAQ)
{
  const s1 = sec(branding, 'Ce que comprend une identité');
  s1.h3 = "Ce que comprend une identité de marque";
  const s2 = sec(branding, "d'un seul tenant");
  s2.blocks[0].text = s2.blocks[0].text.replace(
    "L'identité de marque se combine au site vitrine pour CHF 1'700, ou à une boutique en ligne pour CHF 2'500, toujours en paiement unique.",
    "L'identité de marque se conçoit alors avec le site qui la portera, vitrine ou boutique en ligne, en un seul projet et un seul paiement.");
}

// ===== assemble enhance-twins shape =====
const DATA = [
  { file: 'agence-branding-geneve', canonical: '/fr/agence-branding-geneve', serviceType: 'Identité de marque et branding', content: branding },
  { file: 'agence-marketing-geneve', canonical: '/fr/agence-marketing-geneve', serviceType: 'Marketing digital', content: marketing },
  { file: 'systemes-croissance-ia', canonical: '/fr/systemes-croissance-ia', serviceType: 'Growth Ops et automatisation IA', content: growth },
];
fs.writeFileSync(SP + '/w4-data.json', JSON.stringify(DATA, null, 1));

// ===== report + checks =====
for (const d of DATA) {
  const c = d.content;
  const wc = JSON.stringify(c.sections).split(/\s+/).length;
  const sib = c.internalLinks.filter(l => l.href.startsWith('/fr/agence') || l.href.startsWith('/fr/systemes')).map(l => l.href.replace('/fr/', ''));
  console.log(`✓ ${d.file}\n   h2:"${c.h2}" · ${c.sections.length} sec · ${c.faq.length} FAQ · links:${c.internalLinks.length}\n   siblings→ ${sib.join(', ') || 'none'}`);
}
const all = JSON.stringify(DATA);
const inbound = ['agence-branding-geneve', 'agence-marketing-geneve', 'systemes-croissance-ia'].map(p =>
  p + ':' + (all.match(new RegExp('/fr/' + p + '"', 'g')) || []).length + 'in');
console.log('\ninbound sibling refs: ' + inbound.join(' · '));
console.log('growth unspaced-colon remaining: ' + (/[^\s]:\s/.test(JSON.stringify(growth).replace(/https?:\/\//g,'')) ? 'CHECK' : 'clean'));
console.log('marketing "s\'allume/s\'éteint" ephemeral frame: ' + (all.includes("s'allume") || all.includes("s'éteint") ? 'PRESENT' : 'gone'));
