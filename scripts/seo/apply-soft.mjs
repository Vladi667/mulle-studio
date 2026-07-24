// Soften asserted-behaviour phrasings (audience/market behaviour stated as measured fact).
// KEEP untouched: Fritz's own practice ("remet/traitons/Livrés/Oui/chez Fritz systématiquement"),
// reader instructions ("vérifiez systématiquement"), hedges ("Pas systématiquement"), factual breakdowns.
import fs from 'fs';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad';

// [from, to] — each a distinctive phrase; targeted so it cannot hit a KEEP occurrence.
const RULES = [
  ['presque toujours', 'souvent'],                               // uniform: all 14 are defects
  // "la plupart des X" → "beaucoup de/d' X" (elision handled per phrase)
  ['la plupart des entreprises', "beaucoup d'entreprises"],
  ['La plupart des entreprises', "Beaucoup d'entreprises"],
  ['la plupart des projets', 'beaucoup de projets'],
  ['La plupart des sites anciens', 'Beaucoup de sites anciens'],
  ['la plupart des dérives', 'beaucoup de dérives'],
  ['La plupart des incompréhensions', "Beaucoup d'incompréhensions"],
  ['la plupart des refontes', 'beaucoup de refontes'],
  ['la plupart des demandes', 'beaucoup de demandes'],
  // "la majorité des X" (but NOT "pour la majorité des lignes" = reader's own list, keep)
  ['la majorité des projets', 'beaucoup de projets'],
  ['la majorité des reprises', 'beaucoup de reprises'],
  ['dans la majorité des cas', 'dans bien des cas'],
  // "systématiquement" ONLY where it asserts a pattern (not Fritz-practice / instruction / hedge)
  ['reviennent systématiquement', 'reviennent souvent'],
  ["qu'on oublie systématiquement", "qu'on oublie souvent"],
  ['cache systématiquement', 'masque souvent'],
  ['revient systématiquement', 'revient souvent'],
  // absolute "toujours"
  ['commence toujours par les gestes', 'commence souvent par les gestes'],
  ['finit toujours par diverger', 'finit par diverger'],
  // EN
  ['the one most companies actually need', 'the one many companies need'],
  ['the factor most people expect to dominate', 'the factor people often expect to dominate'],
  ['budgets most often go wrong', 'budgets often go wrong'],
];

// KEEP phrases that must be identical before and after (guard against collisions)
const KEEP = ['remet systématiquement', 'traitons systématiquement', 'Oui, systématiquement',
  'Livrés systématiquement', 'vérifiez systématiquement', 'chez Fritz systématiquement',
  'Pas systématiquement'];

const files = fs.readdirSync(SP).filter(x => /^w\d+-data\.json$/.test(x));
const before = {}, after = {};
for (const f of files) before[f] = fs.readFileSync(SP + '/' + f, 'utf8');

const counts = {};
for (const f of files) {
  let s = before[f];
  for (const [from, to] of RULES) {
    const n = s.split(from).length - 1;
    if (n) { s = s.split(from).join(to); counts[from] = (counts[from] || 0) + n; }
  }
  after[f] = s;
}

// ---- verify BEFORE writing ----
const allBefore = Object.values(before).join('\n'), allAfter = Object.values(after).join('\n');
const problems = [];
// 1. every digit sequence preserved (no price/number altered)
const nums = s => (s.match(/\d+/g) || []).sort().join(',');
if (nums(allBefore) !== nums(allAfter)) problems.push('DIGIT SET CHANGED — a number was altered');
// 2. no em dash / curly apostrophe introduced
if ((allAfter.match(/—/g) || []).length > (allBefore.match(/—/g) || []).length) problems.push('em dash introduced');
if ((allAfter.match(/’/g) || []).length > (allBefore.match(/’/g) || []).length) problems.push('curly apostrophe introduced');
// 3. KEEP phrases untouched
for (const k of KEEP) {
  const b = (allBefore.split(k).length - 1), a = (allAfter.split(k).length - 1);
  if (b !== a) problems.push(`KEEP phrase count changed: "${k}" ${b}→${a}`);
}
// 4. each file still valid JSON
for (const f of files) { try { JSON.parse(after[f]); } catch { problems.push(`${f} no longer valid JSON`); } }

const totalApplied = Object.values(counts).reduce((a, b) => a + b, 0);
console.log('replacements by rule:');
for (const [from] of RULES) console.log(`  ${String(counts[from] || 0).padStart(2)}  ${from}`);
console.log(`\ntotal: ${totalApplied}`);

if (problems.length) { console.log('\n✗ ABORTED — not written:\n  ' + problems.join('\n  ')); process.exit(1); }
for (const f of files) if (after[f] !== before[f]) fs.writeFileSync(SP + '/' + f, after[f]);
console.log('\n✓ verified (digits preserved, keep-list intact, valid JSON) — written');
