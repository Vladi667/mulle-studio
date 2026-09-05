/* ─────────────────────────────────────────────────────────────────
   patch-pricing-lane.mjs — aim the guides at the SERPs they can win
   ─────────────────────────────────────────────────────────────────
   Search Console, 3 months to 3 Sep 2026: every commercial Geneva query
   sits at position 76–97. The informational pricing lane is different:
   the logo-pricing guide is at 9.0, /fr/tarifs at 10.6, and the Google
   SERP for "combien coûte un site internet en suisse" is made of small
   Swiss agency blog posts, not authority sites. That lane is winnable
   without links. Two things every ranking result there has and ours
   lacked:

     1. a VISIBLE date. Google shows "25 févr. 2026 —" beside each
        competitor; our pages carried the date only in JSON-LD.
     2. the exact questions Google lists under "Autres questions" on
        those SERPs. Matching the phrasing is how a low-authority page
        earns that box.

   This patches the rendered HTML directly. The guides' generator inputs
   (w3/w8-data.json) still carry pre-cut prices, so rebuilding them is
   not an option; this is idempotent and marker-delimited instead.

   Byline date = the page's Article dateModified, which patch-dates.mjs
   derives from git. Run patch-dates FIRST, then this.

     node scripts/seo/patch-pricing-lane.mjs
     node scripts/seo/patch-pricing-lane.mjs --check
   ───────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { PRICES, CHF } from './prices.mjs';

const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const CHECK = process.argv.includes('--check');

const BY_START = '<!-- byline: patch-pricing-lane -->';
const BY_END = '<!-- /byline -->';
const FAQ_MARK = 'data-paa="1"';
const CSS_ID = 'pricing-lane-css';
const CSS = `<style id="${CSS_ID}">
.lp-byline{font-family:var(--mono);font-size:11px;letter-spacing:.06em;color:var(--txt-40);margin:16px 0 0;text-transform:uppercase}
</style>`;

const FR_MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmt = (iso, lang) => {
  const [y, m, d] = iso.split('-').map(Number);
  return lang === 'fr' ? `${d} ${FR_MONTHS[m - 1]} ${y}` : `${d} ${EN_MONTHS[m - 1]} ${y}`;
};

/* The questions Google shows under "Autres questions", verbatim, on the two
   SERPs these pages already appear on. Answers reuse ONLY figures the page
   already states (market ranges are editorial fact, Fritz prices come from
   prices.mjs). Straight apostrophes, no em dashes, third person. */
const V = CHF(PRICES.vitrine), E = CHF(PRICES.ecommerce);
const PAA = {
  'fr/guides/combien-coute-site-web-suisse.html': [
    {
      q: 'Quel est le tarif pour créer un site internet ?',
      a: `Sur le marché suisse, un site vitrine se situe le plus souvent entre CHF 1'500 et 4'000 et un site e-commerce entre CHF 5'000 et 20'000. Ce sont des fourchettes observées, pas un tarif officiel. Fritz publie les siens : site vitrine ${V}, e-commerce ${E}, en paiement unique, code et fichiers sources livrés au client.`,
    },
    {
      q: "Quel est le coût mensuel d'un site internet ?",
      a: "Un site réalisé par un professionnel se paie en une fois. Ce qui revient chaque année, c'est l'exploitation : le nom de domaine (CHF 10 à 20 par an), l'hébergement (CHF 100 à 400 par an) et la maintenance (CHF 350 à 2'000 par an selon le site). Sur un constructeur en abonnement comme Wix, Squarespace ou Webflow, comptez CHF 15 à 60 par mois, hébergement compris, aussi longtemps que l'abonnement court.",
    },
  ],
  'fr/guides/prix-site-web-geneve.html': [
    {
      q: 'Quel est le tarif pour créer un site web ?',
      a: `À Genève, un site vitrine réalisé par un professionnel se situe le plus souvent entre CHF 1'500 et 4'000, un site e-commerce entre CHF 5'000 et 20'000, fourchettes observées sur le marché. Fritz publie ses tarifs plutôt que de chiffrer sur devis : site vitrine ${V}, e-commerce ${E}, en paiement unique, code et fichiers sources livrés.`,
    },
  ],
};

