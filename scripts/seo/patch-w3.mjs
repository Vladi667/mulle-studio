import fs from 'fs';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad';
const national = JSON.parse(fs.readFileSync(SP + '/w3-national.json', 'utf8'));
const logo = JSON.parse(fs.readFileSync(SP + '/w3-logo.json', 'utf8'));
const agence = JSON.parse(fs.readFileSync(SP + '/w3-agence.json', 'utf8'));

// ---- CHF suffix -> prefix on text fields (tables untouched; national/logo cells already prefixed) ----
const fixCHF = s => typeof s === 'string'
  ? s.replace(/((?:\d[\d'’]*)(?:\s*(?:à|–|-)\s*\d[\d'’]*)?)\s+CHF(?!\/h|\/)/g, 'CHF $1')
  : s;
function normText(page) {
  page.lede = fixCHF(page.lede);
  page.quotableOpener = fixCHF(page.quotableOpener);
  page.metaDesc = fixCHF(page.metaDesc);
  for (const sec of page.sections) for (const b of sec.blocks) {
    if (b.type === 'p' || b.type === 'h3') b.text = fixCHF(b.text);
    if (b.type === 'ul') b.items = b.items.map(fixCHF);
  }
  for (const f of page.faq) { f.q = fixCHF(f.q); f.a = fixCHF(f.a); }
}

// ============ AGENCE ============
// #11 misquote: "structure d'un freelance" -> "structure d'un indépendant"
{
  const j = JSON.stringify(agence).replaceAll("structure d'un freelance", "structure d'un indépendant");
  Object.assign(agence, JSON.parse(j));
}
// #1 + #4: replace the price-grid table (cannibalizes Geneva guide + contradicts e-commerce floor + unsourced 80-140/h)
//         with a DISTINCT cost-structure table. No price grid, no per-provider e-commerce floor.
agence.sections[4] = {
  h2: "Trois modèles, trois structures de coût",
  blocks: [
    { type: "p", text: "L'écart de prix entre un freelance, une agence et un studio ne tient pas à une grille tarifaire secrète : il tient à ce que chaque modèle vous fait financer. Comprendre cette mécanique vaut mieux qu'un tableau de prix, car c'est elle qui explique pourquoi deux devis pour le même site peuvent varier du simple au triple. Pour les fourchettes chiffrées, poste par poste, voir notre guide du prix d'un site web en Suisse ; ci-dessous, ce que votre budget paie réellement dans chaque cas." },
    { type: "table",
      tableHead: ["Modèle", "Ce que votre budget finance", "Facturation", "Votre interlocuteur", "Code & fichiers sources"],
      tableRows: [
        ["Freelance", "Le temps de travail, sans structure à porter", "Souvent à l'heure, parfois au forfait", "La personne qui exécute", "Selon l'accord — à exiger par écrit"],
        ["Agence", "L'équipe et la structure : locaux, commercial, gestion de projet", "Forfait, avec heures hors devis fréquentes", "Un commercial, puis un chef de projet", "Parfois retenus (CMS propriétaire)"],
        ["Studio indépendant", "Le travail, sans couche commerciale ni frais fixes", "Forfait fixe, publié à l'avance", "La personne qui exécute", "Livrés systématiquement"],
      ] },
    { type: "p", text: "C'est ce qui explique la position d'un studio comme Fritz : des prix publiés — site vitrine à CHF 1'700, e-commerce à CHF 2'500, identité de marque à CHF 1'500, en paiement unique — qui se logent au niveau bas, voire en dessous, des fourchettes du marché, non par prestation au rabais mais parce qu'il n'y a pas de structure commerciale à financer. Ce n'est pas « dans la fourchette basse » : sur plusieurs prestations, c'est sous le plancher observé. L'intérêt du modèle tient à une condition — que la qualité suive — d'où les questions de la section suivante." },
  ],
};
// #4 (part 2): drop the unsourced freelance hourly rate (80–140) from prose + FAQ; keep only the FACTS-backed agence 120–180
{
  let j = JSON.stringify(agence);
  j = j.replace(
    "les taux horaires observés se situent souvent entre 80 et 140 CHF de l'heure, contre 120 à 180 CHF en agence — l'écart vient de l'absence de structure à financer.",
    "les taux horaires pratiqués sont en général inférieurs à ceux d'une agence, où l'on observe souvent 120 à 180 CHF de l'heure — l'écart vient de l'absence de structure à financer.");
  j = j.replace(
    "Souvent oui à l'heure : on observe 80 à 140 CHF/h chez un freelance contre 120 à 180 CHF/h en agence, faute de structure à financer.",
    "Souvent oui : un freelance, sans structure à financer, facture en général moins cher de l'heure qu'une agence, où l'on observe couramment 120 à 180 CHF de l'heure.");
  Object.assign(agence, JSON.parse(j));
}
// #9 + reciprocity: link a sibling guide (national) as the poste-par-poste chiffrage
agence.internalLinks = [
  { anchor: "création de site web à Genève", href: "/fr/creation-site-web-geneve" },
  { anchor: "combien coûte un site web en Suisse", href: "/fr/guides/combien-coute-site-web-suisse" },
  { anchor: "prix d'un site web à Genève", href: "/fr/guides/prix-site-web-geneve" },
  { anchor: "parler de votre projet", href: "/fr/contact" },
];
normText(agence); // #6 CHF placement (opener, freelance rates, FAQ)

