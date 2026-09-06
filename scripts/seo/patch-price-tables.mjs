/* ─────────────────────────────────────────────────────────────────
   patch-price-tables.mjs — a table to quote, and a person to credit
   ─────────────────────────────────────────────────────────────────
   Three changes, all aimed at the one lane this domain can win without
   links: the pricing questions, where the pages being quoted are small
   Swiss agency posts rather than authority sites.

   1. /fr/tarifs carried no table and no date. A price list that an answer
      engine cannot lift as a table is a page it will summarise from
      somebody else's. Adds the table, a visible validity date, and
      priceValidUntil on the nine Offer objects already in the schema.

   2. /fr/guides/prix-site-web-geneve quoted market ranges with no source
      at all: its only outbound links were Google Fonts and LinkedIn. It
      now carries a table where every range is attributed to the agency's
      OWN published price page, fetched and verified on 2026-09-06.

   Authorship (the byline and the Person schema) is NOT here: patch-pricing-lane
   owns it, because it rewrites the byline from scratch and runs later.

   NOT a "best agencies" page: it lists what each agency publishes, in
   their own words, with no ranking and no judgement. The DON'Ts forbid
   ranking competitors, not citing their public prices.

   Why an injector rather than the generator: build-tarifs.mjs has drifted
   from the live page (running it produced a 633-line diff and dropped the
   analytics block, the org stamp and the estimator), so /fr/tarifs is
   patched in place like every other rendered page here.

     node scripts/seo/patch-price-tables.mjs
   ───────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync } from 'node:fs';
import { PRICES, CHF } from './prices.mjs';
import { lastContentChange } from './build-sitemap.mjs';

const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const MARK = 'data-price-table';
const CSS_ID = 'price-table-css';

const P = {
  identity: CHF(PRICES.identity),
  vitrine: CHF(PRICES.vitrine),
  ecommerce: CHF(PRICES.ecommerce),
  mk: PRICES.marketing,
  go: PRICES.growthOps,
};

/* Prices are quoted until the end of January, which is a real commitment the
   owner can keep, not a date invented to please a validator. */
const VALID_UNTIL = '2027-01-31';

const CSS = `<style id="${CSS_ID}">
.fz-tbl{width:100%;border-collapse:collapse;margin:26px 0 8px;font-size:14.5px}
.fz-tbl caption{text-align:left;font-family:var(--mono);font-size:11px;letter-spacing:.08em;
  text-transform:uppercase;color:var(--txt-40);padding-bottom:10px}
.fz-tbl th{text-align:left;font-weight:500;font-size:12px;letter-spacing:.04em;color:var(--txt-40);
  border-bottom:1px solid var(--hairline-2);padding:0 14px 8px 0}
.fz-tbl td{padding:11px 14px 11px 0;border-bottom:1px solid var(--hairline);vertical-align:top;color:var(--txt-70)}
.fz-tbl td:first-child{color:var(--txt);font-weight:500}
.fz-tbl td b{color:var(--txt);font-weight:500}
.fz-note{font-size:12.5px;color:var(--txt-40);line-height:1.6;margin:0 0 26px}
.fz-note a{color:inherit;text-decoration:underline;text-underline-offset:2px}
.fz-wrap{overflow-x:auto}
</style>`;

/* ── 1. the published price list, as a table ── */
const TARIFS_TABLE = `<div class="fz-wrap" ${MARK}="tarifs"><table class="fz-tbl">
<caption>Tarifs publiés, prestations distinctes</caption>
<thead><tr><th>Prestation</th><th>Prix</th><th>Paiement</th><th>Ce qui est livré</th></tr></thead>
<tbody>
<tr><td>Identité de marque</td><td><b>${P.identity}</b></td><td>Unique</td><td>Logo, système visuel, fichiers sources</td></tr>
<tr><td>Site vitrine</td><td><b>${P.vitrine}</b></td><td>Unique</td><td>Conception, développement, mise en ligne, code livré</td></tr>
<tr><td>Site e-commerce</td><td><b>${P.ecommerce}</b></td><td>Unique</td><td>Boutique, paiements, catalogue, code livré</td></tr>
<tr><td>Marketing</td><td><b>dès ${CHF(P.mk.starter)}</b> / mois</td><td>Mensuel</td><td>Starter ${CHF(P.mk.starter)} · Engine ${CHF(P.mk.engine)} · Growth ${CHF(P.mk.growth)}</td></tr>
<tr><td>Growth Ops</td><td><b>dès ${CHF(P.go.signal)}</b> / mois</td><td>Mensuel</td><td>Signal ${CHF(P.go.signal)} · Compound ${CHF(P.go.compound)} · Enterprise ${CHF(P.go.enterprise)}</td></tr>
</tbody></table>
<p class="fz-note">Les trois prestations uniques sont des achats distincts : l'identité n'est pas comprise dans le site, et le site n'est pas compris dans l'e-commerce. Prix identiques dans tous les cantons. <b>Tarifs valables jusqu'au 31 janvier 2027</b> · mis à jour le {DATE}.</p></div>`;

