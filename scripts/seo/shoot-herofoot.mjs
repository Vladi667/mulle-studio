import { chromium } from 'playwright';
const OUT = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad/shots';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
await page.addInitScript(() => localStorage.setItem('fritz_lang', 'en'));
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
const clip = await page.evaluate(() => { const b = document.querySelector('.hero-foot').getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top) - 12, width: Math.round(b.width), height: Math.round(b.height) + 24 }; });
await page.screenshot({ path: `${OUT}/herofoot.png`, clip });
console.log('errors:', errs.length ? errs.slice(0, 3) : 'none');
await browser.close();
