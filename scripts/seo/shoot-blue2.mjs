import { chromium } from 'playwright';
const OUT = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad/shots';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });

async function hero(lang) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await page.addInitScript(l => localStorage.setItem('fritz_lang', l), lang);
  await page.goto('http://localhost:4180/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    document.querySelector('.fluid-wrap')?.classList.add('fallback');
    if (window.gsap) gsap.globalTimeline.getChildren(true, true, true).forEach(t => { try { t.progress(1) } catch (e) {} });
    window.scrollTo(0, 0);
    if (window.ScrollTrigger) { ScrollTrigger.getAll().forEach(st => { try { st.scroll(0) } catch (e) {} }); ScrollTrigger.update(); }
    if (window.MulleFluid && MulleFluid.setVeil) MulleFluid.setVeil(0);
    if (window.gsap) { gsap.set(['.hero-inner', '.hero-wm', '.hero-eyeline', '.hero-foot', '.hero-wm-main'], { clearProps: 'all' }); gsap.set('.hero-wm-echo', { clearProps: 'opacity' }); }
  });
  await page.waitForTimeout(400);
  const svc = await page.evaluate(() => document.querySelector('.el-svc')?.textContent);
  const clip = await page.evaluate(() => { const b = document.querySelector('.hero-eyeline').getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top) - 8, width: Math.round(b.width), height: Math.round(b.height) + 16 }; });
  await page.screenshot({ path: `${OUT}/blue2-hero-${lang}.png`, clip });
  console.log('hero', lang, '| svc:', JSON.stringify(svc), '| errors:', errs.length ? errs.slice(0, 3) : 'none');
  await ctx.close();
}
await hero('en');
await hero('fr');
// disciplines VOIR links
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4180/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelector('.fluid-wrap')?.classList.add('fallback'));
  await page.waitForTimeout(1400);
  await page.evaluate(() => document.querySelector('#disciplines')?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(600);
  const b = await page.evaluate(() => { const r = document.querySelector('.disc-list').getBoundingClientRect(); return { x: 900, y: Math.round(r.top), width: 540, height: Math.min(500, Math.round(r.height)) }; });
  await page.screenshot({ path: `${OUT}/blue2-voir.png`, clip: b });
  await ctx.close();
}
await browser.close();
console.log('done');
