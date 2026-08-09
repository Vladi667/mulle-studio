import { load } from 'cheerio';
import fs from 'fs';
import { PRICES, group, CHF } from './prices.mjs';
const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const ORIGIN = 'https://agencefritz.com';

// shell = an existing FR twin (correct FR chrome: header, nav→FR, footer, scripts)
const $ = load(fs.readFileSync(ROOT + '/fr/confidentialite.html', 'utf8'), { decodeEntities: false });

const title = "Tarifs — Agence Fritz, Genève | Prix publiés";
const desc = `Les tarifs publics de l'agence Fritz à Genève : identité de marque ${CHF(PRICES.identity)}, site web ${CHF(PRICES.vitrine)}, e-commerce ${CHF(PRICES.ecommerce)}.`;
const url = ORIGIN + '/fr/tarifs';
$('title').text(title);
$('meta[name="description"]').attr('content', desc);
$('link[rel="canonical"]').attr('href', url);
$('meta[property="og:url"]').attr('content', url);
$('meta[property="og:title"]').attr('content', 'Tarifs — Agence Fritz, Genève');
$('meta[property="og:description"]').attr('content', desc);
// reciprocal hreflang with the English pricing page (/pricing is this page's EN counterpart)
$('link[rel="alternate"][hreflang]').remove();
$('link[rel="canonical"]').after(
  '\n<link rel="alternate" hreflang="en" href="' + ORIGIN + '/pricing">' +
  '\n<link rel="alternate" hreflang="fr-CH" href="' + url + '">' +
  '\n<link rel="alternate" hreflang="x-default" href="' + ORIGIN + '/pricing">');
// language switcher: EN → the English pricing page, FR active
$('.langtog').remove();
$('header').first().append('<div class="langtog" aria-label="Language"><a href="/pricing">EN</a><a href="/fr/tarifs" class="on" aria-current="page">FR</a></div>');
// scoped FAQ styling
$('head').append(`<style>
.faq{max-width:820px;margin:clamp(24px,4vh,44px) auto 0;padding:0 var(--margin)}
.faq-item{border-top:1px solid var(--hairline);padding:clamp(18px,2.6vh,28px) 0}
.faq-item:last-child{border-bottom:1px solid var(--hairline)}
.faq-item h3{font-size:clamp(16px,1.5vw,19px);font-weight:600;letter-spacing:-.01em;margin:0 0 8px}
.faq-item p{color:var(--txt-70);max-width:68ch;margin:0}
.tarif-note{max-width:820px;margin:clamp(20px,3vh,34px) auto 0;padding:0 var(--margin);color:var(--txt-55);font-size:13.5px}
.tarif-note a{color:var(--blue);text-decoration:none}
.pkg .period.mo{color:var(--blue)}
</style>`);

const pkg = (tag, n, name, desc, cur, amt, per, deliv, items, mo) => `
    <article class="pkg" data-reveal>
      <div class="pkg-n"><span>${tag}</span><b>${n}</b></div>
      <h3>${name}</h3>
      <p class="pkg-tag">${desc}</p>
      <div class="price"><span class="cur">${cur}</span><span class="amt">${amt}</span></div>
      <div class="period${mo ? ' mo' : ''}">${per}</div>
      <div class="deliv"><b>${deliv[0]}</b> ${deliv[1]}</div>
      <ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>
      <a class="btn" href="/fr/contact"><span>Démarrer</span><span class="arr" aria-hidden="true"></span></a>
    </article>`;

