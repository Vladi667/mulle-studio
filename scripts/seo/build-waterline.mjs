import fs from 'fs';
const dir = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad/mock';
const A = JSON.parse(fs.readFileSync(dir + '/assets.json', 'utf8'));
const L = A.logos;
const lg = n => `<img src="${L[n]}" alt="${n}">`;
const WM = A.wordmark, IMG = A.mercury;

const base = `
:root{--ink:#1D1D1F;--t70:rgba(29,29,31,.70);--t55:rgba(29,29,31,.55);--t40:rgba(29,29,31,.40);--hair:rgba(29,29,31,.10);--hair2:rgba(29,29,31,.18);--blue:#0071E3;--bg:#F5F5F7;--sans:"Helvetica Neue",Arial,sans-serif;--mono:ui-monospace,"SF Mono",monospace}
*{margin:0;box-sizing:border-box}
body{background:#e9e9ec;color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased;padding:clamp(16px,3vw,44px)}
.wrap{max-width:1320px;margin:0 auto}
.lede{font-size:13px;line-height:1.6;color:#555;max-width:720px;margin:0 0 6px}
h1.big{font-size:clamp(22px,3vw,32px);letter-spacing:-.02em;margin:0 0 4px}
.opt{margin:34px 0}
.opt-h{display:flex;align-items:baseline;gap:14px;margin:0 0 10px;flex-wrap:wrap}
.opt-h b{font-size:12px;letter-spacing:.16em;text-transform:uppercase}
.opt-h .rec{font-size:10px;font-family:var(--mono);letter-spacing:.1em;text-transform:uppercase;color:#fff;background:var(--blue);padding:2px 8px;border-radius:3px}
.opt-h .sig{font-size:12.5px;color:#444}
.hero{position:relative;aspect-ratio:16/9;background:var(--bg);border-radius:8px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.08),0 18px 50px rgba(0,0,0,.14)}
.img{position:absolute;inset:0;background-image:url("${IMG}");background-size:cover;background-repeat:no-repeat}
.grain{position:absolute;inset:0;opacity:.05;mix-blend-mode:multiply;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.blue{color:var(--blue)}
/* shared chrome */
.reg{position:absolute;top:3.2%;left:3.2%;right:3.2%;height:1px;background:var(--hair)}
.top{position:absolute;top:3.9%;left:3.2%;right:3.2%;display:flex;justify-content:space-between;font-family:var(--mono);font-size:.72vw;letter-spacing:.2em;text-transform:uppercase;color:var(--t55)}
.top img{height:1.05vw;vertical-align:middle}
.eye{position:absolute;font-family:var(--mono);font-size:.72vw;letter-spacing:.34em;text-transform:uppercase;color:var(--t55)}
.slogan{position:absolute;font-weight:500;letter-spacing:-.03em;line-height:.98}
.cta{position:absolute;font-size:1vw;font-weight:500;padding-bottom:5px;border-bottom:1px solid var(--hair2)}
.cta .ar{font-family:var(--mono);margin-left:.4em}
.trust{position:absolute;display:flex;align-items:center;gap:1.5vw}
.trust .lb{font-family:var(--mono);font-size:.62vw;letter-spacing:.3em;text-transform:uppercase;color:var(--t40)}
.trust img{height:1.05vw;filter:grayscale(1);opacity:.5}
.fritz{position:absolute;line-height:0}
.fritz img{filter:none;display:block}
`;

// three variants — vary ONLY fritz size/position; keep the Waterline feel
const chrome = `<div class="reg"></div><div class="top"><span><img src="${WM}"> &nbsp;— Agence · Genève</span><span>Index +&nbsp;·&nbsp;<span class="blue">EN</span> / FR</span></div>`;

