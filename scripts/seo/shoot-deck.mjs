import { chromium } from 'playwright';
const OUT = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad/shots';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });

async function run(name, url, sel, lang, extraScroll = 0) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.addInitScript(l => localStorage.setItem('fritz_lang', l), lang);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelector('.fluid-wrap')?.classList.add('fallback'));
  await page.waitForTimeout(1500);
  // reveal the section, then nudge so the deck's sticky stack engages
  await page.evaluate((s) => { const el = document.querySelector(s); if (el) el.scrollIntoView({ block: 'start' }); }, sel);
  await page.waitForTimeout(400);
  if (extraScroll) { await page.evaluate(y => window.scrollBy(0, y), extraScroll); await page.waitForTimeout(500); }
  await page.evaluate(() => { if (window.ScrollTrigger) ScrollTrigger.update(); });
  await page.waitForTimeout(600);
  // report image/video presence
  const info = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('.wd-media img, .wk-canvas img')].map(i => ({ src: i.currentSrc.split('/').pop(), w: i.naturalWidth }));
    return { imgs };
  });
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await ctx.close();
  console.log(name, '| errors:', errors.length ? errors.slice(0, 4) : 'none', '| media:', JSON.stringify(info.imgs).slice(0, 300));
}

await run('deck-home', 'http://localhost:4179/index.html', '#works', 'en', 380);
await run('deck-home-fr', 'http://localhost:4179/index.html', '#works', 'fr', 380);
await run('work-eden', 'http://localhost:4179/our-work.html', '.wk-row:nth-of-type(2)', 'en', 0);
await browser.close();
console.log('done');