const main = `
<section class="page-hero">
  <div class="eyebrow" data-reveal><span class="hr" aria-hidden="true"></span><span>Tarifs</span><span class="sep" aria-hidden="true"></span><b>Genève</b></div>
  <h1>Des tarifs <em>publics.</em></h1>
  <p class="page-lede">Pas de « sur devis » opaque. Identité de marque dès ${CHF(PRICES.identity)}, site web dès ${CHF(PRICES.vitrine)}, e-commerce dès ${CHF(PRICES.ecommerce)}, accompagnement marketing dès ${CHF(PRICES.marketing.starter)} par mois. Le code et les fichiers sources vous appartiennent, toujours.</p>
  <div class="page-meta">
    <div><span>Devis</span><b>Gratuit</b></div>
    <div><span>Réponse</span><b>&lt; 24 h</b></div>
    <div><span>Propriété</span><b>Code &amp; sources</b></div>
  </div>
</section>

<section class="pricing" aria-label="Marque & site web">
  <div class="eyebrow" data-reveal><span class="hr" aria-hidden="true"></span><span>Marque &amp; site web</span><span class="sep" aria-hidden="true"></span><b>Paiement unique</b></div>
  <div class="pricing-grid">
${pkg('Marque', '01', 'Identité de marque', 'Logo, palette, typographies et les supports essentiels pour une présence cohérente partout.', 'CHF', group(PRICES.identity), 'paiement unique', ['Livré', 'en 14 jours'], ['3 pistes de logo → 1 système affiné', 'Palette et typographies complètes', 'Carte de visite &amp; papeterie', 'Signature e-mail &amp; kit réseaux'])}
${pkg('Web', '02', 'Site web vitrine', "Le site qui porte votre marque — une surface publique complète, conçue et développée d'un seul tenant.", 'CHF', group(PRICES.vitrine), 'paiement unique', ['Livré', 'en 2 à 4 semaines'], ['Site vitrine sur-mesure', 'SEO technique &amp; analytics', 'Formation à la prise en main'])}
${pkg('Commerce', '03', 'Site e-commerce', 'Une surface e-commerce complète. Pour les marques qui vendent, gèrent leur stock et montent en volume.', 'CHF', group(PRICES.ecommerce), 'paiement unique', ['Livré', 'en 6 à 8 semaines'], ['Catalogue &amp; paiement (Stripe, TWINT)', 'Back-office &amp; gestion des commandes', 'SEO e-commerce', 'Formation complète'])}
  </div>
</section>

<section class="pricing" aria-label="Marketing">
  <div class="eyebrow" data-reveal><span class="hr" aria-hidden="true"></span><span>Marketing</span><span class="sep" aria-hidden="true"></span><b>Par mois</b></div>
  <div class="pricing-grid">
${pkg('Signal', '01', 'Starter', 'Le placement du signal, en continu — pour installer une présence régulière et mesurée.', 'CHF', group(PRICES.marketing.starter), 'par mois · sans minimum', ['Sans', 'engagement'], ['Stratégie &amp; calendrier', 'Création des contenus', 'Diffusion &amp; suivi', 'Reporting mensuel'])}
${pkg('Moteur', '02', 'Engine', 'La machine créative qui tourne — production régulière et diffusion sur les bons canaux.', 'CHF', group(PRICES.marketing.engine), 'par mois · min. 3 mois', ['Engagement', '3 mois'], ['Tout ce que comprend Starter', 'Volume de création accru', 'Publicité gérée', 'Optimisation continue'])}
${pkg('Croissance', '03', 'Growth', 'Création, acquisition et performance réunies — pour accélérer franchement.', 'CHF', group(PRICES.marketing.growth), 'par mois · min. 3 mois', ['Engagement', '3 mois'], ['Tout ce que comprend Engine', 'Acquisition multicanale', 'A/B testing &amp; CRO', 'Reporting hebdomadaire'])}
  </div>
</section>

<section class="pricing" aria-label="Growth Ops">
  <div class="eyebrow" data-reveal><span class="hr" aria-hidden="true"></span><span>Growth Ops · IA</span><span class="sep" aria-hidden="true"></span><b>Par mois</b></div>
  <div class="pricing-grid">
${pkg('Signal', '01', 'Signal', 'Le socle : tracking propre, tableaux de bord et visibilité sur ce qui compte.', 'CHF', group(PRICES.growthOps.signal), 'par mois · annulable', ['Sans', 'engagement'], ['Tracking &amp; tableaux de bord', 'Mise en place analytics', 'Reporting mensuel', 'Recommandations'])}
${pkg('Compound', '02', 'Compound', "L'étage automatisation : CRM, workflows et relances qui travaillent pour vous.", 'CHF', group(PRICES.growthOps.compound), 'par mois · min. 3 mois', ['Engagement', '3 mois'], ['Tout ce que comprend Signal', 'CRM &amp; automatisations', 'Séquences &amp; relances', 'Intégrations sur-mesure'])}
${pkg('Enterprise', '03', 'Enterprise', "Le système complet, propulsé par l'IA — pensé pour compounding et passage à l'échelle.", 'CHF', group(PRICES.growthOps.enterprise), 'par mois · engagement 6 mois', ['Engagement', '6 mois'], ['Tout ce que comprend Compound', 'Modèles &amp; agents IA', 'Reporting hebdomadaire', 'Accompagnement dédié'])}
  </div>
</section>

<section class="section" aria-label="Questions fréquentes">
  <div class="eyebrow" data-reveal><span class="hr" aria-hidden="true"></span><span>FAQ</span><span class="sep" aria-hidden="true"></span><b>Tarifs &amp; conditions</b></div>
  <h2>Questions fréquentes</h2>
  <div class="faq">
    <div class="faq-item"><h3>Que comprend le prix chez Fritz ?</h3><p>Le design sur-mesure, le développement, le SEO technique de base et la formation pour gérer votre site en autonomie. Aucun frais caché : le devis détaillé liste tout avant de commencer.</p></div>
    <div class="faq-item"><h3>Le site et le code source m'appartiennent-ils ?</h3><p>Oui, entièrement. À la livraison, le code, les fichiers de design et les sources vous sont remis. Aucune dépendance à une plateforme, aucun abonnement obligatoire.</p></div>
    <div class="faq-item"><h3>Puis-je payer en plusieurs fois ?</h3><p>Oui. Les projets se règlent généralement en deux ou trois échéances : un acompte au lancement, le solde à la livraison.</p></div>
    <div class="faq-item"><h3>Quels sont les délais ?</h3><p>Une identité de marque en ~14 jours, un site vitrine en 2 à 4 semaines, un e-commerce en 6 à 8 semaines. Le calendrier précis est fixé au démarrage du projet.</p></div>
    <div class="faq-item"><h3>Le devis est-il gratuit ?</h3><p>Oui, toujours. Un premier échange et un devis détaillé sont gratuits et sans engagement. Réponse sous 24 heures.</p></div>
    <div class="faq-item"><h3>Proposez-vous de la maintenance ?</h3><p>Oui, en option : mises à jour, sauvegardes et support, sur forfait mensuel ou à l'heure selon vos besoins.</p></div>
  </div>
  <p class="tarif-note">Un projet particulier ou hors forfait ? <a href="/fr/contact">Parlons-en</a> — le devis reste gratuit.</p>
</section>
`;

