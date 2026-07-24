import { chromium } from 'playwright';
const B = 'http://localhost:4180';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });

async function check(url, want) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 120)));
  page.on('pageerror', e => errs.push('PAGEERR: ' + e.message.slice(0, 120)));
  page.on('requestfailed', r => { const u = r.url(); if (!u.includes('cdn') && !u.includes('fonts')) errs.push('REQFAIL: ' + u.split('/').pop()); });
  await page.goto(B + url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  const d = await page.evaluate(() => ({
    title: document.title,
    lang: document.documentElement.lang,
    i18n: !!document.querySelector('script[src*="i18n.js"]'),
    langtog: [...document.querySelectorAll('.langtog a')].map(a => a.textContent + (a.classList.contains('on') ? '*' : '') + '→' + a.getAttribute('href')),
    hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(l => l.getAttribute('hreflang') + '=' + l.getAttribute('href').replace('https://agencefritz.com', '')),
    canonical: (document.querySelector('link[rel=canonical]') || {}).href,
    eyeline: (document.querySelector('.hero-eyeline, h1') || {}).textContent?.trim().slice(0, 46),
    ldTypes: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { const j = JSON.parse(s.textContent); return (j['@graph'] || [j]).map(x => x['@type']).join('+') } catch (e) { return 'INVALID' } }).join(' | '),
    bodyText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 0),
  }));
  d.errs = errs;
  const ok = want.every(w => JSON.stringify(d).includes(w));
  console.log(`\n${ok ? '✓' : '✗ FAIL'} ${url}`);
  console.log('  title:', d.title);
  console.log('  lang:', d.lang, '| i18n loaded:', d.i18n, '| canonical:', d.canonical);
  console.log('  langtog:', d.langtog.join('  '));
  console.log('  hreflang:', d.hreflang.join('  '));
  console.log('  ld:', d.ldTypes);
  console.log('  h1:', d.eyeline);
  if (errs.length) console.log('  ERRORS:', errs);
  if (!ok) console.log('  MISSING wanted:', want.filter(w => !JSON.stringify(d).includes(w)));
  await ctx.close();
  return { ok, errs: errs.length };
}

const R = [];
R.push(await check('/', ['Brand, Web', 'EN*→/', 'FR→/fr/', 'hreflang', false === undefined ? '' : 'fr-CH']));
R.push(await check('/fr/', ['Agence web à Genève', 'fr-CH', 'FR*→/fr/', 'EN→/', 'Conçu pour durer']));
R.push(await check('/fr/tarifs', ['Tarifs', "1'500", 'OfferCatalog', 'FAQPage', 'FR*→/fr/tarifs']));
R.push(await check('/brand-web', ['EN*→/brand-web', 'FR→/fr/agence-branding-geneve']));
R.push(await check('/fr/agence-branding-geneve', ['fr-CH', 'FR*→/fr/agence-branding-geneve', 'Agence branding']));

// click-nav: EN home → FR
{
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.goto(B + '/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(600);
  await page.click('.langtog a:not(.on)'); await page.waitForTimeout(600);
  console.log('\nclick FR on EN home → landed:', new URL(page.url()).pathname);
  await ctx.close();
}
await browser.close();
console.log('\n=== ' + R.filter(r => r.ok).length + '/' + R.length + ' pages OK · ' + R.reduce((a, r) => a + r.errs, 0) + ' total console errors ===');
