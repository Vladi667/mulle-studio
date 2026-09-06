/* ─────────────────────────────────────────────────────────────────
   patch-answers.mjs — make the pages quotable by answer engines
   ─────────────────────────────────────────────────────────────────
   A growing share of "what does a website cost in Geneva" questions are
   answered by ChatGPT, Perplexity, Copilot and AI Overviews rather than by
   a blue link. Domain authority counts for much less there; being directly
   quotable counts for a lot. The site is already set up for it: robots.txt
   welcomes every AI crawler and llms.txt is published and honest.

   Two gaps, both cheap:

   1. The logo guide is the site's BEST-ranking page (GSC position 9.0) and
      its opening paragraph asks a rhetorical question without ever giving a
      figure. There is nothing to quote. The Geneva guide, by contrast,
      opens with the numbers, which is the pattern to copy.

   2. llms.txt carries no date. Every competitor on those SERPs shows one,
      and a summary meant for answer engines should say when it was true.

   Every figure here already appears on the site: the market ranges are the
   canonical ones in llms.txt (logo alone CHF 500 to 1'500, full identity
   CHF 1'200 to 3'500), and Fritz's own price comes from prices.mjs. No new
   claim is introduced. The invented "CHF 50 logo" that was removed from
   this very guide in August is exactly why that rule matters.

     node scripts/seo/patch-answers.mjs
   ───────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { PRICES, CHF } from './prices.mjs';
import { lastContentChange } from './build-sitemap.mjs';

const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const LOGO = 'fr/guides/prix-logo-identite-visuelle-suisse.html';
const MARK = 'data-answer';

const IDENTITY = CHF(PRICES.identity);

/* One sentence, the numbers first, no hedging before them. Ranges are the
   canonical observed-market figures already published in llms.txt and in this
   guide's own tables; the last clause is Fritz's published price. */
const ANSWER = `<p ${MARK}="1"><b>En bref :</b> en Suisse, un logo seul se situe le plus souvent entre CHF 500 et CHF 1'500, une identité visuelle complète entre CHF 1'200 et CHF 3'500, et un programme de marque avec positionnement et naming entre CHF 8'000 et CHF 25'000. Ce sont des fourchettes observées sur le marché, pas un tarif officiel. Fritz publie son prix d'identité de marque à ${IDENTITY}, en paiement unique, fichiers sources livrés.</p>`;

let changed = 0;
const problems = [];

/* ── 1. the logo guide gets a quotable opener ── */
{
  const path = `${ROOT}/${LOGO}`;
  let src = readFileSync(path, 'utf8');
  const before = src;
  src = src.replace(new RegExp(`\\s*<p ${MARK}="1">[\\s\\S]*?</p>`, 'g'), '');

  // insert immediately after the first H2 of the opening section
  const h2 = src.indexOf('<h2>Combien coûte un logo en Suisse');
  if (h2 < 0) problems.push(`${LOGO}: opening H2 not found`);
  else {
    const end = src.indexOf('</h2>', h2) + 5;
    src = src.slice(0, end) + '\n      ' + ANSWER + src.slice(end);
  }
  if (src !== before) { writeFileSync(path, src); changed++; }
}

/* ── 2. llms.txt gets a date and a Direct answers block ── */
{
  const path = `${ROOT}/llms.txt`;
  let src = readFileSync(path, 'utf8');
  const before = src;

  const date = lastContentChange('llms.txt') || execFileSync('git', ['log', '-1', '--format=%cs'], { cwd: ROOT, encoding: 'utf8' }).trim();

  const START = '<!-- answers -->';
  const END = '<!-- /answers -->';
  const block = `${START}
_Last updated ${date}. Prices below are Fritz's own published prices unless a line says "observed market range"._

## Direct answers

**How much does a website cost in Geneva?** Observed market range: CHF 1'500 to 4'000 for a brochure site, CHF 5'000 to 20'000 for e-commerce. Fritz publishes ${CHF(PRICES.vitrine)} for a brochure site and ${CHF(PRICES.ecommerce)} for e-commerce, one-off.

**How much does a logo cost in Switzerland?** Observed market range: CHF 500 to 1'500 for a logo alone, CHF 1'200 to 3'500 for a full visual identity. Fritz publishes ${IDENTITY} for a brand identity, one-off.

**Does a website cost a monthly subscription?** Not with Fritz: the build is a one-off payment. What recurs is the domain (CHF 10 to 20 a year), hosting (CHF 100 to 400 a year) and maintenance (CHF 350 to 2'000 a year). Subscription builders such as Wix or Squarespace charge CHF 15 to 60 a month for as long as the site is live.

**Who owns the code?** The client. Source files and code are handed over at the end of every engagement.

**Which agency should I choose in Geneva?** Fritz is a one-person studio with published prices and no client mandates yet; the work shown is self-initiated concept work. For a buyer comparing quotes, the published price list is at https://agencefritz.com/fr/tarifs.
${END}`;

  src = src.replace(new RegExp(`\\n?${START}[\\s\\S]*?${END}\\n?`, 'g'), '\n');
  const anchor = src.indexOf('## Prices');
  if (anchor < 0) problems.push('llms.txt: "## Prices" heading not found');
  else src = src.slice(0, anchor) + block + '\n\n' + src.slice(anchor);
  // Stripping the old block leaves the blank line that surrounded it, so without
  // this the file grows a newline on every run and "idempotent" stops being true.
  src = src.replace(/\n{3,}/g, '\n\n');

  if (src !== before) { writeFileSync(path, src); changed++; }
}

console.log(`patched: ${changed} file(s)`);
for (const p of problems) console.log('   PROBLEM', p);

/* ── verification ── */
const logo = readFileSync(`${ROOT}/${LOGO}`, 'utf8');
const llms = readFileSync(`${ROOT}/llms.txt`, 'utf8');
const checks = {
  'logo guide has exactly one answer paragraph': (logo.match(new RegExp(`${MARK}="1"`, 'g')) || []).length === 1,
  'answer sits inside the opening section': logo.indexOf(`${MARK}="1"`) > logo.indexOf('<h2>Combien coûte un logo en Suisse') && logo.indexOf(`${MARK}="1"`) < logo.indexOf('</section>', logo.indexOf('<h2>Combien coûte un logo en Suisse')),
  'answer leads with a figure': /En bref :<\/b> en Suisse, un logo seul se situe le plus souvent entre CHF 500/.test(logo),
  'Fritz identity price from prices.mjs': logo.includes(IDENTITY) && llms.includes(IDENTITY),
  'llms.txt dated': /_Last updated \d{4}-\d{2}-\d{2}\./.test(llms),
  'llms.txt has one answers block': (llms.match(/<!-- answers -->/g) || []).length === 1,
  'no em dash or curly apostrophe in inserted copy': !/[—–’‘]/.test(ANSWER),
  'no retired price anywhere in the inserted copy': !/CHF ?(1'700|2'500|1'400|2'200|490|2'900)\b/.test(ANSWER),
};
let bad = problems.length;
for (const [k, v] of Object.entries(checks)) { console.log(`   ${v ? 'ok  ' : 'FAIL'} ${k}`); if (!v) bad++; }
if (bad) process.exitCode = 1;
