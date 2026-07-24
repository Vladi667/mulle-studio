import { chromium } from 'playwright';
const OUT = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad/shots';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
await page.goto('http://localhost:4180/index.html', { waitUntil: 'networkidle' });
await page.evaluate(() => document.querySelector('.fluid-wrap')?.classList.add('fallback'));
await page.waitForTimeout(1500);
// disciplines section (blue numbers + blue eyebrow tick)
await page.evaluate(() => document.querySelector('#disciplines')?.scrollIntoView({ block: 'start' }));
await page.waitForTimeout(500);
await page.evaluate(() => { if (window.ScrollTrigger) ScrollTrigger.update(); });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/blue-disciplines.png` });
// deck title (blue "work.") — scroll so the pinned title shows
await page.evaluate(() => document.querySelector('#works')?.scrollIntoView({ block: 'start' }));
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollBy(0, 120));
await page.waitForTimeout(500);
await page.evaluate(() => { if (window.ScrollTrigger) ScrollTrigger.update(); });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/blue-deck-title.png` });
// LeVallon card (04) — scroll deep into the deck stack
await page.evaluate(() => window.scrollBy(0, 2900));
await page.waitForTimeout(500);
await page.evaluate(() => { if (window.ScrollTrigger) ScrollTrigger.update(); });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/blue-levallon.png` });
console.log('errors:', errs.length ? errs.slice(0, 4) : 'none');
await browser.close();
