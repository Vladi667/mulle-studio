// IndexNow submitter — pushes sitemap URLs to Bing/Yandex/Seznam instead of waiting to be crawled.
// Run AFTER a deploy (the URLs must already be live, and the key file must be reachable).
//   node indexnow.mjs            submit every URL in sitemap.xml
//   node indexnow.mjs /fr/tarifs /pricing   submit only these paths
//
// The key file lives at the site root and its CONTENT must equal its FILENAME (minus .txt).
// Do not rename or remove it — IndexNow re-validates it on every submission.
import fs from 'fs';

const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const O = 'https://agencefritz.com';
const KEY = '1b44c38e1fb32c0a7937f8d846449cdc';
const KEY_LOCATION = `${O}/${KEY}.txt`;

const argPaths = process.argv.slice(2).filter(a => !a.startsWith('-'));

function sitemapUrls() {
  const xml = fs.readFileSync(`${ROOT}/sitemap.xml`, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

// Resolve each argument against the sitemap by suffix match, rather than trusting the string.
// Git Bash on Windows rewrites a leading "/fr/..." argument into "C:/Program Files/Git/fr/...",
// which still forms a valid-looking URL — IndexNow returns 200 and the submission is silently junk.
// Matching against real sitemap entries makes that failure impossible: an unrecognised path aborts.
const known = sitemapUrls();
function resolvePath(arg) {
  const a = arg.replace(/\\/g, '/');
  const matches = known.filter(u => {
    const path = new URL(u).pathname.replace(/\/$/, '') || '/';
    return a === u || a.endsWith(path) || a.replace(/\/$/, '').endsWith(path);
  });
  // prefer the longest matching path so "/fr/" doesn't shadow "/fr/tarifs"
  matches.sort((x, y) => new URL(y).pathname.length - new URL(x).pathname.length);
  return matches[0] || null;
}

let urlList;
if (argPaths.length) {
  urlList = [];
  for (const a of argPaths) {
    const hit = resolvePath(a);
    if (!hit) { console.error(`Not in sitemap.xml, refusing to submit: "${a}"`); process.exit(1); }
    if (!urlList.includes(hit)) urlList.push(hit);
  }
} else {
  urlList = known;
}

if (!urlList.length) { console.error('No URLs to submit.'); process.exit(1); }

// The key file must be live, or every submission is silently rejected.
const keyCheck = await fetch(KEY_LOCATION);
const keyBody = (await keyCheck.text()).trim();
if (!keyCheck.ok || keyBody !== KEY) {
  console.error(`Key file bad: ${KEY_LOCATION} -> HTTP ${keyCheck.status}, body "${keyBody.slice(0, 60)}"`);
  console.error('It must return exactly the key. Deploy it before submitting.');
  process.exit(1);
}
console.log(`Key file OK (${KEY_LOCATION})`);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: 'agencefritz.com', key: KEY, keyLocation: KEY_LOCATION, urlList })
});

// 200 = accepted · 202 = accepted, key still validating · 4xx = rejected (see IndexNow docs)
console.log(`Submitted ${urlList.length} URLs -> HTTP ${res.status} ${res.status === 200 ? '(accepted)' : res.status === 202 ? '(accepted, key pending)' : '(REJECTED)'}`);
if (res.status >= 400) { console.error(await res.text()); process.exit(1); }
urlList.forEach(u => console.log('  ' + u));
