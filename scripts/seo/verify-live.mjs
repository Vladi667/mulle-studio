/* ─────────────────────────────────────────────────────────────────
   verify-live.mjs — fetch production and fail loudly on a regression
   ─────────────────────────────────────────────────────────────────
   Three of the findings in the September audit were regressions of
   things that had already been fixed once:

     · the "Trusted by" band survived the sweep that removed fabricated
       client work from fifteen pages, because it lives in the hero
     · seo-build.mjs kept emitting the July price range for weeks after
       the prices were cut
     · the sitemap kept one hard-coded date while every page changed

   Each was found by a human reading pages months later. A script that
   fails in ten seconds is cheaper than a fourth audit.

   Run after EVERY deploy:  npm run verify-live
   Add --local to check the working tree instead of production.
   ───────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
import { PRICES } from './prices.mjs';

const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const ORIGIN = process.env.VERIFY_ORIGIN || 'https://agencefritz.com';
const LOCAL = process.argv.includes('--local');

const fails = [];
const warns = [];
const fail = (what, detail) => fails.push(`${what}${detail ? ` — ${detail}` : ''}`);
const warn = (what, detail) => warns.push(`${what}${detail ? ` — ${detail}` : ''}`);

/* ── what must never appear again ── */
const FORBIDDEN = [
  [/Trusted by/i, 'the retired "Trusted by" claim'],
  [/(nous font|nous fait) confiance/i, 'the retired "Ils nous font confiance" claim'],
  [/\bIl Duca\b/i, 'fabricated client Il Duca'],
  [/SoYou Cosmetics/i, 'fabricated client SoYou Cosmetics'],
  [/Eden ?Terranova/i, 'fabricated client Eden Terranova'],
  [/\bLeVallon\b/i, 'fabricated client LeVallon'],
  [/Mandarin Oriental/i, 'unevidenced brand Mandarin Oriental'],
  [/CHF ?490\b/, 'superseded price CHF 490'],
  [/CHF ?2.?900\b/, 'superseded price CHF 2900'],
  [/CHF ?1.?700\b/, 'superseded price CHF 1700'],
  [/CHF ?2.?500\b/, 'superseded price CHF 2500'],
  [/CHF ?1.?400\b/, 'superseded price CHF 1400'],
  [/CHF ?2.?200\b/, 'superseded price CHF 2200'],
  // an inclusive-ladder phrasing on a one-off engagement
  [/Everything in (Brand Identity|the site engagement)/i, 'repudiated cumulative ladder'],
  [/Identité de marque incluse/i, 'repudiated cumulative ladder'],
];

const FRITZ = new Set([
  PRICES.identity, PRICES.vitrine, PRICES.ecommerce,
  ...Object.values(PRICES.marketing), ...Object.values(PRICES.growthOps),
]);
const PRICE_RANGE = `CHF ${Math.min(...FRITZ)}–${Math.max(...FRITZ)}`;

/* A guard nobody has watched fail is not a guard. --selftest feeds each pattern
   the exact wording it exists to catch, and fails if any of them sits silent. */
if (process.argv.includes('--selftest')) {
  const SAMPLES = [
    'Trusted by', 'Ils nous font confiance', 'Il Duca', 'SoYou Cosmetics', 'Eden Terranova',
    'LeVallon', 'Mandarin Oriental', 'CHF 490', "CHF 2'900", "CHF 1'700", "CHF 2'500",
    "CHF 1'400", "CHF 2'200", 'Everything in Brand Identity', 'Identité de marque incluse',
  ];
  let missed = 0;
  SAMPLES.forEach((sample, i) => {
    const [re, label] = FORBIDDEN[i];
    const caught = re.test(sample);
    console.log(`  ${caught ? 'catches' : 'MISSES '}  ${JSON.stringify(sample).padEnd(34)} ${label}`);
    if (!caught) missed++;
  });
  const clean = 'A studio in Geneva. Identity CHF 500, a website CHF 1300, commerce CHF 2100.';
  const falsePositives = FORBIDDEN.filter(([re]) => re.test(clean));
  console.log(`\n${SAMPLES.length - missed}/${SAMPLES.length} patterns fire · ${falsePositives.length} false positives on current copy`);
  process.exit(missed || falsePositives.length ? 1 : 0);
}