// the footer lives inside <main> — preserve it when swapping the page body
const footerHtml = $('main footer').first().length ? '\n' + $.html($('main footer').first()) : '';
$('main').html(main + footerHtml);

// OfferCatalog + FAQPage schema
const offer = (name, price, cur, unit) => ({ '@type': 'Offer', name, priceSpecification: { '@type': 'PriceSpecification', price, priceCurrency: cur, ...(unit ? { unitText: unit } : {}) } });
const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'OfferCatalog', name: 'Tarifs Agence Fritz', url, provider: { '@id': ORIGIN + '/#org' },
      itemListElement: [
        offer('Identité de marque', String(PRICES.identity), 'CHF'), offer('Site web vitrine', String(PRICES.vitrine), 'CHF'), offer('Site e-commerce', String(PRICES.ecommerce), 'CHF'),
        offer('Marketing Starter', String(PRICES.marketing.starter), 'CHF', 'MONTH'), offer('Marketing Engine', String(PRICES.marketing.engine), 'CHF', 'MONTH'), offer('Marketing Growth', String(PRICES.marketing.growth), 'CHF', 'MONTH'),
        offer('Growth Ops Signal', String(PRICES.growthOps.signal), 'CHF', 'MONTH'), offer('Growth Ops Compound', String(PRICES.growthOps.compound), 'CHF', 'MONTH'), offer('Growth Ops Enterprise', String(PRICES.growthOps.enterprise), 'CHF', 'MONTH'),
      ] },
    { '@type': 'FAQPage', mainEntity: [
      ['Que comprend le prix chez Fritz ?', 'Le design sur-mesure, le développement, le SEO technique de base et la formation. Aucun frais caché : le devis détaillé liste tout avant de commencer.'],
      ['Le site et le code source m\'appartiennent-ils ?', 'Oui, entièrement. À la livraison, le code, les fichiers de design et les sources vous sont remis, sans dépendance ni abonnement obligatoire.'],
      ['Puis-je payer en plusieurs fois ?', 'Oui, généralement en deux ou trois échéances : un acompte au lancement, le solde à la livraison.'],
      ['Quels sont les délais ?', 'Une identité en ~14 jours, un site vitrine en 2 à 4 semaines, un e-commerce en 6 à 8 semaines. Le calendrier est fixé au démarrage.'],
      ['Le devis est-il gratuit ?', 'Oui, toujours. Premier échange et devis détaillé gratuits et sans engagement. Réponse sous 24 heures.'],
      ['Proposez-vous de la maintenance ?', 'Oui, en option : mises à jour, sauvegardes et support, sur forfait mensuel ou à l\'heure.'],
    ].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ],
};
$('head').append(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`);

fs.writeFileSync(ROOT + '/fr/tarifs.html', $.html());
console.log('wrote fr/tarifs.html (' + Math.round($.html().length / 1024) + 'KB)');