const A_foot = `
<div class="opt"><div class="opt-h"><b>A · Foot band</b><span class="rec">Recommended</span><span class="sig">Type cluster up top-left, the mercury peak in the middle, and a big fritz wordmark rising out of the pool at the foot — baseline just kissed by the fold. Two calm zones with the image breathing between.</span></div>
  <div class="hero"><div class="img" style="background-position:center 34%"></div><div class="grain"></div>${chrome}
    <div class="eye" style="left:3.2%;top:14.5%">Brand · Web · Growth — Genève</div>
    <div class="slogan" style="left:3.2%;top:18.5%;font-size:2.9vw">Built to last<span class="blue">.</span></div>
    <div class="cta" style="right:3.2%;top:20%">Start a project<span class="ar">→</span></div>
    <div class="trust" style="left:3.2%;top:40%"><span class="lb">Trusted by</span>${lg('brunello-cucinelli')}${lg('mandarin-oriental')}${lg('deloitte')}${lg('bcg')}</div>
    <div class="fritz" style="left:0;right:0;bottom:-2%;text-align:center"><img src="${WM}" style="width:58%;margin:0 auto"></div>
  </div></div>`;

const B_water = `
<div class="opt"><div class="opt-h"><b>B · On the water</b><span class="sig">fritz big and centred, its baseline resting exactly on the mercury waterline so the wordmark mirrors into the pool. The slogan shrinks to a single quiet line above. Most poetic; most image-led.</span></div>
  <div class="hero"><div class="img" style="background-position:center 58%"></div><div class="grain"></div>${chrome}
    <div class="eye" style="left:0;right:0;top:26%;text-align:center">Built to last<span class="blue">.</span>&nbsp;&nbsp;—&nbsp;&nbsp;Brand · Web · Growth · Genève</div>
    <div class="fritz" style="left:0;right:0;top:34%;text-align:center"><img src="${WM}" style="width:48%;margin:0 auto"></div>
    <div class="cta" style="left:50%;transform:translateX(-50%);bottom:9%">Start a project<span class="ar">→</span></div>
    <div class="trust" style="left:50%;transform:translateX(-50%);bottom:3.5%"><span class="lb">Trusted by</span>${lg('bcg')}${lg('deloitte')}${lg('mandarin-oriental')}${lg('puig')}</div>
  </div></div>`;

const C_mast = `
<div class="opt"><div class="opt-h"><b>C · Top masthead</b><span class="sig">fritz large at top-left as the brand anchor (a real masthead, not chrome), the mountain rising underneath it, slogan resting on the waterline lower-left. Reads most like a classic agency front page.</span></div>
  <div class="hero"><div class="img" style="background-position:center 52%"></div><div class="grain"></div>
    <div class="reg"></div><div class="top" style="justify-content:flex-end"><span>Index +&nbsp;·&nbsp;<span class="blue">EN</span> / FR</span></div>
    <div class="fritz" style="left:2.8%;top:8%"><img src="${WM}" style="width:38%"></div>
    <div class="eye" style="left:3.2%;top:67%">Brand · Web · Growth — Genève</div>
    <div class="slogan" style="left:3.2%;top:71%;font-size:2.9vw">Built to last<span class="blue">.</span></div>
    <div class="cta" style="right:3.2%;bottom:8%">Start a project<span class="ar">→</span></div>
    <div class="trust" style="left:3.2%;bottom:4%"><span class="lb">Trusted by</span>${lg('brunello-cucinelli')}${lg('bcg')}${lg('deloitte')}${lg('mandarin-oriental')}</div>
  </div></div>`;

const html = `<title>The Waterline — fritz placement</title><style>${base}</style>
<div class="wrap">
<h1 class="big">The Waterline — where fritz goes</h1>
<p class="lede">You liked direction 2 but want <b>fritz bigger and better positioned</b>. Its thesis is restraint, so the audit is: give the wordmark real presence without turning it into clutter. Three placements, all keeping the full-bleed mercury, the slogan-on-the-waterline with its blue period, and the hairline CTA. Type is a system stand-in for Geist. Pick a letter.</p>
${A_foot}${B_water}${C_mast}
<p class="lede" style="margin-top:26px;opacity:.75"><b>My read:</b> <b>A (Foot band)</b> gives fritz the most size and the most premium anchor — it's the architectural "brand at the foot" move (Zentro/Cartelle) and lets the mountain + slogan breathe above it. <b>B</b> is the most poetic (wordmark reflected in the mercury) but competes with the slogan for the waterline. <b>C</b> reads more like a classic agency masthead.</p>
</div>`;
fs.writeFileSync(dir + '/../waterline-fritz.html', html);
console.log('written', Math.round(html.length/1024)+'KB');
