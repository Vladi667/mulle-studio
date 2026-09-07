/* ─────────────────────────────────────────────────────────────────
   patch-logo-hourly.mjs — close the two gaps on the logo-price guide
   ─────────────────────────────────────────────────────────────────
   Measured in Search Console on 2026-09-07 (90 days): "prix logo suisse"
   is the site's best non-brand query at average position 17.6, and on a
   neutral fr/CH search the guide sits around fifth. It is the one page
   genuinely within reach of the top of page one, so it is worth the work.

   Reading that SERP against the page turned up two real gaps, both of
   which competitors ranking above it already cover:

     1. HOURLY RATES. The guide quotes fixed prices and never says what an
        hour of design costs in Switzerland — "tarif horaire" appeared zero
        times. Both fluide.ch and e-graphics.ch outrank it partly on that
        sub-topic. A reader pricing a logo genuinely wants it: a fixed quote
        is only an hourly rate times an estimate, and knowing the first is
        how you judge the second.

     2. THE PEOPLE-ALSO-ASK QUESTION. Google's own PAA box for this query
        asks "Quel est le prix moyen d'un logo ?" and the phrase "prix
        moyen" appeared nowhere on the page. The FAQ already carries six
        questions and FAQPage schema, so adding the one Google is visibly
        asking is cheap.

   Every figure below is verified against the primary source rather than a
   search snippet — fluide.ch, a Geneva agency, publishing its own reading
   of the market and its own rate. The e-graphics.ch page that the SERP
   also quoted returns 404, so nothing from it is used. This follows the
   rule the market table on the web-pricing guide already set: cite the
   page that makes the claim, link it nofollow, and never launder a figure
   through a third party.

     node scripts/seo/patch-logo-hourly.mjs
     node scripts/seo/patch-logo-hourly.mjs --check
   ───────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const FILE = `${ROOT}/fr/guides/prix-logo-identite-visuelle-suisse.html`;
const CHECK = process.argv.includes('--check');

const SRC = 'https://fluide.ch/blog/quels-sont-les-tarifs-des-graphistes-en-suisse/';
const OPEN = '<!-- hourly rates: injected by scripts/seo/patch-logo-hourly.mjs -->';
const CLOSE = '<!-- /hourly rates -->';

const SECTION = `${OPEN}
    <section class="lp-sec">
      <h2>Le tarif horaire derrière le forfait : ce que facture un graphiste en Suisse</h2>
      <p>Un forfait n'est jamais qu'un tarif horaire multiplié par un nombre d'heures estimé. Connaître le premier permet de juger le second : c'est le calcul le plus simple pour repérer un devis gonflé — ou un devis si bas qu'il ne peut pas couvrir le travail annoncé.</p>
      <p>L'agence Fluide Communication publie les fourchettes qu'elle observe sur le marché suisse : dès <strong>CHF 20.–/h</strong> pour un étudiant ou un amateur qui étoffe son portfolio, <strong>CHF 80.– à 160.–/h</strong> pour un graphiste indépendant selon l'expérience, et <strong>CHF 120.– à 150.–/h hors taxes</strong> comme tarif de base d'une agence de communication — l'agence précisant facturer elle-même CHF 132.–/h TTC (<a href="${SRC}" target="_blank" rel="nofollow noopener">source</a>).</p>
      <p>Ces chiffres expliquent l'essentiel de l'écart entre deux devis. Une identité facturée CHF 3'000 par une agence à CHF 140.–/h représente une vingtaine d'heures de travail ; la même somme chez un indépendant à CHF 90.–/h en représente une trentaine. Un écart de prix n'est donc pas toujours un écart de soin : c'est d'abord un écart de structure, et c'est la question qu'il faut poser au moment du devis.</p>
      <p>C'est aussi la lecture honnête du prix publié par Fritz. CHF 500 pour une identité de marque ne recouvre pas moins de méthode : cela recouvre une structure d'une seule personne, sans intermédiaire à financer, et un périmètre arrêté à l'avance plutôt qu'un devis ouvert dont les heures se découvrent en cours de route.</p>
    </section>
${CLOSE}`;

const Q = 'Quel est le prix moyen d\u2019un logo en Suisse ?';
const A = "Il n'existe pas de prix moyen unique, parce que le tarif dépend surtout de la structure qui facture. En Suisse, un logo seul se situe le plus souvent entre CHF 500 et CHF 1'500, et une identité visuelle complète entre CHF 1'200 et CHF 3'500. Rapporté à l'heure, le marché va de CHF 80.– à 160.– pour un graphiste indépendant et de CHF 120.– à 150.– hors taxes pour une agence de communication. Chez Fritz, l'identité de marque complète est publiée à CHF 500 en paiement unique, fichiers sources inclus.";

/* The visible FAQ uses a typographic apostrophe in its copy; the schema is
   generated from the same strings so the two can never drift apart. */
