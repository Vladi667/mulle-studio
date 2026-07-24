import potrace from 'potrace';
import fs from 'fs';
import { Jimp } from 'jimp';
import { chromium } from 'playwright';
const SP = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad/duca';

// autocrop the emblem to the duke's dark-pixel bounds so the traced viewBox is tight (no padding)
const src = await Jimp.read(SP + '/emblem-src.png');
const W = src.bitmap.width, H = src.bitmap.height;
let minX = W, minY = H, maxX = 0, maxY = 0;
src.scan(0, 0, W, H, function (x, y, idx) {
  if (this.bitmap.data[idx] < 138) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
});
const pad = 10;
minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
src.crop({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
await src.write(SP + '/emblem-tight.png');
console.log('tight emblem', (maxX - minX + 1) + 'x' + (maxY - minY + 1));

const svg = await new Promise((res, rej) => {
  potrace.trace(SP + '/emblem-tight.png', { threshold: 138, turdSize: 6, alphaMax: 1, optCurve: true, optTolerance: 0.35, color: '#EFE4D0', background: 'transparent' }, (e, s) => e ? rej(e) : res(s));
});
fs.writeFileSync(SP + '/emblem.svg', svg);
console.log('traced svg', Math.round(svg.length / 1024) + 'KB');

// preview: cream emblem on the deep Il Duca red, next to the raster for comparison
const b64 = fs.readFileSync(SP + '/emblem-src.png').toString('base64');
const html = `<body style="margin:0;display:flex">
  <div style="width:520px;height:520px;background:radial-gradient(circle at 50% 42%,#9c2a1f,#6d1c15 55%,#3f1410);display:flex;align-items:center;justify-content:center">${svg.replace('<svg', '<svg style="width:300px;height:auto"')}</div>
  <div style="width:520px;height:520px;background:radial-gradient(circle at 50% 42%,#9c2a1f,#6d1c15 55%,#3f1410);display:flex;align-items:center;justify-content:center"><img src="data:image/png;base64,${b64}" style="width:300px;mix-blend-mode:screen;opacity:.92"></div>
</body>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1040, height: 520 }, deviceScaleFactor: 2 });
await page.setContent(html);
await page.waitForTimeout(200);
await page.screenshot({ path: SP + '/emblem-compare.png' });
await browser.close();
console.log('preview: emblem-compare.png (left=traced vector, right=raster/screen)');
