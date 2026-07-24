import { chromium } from 'playwright';
const OUT = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad/shots';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });

// work page — Il Duca row (3rd article)
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type()==='error'&&errs.push(m.text()));
  await page.goto('http://localhost:4180/our-work.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll('.wk-row')[2]?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/duca-work.png` });
  console.log('duca-work | errors:', errs.length ? errs.slice(0,3) : 'none');
  await ctx.close();
}
// homepage deck — Il Duca is card 3; scroll deep into the pinned stack
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4180/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelector('.fluid-wrap')?.classList.add('fallback'));
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelector('#works')?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollBy(0, 1900)); // into the stack toward card 3
  await page.waitForTimeout(500);
  await page.evaluate(() => { if (window.ScrollTrigger) ScrollTrigger.update(); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/duca-deck.png` });
  await ctx.close();
}
await browser.close();
console.log('done');
