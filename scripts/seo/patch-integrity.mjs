// Remediation patch driven by the site-wide integrity audit (109 findings).
// Priority: (1) accuracy about our OWN prices, (2) honesty about clients we do not have,
// (3) fairness to unnamed competitors, (4) fabricated numbers. Asserted-behaviour softenings included where clean.
import fs from 'fs';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad';
const files = {};
const load = f => (files[f] ??= JSON.parse(fs.readFileSync(SP + '/' + f, 'utf8')));
// w4-data.json (the injected service bands) keys entries by `file`, everything else by `slug`
const page = (f, slug) => {
  const p = load(f).find(x => x.slug === slug || x.file === slug);
  if (!p) throw new Error('no ' + slug + ' in ' + f);
  return p.content;
};
let ok = 0, miss = 0; const missed = [];
function R(obj, from, to, label) {
  let hits = 0;
  const walk = o => {
    if (Array.isArray(o)) o.forEach((v, i) => { if (typeof v === 'string') { if (v.includes(from)) { o[i] = v.split(from).join(to); hits++; } } else walk(v); });
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string') { if (v.includes(from)) { o[k] = v.split(from).join(to); hits++; } } else walk(v);
    }
  };
  walk(obj);
  if (hits) ok++; else { miss++; missed.push(label); }
  return hits;
}
// remove a whole block (e.g. a fabricated table) from a page's sections
function dropBlock(content, match, label) {
  let done = false;
  for (const s of content.sections) {
    const i = s.blocks.findIndex(b => JSON.stringify(b).includes(match));
    if (i >= 0) { s.blocks.splice(i, 1); done = true; break; }
  }
  if (done) ok++; else { miss++; missed.push(label); }
}

/* ========== 1. THE "BELOW THE FLOOR" PRECISION ERROR (appears on 5 pages) ==========
   Truth: identity CHF 1'500 and site CHF 1'700 are INSIDE their ranges near the bottom.
   ONLY e-commerce CHF 2'500 is below its observed floor of CHF 5'000. */
const TRUE_FR = "Ces prix se situent dans le bas des fourchettes observées, et seul l'e-commerce à CHF 2'500 passe sous le plancher observé de CHF 5'000.";
const TRUE_EN = "identity at CHF 1'500 and the brochure site at CHF 1'700 sit inside their observed ranges, near the bottom; only e-commerce at CHF 2'500 sits below its observed floor of CHF 5'000";
{
  const g = page('w2-data.json', 'creation-site-web-geneve'); // (may not carry it; harmless)
  R(g, "en dessous des fourchettes", "dans le bas des fourchettes", 'w2 below-floor');
}
{
  const g = page('w2-data.json', 'prix-site-web-geneve');
  R(g, "Autrement dit, en dessous des fourchettes de marché ci-dessus — parfois nettement — tout en livrant un design entièrement sur-mesure plutôt qu'un modèle industriel.",
    "Autrement dit, dans le bas des fourchettes de marché ci-dessus, l'e-commerce étant le seul poste à passer sous le plancher observé, tout en livrant un design sur-mesure plutôt qu'un modèle industriel.", 'prix-geneve below-floor');
  const f = page('w3-data.json', 'agence-ou-freelance-suisse');
  R(f, "Ce n'est pas « dans la fourchette basse du marché » : sur plusieurs prestations, c'est en dessous du plancher observé.",
    "Ils se situent dans le bas des fourchettes observées, l'e-commerce étant le seul poste à passer sous le plancher observé.", 'agence-freelance below-floor a');
  R(f, "Ce n'est pas « dans la fourchette basse » : sur plusieurs prestations, c'est sous le plancher observé.",
    "Ils se situent dans le bas des fourchettes observées, l'e-commerce étant le seul poste à passer sous le plancher observé.", 'agence-freelance below-floor b');
}
{
  const b = page('w5-data.json', 'agence-branding-suisse');
  R(b, "Il se situe sous le plancher observé pour ce niveau, et la raison est structurelle plutôt que commerciale",
    "Il se situe dans le bas de cette fourchette, et la raison est structurelle plutôt que commerciale", 'branding-suisse below-floor a');
  R(b, "ce qui se situe sous le plancher habituellement observé pour ce niveau",
    "ce qui se situe dans le bas de la fourchette habituellement observée pour ce niveau", 'branding-suisse below-floor b');
  R(b, "ce qui se situe sous le plancher habituellement observé", "ce qui se situe dans le bas de la fourchette observée", 'branding-suisse below-floor c');
  const r = page('w5-data.json', 'agence-web-suisse-romande');
  R(r, "Les prix ci-dessus se situent au bas de ces fourchettes, et sous le plancher observé sur plusieurs postes.",
    "Les prix ci-dessus se situent dans le bas de ces fourchettes ; seul l'e-commerce passe sous le plancher observé.", 'suisse-romande below-floor');
}
{
  const e = page('w9-data.json', 'web-design-agency-geneva');
  R(e, "these prices sit at or below the low end, and on several items below the floor entirely",
    "these prices sit inside the observed ranges near the bottom, with e-commerce the one item below its observed floor", 'EN geneva below-floor');
  R(e, "a buyer new to Switzerland deserves to know they are looking at the bottom of the market and not the middle of it",
    "a buyer new to Switzerland deserves to know where these figures sit against the observed ranges", 'EN geneva bottom-of-market');
}

