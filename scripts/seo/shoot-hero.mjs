import { chromium } from 'playwright';

const OUT = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad/shots';
import fs from 'fs'; fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });

const settle = () => {
  if (window.gsap) { gsap.globalTimeline.getChildren(true, true, true).forEach(t => { try { t.progress(1) } catch (e) {} }); }
  window.scrollTo(0, 0);
  if (window.ScrollTrigger) { ScrollTrigger.getAll().forEach(st => { try { st.scroll(0) } catch (e) {} }); ScrollTrigger.update(); }
  if (window.MulleFluid && MulleFluid.setVeil) MulleFluid.setVeil(0);
  if (window.gsap) {
    gsap.set(['.hero-inner', '.hero-wm', '.hero-eyeline', '.hero-foot', '.hero-wm-main'], { clearProps: 'all' });
    gsap.set('.hero-wm-echo', { clearProps: 'opacity' });
  }
};

async function shoot(name, viewport, lang) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(l => localStorage.setItem('fritz_lang', l), lang);
  await page.goto('http://localhost:4179/index.html', { waitUntil: 'networkidle' });
  // the choreography boots after webfonts resolve — wait until the intro has actually run
  await page.waitForFunction(() => {
    const el = document.querySelector('.hero-wm-main');
    return el && getComputedStyle(el).opacity !== '' && window.gsap && gsap.globalTimeline.getChildren(true, true, true).length > 0;
  }, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.evaluate(settle);
  await page.waitForTimeout(500);
  await page.evaluate(settle); // catch any late-created tweens
  // if the GL canvas failed to draw (headless), fall back to the matched static massif
  const glOk = await page.evaluate(() => {
    const c = document.getElementById('fluid');
    if (!c) return false;
    try {
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return false;
      const px = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return px[0] + px[1] + px[2] > 30; // not black/empty
    } catch (e) { return false; }
  });
  if (!glOk) { await page.evaluate(() => document.querySelector('.fluid-wrap')?.classList.add('fallback')); }
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await ctx.close();
  console.log('shot', name, 'gl:', glOk);
}

await shoot('hero-desktop-fr', { width: 1440, height: 900 }, 'fr');
await shoot('hero-desktop-en', { width: 1440, height: 900 }, 'en');
await shoot('hero-mobile-fr', { width: 390, height: 844 }, 'fr');
await browser.close();
console.log('done →', OUT);