// ============ NATIONAL ============
// #8 + reciprocity: add logo + agence siblings (natural anchors: identité row / CMS-vs-agence section)
national.internalLinks = [
  { anchor: "création de site web à Genève", href: "/fr/creation-site-web-geneve" },
  { anchor: "prix d'un logo et d'une identité visuelle", href: "/fr/guides/prix-logo-identite-visuelle-suisse" },
  { anchor: "agence ou freelance : comment choisir", href: "/fr/guides/agence-ou-freelance-suisse" },
  { anchor: "prix d'un site web à Genève", href: "/fr/guides/prix-site-web-geneve" },
  { anchor: "nos tarifs", href: "/fr/tarifs" },
];
normText(national);

// ============ LOGO ============
// #5: remove/soften the unsourced "6–12 semaines" market timeline (FACTS gives only Fritz ~14 j)
{
  let j = JSON.stringify(logo);
  j = j.replace(/(?:de\s+)?(?:six à douze|6\s*(?:à|–|-)\s*12)\s+semaines/gi, "quelques semaines à quelques mois selon le prestataire");
  Object.assign(logo, JSON.parse(j));
}
// #7 + reciprocity: add a sibling-guide cross-link (national)
logo.internalLinks = [
  { anchor: "agence de branding à Genève", href: "/fr/agence-branding-geneve" },
  { anchor: "combien coûte un site web en Suisse", href: "/fr/guides/combien-coute-site-web-suisse" },
  { anchor: "nos tarifs", href: "/fr/tarifs" },
  { anchor: "devis gratuit", href: "/fr/contact" },
];
normText(logo);

// ---- assemble build-landers shape ----
const wrap = (page, slug, crumbName) => ({
  slug, type: "guide", dir: "guides", hreflangEn: null, langEn: "/", priceBlock: "",
  breadcrumb: [{ name: "Accueil", path: "/fr/" }, { name: crumbName, path: "/fr/guides/" + slug }],
  content: page,
});
const DATA = [
  wrap(national, "combien-coute-site-web-suisse", "Guide — Prix d'un site web en Suisse"),
  wrap(logo, "prix-logo-identite-visuelle-suisse", "Guide — Prix d'un logo en Suisse"),
  wrap(agence, "agence-ou-freelance-suisse", "Guide — Agence ou freelance ?"),
];
fs.writeFileSync(SP + '/w3-data.json', JSON.stringify(DATA, null, 1));
// report
for (const d of DATA) {
  const c = d.content;
  const links = c.internalLinks.map(l => l.href).join(', ');
  const sib = c.internalLinks.filter(l => l.href.startsWith('/fr/guides/')).length;
  console.log(`✓ ${d.slug}\n   ${c.sections.length} sec · ${c.faq.length} FAQ · ${c.wordCount}w · siblingLinks:${sib}\n   → ${links}`);
}
// sanity: no misquote, no 80-140/h, no 6-12 semaines
const all = JSON.stringify(DATA);
console.log('\nchecks: misquote-freelance:' + (all.match(/structure d'un freelance/g) || []).length +
  ' · 80–140:' + (all.includes("80 – 140") || all.includes("80-140") ? 'PRESENT' : 'gone') +
  ' · 6-12sem:' + (/6\s*(?:à|–|-)\s*12\s+semaines/.test(all) ? 'PRESENT' : 'gone') +
  ' · suffix" CHF":' + (/\d[\d'’]*\s+CHF(?!\/)/.test(all.replace(/"tableRows[\s\S]*?\]\]/g,'')) ? 'CHECK' : 'clean'));
