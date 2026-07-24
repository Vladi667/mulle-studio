import { load } from 'cheerio';
import fs from 'fs';
import vm from 'vm';

const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const ORIGIN = 'https://agencefritz.com';
fs.mkdirSync(ROOT + '/fr', { recursive: true });

/* ── 1. extract FR dict + SEL + norm from the browser i18n.js via a vm sandbox ── */
const i18nSrc = fs.readFileSync(ROOT + '/assets/i18n.js', 'utf8');
const normFn = i18nSrc.match(/function norm\s*\(s\)\s*\{[\s\S]*?\n\s*\}/)[0];
const selStmt = i18nSrc.match(/var SEL\s*=\s*[\s\S]*?;/)[0].replace(/^var\s+/, '');
const frBlock = i18nSrc.split('\n').filter(l => /^\s*FR(_ATTR|_TITLE)?\[/.test(l)).join('\n');
const ctx = { EXPORTS: null };
vm.createContext(ctx);
vm.runInContext(`FR={};FR_ATTR={};FR_TITLE={};\n${normFn}\n${selStmt}\n${frBlock}\nEXPORTS={FR,FR_ATTR,FR_TITLE,SEL,norm};`, ctx);
const { FR, FR_ATTR, FR_TITLE, SEL, norm } = ctx.EXPORTS;
console.log(`dict: ${Object.keys(FR).length} FR entries · SEL ${SEL.split(',').length} selectors`);

/* ── 2. page map + FR-primary meta ── */
const PAGES = [
  { en: 'index.html', fr: 'index', enPath: '/', title: 'Agence web à Genève — Branding, sites & croissance | Agence Fritz', desc: "Studio indépendant à Genève : identité de marque, création de site web et systèmes de croissance propulsés par l'IA. Conçu pour durer." },
  { en: 'brand-web.html', fr: 'agence-branding-geneve', enPath: '/brand-web', title: "Agence branding & web à Genève — Identité dès CHF 1'500 | Fritz", desc: "Agence de branding et de création de site web à Genève. Identité de marque, site vitrine et e-commerce sur-mesure, dès CHF 1'500. Réponse sous 24 h." },
  { en: 'marketing.html', fr: 'agence-marketing-geneve', enPath: '/marketing', title: 'Agence marketing à Genève — Croissance & acquisition dès CHF 490/mois | Fritz', desc: "Agence marketing à Genève : stratégie, création et performance. Forfaits mensuels dès CHF 490, sans engagement long. Placement du signal." },
  { en: 'growth-ops.html', fr: 'systemes-croissance-ia', enPath: '/growth-ops', title: 'Systèmes de croissance IA pour PME — Genève | Agence Fritz', desc: "Systèmes de croissance propulsés par l'IA à Genève : tracking, CRM, automatisations et reporting pour PME romandes. Dès CHF 490/mois." },
  { en: 'our-work.html', fr: 'realisations', enPath: '/our-work', title: 'Réalisations — Sites web & identités de marque | Agence Fritz', desc: 'Projets récents du studio Fritz à Genève : sites web sur-mesure, identités de marque et films de marque.' },
  { en: 'about.html', fr: 'a-propos', enPath: '/about', title: 'À propos — Fritz, studio indépendant à Genève', desc: "Fritz est un studio indépendant à Genève : marque, web et croissance, sans le superflu. Une seule exigence." },
  { en: 'contact.html', fr: 'contact', enPath: '/contact', title: 'Contact — Agence Fritz, Genève | Réponse sous 24 h', desc: 'Parlons de votre projet. Studio Fritz, Genève. Réponse sous 24 heures.' },
  { en: 'privacy.html', fr: 'confidentialite', enPath: '/privacy', title: 'Politique de confidentialité — Agence Fritz', desc: 'Politique de confidentialité du site agencefritz.com.' },
];
const frUrlOf = p => ORIGIN + (p.fr === 'index' ? '/fr/' : '/fr/' + p.fr);
const frPathOf = p => (p.fr === 'index' ? '/fr/' : '/fr/' + p.fr);
// EN href (with .html or /) → FR extensionless path, for rewriting nav on FR pages
const NAVMAP = {};
for (const p of PAGES) { NAVMAP[p.en] = frPathOf(p); NAVMAP['./' + p.en] = frPathOf(p); }
NAVMAP['index.html'] = '/fr/'; NAVMAP['./index.html'] = '/fr/'; NAVMAP['/'] = '/fr/';

const hreflang = (enPath, frPath) =>
  `<link rel="alternate" hreflang="en" href="${ORIGIN}${enPath}">\n` +
  `<link rel="alternate" hreflang="fr-CH" href="${ORIGIN}${frPath}">\n` +
  `<link rel="alternate" hreflang="x-default" href="${ORIGIN}${enPath}">`;
const langtog = (enHref, frHref, active) =>
  `<div class="langtog" aria-label="Language"><a href="${enHref}"${active === 'en' ? ' class="on" aria-current="page"' : ''}>EN</a><a href="${frHref}"${active === 'fr' ? ' class="on" aria-current="page"' : ''}>FR</a></div>`;

/* the shared org schema (stamped on any page lacking JSON-LD) */
const ORG_LD = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"ProfessionalService","@id":"${ORIGIN}/#org","name":"Agence Fritz","alternateName":"Fritz","url":"${ORIGIN}/","image":"${ORIGIN}/assets/og.png","description":"Studio indépendant à Genève — marque, web et systèmes de croissance, conçus pour durer.","email":"contact@agencefritz.com","areaServed":["Genève","Suisse romande","Suisse"],"address":{"@type":"PostalAddress","addressLocality":"Genève","addressRegion":"GE","addressCountry":"CH"},"geo":{"@type":"GeoCoordinates","latitude":46.2044,"longitude":6.1432},"priceRange":"CHF 490–2900","knowsAbout":["Identité de marque","Création de site web","Marketing","Growth","Intelligence artificielle"]}
</script>`;

/* ── 3. EN pass — targeted string edits, files stay byte-stable except the changes ── */
function editEn(p) {
  const path = ROOT + '/' + p.en;
  let h = fs.readFileSync(path, 'utf8');
  const before = h;
  // strip the i18n.js script tag
  h = h.replace(/\s*<script[^>]*assets\/i18n\.js[^>]*><\/script>/g, '');
  // canonical + og:url → extensionless EN path (root stays "/")
  h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${ORIGIN}${p.enPath}">`);
  h = h.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${ORIGIN}${p.enPath}">`);
  // hreflang + og:locale — insert right after canonical, only once
  if (!/hreflang=/.test(h)) {
    h = h.replace(/(<link rel="canonical"[^>]*>)/,
      `$1\n${hreflang(p.enPath, frPathOf(p))}\n<meta property="og:locale" content="en">\n<meta property="og:locale:alternate" content="fr_CH">`);
  }
  // static language switcher — insert before </header>, only once
  if (!/class="langtog"/.test(h)) {
    h = h.replace(/<\/header>/, `  ${langtog(p.enPath, frPathOf(p), 'en')}\n</header>`);
  }
  // stamp org schema if none present
  if (!/application\/ld\+json/.test(h)) h = h.replace(/<\/head>/, `${ORG_LD}\n</head>`);
  fs.writeFileSync(path, h);
  return before !== h;
}

