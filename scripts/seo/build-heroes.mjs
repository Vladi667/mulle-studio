/* NOTE: this generator used to emit a "Trusted by" row over brands the studio
   has never worked for, including Mandarin Oriental, which appears nowhere else.
   Its output is not published today, but re-running it would have put the claim
   back on a page. Only the founder's evidenced freelance clients remain, under
   the same caption the live hero uses. */
import fs from 'fs';
const dir = 'C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Fritz/0960b374-6328-4cf3-a3ca-1e3681f0b646/scratchpad/mock';
const A = JSON.parse(fs.readFileSync(dir + '/assets.json', 'utf8'));
const L = A.logos;
const logo = (n, cls='') => `<img class="${cls}" src="${L[n]}" alt="${n}">`;

const css = `
:root{--ink:#1D1D1F;--t70:rgba(29,29,31,.70);--t55:rgba(29,29,31,.55);--t40:rgba(29,29,31,.40);--hair:rgba(29,29,31,.10);--hair2:rgba(29,29,31,.18);--blue:#0071E3;--bg:#F5F5F7;
  --sans:"Helvetica Neue",Arial,sans-serif;--mono:ui-monospace,"SF Mono","Roboto Mono",monospace}
*{margin:0;box-sizing:border-box}
body{background:#e9e9ec;color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased;padding:clamp(16px,3vw,44px)}
.wrap{max-width:1320px;margin:0 auto}
.lede{font-size:13px;line-height:1.6;color:#555;max-width:680px;margin:0 0 6px}
h1.big{font-size:clamp(22px,3vw,32px);letter-spacing:-.02em;margin:0 0 4px}
.opt{margin:34px 0}
.opt-h{display:flex;align-items:baseline;gap:14px;margin:0 0 10px;flex-wrap:wrap}
.opt-h b{font-size:12px;letter-spacing:.16em;text-transform:uppercase}
.opt-h .ref{font-size:11px;color:#888;font-family:var(--mono)}
.opt-h .sig{font-size:12.5px;color:#444}
/* the hero frame */
.hero{position:relative;aspect-ratio:16/9;background:var(--bg);border-radius:8px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.08),0 18px 50px rgba(0,0,0,.14);isolation:isolate}
.hero .img{position:absolute;inset:0;background-size:cover;background-repeat:no-repeat}
.hero .grain{position:absolute;inset:0;opacity:.05;mix-blend-mode:multiply;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.mono{font-family:var(--mono)}
.blue{color:var(--blue)}

/* ============ 1 · THE PEAK KISS ============ */
.pk .img{background-image:url("${A.mercury}");background-position:center 46%}
.pk-rail{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;padding:2.4% 3.2% 0;
  font-family:var(--mono);font-size:.72vw;letter-spacing:.2em;text-transform:uppercase;color:var(--t55)}
.pk-mark{position:absolute;left:0;right:0;top:8.5%;text-align:center;line-height:0}
.pk-mark img{width:94%;max-width:none;filter:none}
.pk-idx{position:absolute;left:2.2%;top:52%;writing-mode:vertical-rl;font-family:var(--mono);font-size:.68vw;letter-spacing:.3em;text-transform:uppercase;color:var(--t40)}
.pk-slogan{position:absolute;left:3.2%;bottom:16%;font-size:2.1vw;font-weight:500;letter-spacing:-.015em;line-height:1.04}
.pk-slogan em{font-style:italic;font-weight:500}
.pk-cta{position:absolute;right:3.2%;bottom:16.5%;font-family:var(--mono);font-size:.86vw;letter-spacing:.14em;text-transform:uppercase;
  padding-bottom:6px;border-bottom:1px solid var(--hair2)}
.pk-cta .ar{color:var(--blue)}
.pk-trust{position:absolute;left:3.2%;right:3.2%;bottom:5.5%;display:flex;align-items:center;gap:2vw;border-top:1px solid var(--hair);padding-top:1.4%}
.pk-trust .lb{font-family:var(--mono);font-size:.66vw;letter-spacing:.24em;text-transform:uppercase;color:var(--t40)}
.pk-trust img{height:1.15vw;filter:grayscale(1);opacity:.55}
.pk-trust .more{margin-left:auto;font-family:var(--mono);font-size:.66vw;letter-spacing:.18em;text-transform:uppercase;color:var(--t40)}

/* ============ 2 · THE WATERLINE ============ */
.wl .img{background-image:url("${A.mercury}");background-position:center 46%}
.wl-reg{position:absolute;top:3.2%;left:3.2%;right:3.2%;height:1px;background:var(--hair)}
.wl-top{position:absolute;top:3.9%;left:3.2%;right:3.2%;display:flex;justify-content:space-between;font-family:var(--mono);font-size:.72vw;letter-spacing:.2em;text-transform:uppercase;color:var(--t55)}
.wl-top img{height:1.1vw;vertical-align:middle}
.wl-eye{position:absolute;left:3.2%;top:38%;font-family:var(--mono);font-size:.74vw;letter-spacing:.34em;text-transform:uppercase;color:var(--t55)}
.wl-slogan{position:absolute;left:3.2%;top:43%;font-size:5.6vw;font-weight:500;letter-spacing:-.03em;line-height:.98}
.wl-idx{position:absolute;right:2.2%;top:44%;writing-mode:vertical-rl;font-family:var(--mono);font-size:.68vw;letter-spacing:.3em;text-transform:uppercase;color:var(--t40)}
.wl-trust{position:absolute;left:3.2%;bottom:8%;display:flex;flex-direction:column;gap:.9vw}
.wl-trust .lb{font-family:var(--mono);font-size:.66vw;letter-spacing:.3em;text-transform:uppercase;color:var(--t40)}
.wl-trust .row{display:flex;align-items:center;gap:1.7vw}
.wl-trust img{height:1.2vw;filter:grayscale(1);opacity:.5}
.wl-cta{position:absolute;right:3.2%;bottom:8.5%;font-size:1.05vw;font-weight:500;padding-bottom:5px;border-bottom:1px solid var(--hair2)}
.wl-cta .ar{font-family:var(--mono);margin-left:.4em}
.wl-clock{position:absolute;left:3.2%;bottom:3.5%;font-family:var(--mono);font-size:.66vw;letter-spacing:.2em;text-transform:uppercase;color:var(--t40)}

/* ============ 3 · PLANCHE 01 ============ */
.pl{background:var(--bg)}
.pl .cols{position:absolute;inset:0;pointer-events:none}
.pl .cols i{position:absolute;top:0;bottom:0;width:1px;background:rgba(29,29,31,.05)}
.pl .band{position:absolute;left:3.3%;right:3.3%;height:1px;background:var(--hair2)}
.pl-head{position:absolute;left:3.3%;top:3.2%;font-weight:700;font-size:1.5vw;letter-spacing:-.02em}
.pl-nav{position:absolute;right:3.3%;top:3.4%;font-family:var(--mono);font-size:.74vw;letter-spacing:.14em;text-transform:uppercase;color:var(--t55)}
.pl-nav .on{color:var(--blue)}
.pl-plate{position:absolute;top:13%;right:3.3%;width:53%;bottom:16%;background:var(--bg);border:1px solid var(--hair2);overflow:hidden}
.pl-plate .pimg{position:absolute;inset:0;background-image:url("${A.mercury}");background-size:cover;background-position:center 50%}
.pl-plate .mk{position:absolute;font-family:var(--mono);font-size:.6vw;letter-spacing:.16em;text-transform:uppercase;color:rgba(29,29,31,.5)}
.pl-eye{position:absolute;left:3.3%;top:20%;font-family:var(--mono);font-size:.74vw;letter-spacing:.14em;text-transform:uppercase;color:var(--t55)}
.pl-clock{position:absolute;left:3.3%;top:24%;font-family:var(--mono);font-size:.74vw;letter-spacing:.12em;color:var(--t55)}
.pl-slogan{position:absolute;left:3.3%;top:33%;font-weight:600;font-size:4.6vw;line-height:.9;letter-spacing:-.02em}
.pl-slogan em{font-style:italic;font-weight:600}
.pl-slogan .sq{display:inline-block;width:.5em;height:.5em;background:var(--blue);margin-left:.06em;vertical-align:baseline}
.pl-pos{position:absolute;left:3.3%;top:72%;width:36%;font-size:.92vw;line-height:1.5;color:var(--t70)}
.pl-cta{position:absolute;left:3.3%;top:80%;display:flex;gap:1.6vw;align-items:baseline;font-family:var(--mono);font-size:.8vw;letter-spacing:.06em;text-transform:uppercase}
.pl-cta .p{border-bottom:1px solid var(--ink);padding-bottom:4px;position:relative}
.pl-cta .p::before{content:"";position:absolute;left:0;bottom:-1px;width:5px;height:2px;background:var(--blue)}
.pl-cta .s{color:var(--t55)}
.pl-colo{position:absolute;left:3.3%;right:3.3%;bottom:4.4%;display:flex;align-items:center;gap:1.6vw}
.pl-colo .lb{font-family:var(--mono);font-size:.62vw;letter-spacing:.16em;text-transform:uppercase;color:var(--t40)}
.pl-colo img{height:1.05vw;filter:grayscale(1);opacity:.55}
`;

