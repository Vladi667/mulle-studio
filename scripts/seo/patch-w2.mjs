import fs from 'fs';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad';
const pages = JSON.parse(fs.readFileSync(SP + '/w2-content.json', 'utf8'));

/* ── LANDER fixes ── */
const L = pages['creation-lander'];
// fix 6: exact-match in the lede
L.lede = "Fritz est un studio indépendant à Genève spécialisé dans la création de site web sur-mesure : sites vitrines, boutiques e-commerce et identités de marque. Le soin d'une agence, la structure d'un indépendant, et des prix publiés à l'avance. Vous êtes propriétaire du code et des fichiers sources, sans abonnement ni dépendance.";
// fix 3: Fritz-specific opener (not market-general)
L.quotableOpener = "Chez Fritz, un site web vitrine à Genève coûte CHF 1'700 et une boutique e-commerce CHF 2'500, en paiement unique, code et fichiers sources inclus.";
// fix 4: differentiate the shared FAQ question toward the transactional intent
const lq = L.faq.find(f => /Combien coûte la création d'un site internet à Genève/.test(f.q));
if (lq) lq.q = "Combien coûte un site web à Genève chez Fritz ?";
// fix 5: de-duplicate the comparison — drop the price table from the lander's "que choisir" section,
// keep the decision prose, and hand the price-comparison job to the guide via a link
const sec5 = L.sections.find(s => /grande agence ou freelance/i.test(s.h2));
if (sec5) {
  sec5.blocks = sec5.blocks.filter(b => b.type !== 'table');
  sec5.blocks.push({ type: 'p', text: "Pour un comparatif chiffré des prix selon le type de prestataire, consultez notre <a href=\"/fr/guides/prix-site-web-geneve\">guide du prix d'un site web à Genève</a> : il détaille les fourchettes du marché et ce qui les explique." });
}
// fix 5: reciprocal link lander → guide
L.internalLinks.push({ anchor: "prix d'un site web à Genève", href: "/fr/guides/prix-site-web-geneve" });

/* ── GUIDE fixes ── */
const G = pages['prix-guide'];
// fix 2: Fritz is BELOW the market floors, not "in the low range"
for (const s of G.sections) for (const b of s.blocks) {
  if (b.type === 'p' && b.text.includes('dans le bas des fourchettes')) {
    b.text = b.text.replace('Autrement dit, dans le bas des fourchettes ci-dessus, mais avec un design sur-mesure et non un modèle industriel.',
      "Autrement dit, en dessous des fourchettes de marché ci-dessus — parfois nettement — tout en livrant un design entièrement sur-mesure plutôt qu'un modèle industriel.");
  }
}

/* ── build assembler DATA ── */
const O = 'https://agencefritz.com';
const DATA = [
  {
    slug: 'creation-site-web-geneve', type: 'lander', dir: '', hreflangEn: null, langEn: '/brand-web', priceBlock: '',
    breadcrumb: [{ name: 'Accueil', path: '/fr/' }, { name: 'Création de site web à Genève', path: '/fr/creation-site-web-geneve' }],
    content: L,
  },
  {
    slug: 'prix-site-web-geneve', type: 'guide', dir: 'guides', hreflangEn: null, langEn: '/', priceBlock: '',
    breadcrumb: [{ name: 'Accueil', path: '/fr/' }, { name: 'Guide — Prix d\'un site web à Genève', path: '/fr/guides/prix-site-web-geneve' }],
    content: G,
  },
];
fs.writeFileSync(SP + '/w2-data.json', JSON.stringify(DATA, null, 1));
console.log('patched + wrote w2-data.json ·', DATA.map(d => d.slug + ' (' + d.content.sections.length + ' sec, ' + d.content.faq.length + ' faq)').join(' · '));
