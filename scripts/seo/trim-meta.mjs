// Trim over-long <title> and meta descriptions so they are not truncated in SERPs.
// Cuts at a natural boundary (sentence, middot, colon) rather than mid-word; never adds an ellipsis.
import fs from 'fs';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad';
const DESC_MAX = 158, TITLE_MAX = 62;

function trim(s, max) {
  if (!s || s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  // prefer a sentence end, then a middot/colon/semicolon, then a comma, then a word boundary
  for (const re of [/[.!?]\s[^.!?]*$/, /\s[·|:;]\s[^·|:;]*$/, /,\s[^,]*$/]) {
    const m = cut.search(re);
    if (m > max * 0.55) return cut.slice(0, m + 1).replace(/[\s,·|:;-]+$/, '').trim();
  }
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut.slice(0, max)).replace(/[\s,·|:;-]+$/, '').trim();
}

const changes = [];
for (const f of fs.readdirSync(SP).filter(x => /^w\d+-data\.json$/.test(x))) {
  const d = JSON.parse(fs.readFileSync(SP + '/' + f, 'utf8'));
  let touched = false;
  for (const p of d) {
    const c = p.content; if (!c) continue;
    if (c.metaDesc && c.metaDesc.length > DESC_MAX) {
      const before = c.metaDesc; c.metaDesc = trim(before, DESC_MAX);
      changes.push({ f, slug: p.slug, field: 'desc', from: before.length, to: c.metaDesc.length, text: c.metaDesc });
      touched = true;
    }
    if (c.metaTitle && c.metaTitle.length > TITLE_MAX) {
      const before = c.metaTitle;
      // keep the brand suffix if there is one, trim the descriptive part
      const parts = before.split(' | ');
      if (parts.length > 1) {
        const brand = ' | ' + parts.pop();
        c.metaTitle = trim(parts.join(' | '), TITLE_MAX - brand.length) + brand;
      } else c.metaTitle = trim(before, TITLE_MAX);
      changes.push({ f, slug: p.slug, field: 'title', from: before.length, to: c.metaTitle.length, text: c.metaTitle });
      touched = true;
    }
  }
  if (touched) fs.writeFileSync(SP + '/' + f, JSON.stringify(d, null, 2));
}

for (const c of changes) console.log(`  ${c.field.toUpperCase()} ${c.slug} (${c.from}→${c.to})\n      ${c.text}`);
console.log(`\n${changes.length} meta fields trimmed across ${new Set(changes.map(c => c.f)).size} data files`);