const files = execFileSync('git', ['ls-files', '*.html'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let changed = 0, bylines = 0, faqs = 0;
const problems = [];

for (const file of files) {
  const path = `${ROOT}/${file}`;
  let src = readFileSync(path, 'utf8');
  const before = src;
  const lang = /<html[^>]+lang="fr/i.test(src) ? 'fr' : 'en';

  // Only pages that carry an Article with dateModified get a byline.
  const blocks = [...src.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)];
  let article = null, faqBlockIdx = -1, faqData = null;
  blocks.forEach((m, i) => {
    let d; try { d = JSON.parse(m[1]); } catch { return; }
    const nodes = d['@graph'] || [d];
    for (const n of nodes) {
      if (n && n['@type'] === 'Article' && n.dateModified) article = n;
      if (n && n['@type'] === 'FAQPage') { faqBlockIdx = i; faqData = d; }
    }
  });
  if (!article) continue;

  /* Strip everything this script ever added BEFORE measuring anything, or the
     reading time counts its own previous output and the second run differs
     from the first. Idempotent means the second run is a no-op. */
  src = src.replace(new RegExp(`\\n?\\s*${BY_START}[\\s\\S]*?${BY_END}`, 'g'), '');
  src = src.replace(new RegExp(`\\s*<div class="faq-item" ${FAQ_MARK}>[\\s\\S]*?<\\/div>`, 'g'), '');
  src = src.replace(new RegExp(`\\n?<style id="${CSS_ID}">[\\s\\S]*?<\\/style>`, 'g'), '');

  /* ── 1. visible byline, from the Article's own dateModified ── */
  const words = src.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const mins = Math.max(3, Math.round(words / 220));
  const text = lang === 'fr'
    ? `Mis à jour le ${fmt(article.dateModified, 'fr')} · Lecture ${mins} min`
    : `Updated ${fmt(article.dateModified, 'en')} · ${mins} min read`;
  const byline = `${BY_START}<p class="lp-byline">${text}</p>${BY_END}`;
  const ledeEnd = (() => { const i = src.indexOf('class="lp-lede"'); return i < 0 ? -1 : src.indexOf('</p>', i) + 4; })();
  if (ledeEnd > 3) { src = src.slice(0, ledeEnd) + '\n  ' + byline + src.slice(ledeEnd); bylines++; }
  else problems.push(`${file}: no lp-lede to hang the byline on`);
  src = src.replace(new RegExp(`\\n?<style id="${CSS_ID}">[\\s\\S]*?<\\/style>`, 'g'), '');
  src = src.replace('</head>', `${CSS}\n</head>`);

  /* ── 2. PAA questions as visible FAQ items, then the schema follows the page ── */
  const adds = PAA[file] || [];
  if (adds.length) {
    if (faqBlockIdx < 0) { problems.push(`${file}: has PAA additions but no FAQPage schema`); }
    else {
      // strip previous additions, then append after the last existing faq-item
      src = src.replace(new RegExp(`\\s*<div class="faq-item" ${FAQ_MARK}>[\\s\\S]*?<\\/div>`, 'g'), '');
      const lastItem = src.lastIndexOf('<div class="faq-item">');
      const lastEnd = src.indexOf('</div>', lastItem) + 6;
      const html = adds.map((x) => `\n    <div class="faq-item" ${FAQ_MARK}><h3>${esc(x.q)}</h3><p>${esc(x.a)}</p></div>`).join('');
      src = src.slice(0, lastEnd) + html + src.slice(lastEnd);
      faqs += adds.length;

      // rebuild FAQPage.mainEntity from what is now visible, so they cannot drift
      const items = [...src.matchAll(/<div class="faq-item"[^>]*><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/div>/g)]
        .map((m) => ({ q: m[1].replace(/<[^>]+>/g, '').trim(), a: m[2].replace(/<[^>]+>/g, '').trim() }))
        .map(({ q, a }) => ({ q: q.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"), a: a.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'") }));
      const nodes = faqData['@graph'] || [faqData];
      for (const n of nodes) if (n && n['@type'] === 'FAQPage') {
        n.mainEntity = items.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }));
      }
      const fresh = JSON.stringify(faqData);
      const m = [...src.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)][faqBlockIdx];
      src = src.replace(m[0], `<script type="application/ld+json">\n${fresh}\n</script>`);
    }
  }

  if (src !== before) { if (!CHECK) writeFileSync(path, src); changed++; }
}

console.log(`${CHECK ? 'would change' : 'changed'}: ${changed} · bylines: ${bylines} · PAA items added: ${faqs}`);
for (const p of problems) console.log('   PROBLEM', p);

/* ── verification ── */
let bad = problems.length;
for (const file of files) {
  const s = readFileSync(`${ROOT}/${file}`, 'utf8');
  const hasArticle = /"@type":\s*"Article"/.test(s);
  const n = (s.match(new RegExp(BY_START, 'g')) || []).length;
  if (hasArticle && n !== 1 && !CHECK) { console.log(`   FAIL ${file} byline count ${n}`); bad++; }
  const inserted = [...s.matchAll(/<div class="faq-item" data-paa="1">[\s\S]*?<\/div>/g)].map((m) => m[0]).join('');
  if (/—|–/.test(inserted) || /[’‘]/.test(inserted)) { console.log(`   FAIL ${file}: em dash or curly apostrophe in inserted FAQ`); bad++; }
  if (PAA[file] && !CHECK) {
    const visible = (s.match(/<div class="faq-item"/g) || []).length;
    const schema = (s.match(/"@type":"Question"/g) || []).length;
    if (visible !== schema) { console.log(`   FAIL ${file}: ${visible} visible FAQ items vs ${schema} in schema`); bad++; }
    for (const x of PAA[file]) if (!s.includes(esc(x.q))) { console.log(`   FAIL ${file}: missing "${x.q}"`); bad++; }
  }
}
if (bad) { console.log(`VERIFY FAILED (${bad})`); process.exitCode = 1; }
else if (!CHECK) console.log('verified: every guide carries one dated byline; FAQ schema matches the visible FAQ on the patched pages');