/* ========== 2. FALSE IMPLIED EXPERIENCE — clients that do not exist ========== */
{
  const n = page('w6-data.json', 'agence-web-neuchatel');
  R(n, "Fritz est un studio genevois qui travaille à distance avec des entreprises neuchâteloises",
    "Fritz est un studio genevois qui peut travailler à distance avec des entreprises neuchâteloises", 'neuchatel implied-clients a');
  R(n, "travaille avec des entreprises neuchâteloises", "disponible pour des entreprises neuchâteloises", 'neuchatel implied-clients b');
  const f = page('w6-data.json', 'agence-web-fribourg');
  R(f, "Fritz est un studio basé à Genève qui travaille avec des entreprises fribourgeoises",
    "Fritz est un studio basé à Genève qui peut travailler avec des entreprises fribourgeoises", 'fribourg implied-clients');
}
{
  const r = page('w5-data.json', 'agence-web-suisse-romande');
  R(r, "En pratique, la plupart des projets romands comportent un ou deux déplacements, concentrés sur les étapes ci-dessus.",
    "En pratique, un ou deux déplacements suffisent en général, concentrés sur les étapes ci-dessus.", 'romande implied-portfolio');
  R(r, "Un client à Neuchâtel voit exactement la même chose, au même moment, qu'un client au bout de la rue.",
    "Un client basé à Neuchâtel verrait exactement la même chose, au même moment, qu'un client au bout de la rue.", 'romande neuchatel-client');
}
{
  const h = page('w7-data.json', 'sites-web-hotellerie-restauration');
  R(h, "Le studio est basé à Genève et travaille avec des établissements de Suisse romande",
    "Le studio est basé à Genève et peut intervenir pour des établissements de Suisse romande", 'hotellerie implied-clients');
}

