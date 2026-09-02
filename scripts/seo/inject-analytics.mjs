/* ─────────────────────────────────────────────────────────────────
   inject-analytics.mjs — put Vercel Web Analytics + Speed Insights,
   and the site's own conversion events, on every page.
   ─────────────────────────────────────────────────────────────────
   Idempotent: the block is delimited by a marker comment, removed and
   rewritten on every run, so re-running never duplicates it. Run it
   LAST, after build-landers / build-tarifs / add-inbound /
   inject-estimator / inject-booking, because those rebuild pages from
   a shell and would drop the block.

     node scripts/seo/inject-analytics.mjs          # all pages
     node scripts/seo/inject-analytics.mjs --check  # report only

   The window.va stub is Vercel's documented snippet for plain HTML:
   it queues events fired before the script loads, and makes every
   track() call harmless while Web Analytics is switched off.
   ───────────────────────────────────────────────────────────────── */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHECK = process.argv.includes('--check');

const START = '<!-- analytics: injected by scripts/seo/inject-analytics.mjs -->';
const END = '<!-- /analytics -->';
const BLOCK = [
  START,
  '<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};</script>',
  '<script defer src="/_vercel/insights/script.js"></script>',
  '<script defer src="/_vercel/speed-insights/script.js"></script>',
  '<script defer src="/assets/analytics.js"></script>',
  END,
].join('\n');

function htmlFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', '.git', '.vercel', 'scripts', 'tools', 'Levallon'].includes(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) htmlFiles(p, acc);
    else if (entry.endsWith('.html') && !entry.endsWith('.bak')) acc.push(p);
  }
  return acc;
}

const files = htmlFiles(ROOT);
let changed = 0, already = 0, skipped = [];

for (const file of files) {
  let src = readFileSync(file, 'utf8');

  if (!src.includes('</body>')) { skipped.push([file, 'no </body>']); continue; }

  // strip any previous block, then insert the current one
  const stripped = src.replace(new RegExp(`\\n?${START}[\\s\\S]*?${END}\\n?`, 'g'), '\n');
  const had = stripped !== src;
  const out = stripped.replace('</body>', `${BLOCK}\n</body>`);

  if (out === src) { already++; continue; }
  if (!CHECK) writeFileSync(file, out);
  changed++;
  if (had) console.log('   refreshed', file.replace(ROOT, '.'));
}

console.log(`${CHECK ? 'would change' : 'changed'}: ${changed} · already current: ${already} · total html: ${files.length}`);
for (const [f, why] of skipped) console.log('   SKIPPED', f.replace(ROOT, '.'), '-', why);

// verification: every page must carry exactly one block and one of each script
let bad = 0;
for (const file of files) {
  const s = readFileSync(file, 'utf8');
  const n = (s.match(new RegExp(START, 'g')) || []).length;
  const insights = (s.match(/_vercel\/insights\/script\.js/g) || []).length;
  const events = (s.match(/assets\/analytics\.js/g) || []).length;
  if (n !== 1 || insights !== 1 || events !== 1) {
    console.log(`   FAIL ${file.replace(ROOT, '.')} blocks=${n} insights=${insights} events=${events}`);
    bad++;
  }
}
console.log(bad ? `VERIFY FAILED on ${bad} file(s)` : `verified: all ${files.length} pages carry exactly one analytics block`);
if (bad) process.exitCode = 1;
