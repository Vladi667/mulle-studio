/* ─────────────────────────────────────────────────────────────────
   build-sitemap.mjs — sitemap.xml with a REAL lastmod per URL
   ─────────────────────────────────────────────────────────────────
   lastmod used to be a hard-coded constant ('2026-07-19'). The sitemap
   was regenerated several times after that date and every page had
   since changed — two sitewide price cuts, the fabricated-client
   removal, the marketing and work-page rewrites — so all 36 URLs were
   telling search engines that nothing had moved since July.

   The date now comes from git: the last commit that touched the page's
   own file, ignoring commits that only touched the <head> (analytics,
   favicon, schema stamps), which are not content changes.

   Freshness is computed, never typed. If a page has not changed, its
   date does not move.
   ───────────────────────────────────────────────────────────────── */
import fs from 'fs';
import { execFileSync } from 'child_process';
import { pathToFileURL } from 'url';

const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const O = 'https://agencefritz.com';

/* What counts as a content change.

   Filtering by commit subject was the first attempt and it is wrong: it needs a
   naming convention nobody will remember, and it feeds back on itself. Running
   patch-dates.mjs edits the page, the commit that records the edit then looks
   like a content change, and the next run moves the date again — freshness
   inventing itself out of nothing.

   So the body decides. `head`, every `script`, and every `link` are stripped,
   and the date is the newest commit whose remaining markup differs from its
   parent's. Analytics snippets, schema stamps and date patches all live in the
   stripped part, so they cannot move a date; a rewritten paragraph can. */
const stripChrome = (html) =>
  html
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '') // marker comments around injected blocks
    .replace(/\s+/g, ' ')
    .trim();

// [enPath, frPath, priority]  (frPath null = EN-only; enPath null = FR-only)
const PAIRS = [
  ['/', '/fr/', '1.0'],
  ['/brand-web', '/fr/agence-branding-geneve', '0.9'],
  ['/marketing', '/fr/agence-marketing-geneve', '0.9'],
  ['/growth-ops', '/fr/systemes-croissance-ia', '0.9'],
  ['/pricing', '/fr/tarifs', '0.9'],
  ['/web-design-agency-geneva', '/fr/creation-site-web-geneve', '0.9'],
  [null, '/fr/agence-web-suisse-romande', '0.9'],
  ['/branding-agency-switzerland', '/fr/agence-branding-suisse', '0.9'],
  [null, '/fr/guides/prix-site-web-geneve', '0.8'],
  ['/website-cost-switzerland', '/fr/guides/combien-coute-site-web-suisse', '0.8'],
  ['/logo-design-cost-switzerland', '/fr/guides/prix-logo-identite-visuelle-suisse', '0.8'],
  ['/web-agency-vs-freelancer-switzerland', '/fr/guides/agence-ou-freelance-suisse', '0.8'],
  [null, '/fr/sites-web-hotellerie-restauration', '0.8'],
  [null, '/fr/guides/wix-ou-site-sur-mesure', '0.8'],
  [null, '/fr/guides/creer-un-site-internet-en-suisse', '0.8'],
  [null, '/fr/guides/refonte-site-web-suisse', '0.8'],
  [null, '/fr/agence-web-fribourg', '0.7'],
  [null, '/fr/agence-web-neuchatel', '0.7'],
  ['/our-work', '/fr/realisations', '0.7'],
  ['/about', '/fr/a-propos', '0.7'],
  ['/contact', '/fr/contact', '0.7'],
  ['/privacy', '/fr/confidentialite', '0.3'],
];

/** URL path -> the file that renders it */
export function fileFor(loc) {
  if (loc === '/') return 'index.html';
  if (loc === '/fr/') return 'fr/index.html';
  return loc.replace(/^\//, '') + '.html';
}

const bodyCache = new Map();
function bodyAt(sha, file) {
  const key = `${sha}:${file}`;
  if (bodyCache.has(key)) return bodyCache.get(key);
  let body = '';
  try { body = stripChrome(execFileSync('git', ['show', `${sha}:${file}`], { cwd: ROOT, encoding: 'utf8' })); }
  catch { body = ''; } // file did not exist at that commit
  bodyCache.set(key, body);
  return body;
}

/** Date of the newest commit that changed this page's visible markup, YYYY-MM-DD. */
const dateCache = new Map();
export function lastContentChange(file) {
  if (dateCache.has(file)) return dateCache.get(file);

  const log = execFileSync('git', ['log', '--format=%H\t%cs', '--', file], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(Boolean).map((l) => l.split('\t'));
  if (!log.length) { dateCache.set(file, null); return null; }

  let answer = log[log.length - 1][1]; // fall back to the first commit that added it
  for (let i = 0; i < log.length; i++) {
    const [sha, date] = log[i];
    const parent = log[i + 1];
    const now = bodyAt(sha, file);
    const before = parent ? bodyAt(parent[0], file) : '';
    if (now !== before) { answer = date; break; }
  }
  dateCache.set(file, answer);
  return answer;
}

function alts(en, fr) {
  let s = '';
  if (en) s += `\n    <xhtml:link rel="alternate" hreflang="en" href="${O}${en}"/>`;
  if (fr) s += `\n    <xhtml:link rel="alternate" hreflang="fr-CH" href="${O}${fr}"/>`;
  s += `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${O}${en || fr}"/>`;
  return s;
}

function url(loc, pr, en, fr) {
  const file = fileFor(loc);
  if (!fs.existsSync(`${ROOT}/${file}`)) throw new Error(`sitemap lists ${loc} but ${file} does not exist`);
  const lm = lastContentChange(file);
  if (!lm) throw new Error(`no git history for ${file} — cannot date ${loc}`);
  return `  <url>\n    <loc>${O}${loc}</loc>${alts(en, fr)}\n    <lastmod>${lm}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${pr}</priority>\n  </url>`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const urls = [];
  const dates = [];
  for (const [en, fr, pr] of PAIRS) {
    if (en) { urls.push(url(en, pr, en, fr)); dates.push(lastContentChange(fileFor(en))); }
    if (fr) { urls.push(url(fr, pr, en, fr)); dates.push(lastContentChange(fileFor(fr))); }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(ROOT + '/sitemap.xml', xml);

  const spread = [...new Set(dates)].sort();
  console.log(`sitemap: ${urls.length} URLs · ${spread.length} distinct lastmod values (${spread[0]} → ${spread[spread.length - 1]})`);
  if (spread.length === 1) {
    console.log('WARNING: every URL carries the same date — that is what the old hard-coded constant did. Check the git history filter.');
    process.exitCode = 1;
  }
}

export { PAIRS };