async function get(path) {
  if (LOCAL) {
    const file = path === '/' ? 'index.html' : path === '/fr/' ? 'fr/index.html' : path.replace(/^\//, '') + '.html';
    try { return { status: 200, body: readFileSync(`${ROOT}/${file}`, 'utf8') }; }
    catch { return { status: 404, body: '' }; }
  }
  const r = await fetch(ORIGIN + path, { redirect: 'manual', headers: { 'user-agent': 'fritz-verify-live' } });
  return { status: r.status, body: r.status < 400 ? await r.text() : '', location: r.headers.get('location') };
}

/* ── the URL list comes from the live sitemap, so a page added without
      being listed is itself caught ── */
const sitemapRes = await get('/sitemap.xml');
const sitemap = LOCAL ? readFileSync(`${ROOT}/sitemap.xml`, 'utf8') : sitemapRes.body || readFileSync(`${ROOT}/sitemap.xml`, 'utf8');
const urls = [...sitemap.matchAll(/<loc>https:\/\/agencefritz\.com([^<]*)<\/loc>/g)].map((m) => m[1]);
const lastmods = [...sitemap.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map((m) => m[1]);

console.log(`verifying ${urls.length} pages on ${LOCAL ? 'the working tree' : ORIGIN}\n`);

if (new Set(lastmods).size <= 1) fail('sitemap lastmod is a single value', 'it is being typed, not computed');

const pages = new Map();
for (const path of urls) {
  const { status, body } = await get(path);
  if (status !== 200) { fail(`${path} returned ${status}`); continue; }
  pages.set(path, body);
}

for (const [path, body] of pages) {
  /* Scan what a reader actually reads: rendered text plus the attributes that get
     spoken or shown (alt, title, aria-label). NOT href/src — an asset called
     levallon-plate.mp4 on a tile labelled "Concept" is a filename, not a claim,
     and failing on it trains people to ignore the guard. */
  const stripped = body.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  const readable = [...stripped.matchAll(/\b(?:alt|title|aria-label|content)="([^"]*)"/gi)].map((m) => m[1]).join(' ')
    + ' ' + stripped.replace(/<[^>]*>/g, ' ');

  for (const [re, label] of FORBIDDEN) {
    if (re.test(readable)) fail(`${path} contains ${label}`);
  }

  // analytics on every page
  if (!body.includes('/assets/analytics.js')) fail(`${path} has no analytics`);
  if (!body.includes('_vercel/insights/script.js')) fail(`${path} has no Web Analytics snippet`);

  // one organisation, right language, right price range
  const lang = /<html[^>]+lang="fr/i.test(body) ? 'fr' : 'en';
  let org = null;
  for (const m of body.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)) {
    let d; try { d = JSON.parse(m[1]); } catch { fail(`${path} has unparseable JSON-LD`); continue; }
    const hit = (d['@graph'] || [d]).find((n) => n && n['@id'] === 'https://agencefritz.com/#org');
    if (hit) org = hit;
  }
  if (!org) fail(`${path} has no organisation schema`);
  else {
    if (org.priceRange !== PRICE_RANGE) fail(`${path} organisation priceRange is "${org.priceRange}"`, `expected ${PRICE_RANGE}`);
    if (org.inLanguage !== (lang === 'fr' ? 'fr-CH' : 'en')) fail(`${path} organisation language is ${org.inLanguage} on a ${lang} page`);
    if (!(org.sameAs || []).length) fail(`${path} organisation has no sameAs`);
  }

}

/* ── endpoints and redirects ── */
if (!LOCAL) {
  const api = await fetch(ORIGIN + '/api/contact', { method: 'GET' });
  if (api.status !== 405) fail(`GET /api/contact returned ${api.status}`, 'expected 405 from the handler');
  const apiBody = await api.text().catch(() => '');
  if (!apiBody.includes('method_not_allowed')) fail('/api/contact did not answer from the handler');

  const lausanne = await fetch(ORIGIN + '/fr/agence-web-lausanne', { redirect: 'manual' });
  if (lausanne.status !== 308) fail(`/fr/agence-web-lausanne returned ${lausanne.status}`, 'expected 308');

  const insights = await fetch(ORIGIN + '/_vercel/insights/script.js');
  if (insights.status !== 200) warn('Vercel Web Analytics is still switched off', 'events queue in the browser until the dashboard toggle is on');
}

/* ── hreflang must be reciprocal ── */
const PAIRS = [
  ['/', '/fr/'], ['/pricing', '/fr/tarifs'], ['/web-design-agency-geneva', '/fr/creation-site-web-geneve'],
  ['/branding-agency-switzerland', '/fr/agence-branding-suisse'],
  ['/website-cost-switzerland', '/fr/guides/combien-coute-site-web-suisse'],
  ['/logo-design-cost-switzerland', '/fr/guides/prix-logo-identite-visuelle-suisse'],
  ['/web-agency-vs-freelancer-switzerland', '/fr/guides/agence-ou-freelance-suisse'],
];
for (const [en, fr] of PAIRS) {
  const a = pages.get(en), b = pages.get(fr);
  if (!a || !b) { fail(`hreflang pair ${en} <-> ${fr}`, 'a page is missing'); continue; }
  if (!a.includes(`href="https://agencefritz.com${fr}"`)) fail(`${en} does not point at ${fr}`);
  if (!b.includes(`href="https://agencefritz.com${en}"`)) fail(`${fr} does not point back at ${en}`);
}

/* ── report ── */
console.log(`checked: ${pages.size} pages · ${FORBIDDEN.length} forbidden patterns · ${PAIRS.length} hreflang pairs\n`);
for (const w of warns) console.log(`  warn  ${w}`);
if (warns.length) console.log('');
for (const f of fails) console.log(`  FAIL  ${f}`);
if (fails.length) {
  console.log(`\n${fails.length} failure(s). Production is not in the state this repo intends.`);
  process.exitCode = 1;
} else {
  console.log(`no failures${warns.length ? `, ${warns.length} warning(s)` : ''}.`);
}
