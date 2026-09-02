/* ─────────────────────────────────────────────────────────────────
   patch-dates.mjs — keep Article dateModified honest
   ─────────────────────────────────────────────────────────────────
   The ten guide pages all carried dateModified 2026-07-20 while their
   bodies had been rewritten twice since (the 08-13 price cut, the
   08-17 grids). This sets dateModified from the same git history the
   sitemap uses, so the schema and the sitemap can never disagree.

   datePublished is never touched — it is a fact about the past.
   A page whose date is already correct is left alone, so re-running
   changes nothing and no page gets a fake freshness bump.

     node scripts/seo/patch-dates.mjs
     node scripts/seo/patch-dates.mjs --check
   ───────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { lastContentChange } from './build-sitemap.mjs';

const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const CHECK = process.argv.includes('--check');

const files = execFileSync('git', ['ls-files', '*.html'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter(Boolean)
  .filter((f) => readFileSync(`${ROOT}/${f}`, 'utf8').includes('"dateModified"'));

let changed = 0, ok = 0;
for (const file of files) {
  const src = readFileSync(`${ROOT}/${file}`, 'utf8');
  const real = lastContentChange(file);
  if (!real) { console.log('   no history, skipped', file); continue; }

  const current = (src.match(/"dateModified":"([^"]*)"/) || [])[1];
  if (current === real) { ok++; continue; }

  const out = src.replace(/"dateModified":"[^"]*"/g, `"dateModified":"${real}"`);
  if (!CHECK) writeFileSync(`${ROOT}/${file}`, out);
  console.log(`   ${file}: ${current} -> ${real}`);
  changed++;
}
console.log(`${CHECK ? 'would update' : 'updated'}: ${changed} · already correct: ${ok} · pages with a date: ${files.length}`);

// verification: no page may claim a dateModified newer than its last content commit
let bad = 0;
for (const file of files) {
  const d = (readFileSync(`${ROOT}/${file}`, 'utf8').match(/"dateModified":"([^"]*)"/) || [])[1];
  const real = lastContentChange(file);
  if (!CHECK && d !== real) { console.log(`   FAIL ${file} says ${d}, git says ${real}`); bad++; }
}
if (bad) process.exitCode = 1;
else if (!CHECK) console.log('verified: every dateModified equals its last content commit');
