// EN chrome links use .html extensions (about.html, contact.html, …). Under cleanUrls each of those
// 308-redirects to its extensionless form, so every nav/footer link is a wasted redirect hop and
// /about + /privacy never get counted as properly linked. Convert them all to clean URLs.
// FR pages already use clean /fr/ links, so only root-level EN html is touched.
import fs from 'fs';
const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';

const MAP = {
  'index.html': '/',
  'brand-web.html': '/brand-web',
  'marketing.html': '/marketing',
  'growth-ops.html': '/growth-ops',
  'our-work.html': '/our-work',
  'about.html': '/about',
  'contact.html': '/contact',
  'privacy.html': '/privacy',
};

const files = fs.readdirSync(ROOT).filter(f => /\.html$/.test(f)); // root-level only (EN)
const counts = {};
let touched = 0;
for (const f of files) {
  const p = ROOT + '/' + f;
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  for (const [ext, clean] of Object.entries(MAP)) {
    // href="X.html"  and  href="X.html?..."  and  href="X.html#..."
    for (const [from, to] of [[`href="${ext}"`, `href="${clean}"`], [`href="${ext}?`, `href="${clean}?`], [`href="${ext}#`, `href="${clean}#`]]) {
      const n = s.split(from).length - 1;
      if (n) { s = s.split(from).join(to); counts[ext] = (counts[ext] || 0) + n; }
    }
  }
  if (s !== before) { fs.writeFileSync(p, s); touched++; }
}
console.log('EN chrome links normalised → clean URLs:');
for (const [ext, clean] of Object.entries(MAP)) console.log(`  ${String(counts[ext] || 0).padStart(4)}  ${ext} → ${clean}`);
console.log(`\nfiles touched: ${touched}`);

// verify: no remaining .html-extension internal href in root EN pages
let leftover = 0;
for (const f of files) {
  const m = fs.readFileSync(ROOT + '/' + f, 'utf8').match(/href="[a-z][a-z0-9-]*\.html[#?"]/g) || [];
  const internal = m.filter(x => !/404\.html/.test(x)); // 404 is fine to leave
  if (internal.length) { leftover += internal.length; console.log(`  ! ${f}: ${[...new Set(internal)].join(', ')}`); }
}
console.log(leftover ? `\n${leftover} extension links remain (inspect)` : '\nno extension links remain (404.html excepted)');