const cap = (n, ref, sig) => `<div class="opt-h"><b>${n}</b><span class="ref mono">ref · ${ref}</span></div><div class="lede">${sig}</div>`;

const peakKiss = `
<div class="opt">${cap('01 · The Peak Kiss', 'Klim specimen × Swiss masthead', 'The giant <b>fritz</b> nameplate pinned to the top; the mercury summit rises to <b>kiss the underside of the baseline</b> — ink and liquid physically touching. Slogan low-left, CTA low-right, one blue mark. Type is the hero.')}
  <div class="hero pk">
    <div class="img"></div><div class="grain"></div>
    <div class="pk-rail"><span>Agence — Genève</span><span>46.204°N 6.143°E · 14:07 CET · Index + · <span class="blue">EN</span> / FR</span></div>
    <div class="pk-mark"><img src="${A.wordmark}" alt="fritz"></div>
    <div class="pk-idx">01 — Ouverture</div>
    <div class="pk-slogan">Built to <em>last.</em></div>
    <div class="pk-cta">Start a project <span class="ar mono">→</span></div>
    <div class="pk-trust"><span class="lb">Founder's freelance work, before Fritz</span>${logo('deloitte')}${logo('puig')}</div>
  </div>
</div>`;

const waterline = `
<div class="opt">${cap('02 · The Waterline', 'Exo Ape cinematic · Aesop restraint', 'The image owns the whole frame; type stays small and precise at the edges. The slogan rests <b>exactly on the mercury waterline</b> with a single blue period. Signature load: the mountain <b>surfaces out of a still mirror pool</b>. Image is the hero.')}
  <div class="hero wl">
    <div class="img"></div><div class="grain"></div>
    <div class="wl-reg"></div>
    <div class="wl-top"><span><img src="${A.wordmark}" alt="fritz"> &nbsp;— Agence · Genève</span><span>Index +&nbsp;&nbsp;·&nbsp;&nbsp;<span class="blue">EN</span> / FR</span></div>
    <div class="wl-eye">Brand · Web · Growth — Genève</div>
    <div class="wl-slogan">Built to last<span class="blue">.</span></div>
    <div class="wl-idx">Ouverture — 01</div>
    <div class="wl-trust"><span class="lb">Founder's freelance work, before Fritz</span><div class="row">${logo('deloitte')}${logo('puig')}</div></div>
    <div class="wl-cta">Start a project<span class="ar">→</span></div>
    <div class="wl-clock">Genève — 46.2044°N 6.1432°E — 14:32:09</div>
  </div>
</div>`;