const FAQ_ITEM = `    <div class="faq-item"><h3>${Q}</h3><p>${A}</p></div>`;

let src = readFileSync(FILE, 'utf8');
const before = src;
const did = [];

/* ── 1. the hourly-rate section, after the price table it explains ── */
if (src.includes(OPEN)) {
  did.push('section already present');
} else {
  const anchor = '<h2>Le prix par livrable : le tableau de référence</h2>';
  const at = src.indexOf(anchor);
  if (at < 0) { console.log('FAIL: price-table section not found'); process.exit(1); }
  const end = src.indexOf('</section>', at);
  if (end < 0) { console.log('FAIL: unterminated price-table section'); process.exit(1); }
  const after = end + '</section>'.length;
  src = src.slice(0, after) + '\n' + SECTION + src.slice(after);
  did.push('added hourly-rate section');
}

/* ── 2. the PAA question, in the visible FAQ ── */
if (src.includes(`<h3>${Q}</h3>`)) {
  did.push('faq item already present');
} else {
  const firstItem = src.indexOf('<div class="faq-item">');
  if (firstItem < 0) { console.log('FAIL: no faq-item found'); process.exit(1); }
  const end = src.indexOf('</div>', firstItem) + '</div>'.length;
  src = src.slice(0, end) + '\n' + FAQ_ITEM + src.slice(end);
  did.push('added faq item');
}

/* ── 3. the same question in the FAQPage schema ──────────────────
   Parsed and re-serialised rather than string-spliced: the block is one
   minified line of JSON-LD, and a regex insertion into it is how you end
   up shipping invalid structured data that no tool will tell you about. */
const LD = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
let schemaTouched = false;
src = src.replace(LD, (whole, body) => {
  let json;
  try { json = JSON.parse(body); } catch { return whole; }
  const nodes = json['@graph'] || [json];
  const faq = nodes.find((n) => n['@type'] === 'FAQPage');
  if (!faq || !Array.isArray(faq.mainEntity)) return whole;
  if (faq.mainEntity.some((q) => q.name === Q)) { schemaTouched = true; return whole; }
  faq.mainEntity.splice(1, 0, {
    '@type': 'Question', name: Q,
    acceptedAnswer: { '@type': 'Answer', text: A },
  });
  schemaTouched = true;
  return `<script type="application/ld+json">${JSON.stringify(json)}</script>`;
});
if (!schemaTouched) { console.log('FAIL: FAQPage schema not found'); process.exit(1); }
did.push('faq schema in sync');

if (src !== before && !CHECK) writeFileSync(FILE, src.replace(/\r\n/g, '\n'));
console.log(`${CHECK ? 'would change' : 'changed'}: ${did.join(' · ')}`);

/* ── verification ── */
const out = readFileSync(FILE, 'utf8');
let bad = 0;
const check = (ok, msg) => { if (!ok) { console.log('   FAIL ' + msg); bad++; } };

check((out.match(new RegExp(OPEN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length === 1, 'section marker not exactly once');
check((out.match(new RegExp(`<h3>${Q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h3>`, 'g')) || []).length === 1, 'faq item not exactly once');
check(/tarif horaire/i.test(out), 'hourly-rate wording missing');
check(out.includes(SRC), 'source link missing');

/* the visible FAQ and the schema must carry the same set of questions */
const visible = [...out.matchAll(/<div class="faq-item"><h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
const blocks = [...out.matchAll(LD)];
let schemaQs = null;
for (const [, body] of blocks) {
  let j; try { j = JSON.parse(body); } catch { continue; }
  const f = (j['@graph'] || [j]).find((n) => n['@type'] === 'FAQPage');
  if (f) schemaQs = f.mainEntity.map((q) => q.name);
}
check(schemaQs !== null, 'FAQPage schema unparseable after patch');
if (schemaQs) {
  check(schemaQs.length === visible.length, `schema has ${schemaQs.length} questions, page shows ${visible.length}`);
  for (const q of visible) check(schemaQs.includes(q), `"${q.slice(0, 40)}…" is on the page but not in the schema`);
}

if (bad) { console.log(`VERIFY FAILED (${bad})`); process.exitCode = 1; }
else console.log(`verified: ${visible.length} questions, page and schema identical, source cited`);
