/* Rasterise the Machined masters with Chromium at exact device pixels.
   From this folder:  python machined.py && node make.js && python assemble.py
   (needs playwright: npm i -D playwright) */
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
const DIR = __dirname;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:600,height:600}, deviceScaleFactor:1});
  const p = await ctx.newPage();
  for (const sz of [16, 20, 24, 32, 48, 180, 192, 512]) {
    const svg = fs.readFileSync(path.join(DIR, `m-${sz}.svg`), 'utf8');
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await p.waitForTimeout(60);
    await p.screenshot({path: path.join(DIR, `m-${sz}.png`), clip:{x:0,y:0,width:sz,height:sz}, omitBackground:true});
  }
  await b.close();
  console.log('rendered; now: python assemble.py');
})();