/* ── 2. what other Geneva providers publish, each row from its own price page.
      Every figure below was fetched from the source URL on 2026-09-06. ── */
const SOURCES = [
  { who: 'Fritz', vitrine: `<b>${P.vitrine}</b>`, ecom: `<b>${P.ecommerce}</b>`, url: 'https://agencefritz.com/fr/tarifs', label: 'Tarifs publiés', self: true },
  { who: 'ReactiveWeb', vitrine: "490 à 2'990 (HT)", ecom: "990 à 1'990 (HT)", url: 'https://reactiveweb.ch/creation-de-site-web-suisse', label: 'Page tarifs' },
  { who: 'Helveit', vitrine: "1'500 (ou dès 150/mois)", ecom: "2'500 (ou dès 400/mois)", url: 'https://helveit.ch/tarifs', label: 'Page tarifs' },
  { who: 'VLdesign (Genève)', vitrine: "1'500 à 4'500", ecom: "3'500 à 15'000+", url: 'https://www.vldesign.ch/prix-site-internet-geneve', label: 'Guide prix, mai 2026' },
  { who: 'Jon Labs', vitrine: "1'500 à 8'000 (indépendant)", ecom: "1'500 à 8'000 (simple)", url: 'https://jonlabs.ch/blog/prix-site-web-suisse-2026', label: 'Guide prix, déc. 2025' },
];

const MARKET_TABLE = `<div class="fz-wrap" ${MARK}="market"><table class="fz-tbl">
<caption>Prix publiés par des prestataires actifs à Genève et en Suisse romande</caption>
<thead><tr><th>Prestataire</th><th>Site vitrine (CHF)</th><th>E-commerce (CHF)</th><th>Source</th></tr></thead>
<tbody>
${SOURCES.map((s) => `<tr><td>${s.who}</td><td>${s.vitrine}</td><td>${s.ecom}</td><td>${s.self ? s.label : `<a href="${s.url}" rel="nofollow noopener" target="_blank">${s.label}</a>`}</td></tr>`).join('\n')}
</tbody></table>
<p class="fz-note">Relevé le 6 septembre 2026 sur les pages publiques de chaque prestataire ; les montants peuvent avoir changé depuis. Ce tableau compare des prix affichés, pas la qualité du travail, et ne classe personne. La plupart des prestataires de Genève ne publient aucun prix : ceux qui figurent ici sont ceux qui le font. Le prix Fritz d'un site vitrine (${P.vitrine}) se situe sous le plancher des fourchettes publiées par Helveit, VLdesign et Jon Labs, mais au-dessus des offres d'entrée de ReactiveWeb (490 à 990 pour un à cinq pages).</p></div>`;

let changed = 0;
const problems = [];