const cols = Array.from({length:11},(_,i)=>`<i style="left:${3.3+(i+1)*(93.4/12)}%"></i>`).join('');
const planche = `
<div class="opt">${cap('03 · Planche 01 — The Specimen Plate', 'Klim / Müller-Brockmann Swiss grid', 'A rigid printed specimen sheet: a visible 12-column raster, the mercury <b>matted as a gallery plate</b> (right), the slogan as a 3-line flush-left monument (left). Every element obeys the grid — except <b>the peak, which breaks it</b>. Structure is the hero.')}
  <div class="hero pl">
    <div class="cols">${cols}</div>
    <div class="band" style="top:8%"></div><div class="band" style="top:87.5%"></div>
    <div class="pl-head">fritz</div>
    <div class="pl-nav">Index +&nbsp;&nbsp;·&nbsp;&nbsp;<span class="on">EN</span> / FR</div>
    <div class="pl-plate"><div class="pimg"></div>
      <div class="mk" style="top:5%;left:5%">PL.01 · Mercury</div><div class="mk" style="top:5%;right:5%">46.2044° N</div>
      <div class="mk" style="bottom:5%;left:5%">Studio — Genève</div><div class="mk" style="bottom:5%;right:5%">6.1432° E</div>
    </div>
    <div class="pl-eye">N° 01 — Ouverture</div>
    <div class="pl-clock">GVA 14:23:0<span class="blue">7</span> CET</div>
    <div class="pl-slogan">Built<br>to<br><em>last</em><span class="sq"></span></div>
    <div class="pl-pos">Brand, web and growth systems, machined in Geneva. Precise, essential, made to endure.</div>
    <div class="pl-cta"><span class="p">Start a project →</span><span class="s">See the work ↗</span></div>
    <div class="pl-colo"><span class="lb">Founder's freelance work, before Fritz</span>${logo('clarins')}${logo('deloitte')}${logo('puig')}</div>
  </div>
</div>`;

const html = `<title>Fritz hero — three directions</title><style>${css}</style>
<div class="wrap">
<h1 class="big">Three hero directions</h1>
<p class="lede">From the redesign brainstorm: the three strongest, most distinct, buildable heroes. All kill the cheap tells (no centered stack, no scrolling marquee, no glowing pill) and keep the mercury image + its liquid interaction. Type here is a system stand-in for <b>Geist</b>; the live build uses real Geist + the WebGL wave. Pick the one that feels $50k to you — say “build 1”, “2”, or “3”.</p>
${peakKiss}
${waterline}
${planche}
<p class="lede" style="margin-top:30px;opacity:.7">Each reflows to a real phone layout (verified in the plan). The one blue mark, the hairline ghost CTA, and a faint film grain over the render are shared across all three.</p>
</div>`;

fs.writeFileSync(dir + '/../hero-directions.html', html);
console.log('written', Math.round(html.length/1024) + 'KB');
