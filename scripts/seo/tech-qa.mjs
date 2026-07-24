// Full technical SEO QA across every URL in the sitemap, run against the LOCAL build.
// Checks the things that actually break indexing, before the sitemap is submitted to GSC.
import { load } from 'cheerio';
import fs from 'fs';
const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const O = 'https://agencefritz.com';

const sitemap = fs.readFileSync(ROOT + '/sitemap.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

// map a URL to the file that serves it (cleanUrls: /x → x.html, /fr/ → fr/index.html)
const fileFor = u => {
  let p = u.replace(O, '');
  if (p === '/') return ROOT + '/index.html';
  if (p.endsWith('/')) return ROOT + p + 'index.html';
  return ROOT + p + '.html';
};

const pages = [];
const problems = [];
const add = (sev, url, kind, detail) => problems.push({ sev, url, kind, detail });

for (const u of urls) {
  const f = fileFor(u);
  if (!fs.existsSync(f)) { add('HIGH', u, 'missing-file', `sitemap lists it but ${f.replace(ROOT, '')} does not exist`); continue; }
  const $ = load(fs.readFileSync(f, 'utf8'), { decodeEntities: false });
  const canonical = $('link[rel=canonical]').attr('href') || '';
  const title = ($('title').text() || '').trim();
  const desc = $('meta[name=description]').attr('content') || '';
  const h1s = $('h1').map((i, e) => $(e).text().trim()).get();
  const robots = $('meta[name=robots]').attr('content') || '';
  const alts = {};
  $('link[rel=alternate][hreflang]').each((i, e) => { alts[$(e).attr('hreflang').toLowerCase()] = $(e).attr('href'); });
  const ld = [];
  $('script[type="application/ld+json"]').each((i, e) => {
    try { const j = JSON.parse($(e).html()); (j['@graph'] || [j]).forEach(x => ld.push(x['@type'])); }
    catch { add('HIGH', u, 'invalid-jsonld', 'a JSON-LD block does not parse'); }
  });
  const internalLinks = $('a[href^="/"]').map((i, e) => $(e).attr('href')).get();
  pages.push({ url: u, file: f, canonical, title, desc, h1s, alts, ld, internalLinks, lang: $('html').attr('lang') || '' });

  // per-page checks
  if (!canonical) add('HIGH', u, 'no-canonical', 'missing canonical');
  else if (canonical !== u) add('HIGH', u, 'canonical-mismatch', `canonical=${canonical} but sitemap lists ${u}`);
  if (/noindex/i.test(robots)) add('HIGH', u, 'noindex', `robots="${robots}" — page is excluded from search`);
  if (!title) add('HIGH', u, 'no-title', 'missing <title>');
  else if (title.length > 65) add('LOW', u, 'title-long', `${title.length} chars: ${title.slice(0, 70)}`);
  if (!desc) add('MED', u, 'no-description', 'missing meta description');
  else if (desc.length > 165) add('LOW', u, 'desc-long', `${desc.length} chars`);
  if (h1s.length === 0) add('HIGH', u, 'no-h1', 'no <h1>');
  if (h1s.length > 1) add('MED', u, 'multiple-h1', `${h1s.length} h1s: ${h1s.join(' | ').slice(0, 90)}`);
  if (!$('html').attr('lang')) add('MED', u, 'no-lang', 'missing <html lang>');
  // hreflang reciprocity
  const keys = Object.keys(alts);
  if (keys.length) {
    if (!alts['x-default']) add('MED', u, 'hreflang-no-xdefault', 'has hreflang but no x-default');
    const self = Object.values(alts).includes(u);
    if (!self) add('HIGH', u, 'hreflang-no-self', 'hreflang set does not include the page itself');
  }
}

// cross-page checks
const byTitle = {}, byDesc = {}, byCanon = {};
for (const p of pages) {
  (byTitle[p.title] ||= []).push(p.url);
  (byDesc[p.desc] ||= []).push(p.url);
  (byCanon[p.canonical] ||= []).push(p.url);
}
for (const [t, us] of Object.entries(byTitle)) if (t && us.length > 1) add('HIGH', us.join(' + '), 'duplicate-title', `"${t.slice(0, 60)}"`);
for (const [d, us] of Object.entries(byDesc)) if (d && us.length > 1) add('MED', us.join(' + '), 'duplicate-description', `"${d.slice(0, 60)}"`);
for (const [c, us] of Object.entries(byCanon)) if (c && us.length > 1) add('HIGH', us.join(' + '), 'duplicate-canonical', c);

// hreflang must be reciprocal both ways
for (const p of pages) {
  for (const [lang, href] of Object.entries(p.alts)) {
    if (lang === 'x-default' || href === p.url) continue;
    const other = pages.find(x => x.url === href);
    if (!other) { add('HIGH', p.url, 'hreflang-target-missing', `points at ${href} which is not in the sitemap`); continue; }
    if (!Object.values(other.alts).includes(p.url)) add('HIGH', p.url, 'hreflang-not-reciprocal', `${href} does not point back`);
  }
}

// orphan detection: which sitemap pages are linked from no other page?
// canonical URL: strip query/fragment and any trailing slash (except the bare domain root)
const canon = u => { const s = u.replace(/[?#].*$/, ''); return (s !== O + '/' && s.endsWith('/')) ? s.slice(0, -1) : s; };
const linkedFrom = {};
for (const p of pages) for (const l of new Set(p.internalLinks)) {
  if (!l.startsWith('/') || l.startsWith('//')) continue;
  (linkedFrom[canon(O + l)] ||= new Set()).add(canon(p.url));
}
for (const p of pages) {
  const key = canon(p.url);
  const inbound = linkedFrom[key] ? [...linkedFrom[key]].filter(x => x !== key) : [];
  if (inbound.length === 0) add('MED', p.url, 'orphan', 'no internal links point to this page');
  else if (inbound.length === 1) add('LOW', p.url, 'thin-inbound', `only 1 internal link (from ${inbound[0].replace(O, '')})`);
}

// broken internal links (to anything not served)
const served = new Set(pages.map(p => p.url));
const known = new Set(['/', '/contact', '/our-work', '/about', '/privacy', '/brand-web', '/marketing', '/growth-ops']);
for (const p of pages) {
  for (const l of new Set(p.internalLinks)) {
    if (l.startsWith('//') || l.startsWith('/#')) continue;
    const clean = l.replace(/[?#].*$/, '');       // strip query + fragment before resolving
    if (!clean || clean.includes('.')) continue;   // skip assets (still have an extension after stripping)
    if (!clean.startsWith('/')) continue;
    const asUrl = clean === '/' ? O + '/' : O + clean.replace(/\/$/, '');
    if (served.has(asUrl) || known.has(clean.replace(/\/$/, '') || '/')) continue;
    const f = fileFor(asUrl);
    if (!fs.existsSync(f) && !fs.existsSync(ROOT + clean.replace(/\/$/, '') + '/index.html')) {
      add('HIGH', p.url, 'broken-internal-link', `links to ${clean} which is not served`);
    }
  }
}

// report
const order = { HIGH: 0, MED: 1, LOW: 2 };
problems.sort((a, b) => order[a.sev] - order[b.sev] || a.kind.localeCompare(b.kind));
console.log(`SITEMAP: ${urls.length} URLs · pages parsed: ${pages.length}`);
console.log(`SCHEMA COVERAGE: ${pages.filter(p => p.ld.length > 1).length}/${pages.length} pages carry page-level schema beyond the org stamp`);
console.log(`HREFLANG PAIRS: ${pages.filter(p => Object.keys(p.alts).length).length} pages declare alternates\n`);
if (!problems.length) console.log('NO PROBLEMS FOUND.');
else {
  let last = '';
  for (const p of problems) {
    if (p.sev !== last) { console.log(`\n===== ${p.sev} =====`); last = p.sev; }
    console.log(`  [${p.kind}] ${p.url.replace(O, '') || '/'}\n      ${p.detail}`);
  }
  const counts = problems.reduce((a, p) => (a[p.sev] = (a[p.sev] || 0) + 1, a), {});
  console.log(`\nTOTAL: ${problems.length}  (HIGH ${counts.HIGH || 0} · MED ${counts.MED || 0} · LOW ${counts.LOW || 0})`);
}
