import fs from 'fs';
import { chromium } from 'playwright';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad/duca';
const emblem = fs.readFileSync(SP + '/emblem.svg', 'utf8').replace('<svg', '<svg class="em"');

const grain = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const html = `<!doctype html><html><head><meta charset="utf8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;box-sizing:border-box}
  .card{position:relative;width:1760px;height:1100px;overflow:hidden;
    background:radial-gradient(120% 100% at 50% 43%, #a12d21 0%, #7c2019 42%, #591811 74%, #37120d 100%);
    display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif}
  /* faint printed grain + a soft warm bloom top-centre for depth */
  .bloom{position:absolute;inset:0;background:radial-gradient(60% 46% at 50% 34%, rgba(255,214,188,.16), transparent 70%);pointer-events:none}
  .grain{position:absolute;inset:0;background:url("${grain}");background-size:150px 150px;opacity:.09;mix-blend-mode:overlay;pointer-events:none}
  .vig{position:absolute;inset:0;box-shadow:inset 0 0 220px 40px rgba(30,9,6,.55);pointer-events:none}
  .stack{position:relative;display:flex;flex-direction:column;align-items:center;color:#efe4d0;z-index:2}
  .em{height:328px;width:auto;display:block;filter:drop-shadow(0 6px 22px rgba(20,6,4,.45))}
  .name{margin-top:38px;font-weight:600;font-size:88px;letter-spacing:.16em;line-height:1;
    text-indent:.16em;color:#f2e8d5;text-shadow:0 2px 18px rgba(20,6,4,.35)}
  .rule{margin-top:26px;display:flex;align-items:center;gap:16px}
  .rule i{display:block;width:54px;height:1px;background:rgba(239,228,208,.5)}
  .rule b{width:4px;height:4px;border-radius:50%;background:rgba(239,228,208,.75);display:block}
  .tag{margin-top:20px;font-size:22px;font-weight:400;letter-spacing:.42em;text-indent:.42em;color:rgba(239,228,208,.72)}
</style></head>
<body>
  <div class="card">
    <div class="bloom"></div>
    <div class="stack">
      ${emblem}
      <div class="name">IL&nbsp;DUCA</div>
      <div class="rule"><i></i><b></b><i></i></div>
      <div class="tag">GELATERIA ARTIGIANALE · LAUSANNE</div>
    </div>
    <div class="grain"></div>
    <div class="vig"></div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1760, height: 1100 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
await page.locator('.card').screenshot({ path: SP + '/duca-card-raw.png' });
await browser.close();
console.log('rendered duca-card-raw.png');
