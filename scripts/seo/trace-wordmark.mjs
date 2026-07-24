import { Jimp } from 'jimp';
import potrace from 'potrace';
import fs from 'fs';

const SRC = 'C:/Users/Admin/Desktop/mulle-studio/assets/fritz-logo.png';
const OUT = 'C:/Users/Admin/Desktop/mulle-studio/assets/fritz-wordmark.svg';

// 1) load, flatten alpha -> white so only the black glyph remains, then autocrop the transparent margin
const img = await Jimp.read(SRC);
const w = img.bitmap.width, h = img.bitmap.height;
const flat = new Jimp({ width: w, height: h, color: 0xffffffff });
flat.composite(img, 0, 0);          // black glyph over white
// find glyph bounds (any pixel darker than mid) to crop the padding
let minX = w, minY = h, maxX = 0, maxY = 0;
flat.scan(0, 0, w, h, function (x, y, idx) {
  const r = this.bitmap.data[idx];
  if (r < 128) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
});
const pad = 4;
minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
const cw = maxX - minX + 1, ch = maxY - minY + 1;
flat.crop({ x: minX, y: minY, w: cw, h: ch });
const tmp = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad/_wm-flat.png';
await flat.write(tmp);
console.log('cropped glyph', cw + 'x' + ch, '(from', w + 'x' + h + ')');

// 2) trace to a tight single-path SVG
potrace.trace(tmp, { threshold: 128, turdSize: 2, optCurve: true, optTolerance: 0.2, color: '#1D1D1F', background: 'transparent' }, (err, svg) => {
  if (err) throw err;
  fs.writeFileSync(OUT, svg);
  console.log('wrote', OUT, Math.round(svg.length / 1024) + 'KB');
});