/* ========== 3. COMPETITOR MOTIVE-IMPUTATION ========== */
{
  const g = page('w2-data.json', 'prix-site-web-geneve');
  R(g, "Beaucoup d'agences ne publient aucun tarif et facturent au ressenti",
    "Beaucoup d'agences ne publient pas de tarif et chiffrent projet par projet", 'prix-geneve au-ressenti');
  R(g, "la maintenance reste un service optionnel, jamais une prise en otage",
    "la maintenance reste un service optionnel, facturé séparément", 'prix-geneve prise-en-otage');
  const c = page('w3-data.json', 'combien-coute-site-web-suisse');
  R(c, "Méfiez-vous des offres offshore à très bas prix : l'économie initiale se paie souvent en reprises, en délais et en incompréhensions.",
    "Une offre nettement moins chère venue d'un autre marché peut être un choix rationnel ; les points à vérifier sont le décalage horaire, la langue de travail et ce qui se passe en cas de reprise.", 'combien offshore');
}
{
  const r = page('w5-data.json', 'agence-web-suisse-romande');
  R(r, "Le déplacement est proposé quand il sert le projet, jamais pour justifier une facture.",
    "Le déplacement est proposé quand il sert le projet.", 'romande justifier-facture');
  R(r, "Facturer le déplacement au kilomètre pousse à se déplacer pour de mauvaises raisons, et transforme la géographie du client en variable commerciale.",
    "Les prix ne varient pas selon le canton : la géographie du client n'entre pas dans le calcul.", 'romande kilometre');
  R(r, "L'argument de la proximité est l'argument commercial par défaut des agences régionales.",
    "La proximité est souvent mise en avant dans ce marché.", 'romande proximite-argument');
  R(r, "Le prix est-il publié à l'avance, ou construit après estimation de votre budget.",
    "Le prix est-il publié à l'avance, ou communiqué après un premier échange.", 'romande estimation-budget');
  R(r, "Une agence installée dans votre rue peut très bien vous facturer CHF 4'000 pour un thème installé en trois jours",
    "La proximité seule ne dit rien du périmètre livré ni du prix", 'romande invented-4000');
}
{
  const l = page('w7-data.json', 'agence-web-lausanne');
  R(l, "Aucune promesse de temps de trajet ne sera faite ici : ce genre d'argument sert surtout à masquer l'absence de raison plus solide de choisir quelqu'un.",
    "Aucune promesse de temps de trajet ne sera faite ici : la proximité n'est pas proposée comme argument.", 'lausanne trajet-motive');
  R(l, "C'est un mauvais service rendu, et c'est une dépendance déguisée en cohérence.",
    "Le commerce doit alors repasser par un studio à chaque changement de parfum, ce qui n'a pas de sens.", 'lausanne dependance-deguisee');
}
{
  const b = page('w4-data.json', 'agence-marketing-geneve');
  R(b, "une agence classique qui facture des départements et sort deux publications par mois, ou un studio qui construit un vrai moteur d'acquisition de clients",
    "une structure organisée en plusieurs métiers et plusieurs interlocuteurs, ou un studio où une seule personne construit et tient le moteur d'acquisition", 'marketing competitor-cadence');
  R(b, "Une agence marketing à Genève qui se contente de publier deux annonces par mois saute les trois quarts de ce travail : elle diffuse sans avoir posé le positionnement, et diffuse sans mesurer ce qui rentre.",
    "Diffuser sans avoir posé le positionnement, ou diffuser sans mesurer ce qui rentre, revient à sauter l'essentiel de ce travail.", 'marketing trois-quarts');
  R(b, "Dans les fourchettes observées sur le marché genevois, un accompagnement récurrent démarre rarement sous quelques centaines de francs par mois et monte selon le nombre de canaux pilotés.",
    "Les modèles varient selon le prestataire et le nombre de canaux pilotés.", 'marketing invented-retainer-range');
  R(b, "Dans une agence marketing à Genève de taille classique, le compte passe entre un commercial, un chef de projet, un stratège et des exécutants qui ne se croisent qu'en réunion.",
    "Dès qu'une structure répartit le travail entre plusieurs métiers, un compte passe par plusieurs mains avant d'arriver à l'exécution.", 'marketing agency-internals');
  R(b, "Une agence marketing digital à Genève qui traite ces leviers séparément paie plus cher pour des résultats qu'elle ne parvient pas à relier.",
    "Des leviers pilotés séparément se mesurent mal et se relient difficilement.", 'marketing leviers');
  R(b, "La plupart des agences sortent deux pubs par mois et croisent les doigts.", "", 'marketing plupart-agences');
}
{
  const b = page('w4-data.json', 'systemes-croissance-ia');
  R(b, "Cette clarté est rare. Peu d'acteurs en Suisse romande expliquent honnêtement ce que l'IA fait, et surtout ce qu'elle ne fait pas, pour une petite structure.",
    "D'où l'intérêt de dire clairement ce que l'IA fait, et surtout ce qu'elle ne fait pas, pour une petite structure.", 'growth competitor-honesty');
  R(b, "La plupart des entreprises se développent encore à l'instinct.", "Quand la croissance se pilote à l'instinct, elle se répète mal.", 'growth plupart-instinct');
}
{
  const g = page('w4-data.json', 'agence-branding-geneve');
  R(g, "Un freelance résout le coût mais rarement la structure : pas toujours de charte, pas toujours de fichiers sources remis, un cadre variable.",
    "Ce qui varie d'un prestataire à l'autre, c'est le cadre livré : présence d'une charte, remise des fichiers sources, périmètre écrit.", 'branding-geneve freelance-claim');
}
{
  const c = page('w9-data.json', 'website-cost-switzerland');
  R(c, "one of them includes things the other quietly leaves out", "one of them includes items the other does not", 'EN cost quietly');
  R(c, "some low quotes are low precisely because they are not portable",
    "a build that cannot be taken elsewhere is a smaller scope, and scope shows up in the price", 'EN cost portable-motive');
  R(c, "no way to tell whether a CHF 6'000 quote is reasonable", "no way to tell whether a given quote is reasonable", 'EN cost invented-6000');
}

