/* ─────────────────────────────────────────────────────────────────
   read-gsc.mjs — the Monday read, from a Search Console export
   ─────────────────────────────────────────────────────────────────
   Search Console cannot be queried from here, and a live SERP check from
   this machine is worthless: Google geolocates the session to Israel, so
   what it returns is not what a Geneva prospect sees. The numbers have to
   come from the account.

   Export Performance → Queries as CSV (last 28 days) and run:

     node scripts/seo/read-gsc.mjs ~/Downloads/Queries.csv

   Two things it does that reading the export by eye does not:

   1. It separates the real brand queries from the name collisions. The
      August reading was summarised as "brand queries rank 13 to 46", but
      "agent fritz", "agentur fritz" and "fritz marketing" are other
      businesses that happen to share a common German first name. The
      honest brand range that month was 14 to 20.

   2. It looks for "agence fritz" and "agence fritz genève" specifically.
      Those are the French brand searches a Geneva client actually types,
      they are the gate the plan is measured against, and no reading has
      ever recorded a position for them.
   ───────────────────────────────────────────────────────────────── */
import { readFileSync, existsSync } from 'node:fs';

const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.log('usage: node scripts/seo/read-gsc.mjs <Queries.csv exported from Search Console>');
  process.exit(1);
}

const BRAND = ['agence fritz', 'agence fritz genève', 'agence fritz geneve', 'fritz agency', 'studio fritz', 'agencefritz'];
const MONEY = ['création site web genève', 'creation site web geneve', 'création site internet genève',
  'agence web genève', 'agence web geneve', 'prix site internet genève', 'agence branding genève',
  'création logo genève', 'agence web suisse romande'];
/* Other businesses. "Agentur Fritz" and "agent fritz" are not this studio, and
   counting them as brand queries flattered the August summary by 26 positions. */
const COLLISION = ['agent fritz', 'agentur fritz', 'fritz marketing', 'fritz kaiser', 'agence fritz agricole', 'agencement fritz'];

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',' || c === '\t') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const rows = parseCsv(readFileSync(file, 'utf8').replace(/^﻿/, ''));
const header = rows[0].map((h) => h.toLowerCase().trim());
const iQ = header.findIndex((h) => /quer|requête|requete/.test(h));
const iClicks = header.findIndex((h) => /click|clic/.test(h));
const iImpr = header.findIndex((h) => /impress/.test(h));
const iPos = header.findIndex((h) => /position/.test(h));
if (iQ < 0) { console.log('No query column found. Export Performance → Queries as CSV.'); process.exit(1); }

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const data = rows.slice(1).filter((r) => r[iQ]).map((r) => ({
  q: r[iQ].trim(),
  clicks: Number(r[iClicks] || 0),
  impressions: Number(r[iImpr] || 0),
  position: Number(String(r[iPos] || '').replace(',', '.')) || null,
}));

const has = (list, q) => list.some((t) => norm(t) === norm(q));
const show = (label, list) => {
  console.log(`\n${label}`);
  let any = false;
  // Accented and unaccented spellings of one query normalise to the same thing,
  // so each target is listed once instead of printing the same row twice.
  const seen = new Set();
  for (const t of list) {
    if (seen.has(norm(t))) continue;
    seen.add(norm(t));
    const hit = data.find((d) => norm(d.q) === norm(t));
    if (hit) {
      any = true;
      console.log(`  ${String(hit.position ?? '—').padStart(6)}  ${String(hit.impressions).padStart(5)} impr  ${String(hit.clicks).padStart(3)} clicks   ${hit.q}`);
    } else {
      console.log(`  ${'no data'.padStart(6)}  ${''.padStart(5)}             ${t}`);
    }
  }
  if (!any) console.log('  (nothing in this export — the site is not being shown for any of these)');
};

const totals = data.reduce((a, d) => ({ c: a.c + d.clicks, i: a.i + d.impressions }), { c: 0, i: 0 });
console.log(`${data.length} queries · ${totals.i} impressions · ${totals.c} clicks`);

show('BRAND — the gate. "agence fritz" is the one the plan is measured on.', BRAND);
show('MONEY — the commercial queries the cluster was built for.', MONEY);

const collisions = data.filter((d) => has(COLLISION, d.q));
if (collisions.length) {
  console.log('\nNAME COLLISIONS — other businesses, excluded from the brand read:');
  for (const c of collisions) console.log(`  ${String(c.position ?? '—').padStart(6)}  ${String(c.impressions).padStart(5)} impr   ${c.q}`);
}

const brandRows = data.filter((d) => has(BRAND, d.q) && d.position);
if (brandRows.length) {
  const best = Math.min(...brandRows.map((r) => r.position));
  const worst = Math.max(...brandRows.map((r) => r.position));
  console.log(`\nBrand position range, collisions excluded: ${best.toFixed(1)} to ${worst.toFixed(1)}`);
  console.log(brandRows.some((r) => norm(r.q).startsWith('agence fritz'))
    ? 'The French brand query has data. That is the number to watch weekly.'
    : 'STILL NO DATA for "agence fritz". Until it appears, the Phase 2 gate has no baseline.');
} else {
  console.log('\nNo brand query in this export at all.');
}

const top = [...data].filter((d) => d.position).sort((a, b) => a.position - b.position).slice(0, 10);
console.log('\nBest positions overall:');
for (const t of top) console.log(`  ${t.position.toFixed(1).padStart(6)}  ${String(t.impressions).padStart(5)} impr   ${t.q}`);
