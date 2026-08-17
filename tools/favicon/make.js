/* Rasterise the SVG masters with Chromium at exact device pixels and hand the PNGs to
   assemble.py. Run from this folder:  node make.js   (needs playwright: npm i -D playwright) */
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
const DIR = __dirname;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:600,height:600}, deviceScaleFactor:1});
  const p = await ctx.newPage();
  for (const [f, sz] of [['small-16.svg',16],['small-32.svg',32],['small-48.svg',48],
                         ['display-180.svg',180],['display-192.svg',192],['display-512.svg',512]]) {
    await p.setContent(`<html><body style="margin:0;background:transparent">${fs.readFileSync(path.join(DIR,f),'utf8')}</body></html>`);
    await p.waitForTimeout(60);
    await p.screenshot({path: path.join(DIR, f.replace('.svg','.png')), clip:{x:0,y:0,width:sz,height:sz}, omitBackground:true});
  }
  await b.close();
  console.log('rendered; now: python assemble.py');
})();
