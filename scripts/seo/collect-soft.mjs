import fs from 'fs';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad';
const TRIG = /la plupart des|la majorité des|presque toujours|finit toujours par|commence toujours par|systématiquement|\bmost (people|buyers|companies|sites|studios|agencies|quotes)\b|budgets most often|expect to dominate|tend to be high/i;
const cands = [];
const seen = new Set();
for (const f of fs.readdirSync(SP).filter(x => /^w\d+-data\.json$/.test(x))) {
  const d = JSON.parse(fs.readFileSync(SP + '/' + f, 'utf8'));
  for (const p of d) {
    if (!p.content) continue;
    const id = p.slug || p.file;
    const walk = o => {
      if (typeof o === 'string') {
        if (TRIG.test(o) && !seen.has(o)) { seen.add(o); cands.push({ file: f, page: id, text: o }); }
      } else if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === 'object') Object.values(o).forEach(walk);
    };
    walk(p.content);
  }
}
cands.forEach((c, i) => c.i = i);
fs.writeFileSync(SP + '/soft-candidates.json', JSON.stringify(cands, null, 1));
console.log(`${cands.length} candidate fields collected across ${new Set(cands.map(c => c.file)).size} data files`);
