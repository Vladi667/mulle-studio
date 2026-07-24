// Normalise em dashes inside GENERATED CONTENT only (the site chrome's em dashes are brand typography
// and live in the HTML shell, not in these data files, so they are untouched by construction).
import fs from 'fs';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad';
const fix = v => v
  .replace(/\s—\s([^—]{1,90}?)\s—\s/g, ' ($1) ')  // paired → parentheses
  .replace(/\s—\s/g, ', ')                          // remaining → comma
  .replace(/\s—$/g, '')                             // trailing
  .replace(/^—\s/g, '');
let total = 0;
for (const f of fs.readdirSync(SP).filter(x => /^w\d+-data\.json$/.test(x))) {
  const d = JSON.parse(fs.readFileSync(SP + '/' + f, 'utf8'));
  let c = 0;
  const walk = o => {
    if (Array.isArray(o)) o.forEach((v, i) => { if (typeof v === 'string') { const t = fix(v); if (t !== v) { o[i] = t; c++; } } else walk(v); });
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string') { const t = fix(v); if (t !== v) { o[k] = t; c++; } } else walk(v);
    }
  };
  for (const p of d) if (p.content) walk(p.content);
  if (c) { fs.writeFileSync(SP + '/' + f, JSON.stringify(d, null, 2)); console.log(`  ${f}: ${c} fields`); total += c; }
}
let blob = '';
for (const f of fs.readdirSync(SP).filter(x => /^w\d+-data\.json$/.test(x))) blob += fs.readFileSync(SP + '/' + f, 'utf8');
console.log(`\ntotal fields normalised: ${total}`);
console.log('em dash remaining in content data: ' + ((blob.match(/—/g) || []).length));
