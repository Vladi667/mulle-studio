/* ──────────────────────────────────────────────────────────────────
   MULLE® — choreography
   Lenis smooth scroll + GSAP ScrollTrigger / SplitText
   ────────────────────────────────────────────────────────────────── */
(function(){
'use strict';

var reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
var hasHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
var hasGSAP = typeof gsap !== 'undefined';

/* console note for the curious (judges open dev tools to inspect the fluid) */
try{
  console.log('%cMULLE®','font:600 28px monospace;color:#1D1D1F;');
  console.log('%cCurious is good. The surface is real WebGL.\nWork with us → contact.html','font:12px monospace;color:#0071E3;');
}catch(e){}

/* tab-blur title swap */
(function(){
  var real = document.title;
  document.addEventListener('visibilitychange', function(){
    document.title = document.hidden ? 'The ink settles — Mulle®' : real;
  });
})();

if(hasGSAP){
  gsap.registerPlugin(ScrollTrigger);
  if(typeof SplitText !== 'undefined'){ gsap.registerPlugin(SplitText); }
}

/* ── smooth scroll ── */
var lenis = null;
if(!reduced && hasGSAP && typeof Lenis !== 'undefined'){
  lenis = new Lenis({ duration:0.9, smoothWheel:true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function(t){ lenis.raf(t*1000); });
  gsap.ticker.lagSmoothing(0);
}

/* ── Geneva clock ── */
var clockEl = document.getElementById('clock');
if(clockEl){
  var fmt = new Intl.DateTimeFormat('en-GB', { timeZone:'Europe/Zurich', hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit' });
  var tick = function(){ clockEl.textContent = fmt.format(new Date()); };
  tick(); setInterval(tick, 1000);
}

/* ── menu ── */
var menuBtn = document.querySelector('.index-link');
var menu = document.getElementById('menu');
var menuOpen = false;
function setMenu(open){
  menuOpen = open;
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if(!hasGSAP || reduced){
    menu.style.visibility = open ? 'visible' : 'hidden';
    menu.style.clipPath = open ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)';
    return;
  }
  if(open){
    if(lenis){ lenis.stop(); }
    gsap.set(menu, { visibility:'visible' });
    gsap.to(menu, { clipPath:'inset(0% 0% 0% 0%)', duration:.7, ease:'power4.inOut' });
    gsap.fromTo(menu.querySelectorAll('li'),
      { y:34, opacity:0 },
      { y:0, opacity:1, duration:.6, stagger:.05, delay:.25, ease:'power3.out', overwrite:true });
  }else{
    if(lenis){ lenis.start(); }
    gsap.to(menu, { clipPath:'inset(0% 0% 100% 0%)', duration:.55, ease:'power4.inOut',
      onComplete:function(){ gsap.set(menu, { visibility:'hidden' }); } });
  }
}
if(menuBtn && menu){
  menuBtn.addEventListener('click', function(){ setMenu(!menuOpen); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && menuOpen){ setMenu(false); } });
  menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
}

/* ── magnetic elements ── */
if(hasHover && !reduced && hasGSAP){
  document.querySelectorAll('[data-magnetic]').forEach(function(el){
    var qx = gsap.quickTo(el, 'x', { duration:.4, ease:'power3.out' });
    var qy = gsap.quickTo(el, 'y', { duration:.4, ease:'power3.out' });
    el.addEventListener('pointermove', function(e){
      var r = el.getBoundingClientRect();
      qx((e.clientX - r.left - r.width/2) * .25);
      qy((e.clientY - r.top - r.height/2) * .25);
    });
    el.addEventListener('pointerleave', function(){ qx(0); qy(0); });
  });
}

/* ── plate cursor tilt — gives the chrome plates material depth ── */
if(hasHover && !reduced){
  document.querySelectorAll('.plate-visual, .case-plate').forEach(function(el){
    el.addEventListener('pointermove', function(e){
      var r = el.getBoundingClientRect();
      var rx = ((e.clientY - r.top) / r.height - 0.5) * -7;
      var ry = ((e.clientX - r.left) / r.width - 0.5) * 7;
      el.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    });
    el.addEventListener('pointerleave', function(){
      el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    });
  });
}

/* ── no GSAP / reduced motion: show everything and stop ── */
var pre = document.querySelector('.pre');
if(!hasGSAP || reduced){
  if(pre){ pre.remove(); }
  return;
}

/* boot the choreography only once webfonts are ready, so SplitText
   measures real Geist Mono metrics and masked lines never mis-clip */
function boot(){

/* ── preloader → hero intro ── */
var counter = { v:0 };
var preCount = document.getElementById('preCount');
var preBar = document.querySelector('.pre-bar i');

function revealChrome(tl, at){
  tl.from(['.wordmark', '.index-link', '.readout', '.hint'].filter(function(s){ return document.querySelector(s); }),
    { opacity:0, y:-10, duration:.7, stagger:.06, ease:'power2.out' }, at);
}

/* one motion dictionary: every section heading rises out of a clip mask */
function revealHeading(el){
  if(!el) return;
  if(typeof SplitText !== 'undefined'){
    var split = new SplitText(el, { type:'lines', mask:'lines', linesClass:'split-line' });
    gsap.from(split.lines, {
      yPercent:118, opacity:0, duration:1, stagger:.1, ease:'power4.out',
      scrollTrigger:{ trigger:el, start:'top 86%' }
    });
  }else{
    gsap.from(el, { y:40, opacity:0, duration:.9, ease:'power3.out', scrollTrigger:{ trigger:el, start:'top 86%' } });
  }
}

function heroIntro(){
  var tl = gsap.timeline();
  var title = document.querySelector('.hero-title');
  var titleImg = title && title.querySelector('img');
  if(titleImg){
    /* logo mark: scale-up reveal + dissolve-grow on scroll-out */
    tl.from(title, { scale:.9, opacity:0, yPercent:6, duration:1.2, ease:'power4.out' }, 0);
    gsap.to(title, {
      scale:1.16, ease:'none',
      scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom 28%', scrub:true }
    });
  }else if(typeof SplitText !== 'undefined' && title){
    var split = new SplitText(title, { type:'chars' });
    tl.from(split.chars, { yPercent:115, opacity:0, duration:1.1, stagger:.055, ease:'power4.out' }, 0);
    /* on scroll-out the letters scatter individually */
    gsap.to(split.chars, {
      yPercent:function(){ return -50 - Math.random()*150; },
      xPercent:function(){ return (Math.random() - .5) * 70; },
      rotate:function(){ return (Math.random() - .5) * 36; },
      ease:'none', stagger:{ each:.012, from:'random' },
      scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom 28%', scrub:true }
    });
  }else if(title){
    tl.from(title, { y:60, opacity:0, duration:1, ease:'power4.out' }, 0);
  }
  tl.from('.hero-eyebrow', { y:-16, opacity:0, duration:.8, ease:'power3.out' }, .25)
    .from('.hero-lockup', { opacity:0, letterSpacing:'1em', duration:1.1, ease:'power3.out' }, .4)
    .from('.hero-sub', { y:24, opacity:0, duration:.8, ease:'power3.out' }, .55)
    .from('.hero-cta .btn', { y:24, opacity:0, duration:.7, stagger:.09, ease:'power3.out' }, .7);
  revealChrome(tl, .8);
  if(window.MulleFluid && window.MulleFluid.ok){
    tl.call(window.MulleFluid.intro, null, .15);
  }
}

function innerIntro(){
  var tl = gsap.timeline();
  var title = document.querySelector('.page-hero h1');
  tl.from('.page-hero .eyebrow', { y:-14, opacity:0, duration:.7, ease:'power3.out' }, 0);
  if(typeof SplitText !== 'undefined' && title){
    var split = new SplitText(title, { type:'lines', mask:'lines', linesClass:'split-line' });
    tl.from(split.lines, { yPercent:115, opacity:0, duration:1, stagger:.09, ease:'power4.out' }, .1);
  }else if(title){
    tl.from(title, { y:40, opacity:0, duration:.9, ease:'power4.out' }, .1);
  }
  tl.from('.page-lede', { y:22, opacity:0, duration:.8, ease:'power3.out' }, .35)
    .from('.page-meta > div', { y:18, opacity:0, duration:.7, stagger:.07, ease:'power3.out' }, .5);
  revealChrome(tl, .25);
}

function pageIntro(){
  if(document.querySelector('.hero')){ heroIntro(); }
  else { innerIntro(); }
}

/* ── ink page transitions + preloader-once ── */
var wipe = document.createElement('div');
wipe.className = 'inkwipe'; wipe.setAttribute('aria-hidden', 'true');
document.body.appendChild(wipe);

function navTransition(href){
  gsap.to(wipe, {
    yPercent:0, borderRadius:'0px', duration:.55, ease:'power3.inOut',
    onComplete:function(){ window.location.href = href; }
  });
}
window.MulleNav = navTransition;

document.addEventListener('click', function(e){
  if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  var a = e.target.closest('a');
  if(!a) return;
  var href = a.getAttribute('href');
  if(!href || href.charAt(0) === '#' || a.target === '_blank' || a.hasAttribute('download')) return;
  var url; try{ url = new URL(a.href, location.href); }catch(_){ return; }
  if(url.origin !== location.origin) return;
  e.preventDefault();
  if(url.pathname === location.pathname){ return; }   /* already here */
  navTransition(a.href);
}, true);

/* counter preloader on first visit only; quick drain on every navigation after */
var seen = false;
try{ seen = sessionStorage.getItem('mulle_seen') === '1'; }catch(_){}
if(pre && !seen){
  try{ sessionStorage.setItem('mulle_seen', '1'); }catch(_){}
  var preTl = gsap.timeline();
  preTl.to(counter, {
      v:100, duration:1.15, ease:'power2.inOut',
      onUpdate:function(){
        var v = Math.round(counter.v);
        if(preCount){ preCount.textContent = (v < 10 ? '00' : v < 100 ? '0' : '') + v; }
        if(preBar){ preBar.style.transform = 'scaleX(' + (v/100) + ')'; }
      }
    })
    .to(pre, { yPercent:-100, duration:.85, ease:'power4.inOut',
      onComplete:function(){ pre.remove(); } }, '+=.1')
    .call(pageIntro, null, '-=.55');
}else{
  if(pre){
    gsap.to(pre, { yPercent:-100, duration:.6, ease:'power3.inOut', delay:.05,
      onComplete:function(){ pre.remove(); } });
  }
  pageIntro();
}

/* ── scroll progress ── */
gsap.to('.progress i', {
  scaleX:1, ease:'none',
  scrollTrigger:{ start:0, end:'max', scrub:.3 }
});

/* ── client marquee — base drift + scroll-velocity boost, slow on hover ── */
(function(){
  var section = document.querySelector('.marquee');
  var track = document.getElementById('mqTrack');
  if(!section || !track) return;
  var groups = track.querySelectorAll('.mq-group');
  if(groups.length < 2) return;
  var half = 0;
  function measure(){ half = groups[0].getBoundingClientRect().width; }
  measure();
  window.addEventListener('load', measure);
  setTimeout(measure, 1200);                 /* re-measure after webfont reflow */
  window.addEventListener('resize', measure);
  var x = 0, base = 72, speed = base, skew = 0, hover = false, handed = false, last = performance.now();
  section.addEventListener('pointerenter', function(){ hover = true; });
  section.addEventListener('pointerleave', function(){ hover = false; });
  function loop(now){
    requestAnimationFrame(loop);
    /* hand off from the CSS fallback only once rAF is confirmed firing —
       if rAF is throttled (hidden tab), the CSS animation keeps it moving */
    if(!handed){ handed = true; section.dataset.js = '1'; last = now; return; }
    var dt = Math.min((now - last)/1000, .05); last = now;
    var signed = lenis ? (lenis.velocity || 0) : 0;
    var v = Math.abs(signed);
    var target = (hover ? 14 : base) + v * 9;
    speed += (target - speed) * Math.min(dt * 6, 1);
    x -= speed * dt;
    if(half > 0 && x <= -half){ x += half; }
    /* lean into the scroll direction — the ticker feels physical */
    var skewTarget = Math.max(-4, Math.min(4, signed * 0.32));
    skew += (skewTarget - skew) * Math.min(dt * 5, 1);
    track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0) skewX(' + skew.toFixed(2) + 'deg)';
  }
  requestAnimationFrame(loop);
})();

/* ── hero: fluid re-inks + drifts as it leaves ── */
if(document.querySelector('.hero')){
  var veilState = { v:0 };
  gsap.to(veilState, {
    v:1, ease:'none',
    scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom 25%', scrub:true },
    onUpdate:function(){
      if(window.MulleFluid && window.MulleFluid.ok){ window.MulleFluid.setVeil(veilState.v * .85); }
    }
  });
  gsap.to('.hero-inner', {
    yPercent:-14, opacity:0, ease:'none',
    scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom 35%', scrub:true }
  });
}

/* ── manifesto: pinned, lines sharpen out of blur ── */
var mlines = gsap.utils.toArray('.mline');
if(mlines.length){
  gsap.set(mlines, { opacity:0, filter:'blur(16px)', yPercent:10, scale:.97 });
  var mtl = gsap.timeline({
    scrollTrigger:{
      trigger:'.manifesto', start:'top top',
      end:'+=' + (mlines.length * 60) + '%',
      pin:true, scrub:.7, anticipatePin:1
    }
  });
  /* one line at a time, always dead-centre — each fades in, then out as the next arrives */
  mlines.forEach(function(l, i){
    mtl.fromTo(l,
      { opacity:0, filter:'blur(16px)', yPercent:10, scale:.97 },
      { opacity:1, filter:'blur(0px)', yPercent:0, scale:1, duration:1, ease:'power2.out' }, i);
    if(i < mlines.length - 1){
      mtl.to(l, { opacity:0, filter:'blur(12px)', yPercent:-10, scale:1.03, duration:1, ease:'power2.in' }, i + 1);
    }
  });
}

/* ── marketing: self-playing engine — light flows the loop, steps advance ── */
(function(){
  var eng = document.querySelector('.engine');
  if(!eng || typeof gsap === 'undefined') return;
  var flows  = gsap.utils.toArray(eng.querySelectorAll('.eng-flow, .eng-flow-soft'));
  var dots   = gsap.utils.toArray(eng.querySelectorAll('.eng-dot'));
  var labels = gsap.utils.toArray(eng.querySelectorAll('.eng-label'));
  var caps   = gsap.utils.toArray(eng.querySelectorAll('.eng-cap'));
  if(!dots.length) return;
  gsap.set(dots, { attr:{ r:6 }, fill:'#8E96A3' });
  gsap.set(labels, { opacity:.4 });
  gsap.set(caps, { opacity:0 });
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){
    gsap.set(dots, { attr:{ r:8 }, fill:'#0071E3' });
    gsap.set(labels, { opacity:1 });
    if(caps[0]){ gsap.set(caps[0], { opacity:1 }); }
    return;
  }
  var anims = [];
  if(flows.length){
    var total = flows[0].getTotalLength();
    var seg = Math.max(120, total * 0.12);
    flows.forEach(function(f){ gsap.set(f, { strokeDasharray: seg + ' ' + (total - seg), strokeDashoffset:0 }); });
    anims.push(gsap.to(flows, { strokeDashoffset: -total, duration:5, ease:'none', repeat:-1, paused:true }));
  }
  var ST = 2.4;
  var tl = gsap.timeline({ repeat:-1, paused:true });
  for(var i = 0; i < 4; i++){
    var t = i * ST;
    tl.to(dots[i], { attr:{ r:10 }, fill:'#0071E3', duration:.4, ease:'power2.out' }, t)
      .to(dots[i], { attr:{ r:6 },  fill:'#8E96A3', duration:.5, ease:'power2.in' }, t + ST - 0.5);
    tl.to(labels[i], { opacity:1,  duration:.35 }, t)
      .to(labels[i], { opacity:.4, duration:.4 }, t + ST - 0.4);
    if(caps[i]){
      tl.fromTo(caps[i], { opacity:0, y:6 }, { opacity:1, y:0, duration:.45, ease:'power2.out' }, t + 0.1)
        .to(caps[i], { opacity:0, y:-6, duration:.4, ease:'power2.in' }, t + ST - 0.4);
    }
  }
  anims.push(tl);
  function play(){ anims.forEach(function(a){ a.play(); }); }
  function pause(){ anims.forEach(function(a){ a.pause(); }); }
  if(typeof ScrollTrigger !== 'undefined'){
    ScrollTrigger.create({ trigger:eng, start:'top 82%', end:'bottom 18%',
      onEnter:play, onEnterBack:play, onLeave:pause, onLeaveBack:pause });
  } else { play(); }
})();

/* ── disciplines: rows rise in, floating preview follows cursor ── */
gsap.utils.toArray('.disc-row').forEach(function(row, i){
  gsap.from(row, {
    y:54, opacity:0, duration:.9, ease:'power3.out',
    scrollTrigger:{ trigger:row, start:'top 88%' }
  });
});
if(document.querySelector('.disc-head')){
  gsap.from('.disc-head .eyebrow', {
    y:28, opacity:0, duration:.8, ease:'power3.out',
    scrollTrigger:{ trigger:'.disc-head', start:'top 85%' }
  });
  revealHeading(document.querySelector('.disc-head h2'));
}

document.querySelectorAll('.disc-row').forEach(function(row){
  row.addEventListener('click', function(){
    if(row.dataset.href){ navTransition(row.dataset.href); }
  });
});

/* ── works: plates clip in, inner gradient parallax ── */
if(document.querySelector('.works-head')){
  gsap.from(['.works-head .eyebrow', '.works-head p'], {
    y:28, opacity:0, duration:.8, stagger:.08, ease:'power3.out',
    scrollTrigger:{ trigger:'.works-head', start:'top 85%' }
  });
  revealHeading(document.querySelector('.works-head h2'));
}
gsap.utils.toArray('.plate').forEach(function(plate, i){
  var visual = plate.querySelector('.plate-visual');
  gsap.from(plate, {
    y:70, opacity:0, duration:1, delay:i*.08, ease:'power3.out',
    scrollTrigger:{ trigger:plate, start:'top 88%' }
  });
  if(visual){
    gsap.fromTo(visual.querySelector('.pg'),
      { yPercent:-7 }, { yPercent:7, ease:'none',
      scrollTrigger:{ trigger:visual, start:'top bottom', end:'bottom top', scrub:true } });
  }
});

/* ── outro: bloom swells ── */
if(document.querySelector('.outro')){
  gsap.fromTo('.outro .bloom',
    { opacity:.3 },
    { opacity:.8, ease:'none',
      scrollTrigger:{ trigger:'.outro', start:'top 80%', end:'bottom bottom', scrub:.5 } });
  gsap.from(['.outro .eyebrow', '.outro-cta', '.outro-btn', '.outro-meta'], {
    y:44, opacity:0, duration:1, stagger:.1, ease:'power3.out',
    scrollTrigger:{ trigger:'.outro', start:'top 65%' }
  });
}


/* ── inner pages: generic reveal-up for any [data-reveal] element;
      headings auto-upgrade to the masked-line reveal ── */
gsap.utils.toArray('[data-reveal]').forEach(function(el){
  if(/^H[1-3]$/.test(el.tagName)){ revealHeading(el); return; }
  gsap.from(el, {
    y:48, opacity:0, duration:.9, ease:'power3.out',
    scrollTrigger:{ trigger:el, start:'top 88%' }
  });
});

/* ── cases accordion (our-work): open one file at a time ── */
(function(){
  var cases = gsap.utils.toArray('.case');
  if(!cases.length) return;
  cases.forEach(function(c){
    var head = c.querySelector('.case-head');
    var detail = c.querySelector('.case-detail');
    if(!head || !detail) return;
    head.setAttribute('aria-expanded', 'false');
    head.addEventListener('click', function(){
      var willOpen = !c.classList.contains('open');
      cases.forEach(function(o){
        if(o !== c && o.classList.contains('open')){
          o.classList.remove('open');
          o.querySelector('.case-head').setAttribute('aria-expanded', 'false');
          gsap.to(o.querySelector('.case-detail'), { height:0, duration:.5, ease:'power3.inOut' });
        }
      });
      c.classList.toggle('open', willOpen);
      head.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      gsap.to(detail, {
        height: willOpen ? detail.firstElementChild.offsetHeight : 0,
        duration:.55, ease:'power3.inOut',
        onComplete:function(){ if(willOpen){ detail.style.height='auto'; ScrollTrigger.refresh(); } }
      });
    });
  });
})();

/* ════════════════════════════════════════════════════════════════
   PHASE 1 — motion dictionary: hairlines · counters · rails · light
   ════════════════════════════════════════════════════════════════ */

/* hairlines draw themselves on enter */
gsap.utils.toArray('.eyebrow .hr, .mq-head .hr').forEach(function(hr){
  gsap.from(hr, {
    scaleX:0, transformOrigin:'left center', duration:.7, ease:'power3.inOut',
    scrollTrigger:{ trigger:hr, start:'top 94%' }
  });
});

/* pricing amounts count up from zero (tabular figures → no layout shift) */
gsap.utils.toArray('.pkg .amt').forEach(function(el){
  var target = parseFloat(el.textContent.replace(/[^0-9.]/g, ''));
  if(!isFinite(target)) return;
  var grouped = target >= 1000;
  el.textContent = '0';
  var o = { v:0 };
  gsap.to(o, {
    v:target, duration:1.3, ease:'power2.out',
    scrollTrigger:{ trigger:el, start:'top 92%' },
    onUpdate:function(){
      var n = Math.round(o.v);
      el.textContent = grouped ? n.toLocaleString('en-US') : String(n);
    }
  });
});

/* steps progress rail (about · process) */
(function(){
  var steps = document.querySelector('.steps');
  if(!steps) return;
  var rail = document.createElement('div'); rail.className = 'steps-rail';
  var fill = document.createElement('i'); rail.appendChild(fill); steps.prepend(rail);
  gsap.to(fill, {
    scaleX:1, ease:'none',
    scrollTrigger:{ trigger:steps, start:'top 72%', end:'bottom 72%', scrub:.5 }
  });
  gsap.utils.toArray('.steps .step').forEach(function(step){
    ScrollTrigger.create({
      trigger:step, start:'top 64%',
      onEnter:function(){ step.classList.add('lit'); },
      onLeaveBack:function(){ step.classList.remove('lit'); }
    });
  });
})();

/* footer assembles: columns rise, base draws last */
if(document.querySelector('.site-foot')){
  gsap.from('.site-foot .sf-brand, .site-foot .sf-col', {
    y:36, opacity:0, duration:.8, stagger:.08, ease:'power3.out',
    scrollTrigger:{ trigger:'.site-foot', start:'top 88%' }
  });
  gsap.from('.site-foot .sf-base', {
    opacity:0, y:14, duration:.7, ease:'power2.out',
    scrollTrigger:{ trigger:'.site-foot .sf-base', start:'top 97%' }
  });
}

/* traveling ambient light — the source descends as you scroll */
(function(){
  var amb = document.createElement('div');
  amb.className = 'ambient';
  document.body.appendChild(amb);
  gsap.fromTo(amb, { yPercent:-28 }, {
    yPercent:55, ease:'none',
    scrollTrigger:{ start:0, end:'max', scrub:.6 }
  });
})();

/* chapter rail — wayfinding readout, follows the section under the viewport
   centre. Catches pinned sections (GSAP wraps them in .pin-spacer). */
(function(){
  var secs = gsap.utils.toArray('main > section, main > .pin-spacer > section');
  if(secs.length < 2) return;
  function labelFor(s, i){
    var d = s.getAttribute('data-chapter');
    if(d) return d;
    var e = s.querySelector('.eyebrow span:not(.hr), .hero-eyebrow span:not(.hr)');
    var t = e ? e.textContent.replace(/^\s*\d+\s*[—–-]\s*/, '').trim() : '';
    return t || ('Section ' + (i + 1));
  }
  var labels = secs.map(labelFor);
  function pad(n){ return String(n).padStart(2, '0'); }
  var rail = document.createElement('aside');
  rail.className = 'chaprail glass';
  rail.setAttribute('aria-hidden', 'true');
  rail.innerHTML = '<span class="cr-n">01</span><span class="cr-l"></span><span class="cr-t">/ ' + pad(secs.length) + '</span>';
  document.body.appendChild(rail);
  var nEl = rail.querySelector('.cr-n'), lEl = rail.querySelector('.cr-l'), current = -1;
  function update(){
    var mid = window.innerHeight * 0.45, idx = 0;
    for(var i = 0; i < secs.length; i++){
      if(secs[i].getBoundingClientRect().top <= mid){ idx = i; }
    }
    if(idx !== current){ current = idx; nEl.textContent = pad(idx + 1); lEl.textContent = labels[idx]; if(typeof decode === 'function'){ decode(lEl, 300); } }
  }
  ScrollTrigger.create({ start:0, end:'max', onUpdate:update, onRefresh:update });
  update();
  requestAnimationFrame(function(){ rail.classList.add('ready'); });
})();

/* ════════════════════════════════════════════════════════════════
   PHASE 3 — connective tissue: decode · coverage · ink · mobile
   ════════════════════════════════════════════════════════════════ */

/* decode/scramble settle — operates on an element's first text node so
   nested spans (.sub, .arr) survive */
var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%/=+*<>';
function firstText(el){
  if(!el) return null;
  for(var i = 0; i < el.childNodes.length; i++){
    var n = el.childNodes[i];
    if(n.nodeType === 3 && n.nodeValue.replace(/\s/g, '').length){ return n; }
  }
  return null;
}
function decode(el, dur){
  var node = firstText(el);
  if(!node || node.__busy) return;
  var finalText = node.nodeValue, len = finalText.length, start = performance.now();
  node.__busy = true; dur = dur || 420;
  function tick(now){
    var p = Math.min((now - start) / dur, 1), reveal = Math.floor(p * len), out = '';
    for(var i = 0; i < len; i++){
      var ch = finalText.charAt(i);
      out += (ch === ' ' || ch === ' ') ? ch : (i < reveal ? ch : GLYPHS.charAt((Math.random() * GLYPHS.length) | 0));
    }
    node.nodeValue = out;
    if(p < 1){ requestAnimationFrame(tick); } else { node.nodeValue = finalText; node.__busy = false; }
  }
  requestAnimationFrame(tick);
}
window.MulleDecode = decode;

document.querySelectorAll('.menu .lbl, .sf-col a').forEach(function(el){
  el.addEventListener('pointerenter', function(){ decode(el, 360); });
});
document.querySelectorAll('.xlink').forEach(function(el){
  el.addEventListener('pointerenter', function(){ decode(el.querySelector('span'), 360); });
});

/* live sim coverage in the readout pill */
if(window.MulleFluid && window.MulleFluid.ok && window.MulleFluid.coverage){
  var ro = document.querySelector('.readout');
  if(ro){
    var cov = document.createElement('span');
    cov.className = 'cov';
    cov.innerHTML = '<span class="d" aria-hidden="true"></span><span>Surface</span><b class="cov-v">100%</b>';
    ro.appendChild(cov);
    var cvEl = cov.querySelector('.cov-v');
    setInterval(function(){
      var c = window.MulleFluid.coverage();
      if(c != null){ cvEl.textContent = Math.round(c * 100) + '%'; }
    }, 900);
  }
}

/* outro bloom — the blue light breathes with cursor proximity to centre:
   bigger toward the middle, smaller toward the edges. Minimal, opacity untouched. */
(function(){
  var outro = document.querySelector('.outro');
  var bloom = document.querySelector('.outro .bloom');
  if(!outro || !bloom || !hasHover) return;
  gsap.set(bloom, { xPercent:-50, x:0, y:0 });
  var bX = gsap.quickTo(bloom, 'x', { duration:.6, ease:'power3.out' });
  var bY = gsap.quickTo(bloom, 'y', { duration:.6, ease:'power3.out' });
  var bScale = gsap.quickTo(bloom, 'scale', { duration:.5, ease:'power2.out' });
  outro.addEventListener('pointermove', function(e){
    var r = outro.getBoundingClientRect();
    var nx = (e.clientX - (r.left + r.width/2)) / (r.width/2);
    var ny = (e.clientY - (r.top + r.height/2)) / (r.height/2);
    var dist = Math.min(Math.sqrt(nx*nx + ny*ny), 1);   /* 0 centre · 1 edge */
    bScale(0.85 + (1 - dist) * 0.9);                     /* edge 0.85 → centre 1.75 */
    bX(nx * r.width * 0.11);                             /* the light drifts toward the cursor */
    bY(ny * r.height * 0.11);
  }, { passive:true });
  outro.addEventListener('pointerleave', function(){ bScale(1.0); bX(0); bY(0); }, { passive:true });
})();

/* mobile: scroll velocity disturbs the mercury so the first swipe reveals it */
if(!hasHover){
  var lastSY = window.scrollY || 0;
  window.addEventListener('scroll', function(){
    if(!(window.MulleFluid && window.MulleFluid.ok)) return;
    var hero = document.querySelector('.hero');
    if(!hero){ return; }
    var r = hero.getBoundingClientRect();
    if(r.bottom < 0 || r.top > window.innerHeight){ lastSY = window.scrollY || 0; return; }
    var dy = (window.scrollY || 0) - lastSY; lastSY = window.scrollY || 0;
    if(Math.abs(dy) < 3) return;
    window.MulleFluid.splash(0.18 + Math.random()*0.64, 0.3 + Math.random()*0.45);
  }, { passive:true });
}

}
if(document.fonts && document.fonts.ready){ document.fonts.ready.then(boot); } else { boot(); }

})();
