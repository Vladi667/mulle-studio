/* ──────────────────────────────────────────────────────────────────
   FRITZ — Machined
   The wordmark as a technical drawing of itself.

   The hero's tagline is "machined in Geneva"; this is that sentence, drawn.
   Construction lines and the outline draw in like a plotter as the page opens;
   a crosshair with live coordinates — in the drawing's own units — follows the
   pointer; press-and-hold fills the plan to a solid object and it springs back
   to a plan on release. Every mark on screen is information, none is texture.

   SVG + springs. No shaders, no WebGL, no libraries. Replaces mulle-fluid.js.
   Exposes the same window.MulleFluid surface so mulle.js is untouched:
     ok · intro() · setVeil(v) · coverage() · splash(x,y)
   ────────────────────────────────────────────────────────────────── */
(function(){
'use strict';

var wrap = document.querySelector('.fluid-wrap');
if(!wrap) return;
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* the mark — the same path as assets/fritz-wordmark.svg, inlined so there is no fetch
   before the first frame and no flash of an empty stage */
var VW = 874, VH = 321;
var PATH_D = 'M 139 5.035 C 129.327 6.185, 116.936 9.610, 107.073 13.862 C 72.302 28.853, 51.058 59.663, 47.507 100.250 L 46.829 108 25.415 108 L 4 108 4 134.500 L 4 161 25.494 161 L 46.988 161 47.244 238.750 L 47.500 316.500 76.750 316.765 L 106 317.030 106 239.015 L 106 161 151.500 161 L 197 161 197 239 L 197 317 226.500 317 L 256 317 256 264.160 C 256 214.812, 256.131 210.809, 257.975 203.596 C 263.088 183.606, 277.033 169.568, 298 163.304 C 302.669 161.909, 310.619 161.601, 350.611 161.261 L 397.722 160.862 398.386 164.181 C 398.751 166.006, 399.027 198.775, 398.999 237 C 398.971 275.225, 398.960 308.863, 398.974 311.750 L 399 317 428 317 C 450.477 317, 457.024 316.719, 457.106 315.750 C 457.182 314.853, 457.100 141.889, 457.008 110.704 L 457 107.908 380.250 108.237 C 303.704 108.566, 303.479 108.573, 295.511 110.860 C 283.690 114.252, 271.226 121.090, 263.028 128.680 L 256 135.187 256 121.594 L 256 108 181 108 L 106 108 106 105.684 C 106 104.410, 106.492 100.697, 107.093 97.434 C 110.187 80.643, 122.027 68.067, 140 62.481 C 144.108 61.205, 150.626 60.643, 165.750 60.260 L 186 59.748 186 31.874 L 186 4 165.750 4.131 C 154.613 4.204, 142.575 4.610, 139 5.035 M 398.863 47.750 C 398.664 49.263, 398.646 59.612, 398.825 70.750 L 399.150 91 427.985 91 L 456.819 91 457.160 70.750 C 457.347 59.612, 457.336 49.263, 457.137 47.750 L 456.773 45 428 45 L 399.227 45 398.863 47.750 M 493 150.840 C 493 253.263, 493.064 256.932, 494.992 264.468 C 500.326 285.325, 512.966 300.891, 531.668 309.634 C 547.301 316.942, 533.629 316.400, 710.750 316.741 L 870 317.047 870 290.530 L 870 264.013 797.910 263.757 L 725.821 263.500 797.873 209.500 L 869.925 155.500 869.962 131.753 L 870 108.006 710.750 107.753 L 551.500 107.500 551.236 76.250 L 550.972 45 521.986 45 L 493 45 493 150.840 M 551.417 161.355 C 551.131 162.100, 551.033 181.562, 551.199 204.605 C 551.534 251.236, 551.423 250.430, 558.467 257.271 C 565.146 263.758, 566.939 264, 608.261 264 L 645.167 264 674.833 241.648 C 691.150 229.354, 713.059 212.816, 723.520 204.898 C 733.981 196.979, 751.172 183.975, 761.721 176 C 772.270 168.025, 780.924 161.162, 780.951 160.750 C 780.978 160.338, 729.461 160, 666.469 160 C 571.040 160, 551.851 160.226, 551.417 161.355';

var NS = 'http://www.w3.org/2000/svg';
function el(n, a, p){ var e = document.createElementNS(NS, n); for(var k in (a||{})) e.setAttribute(k, a[k]); if(p) p.appendChild(e); return e; }

/* tokens — the site's own */
var INK = '#1D1D1F', BLUE = '#0071E3', RULE = 'rgba(29,29,31,.30)', LBL = 'rgba(29,29,31,.55)';
var MONO = '"Geist Mono", ui-monospace, "SF Mono", monospace';

/* stage */
var svg = el('svg', { 'class':'mach', 'aria-hidden':'true' }, wrap);
svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;display:block';
var g = el('g', {}, svg);
var gDim = el('g', { fill:'none', stroke:RULE, 'stroke-width':1, 'vector-effect':'non-scaling-stroke' }, g);
var outline = el('path', { d:PATH_D, fill:INK, 'fill-opacity':0, stroke:INK, 'stroke-width':1.25,
  'vector-effect':'non-scaling-stroke', 'stroke-linejoin':'round' }, g);
var gLbl = el('g', { 'font-family':MONO, 'font-size':10, fill:LBL, 'letter-spacing':'0.14em' }, svg);
var gCross = el('g', { fill:'none', stroke:BLUE, 'stroke-width':1, opacity:0 }, svg);
var chX = el('line', {}, gCross), chY = el('line', {}, gCross);
var chDot = el('circle', { r:2.5, fill:BLUE, stroke:'none' }, gCross);
/* the readout is not a dimension label: it must stay legible over the FILLED mark, so it
   lives in its own layer and never takes the fill fade */
var gRead = el('g', {}, svg);
var chLbl = el('text', { 'font-family':MONO, 'font-size':10, fill:BLUE, 'letter-spacing':'0.12em',
  stroke:'#F5F5F7', 'stroke-width':3, 'paint-order':'stroke', 'stroke-linejoin':'round' }, gRead);

/* layout — the drawing sits in the right half on desktop, above the type on phones.
   Screen-fraction boxes; the drawing keeps its aspect and centres in the box. */
var scale = 1, ox = 0, oy = 0, compact = false;
function layout(){
  var W = wrap.clientWidth, H = wrap.clientHeight;
  compact = W < 768;
  /* phone: the sheet is full-bleed and sits behind the type — the plan is the paper the words
     are printed on. Desktop: the right half, beside the type. */
  var box = compact ? { l:0.06, r:0.88, t:0.16, b:0.42 } : { l:0.55, r:0.92, t:0.30, b:0.66 };
  var bw = (box.r-box.l)*W, bh = (box.b-box.t)*H;
  scale = Math.min(bw/VW, bh/VH);
  ox = box.l*W + (bw - VW*scale)/2; oy = box.t*H + (bh - VH*scale)/2;
  g.setAttribute('transform', 'translate('+ox+','+oy+') scale('+scale+')');
  buildDims();
}

/* dimensions — only the ones a draughtsman would put on a first sheet: overall width,
   cap height, the one radius, and the x-height construction line. On phones the width
   dimension and the title block go; the sheet has less room and the type is close. */
function buildDims(){
  while(gDim.firstChild) gDim.removeChild(gDim.firstChild);
  while(gLbl.firstChild) gLbl.removeChild(gLbl.firstChild);
  var px = function(v){ return ox + v*scale; }, py = function(v){ return oy + v*scale; };
  var ext = 18/scale, off = (compact?26:34)/scale, tick = 4/scale;
  var yb = VH + off, xr = VW + off;
  if(!compact){
    el('line', { x1:0, y1:VH+ext*0.4, x2:0, y2:yb+ext*0.4 }, gDim);
    el('line', { x1:VW, y1:VH+ext*0.4, x2:VW, y2:yb+ext*0.4 }, gDim);
    el('line', { x1:0, y1:yb, x2:VW, y2:yb }, gDim);
    el('line', { x1:0, y1:yb-tick, x2:0, y2:yb+tick }, gDim);
    el('line', { x1:VW, y1:yb-tick, x2:VW, y2:yb+tick }, gDim);
  }
  el('line', { x1:VW+ext*0.4, y1:0, x2:xr+ext*0.4, y2:0 }, gDim);
  el('line', { x1:VW+ext*0.4, y1:VH, x2:xr+ext*0.4, y2:VH }, gDim);
  el('line', { x1:xr, y1:0, x2:xr, y2:VH }, gDim);
  el('line', { x1:xr-tick, y1:0, x2:xr+tick, y2:0 }, gDim);
  el('line', { x1:xr-tick, y1:VH, x2:xr+tick, y2:VH }, gDim);
  el('line', { x1:-off*1.2, y1:VH*0.5, x2:VW+off*0.6, y2:VH*0.5, 'stroke-dasharray':(6/scale)+' '+(6/scale) }, gDim);
  el('path', { d:'M '+(VW*0.16)+' '+(VH*0.05)+' A '+(VW*0.10)+' '+(VW*0.10)+' 0 0 0 '+(VW*0.06)+' '+(VH*0.33), 'stroke-dasharray':(4/scale)+' '+(5/scale) }, gDim);
  var lbl = function(x, y, t, anchor){ var e = el('text', { x:x, y:y, 'text-anchor':anchor||'middle' }, gLbl); e.textContent = t; return e; };
  if(!compact) lbl(px(VW/2), py(yb)+16, VW+' × '+VH);
  var cap = lbl(px(xr)-6, py(VH/2), String(VH));
  cap.setAttribute('transform', 'rotate(-90 '+(px(xr)-6)+' '+py(VH/2)+')');
  if(!compact){
    lbl(px(0), py(-off*0.55), '01 — FRITZ · PLAN', 'start');
    lbl(px(VW), py(-off*0.55), 'GENÈVE · 1:1', 'end');
  }
  lbl(px(VW*0.03), py(VH*0.02), 'R '+Math.round(VW*0.10), 'end');
}

/* draw-in — every line and the outline are drawn like a plotter */
var outlineLen = 0, dimEls = [], lblEls = [];
function prep(){
  outlineLen = outline.getTotalLength();
  outline.style.strokeDasharray = outlineLen+' '+outlineLen;
  outline.style.strokeDashoffset = outlineLen;
  dimEls = Array.prototype.slice.call(gDim.querySelectorAll('line,path'));
  dimEls.forEach(function(l){ var len = l.getTotalLength(); l._len = len;
    var dash = l.getAttribute('stroke-dasharray');
    l.style.strokeDasharray = dash ? dash : (len+' '+len);
    l.style.strokeDashoffset = len; });
  lblEls = Array.prototype.slice.call(gLbl.querySelectorAll('text'));
  lblEls.forEach(function(t){ t.style.opacity = 0; });
}

/* springs — Apple's vocabulary: response in seconds, damping ratio */
function spring(x, v, target, dt, response, damping){
  var w = 2*Math.PI/response, k = w*w, c = 2*damping*w;
  v += (-k*(x-target) - c*v)*dt; x += v*dt; return [x, v];
}
var fill = 0, fillV = 0, fillTarget = 0;                       /* 0 plan … 1 object */
var cx = -1e4, cy = -1e4, sx = -1e4, sy = -1e4, svx = 0, svy = 0, hasPointer = false;
var veil = 0, running = true, started = false, t0 = null;

/* pointer AND touch — the finger is a pointer. Bound on the hero, not the wrap: .hero-inner
   sits above with pointer-events:none, so events arrive here while the CTA and links keep
   their own. Touch: the crosshair snaps to the finger, follows it with the spring, and holds
   for a beat after lift; a tap pulses the fill, a hold fills it. */
var hero = document.querySelector('.hero') || wrap;
var isCoarse = window.matchMedia('(pointer: coarse)').matches;
var lastTouchT = 0, holdT = 0, pulseUntil = 0, isCtl = function(e){ return e.target && e.target.closest && e.target.closest('a,button,input,label'); };
function toLocal(e){ var r = wrap.getBoundingClientRect(); cx = e.clientX-r.left; cy = e.clientY-r.top; }
hero.addEventListener('pointermove', function(e){ if(isCtl(e)) return; toLocal(e); hasPointer = true; if(e.pointerType!=='mouse'){ lastTouchT = performance.now(); touring = false; } }, { passive:true });
hero.addEventListener('pointerleave', function(e){ if(e.pointerType==='mouse') hasPointer = false; });
hero.addEventListener('pointerdown', function(e){
  if(isCtl(e)) return;                       /* a press on a control is a click, not a fill */
  toLocal(e); hasPointer = true; touring = false;
  if(e.pointerType!=='mouse'){ lastTouchT = performance.now(); if(sx<-1e3){ sx=cx; sy=cy; } }
  holdT = performance.now(); fillTarget = 1;
}, { passive:true });
function release(e){
  if(!fillTarget) return;
  fillTarget = 0;
  /* a short tap: give it a fill PULSE so a plain tap is rewarded, not ignored */
  if(performance.now()-holdT < 220){ pulseUntil = performance.now()+260; }
  if(e && e.pointerType!=='mouse'){ lastTouchT = performance.now(); }
}
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);

/* the ambient tour — before anyone touches it, the crosshair inspects the sheet on its own:
   it visits the drawing's own dimension points, dwelling on each, so the instrument reads as
   alive on first paint. Any pointer input takes over. Never runs under reduced motion. */
var touring = !reduced, tourI = 0, tourT = 0, tourPts = [];
function tourPoints(){
  return [ [0.06,0.05], [0.53,0.15], [1.0,0.5], [0.83,0.82], [0.30,0.5], [0.0,0.98] ];   /* in drawing fractions */
}

/* pause when off-screen or hidden — the readout and the loop have nothing to do */
if('IntersectionObserver' in window){
  new IntersectionObserver(function(es){ running = es[0].isIntersecting; }, { threshold:0 }).observe(wrap);
}
document.addEventListener('visibilitychange', function(){ running = !document.hidden; last = performance.now(); });

var last = performance.now();
function ease(t, a, b){ var u = Math.min(Math.max((t-a)/(b-a), 0), 1); return 1 - Math.pow(1-u, 3); }
function frame(now){
  requestAnimationFrame(frame);
  if(!running){ last = now; return; }
  var dt = Math.min((now-last)/1000, 0.05); last = now;
  if(reduced) dt = 0;
  var t = started ? (now-t0)/1000 : 0;

  /* choreography: construction lines 0–0.9s, outline 0.4–1.9s, labels 1.4–2.0s.
     Reduced motion: the finished drawing, no draw-in. */
  var dimP = reduced?1:ease(t,0,0.9), outP = reduced?1:ease(t,0.4,1.9), lblP = reduced?1:ease(t,1.4,2.0);
  for(var i=0;i<dimEls.length;i++){ dimEls[i].style.strokeDashoffset = dimEls[i]._len*(1-dimP); }
  outline.style.strokeDashoffset = outlineLen*(1-outP);
  for(var j=0;j<lblEls.length;j++){ lblEls[j].style.opacity = lblP*0.9; }

  /* press-and-hold: plan → object. .82 damping on the way in — a press carried force, so it
     lands with a hair of life; 1.0 on release, it just settles back to a plan. */
  if(dt>0){ var r = spring(fill, fillV, fillTarget, dt, fillTarget?0.34:0.42, fillTarget?0.82:1.0); fill = r[0]; fillV = r[1]; }
  else fill = fillTarget;
  var f = Math.max(0, Math.min(1, fill));
  outline.setAttribute('fill-opacity', f);
  outline.setAttribute('stroke-opacity', 1-f*0.7);
  gDim.setAttribute('opacity', 1-f*0.85);
  gLbl.setAttribute('opacity', 1-f*0.85);

  /* tap pulse rides on top of the fill spring */
  var pulse = pulseUntil>now ? (pulseUntil-now)/260 : 0;
  if(pulse>0){ f = Math.max(f, Math.sin(pulse*Math.PI)*0.55); outline.setAttribute('fill-opacity', f); outline.setAttribute('stroke-opacity', 1-f*0.7); }

  /* the crosshair — an instrument. Desktop: follows the mouse. Touch: follows the finger,
     holds ~1.6s after lift, then fades. Idle: the ambient tour, until the first touch. */
  var touchAlive = isCoarse && (now-lastTouchT) < 1600;
  var show = false;
  if(touring && lblP>0.98){
    tourT += dt;
    if(tourT > 2.4){ tourT = 0; tourI = (tourI+1) % tourPoints().length; }
    var tp = tourPoints()[tourI];
    cx = ox + tp[0]*VW*scale; cy = oy + tp[1]*VH*scale;
    if(sx<-1e3){ sx=cx; sy=cy; }
    show = true;
  } else if(hasPointer && (!isCoarse || touchAlive || fillTarget)){
    show = true;
  }
  if(show){
    if(sx<-1e3){ sx = cx; sy = cy; }
    /* the tour moves slower than a hand: a longer response, so it glides between points */
    var resp = touring ? 0.9 : 0.26;
    if(dt>0){ var a = spring(sx,svx,cx,dt,resp,0.9); sx=a[0]; svx=a[1]; var b = spring(sy,svy,cy,dt,resp,0.9); sy=b[0]; svy=b[1]; }
    else { sx = cx; sy = cy; }
    var W = wrap.clientWidth, H = wrap.clientHeight;
    chX.setAttribute('x1',0); chX.setAttribute('x2',W); chX.setAttribute('y1',sy); chX.setAttribute('y2',sy);
    chY.setAttribute('y1',0); chY.setAttribute('y2',H); chY.setAttribute('x1',sx); chY.setAttribute('x2',sx);
    chDot.setAttribute('cx',sx); chDot.setAttribute('cy',sy);
    chLbl.textContent = 'X '+Math.round((sx-ox)/scale)+'  Y '+Math.round((sy-oy)/scale);
    /* keep the readout on-screen: flip it left of the crosshair near the right edge */
    var flip = sx > W-96;
    chLbl.setAttribute('x', flip ? sx-10 : sx+10); chLbl.setAttribute('y', sy-8);
    chLbl.setAttribute('text-anchor', flip ? 'end' : 'start');
    var fadeOut = (isCoarse && !touring && !fillTarget) ? Math.min(1, (1600-(now-lastTouchT))/500) : 1;
    var co = (touring?0.42:0.55)*lblP*(1-veil)*Math.max(0,fadeOut);
    gCross.setAttribute('opacity', co); gRead.setAttribute('opacity', Math.min(1, co*1.7));
  } else { gCross.setAttribute('opacity', 0); gRead.setAttribute('opacity', 0); }

  /* the scroll veil from mulle.js: the drawing fades as the hero leaves */
  svg.style.opacity = 1 - veil;
}

layout(); prep();
var rT = null;
window.addEventListener('resize', function(){ clearTimeout(rT); rT = setTimeout(function(){ layout(); prep(); }, 120); });
requestAnimationFrame(frame);

/* the API mulle.js already talks to */
window.MulleFluid = {
  ok: true,
  intro: function(){ if(!started){ started = true; t0 = performance.now(); } },
  setVeil: function(v){ veil = Math.max(0, Math.min(1, v)); },
  coverage: function(){ return fill; },       /* the readout pill: 0% plan → 100% object */
  splash: function(){}                        /* mobile scroll nudge — nothing to nudge here */
};
/* if mulle.js never calls intro (preloader path differs), start on our own after a beat */
setTimeout(function(){ if(!started){ started = true; t0 = performance.now(); } }, 900);
})();