/* ── 4. FR pass — cheerio: translate + rewrite head/nav/switcher ── */
function buildFr(p) {
  const $ = load(fs.readFileSync(ROOT + '/' + p.en, 'utf8'), { decodeEntities: false });
  $('script[src*="i18n.js"]').remove();
  // translate every SEL element via the real dict + norm
  let hit = 0, miss = 0;
  $(SEL).each((i, el) => { const k = norm($(el).html()); if (Object.prototype.hasOwnProperty.call(FR, k)) { $(el).html(FR[k]); hit++; } else if (k) miss++; });
  $('.sub').each((i, el) => { const k = norm($(el).html()); if (FR[k]) { $(el).html(FR[k]); hit++; } });
  $('[placeholder]').each((i, el) => { const v = $(el).attr('placeholder'); if (FR_ATTR[v]) $(el).attr('placeholder', FR_ATTR[v]); });
  // head
  $('html').attr('lang', 'fr-CH');
  const frUrl = frUrlOf(p), frPath = frPathOf(p);
  $('title').text(p.title);
  $('meta[name="description"]').attr('content', p.desc);
  $('link[rel="canonical"]').attr('href', frUrl);
  $('meta[property="og:url"]').attr('content', frUrl);
  $('meta[property="og:title"]').attr('content', p.title.split(' | ')[0]);
  $('meta[property="og:description"]').attr('content', p.desc);
  $('link[rel="alternate"][hreflang]').remove();
  $('meta[property="og:locale"], meta[property="og:locale:alternate"]').remove();
  $('link[rel="canonical"]').after(
    `\n${hreflang(p.enPath, frPath)}\n<meta property="og:locale" content="fr_CH">\n<meta property="og:locale:alternate" content="en">`);
  // rewrite internal nav links to FR twins
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (NAVMAP[href]) $(el).attr('href', NAVMAP[href]);
  });
  $('[data-href]').each((i, el) => {   // discipline rows navigate via JS on data-href
    const v = $(el).attr('data-href');
    if (NAVMAP[v]) $(el).attr('data-href', NAVMAP[v]);
  });
  // FR pages live under /fr/ — relative "assets/…" would resolve to /fr/assets/ (404).
  // Absolutize every asset reference (src, href, and the deck/work data-* attributes).
  const ASSET_ATTRS = ['src', 'href', 'poster', 'data-video', 'data-poster', 'data-img', 'data-src'];
  $('*').each((i, el) => {
    for (const a of ASSET_ATTRS) {
      const v = el.attribs && el.attribs[a];
      if (v && v.startsWith('assets/')) $(el).attr(a, '/' + v);
    }
  });
  // language switcher (FR active)
  $('.langtog').remove();
  $('header').first().append(langtog(p.enPath, frPath, 'fr'));
  // sitewide inbound links to the FR money pages (footer Services column)
  const svc = $('footer nav[aria-label="Services"]');
  if (svc.length && !svc.find('a[href="/fr/creation-site-web-geneve"]').length) {
    svc.append('\n      <a href="/fr/creation-site-web-geneve">Création de site web</a>');
    svc.append('\n      <a href="/fr/tarifs">Tarifs</a>');
  }
  // stamp org schema if none
  if (!$('script[type="application/ld+json"]').length) $('head').append('\n' + ORG_LD);
  fs.writeFileSync(ROOT + '/fr/' + p.fr + '.html', $.html());
  return { hit, miss };
}

/* ── run ── */
console.log('\nEN pass:');
for (const p of PAGES) console.log(`  ${p.en.padEnd(16)} changed=${editEn(p)}`);
console.log('\nFR pass:');
for (const p of PAGES) { const r = buildFr(p); console.log(`  fr/${(p.fr + '.html').padEnd(28)} translated=${r.hit} miss=${r.miss}`); }
console.log('\ndone.');