/* ========== 4. FABRICATED FIGURES / TABLES ========== */
{
  const g = page('w2-data.json', 'prix-site-web-geneve');
  R(g, "« Genève est 30 à 50 % plus cher que Lausanne » : vrai ou faux ?", "Genève est-elle plus chère que Lausanne ?", 'prix-geneve 30-50 heading');
  R(g, "Mais l'écart de 30 à 50 % concerne surtout les grandes structures avec des locaux et des équipes à Genève.",
    "L'écart concerne surtout les grandes structures avec des locaux et des équipes à Genève.", 'prix-geneve 30-50 body');
  R(g, "la différence entre un site à CHF 800 qui ne convertit pas et un site à CHF 1'700 qui convertit se compte vite en milliers de francs",
    "un site qui ne convertit pas coûte plus cher, dans la durée, qu'un site correctement conçu", 'prix-geneve CHF-800');
  R(g, "l'hébergement (CHF 60 à 400 par an)", "l'hébergement (CHF 100 à CHF 400 par an)", 'prix-geneve hosting-contradiction');
  dropBlock(g, "800 – 3'000", 'prix-geneve invented per-provider table');
  dropBlock(g, "3'500 – 8'000", 'prix-geneve invented advanced band');
  const c = page('w3-data.json', 'combien-coute-site-web-suisse');
  dropBlock(c, "Haut de fourchette", 'combien invented regional table');
  R(c, "(120 à 180 CHF/h en Suisse, contre souvent 50 à 90 €/h en France). Un même site vitrine peut se négocier autour de 1'000 à 2'500 € chez un prestataire français",
    "(CHF 120 à CHF 180 de l'heure en Suisse, contre des taux nettement inférieurs dans les marchés voisins)", 'combien france-figures');
  R(c, "pour un abonnement de CHF 15 à 60 par mois, hébergement compris", "pour un abonnement mensuel, hébergement compris", 'combien cms-subscription');
  R(c, "le taux horaire d'une agence en Suisse se situe généralement entre 120 et CHF 180 de l'heure",
    "le taux horaire d'une agence en Suisse se situe généralement entre CHF 120 et CHF 180 de l'heure", 'combien CHF-prefix');
  const lg = page('w3-data.json', 'prix-logo-identite-visuelle-suisse');
  R(lg, "Un même signe peut valoir CHF 200 sur une place de marché en ligne ou CHF 15'000 au sein d'une grande agence",
    "Un même signe peut être facturé très peu sur une place de marché en ligne, ou beaucoup au sein d'une grande agence", 'prix-logo invented-200-15000');
}
{
  const b = page('w5-data.json', 'agence-branding-suisse');
  R(b, "un taux horaire d'agence se situe le plus souvent entre CHF 120 à 180 de l'heure",
    "un taux horaire d'agence se situe le plus souvent entre CHF 120 et CHF 180 de l'heure", 'branding-suisse CHF-prefix');
  R(b, "Un client suisse qui compare deux prestataires regarde la précision avant l'audace.",
    "Sur ce marché, la précision est généralement mieux récompensée que l'audace.", 'branding-suisse buyer-behaviour');
}

/* ========== write ========== */
for (const [f, d] of Object.entries(files)) fs.writeFileSync(SP + '/' + f, JSON.stringify(d, null, 2));
console.log(`applied: ${ok}   missed: ${miss}`);
if (missed.length) console.log('MISSED (text not found — verify manually):\n  ' + missed.join('\n  '));

// verification sweep
const blob = JSON.stringify(files);
const banned = {
  'below-floor overclaim (FR)': /sous le plancher observé sur plusieurs postes|en dessous du plancher observé/,
  'below-floor overclaim (EN)': /below the floor entirely/,
  '30 à 50 %': /30 à 50 ?%/,
  'CHF 800 site': /site à CHF 800/,
  'CHF 200 logo': /CHF 200 sur une place/,
  'invented regional table': /Haut de fourchette/,
  'per-provider price table': /800 – 3'000/,
  'French €/h': /50 à 90 €/,
  'prise en otage': /prise en otage/,
  'au ressenti': /facturent au ressenti/,
  'justifier une facture': /justifier une facture/,
  'trois quarts': /saute les trois quarts/,
  'peu d\'acteurs honnêtes': /Peu d'acteurs en Suisse romande expliquent honnêtement/,
  'travaille avec des entreprises fribourgeoises': /qui travaille avec des entreprises fribourgeoises/,
  'travaille avec des entreprises neuchâteloises': /qui travaille à distance avec des entreprises neuchâteloises/,
};
console.log('\nVERIFY:');
let fails = 0;
for (const [k, re] of Object.entries(banned)) { const bad = re.test(blob); if (bad) fails++; console.log(`  ${bad ? '✗' : '·'} ${k}: ${bad ? 'STILL PRESENT' : 'gone'}`); }
console.log(fails ? `\n${fails} still present` : '\nall targeted defects cleared');