function patch(file, fn) {
  const path = `${ROOT}/${file}`;
  let src = readFileSync(path, 'utf8');
  const before = src;
  /* Strip what this script added before inserting again. The strip must consume
     exactly what the insert produced and no more: an earlier version also ate the
     whitespace AFTER the block, so the run that removed it left the following
     element pulled up against the table and the second run differed from the
     first. Leading whitespace only, nothing trailing. */
  src = src.replace(new RegExp(`\\s*<div class="fz-wrap" ${MARK}="[a-z]+">[\\s\\S]*?</div>`, 'g'), '');
  src = src.replace(new RegExp(`\\n?<style id="${CSS_ID}">[\\s\\S]*?</style>`, 'g'), '');
  src = fn(src);
  src = src.replace('</head>', `${CSS}\n</head>`);
  // Adjacent style blocks join differently depending on what the previous
  // patcher left behind; force the break so the result does not depend on it.
  src = src.replace(/(<\/style>)(<style id=)/g, '$1\n$2');
  src = src.replace(/(?:\r?\n[ \t]*){3,}/g, '\n\n');
  if (src !== before) { writeFileSync(path, src); changed++; }
  return src;
}

/* /fr/tarifs — table after the lede, priceValidUntil on every Offer */
patch('fr/tarifs.html', (src) => {
  const date = lastContentChange('fr/tarifs.html') || '2026-09-06';
  const [y, m, d] = date.split('-').map(Number);
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const table = TARIFS_TABLE.replace('{DATE}', `${d} ${MONTHS[m - 1]} ${y}`);

  const i = src.indexOf('class="page-lede"');
  if (i < 0) { problems.push('fr/tarifs.html: no .page-lede'); return src; }
  const end = src.indexOf('</p>', i) + 4;
  src = src.slice(0, end) + '\n' + table + src.slice(end);

  // priceValidUntil inside the OfferCatalog's Offer objects. Strip first: without
  // that, a second run adds a second copy to every offer.
  src = src.replace(/"priceValidUntil":"[^"]*",?/g, '');
  return src.replace(/("@type":\s*"Offer",)/g, `$1"priceValidUntil":"${VALID_UNTIL}",`);
});

/* the Geneva pricing guide — sourced market table under its opening answer */
patch('fr/guides/prix-site-web-geneve.html', (src) => {
  const h2 = src.indexOf('<h2>Combien coûte un site web à Genève');
  if (h2 < 0) { problems.push('prix-site-web-geneve: opening H2 not found'); return src; }
  const p = src.indexOf('</p>', h2) + 4;
  return src.slice(0, p) + '\n' + MARKET_TABLE + src.slice(p);
});

/* Authorship (byline + Person schema) lives in patch-pricing-lane.mjs, which
   rewrites the byline from scratch and runs later in the chain. Doing it here
   too meant the name was written and then wiped on the next rebuild. */

console.log(`patched: ${changed} file(s)`);
for (const p of problems) console.log('   PROBLEM', p);

/* ── verification ── */
const tarifs = readFileSync(`${ROOT}/fr/tarifs.html`, 'utf8');
const geneva = readFileSync(`${ROOT}/fr/guides/prix-site-web-geneve.html`, 'utf8');
const offers = (tarifs.match(/"priceValidUntil"/g) || []).length;

const checks = {
  'tarifs has exactly one price table': (tarifs.match(new RegExp(`${MARK}="tarifs"`, 'g')) || []).length === 1,
  'tarifs table carries every published price': [P.identity, P.vitrine, P.ecommerce, CHF(P.mk.engine), CHF(P.go.enterprise)].every((v) => tarifs.includes(v)),
  'priceValidUntil on all nine offers': offers === 9,
  'guide has exactly one market table': (geneva.match(new RegExp(`${MARK}="market"`, 'g')) || []).length === 1,
  'every source row links out': SOURCES.filter((s) => !s.self).every((s) => geneva.includes(`href="${s.url}"`)),
  'source links are nofollow': !/href="https:\/\/(reactiveweb|helveit|www\.vldesign|jonlabs)[^"]*"(?![^>]*rel="nofollow)/.test(geneva),
  'market note states the position honestly': geneva.includes('au-dessus des offres') && geneva.includes('ne classe personne'),
  'no em dash or curly apostrophe inserted': !/[—–’‘]/.test(TARIFS_TABLE + MARKET_TABLE),
  'no retired price in inserted copy': !/CHF ?(1'700|2'500|1'400|2'200|490|2'900)\b/.test(TARIFS_TABLE),
};
let bad = problems.length;
for (const [k, v] of Object.entries(checks)) { console.log(`   ${v ? 'ok  ' : 'FAIL'} ${k}`); if (!v) bad++; }
if (bad) process.exitCode = 1;
