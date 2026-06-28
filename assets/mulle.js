/* ──────────────────────────────────────────────────────────────────
   FRITZ — choreography
   Lenis smooth scroll + GSAP ScrollTrigger / SplitText
   ────────────────────────────────────────────────────────────────── */
(function(){
'use strict';

var reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
var hasHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
var hasGSAP = typeof gsap !== 'undefined';

/* console note for the curious (judges open dev tools to inspect the fluid) */
try{
  console.log('%cFRITZ','font:600 28px monospace;color:#1D1D1F;');
  console.log('%cCurious is good. The surface is real WebGL.\nWork with us → contact.html','font:12px monospace;color:#0071E3;');
}catch(e){}

/* tab-blur title swap */
(function(){
  var real = document.title;
  document.addEventListener('visibilitychange', function(){
    document.title = document.hidden ? 'The ink settles — Fritz' : real;
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

/* ── carousel: swap brand names for real logos when present (monochrome, text fallback) ── */
(function(){
  var items = Array.prototype.slice.call(document.querySelectorAll('.mq-item'));
  if(!items.length) return;
  function slug(s){
    return s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()
            .replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  }
  items.forEach(function(it){
    var name = it.textContent.trim();
    var base = 'assets/logos/' + slug(name);
    var exts = ['svg','png','webp'], i = 0;
    (function tryNext(){
      if(i >= exts.length) return;                 // none found → keep the text name
      var url = base + '.' + exts[i++];
      var probe = new Image();
      probe.onload = function(){
        it.textContent = '';
        var logo = new Image();
        logo.className = 'mq-logo'; logo.src = url; logo.alt = name; logo.loading = 'lazy';
        it.appendChild(logo);
        it.classList.add('has-logo');
        try{ window.dispatchEvent(new Event('resize')); }catch(e){}
      };
      probe.onerror = tryNext;
      probe.src = url;
    })();
  });
})();

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
  var x = 0, base = 40, speed = base, skew = 0, hover = false, handed = false, last = performance.now();
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
    var target = (hover ? 8 : base) + v * 9;
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

/* ── method film: liquid-mercury Coalesce — materialises on entry, plays only in view ── */
(function(){
  var film = document.querySelector('.mfilm');
  var v = film && film.querySelector('.mfilm-v'); if(!v) return;
  var reduce = false; try{ reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
  var revealed = false;
  function reveal(){
    if(revealed) return; revealed = true;
    if(!reduce && typeof gsap !== 'undefined'){
      gsap.fromTo(film, { autoAlpha:0, scale:.94, filter:'blur(8px)' },
        { autoAlpha:1, scale:1, filter:'blur(0px)', duration:1.5, ease:'power2.out' });
    }
  }
  function go(on){ if(reduce) return; if(on){ var p=v.play(); if(p&&p.catch) p.catch(function(){}); } else { v.pause(); } }
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting) reveal(); go(e.isIntersecting); }); }, { threshold:0.1 }).observe(film);
  } else { reveal(); go(true); }
})();

/* ── manifesto: auto-playing kinetic word-build (masked), cycles through the tenets ── */
(function(){
  var man = document.querySelector('.manifesto');
  if(!man || typeof gsap === 'undefined') return;
  var mlines = gsap.utils.toArray(man.querySelectorAll('.mline'));
  if(!mlines.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  function init(){
    var groups = mlines.map(function(l){
      if(typeof SplitText !== 'undefined'){
        try { return new SplitText(l, { type:'lines,words', mask:'lines' }).words; } catch(e){}
      }
      return [l];
    });
    gsap.set(mlines, { opacity:0 });
    groups.forEach(function(w){ gsap.set(w, { yPercent:120 }); });
    if(reduce){
      gsap.set(mlines[0], { opacity:1 });
      gsap.set(groups[0], { yPercent:0 });
      return;
    }
    var SL = 4.8;
    var tl = gsap.timeline({ repeat:-1, paused:true });
    mlines.forEach(function(l, i){
      var t = i * SL, w = groups[i];
      tl.set(l, { opacity:1, filter:'blur(0px)' }, t);
      tl.fromTo(w, { yPercent:120 }, { yPercent:0, duration:.95, ease:'power4.out', stagger:0.055 }, t);
      tl.to(l, { opacity:0, filter:'blur(10px)', duration:.6, ease:'power2.in' }, t + SL - 0.6);
    });
    var started = false;
    function play(){ if(!started){ started = true; gsap.delayedCall(0.35, function(){ tl.play(); }); } else { tl.play(); } }
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ es.forEach(function(e){
        if(e.isIntersecting){ play(); } else { tl.pause(); }
      }); }, { threshold:0.2 }).observe(man);
    } else { play(); }
  }
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(init); } else { init(); }
})();

/* ── marketing: kinetic keynote — hook intro, then steps rise through in turn ── */
(function(){
  var kn = document.querySelector('.keynote');
  if(!kn || typeof gsap === 'undefined') return;
  var slides = gsap.utils.toArray(kn.querySelectorAll('.kn-slide'));
  var ticks  = gsap.utils.toArray(kn.querySelectorAll('.kn-tick'));
  if(!slides.length) return;
  var SEL = '.kn-num,.kn-word,.kn-line,.kn-hook';
  var DIM = 'rgba(29,29,31,.18)', ON = '#0071E3';
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){
    gsap.set(kn.querySelectorAll(SEL), { yPercent:0 });
    slides.forEach(function(s){ s.style.position='relative'; s.style.marginBottom='26px'; });
    var st = kn.querySelector('.kn-stage'); if(st){ st.style.height='auto'; }
    gsap.set(ticks, { backgroundColor:ON });
    return;
  }
  slides.forEach(function(s){ gsap.set(s.querySelectorAll(SEL), { yPercent:110 }); });
  gsap.set(ticks, { backgroundColor:DIM });
  var prog = kn.querySelector('.kn-progress');
  if(prog){ gsap.set(prog, { opacity:0 }); }
  var SL = 4.2;
  var tl = gsap.timeline({ repeat:-1, paused:true });
  slides.forEach(function(s, i){
    var parts = s.querySelectorAll(SEL);
    var t = i * SL;
    tl.fromTo(parts, { yPercent:110 }, { yPercent:0, duration:.82, ease:'power3.out', stagger:.07 }, t);
    tl.to(parts, { yPercent:-110, duration:.62, ease:'power3.in', stagger:.05 }, t + SL - 0.7);
    var ti = i - 1; /* intro lights no tick; steps map to ticks 0..3 */
    if(ti >= 0 && ticks[ti]){
      tl.to(ticks[ti], { backgroundColor:ON, duration:.3 }, t)
        .to(ticks[ti], { backgroundColor:DIM, duration:.35 }, t + SL - 0.35);
    }
  });
  if(prog){
    tl.to(prog, { opacity:1, duration:.5, ease:'power2.out' }, SL - 0.3);
    tl.to(prog, { opacity:0, duration:.4, ease:'power2.in' }, slides.length * SL - 0.6);
  }
  var started = false;
  function startPlay(){
    if(!started){ started = true; gsap.delayedCall(0.5, function(){ tl.play(); }); }
    else { tl.play(); }
  }
  if(typeof ScrollTrigger !== 'undefined'){
    ScrollTrigger.create({ trigger:kn, start:'top 82%', end:'bottom 18%',
      onEnter:startPlay,  onEnterBack:startPlay,
      onLeave:function(){ tl.pause(); }, onLeaveBack:function(){ tl.pause(); } });
  } else { startPlay(); }
})();

/* ── work: rows rise in on scroll ── */
gsap.utils.toArray('.wk-row').forEach(function(t){
  gsap.from(t, { y:42, opacity:0, duration:.9, ease:'power3.out',
    scrollTrigger:{ trigger:t, start:'top 88%' } });
});

/* ── work: inject real media only when the asset exists (no broken icons) ── */
document.querySelectorAll('.wk-canvas[data-img]').forEach(function(c){
  var src = c.getAttribute('data-img'); if(!src) return;
  var im = new Image();
  im.onload = function(){
    im.className = 'wk-img'; im.alt = c.getAttribute('data-alt') || ''; im.loading = 'lazy';
    c.appendChild(im);
  };
  im.src = src;
});
document.querySelectorAll('.wk-canvas[data-video]').forEach(function(c){
  var src = c.getAttribute('data-video'); if(!src || !window.fetch) return;
  fetch(src, { method:'HEAD' }).then(function(r){
    if(!r.ok) return;
    var v = document.createElement('video');
    v.className = 'wk-vid'; v.muted = true; v.loop = true; v.autoplay = true;
    v.playsInline = true; v.setAttribute('playsinline',''); v.preload = 'metadata';
    var p = c.getAttribute('data-poster'); if(p){ v.poster = p; }
    v.src = src;
    v.addEventListener('playing', function(){ c.classList.add('is-playing'); });
    c.appendChild(v);
    var pr = v.play(); if(pr && pr.catch){ pr.catch(function(){}); }
  }).catch(function(){});
});


/* ── work: cinematic Method — ghost numerals cross-fade, auto-plays ── */
(function(){
  var mth = document.querySelector('.mth');
  if(!mth || typeof gsap === 'undefined') return;
  var slides = gsap.utils.toArray(mth.querySelectorAll('.mth-slide'));
  var ticks  = gsap.utils.toArray(mth.querySelectorAll('.mth-progress span'));
  var prog   = mth.querySelector('.mth-progress');
  if(!slides.length) return;
  var DIM = 'rgba(29,29,31,.16)', ON = '#0071E3';
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){
    slides.forEach(function(s){ s.style.position='relative'; s.style.opacity='1'; s.style.marginBottom='30px'; });
    var st = mth.querySelector('.mth-stage'); if(st){ st.style.height='auto'; }
    gsap.set(ticks, { backgroundColor:ON });
    return;
  }
  gsap.set(slides, { opacity:0 });
  if(prog){ gsap.set(prog, { opacity:0 }); }
  gsap.set(ticks, { backgroundColor:DIM });
  var SL = 4.0;
  var tl = gsap.timeline({ repeat:-1, paused:true });
  slides.forEach(function(s, i){
    var t = i * SL;
    var fg = s.querySelector('.mth-fg') || s.querySelector('.mth-hook');
    var ghost = s.querySelector('.mth-ghost');
    tl.fromTo(s, { opacity:0 }, { opacity:1, duration:.7, ease:'power2.out' }, t);
    if(fg){ tl.fromTo(fg, { y:24, scale:.98 }, { y:0, scale:1, duration:.85, ease:'power3.out' }, t); }
    if(ghost){ tl.fromTo(ghost, { opacity:0, scale:1.1 }, { opacity:1, scale:1, duration:.95, ease:'power3.out' }, t); }
    tl.to(s, { opacity:0, duration:.55, ease:'power2.in' }, t + SL - 0.55);
    var ti = i - 1; /* intro lights no tick; readings map to ticks 0..2 */
    if(ti >= 0 && ticks[ti]){
      tl.to(ticks[ti], { backgroundColor:ON, duration:.3 }, t)
        .to(ticks[ti], { backgroundColor:DIM, duration:.35 }, t + SL - 0.35);
    }
  });
  if(prog){
    tl.to(prog, { opacity:1, duration:.5, ease:'power2.out' }, SL - 0.3);
    tl.to(prog, { opacity:0, duration:.4, ease:'power2.in' }, slides.length * SL - 0.6);
  }
  var started = false;
  function play(){ if(!started){ started = true; gsap.delayedCall(0.5, function(){ tl.play(); }); } else { tl.play(); } }
  if(typeof ScrollTrigger !== 'undefined'){
    ScrollTrigger.create({ trigger:mth, start:'top 80%', end:'bottom 20%',
      onEnter:play, onEnterBack:play, onLeave:function(){ tl.pause(); }, onLeaveBack:function(){ tl.pause(); } });
    if(mth.getBoundingClientRect().top < window.innerHeight * 0.85){ play(); }
  } else { play(); }
})();

/* ── hide the fixed bottom chrome over the footer (no overlap) ── */
(function(){
  var foot = document.querySelector('.site-foot');
  if(!foot || typeof ScrollTrigger === 'undefined') return;
  var chrome = gsap.utils.toArray('.readout, .chaprail, .hint');
  if(!chrome.length) return;
  ScrollTrigger.create({
    trigger: foot, start: 'top 92%',
    onEnter: function(){
      gsap.to(chrome, { opacity:0, duration:.35, ease:'power2.out', overwrite:true });
      chrome.forEach(function(el){ el.style.pointerEvents = 'none'; });
    },
    onLeaveBack: function(){
      chrome.forEach(function(el){ el.style.pointerEvents = ''; });
      gsap.to(chrome, { opacity:1, duration:.35, ease:'power2.out', overwrite:true });
    }
  });
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

/* ── outro: bloom swells; headline builds and "noise" resolves out of noise ── */
if(document.querySelector('.outro')){
  gsap.fromTo('.outro .bloom',
    { opacity:.3 },
    { opacity:.8, ease:'none',
      scrollTrigger:{ trigger:'.outro', start:'top 80%', end:'bottom bottom', scrub:.5 } });
  gsap.from(['.outro .eyebrow', '.outro-btn', '.outro-meta'], {
    y:44, opacity:0, duration:1, stagger:.12, ease:'power3.out',
    scrollTrigger:{ trigger:'.outro', start:'top 62%' }
  });
  (function(){
    var cta = document.querySelector('.outro-cta');
    var lns = gsap.utils.toArray('.outro-cta .ln');
    var flareEl = document.querySelector('.o-flare');
    var disp = document.querySelector('#noiseResolve feDisplacementMap');
    var turb = document.querySelector('#noiseResolve feTurbulence');
    if(!cta || !lns.length) return;
    var reduce = false; try{ reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
    var canTurb = !reduce && !!disp && !!turb;

    function flare(at){
      if(!flareEl) return;
      gsap.killTweensOf(flareEl);
      gsap.fromTo(flareEl, { opacity:0, scale:.42 },
        { opacity:1, scale:1.2, duration:.55, delay:at||0, ease:'power3.out',
          onComplete:function(){ gsap.to(flareEl, { opacity:0, scale:1.6, duration:1.2, ease:'power2.in' }); } });
    }

    // the words materialise OUT OF heavy static and crystallise into a clean signal — slow + cinematic
    function crystallise(){
      if(!canTurb){ flare(1.2); window.__outroReady = true; return; }
      cta.style.filter = 'url(#noiseResolve)';
      gsap.killTweensOf([disp, turb]);
      gsap.fromTo(turb, { attr:{ baseFrequency:0.6 } },
        { attr:{ baseFrequency:0.012 }, duration:2.6, ease:'power2.out' });    // static → liquid
      gsap.fromTo(disp, { attr:{ scale:64 } },
        { attr:{ scale:0 }, duration:3.1, ease:'power2.out',
          onComplete:function(){ cta.style.filter=''; window.__outroReady = true; } });
      flare(1.7);   // light locks in as the signal resolves
    }

    gsap.set(lns, { opacity:0, yPercent:18 });
    ScrollTrigger.create({ trigger:cta, start:'top 82%', once:true, onEnter:function(){
      gsap.to(lns, { opacity:1, yPercent:0, duration:1.6, ease:'power3.out', stagger:.13 });
      gsap.delayedCall(0.1, crystallise);
    }});

    // ── play with the sentence: cursor SPEED stirs it into noise (fast = grainier),
    //    it calms toward clarity when you slow/hold still, and resolves when you leave ──
    if(hasHover && canTurb){
      var hovering=false, running=false, drive=0;
      var curS=0, curBF=0.012, lastX=0, lastY=0, lastT=0;
      var MAXS=24, MAXBF=0.2;
      function loop(){
        drive *= 0.90;                                   // stir energy fades as you slow/stop
        var idle = hovering ? 1.6 : 0;                   // a faint life while resting on it
        var tS  = Math.min(idle + drive, MAXS);
        var tBF = 0.012 + Math.min(drive / MAXS, 1) * (MAXBF - 0.012);   // faster → grainier
        curS  += (tS  - curS ) * 0.18;
        curBF += (tBF - curBF) * 0.18;
        disp.setAttribute('scale', curS.toFixed(2));
        turb.setAttribute('baseFrequency', curBF.toFixed(4));
        if(!hovering && curS < 0.04 && drive < 0.04){    // fully resolved → release the filter
          disp.setAttribute('scale','0'); turb.setAttribute('baseFrequency','0.012');
          cta.style.filter=''; gsap.ticker.remove(loop); running=false;
        }
      }
      function run(){ if(!running){ running=true; gsap.ticker.add(loop); } }
      cta.addEventListener('pointerenter', function(e){
        if(!window.__outroReady) return;
        gsap.killTweensOf([disp, turb]);
        hovering=true; cta.style.filter='url(#noiseResolve)';
        lastX=e.clientX; lastY=e.clientY; lastT=performance.now();
        drive = Math.max(drive, 15);                     // a pulse on entry
        flare(.15); run();
      });
      cta.addEventListener('pointermove', function(e){
        if(!hovering) return;
        var now=performance.now(), dt=Math.max(now-lastT, 8);
        var dx=e.clientX-lastX, dy=e.clientY-lastY;
        var speed=Math.sqrt(dx*dx+dy*dy)/dt;             // px per ms
        drive = Math.min(drive + speed*11, MAXS);        // accumulate stir energy
        lastX=e.clientX; lastY=e.clientY; lastT=now; run();
      }, { passive:true });
      cta.addEventListener('pointerleave', function(){ hovering=false; run(); });
    }
  })();
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

/* ── about · process: self-playing timeline — focus auto-advances through the steps once in view ── */
(function(){
  var steps = document.querySelector('.steps');
  if(!steps || typeof gsap === 'undefined') return;
  var els = gsap.utils.toArray('.steps .step');
  if(!els.length) return;
  var n = els.length;
  var dotsWrap = document.createElement('div'); dotsWrap.className = 'steps-dots'; dotsWrap.setAttribute('aria-hidden','true');
  var dots = [], inners = [];
  for(var k=0;k<n;k++){ var d=document.createElement('span'); d.className='sdot'; var fi=document.createElement('i'); d.appendChild(fi); dotsWrap.appendChild(d); dots.push(d); inners.push(fi); }
  steps.prepend(dotsWrap);
  var reduce=false; try{ reduce = matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){}
  if(reduce){ inners.forEach(function(fi){ gsap.set(fi,{scale:1}); }); return; }
  var HOLD = 3200, idx = 0, timer = null, playing = false;
  function activate(i){
    els.forEach(function(s2,j){ s2.classList.toggle('active', j===i); });
    dots.forEach(function(d,j){ d.classList.toggle('on', j===i); });
    var s = els[i], others = els.filter(function(e){ return e !== s; });
    gsap.to(others, { opacity:.25, y:0, duration:.9, ease:'power2.out', overwrite:'auto' });
    gsap.to(s, { opacity:1, y:-4, duration:1.0, ease:'power3.out', overwrite:'auto' });
    gsap.set(inners, { scale:0 });
    gsap.fromTo(inners[i], { scale:0 }, { scale:1, duration:HOLD/1000, ease:'none' });   /* dot fills over the hold = the loader */
  }
  function tick(){ activate(idx); idx = (idx+1) % n; }
  function start(){ if(playing) return; playing = true; tick(); timer = setInterval(tick, HOLD); }
  function stop(){ playing = false; if(timer){ clearInterval(timer); timer = null; } }
  if(typeof ScrollTrigger !== 'undefined'){
    ScrollTrigger.create({ trigger:steps, start:'top 78%', end:'bottom 30%', onEnter:start, onEnterBack:start, onLeave:stop, onLeaveBack:stop });
  } else if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? start() : stop(); }); }, { threshold:0.25 }).observe(steps);
  } else { start(); }
})();

/* ── about: cinematic cascade — process steps + values perform on entry ── */
(function(){
  if(typeof gsap === 'undefined') return;
  var stepsWrap = document.querySelector('.steps');
  var valuesWrap = document.querySelector('.values');
  if(!stepsWrap && !valuesWrap) return;
  var reduce=false; try{ reduce = matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){}
  function splitOf(el, type){
    if(el && typeof SplitText !== 'undefined'){ try{ var s=new SplitText(el,{type:type,mask:'lines'}); return type.indexOf('words')>-1 ? s.words : s.lines; }catch(e){} }
    return null;
  }
  function cascade(wrap, sel, build, play){
    var els = gsap.utils.toArray(wrap.querySelectorAll(sel));
    if(!els.length || reduce) return;
    var parts = els.map(build), done=false;
    function go(){ if(done) return; done=true; els.forEach(function(el,i){ play(el, parts[i], i); }); }
    if(typeof ScrollTrigger !== 'undefined'){ ScrollTrigger.create({ trigger:wrap, start:'top 82%', once:true, onEnter:go }); }
    if('IntersectionObserver' in window){ new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting) go(); }); }, { threshold:0.15 }).observe(wrap); }
  }
  function init(){
    if(valuesWrap) cascade(valuesWrap, '.value',
      function(v){
        var words=splitOf(v.querySelector('h4'),'lines,words');
        gsap.set(v,{opacity:0,y:48}); if(words) gsap.set(words,{yPercent:120});
        return {words:words};
      },
      function(v,p,i){
        var t=i*0.16;
        gsap.to(v,{opacity:1,y:0,duration:1,ease:'power3.out',delay:t});
        if(p.words) gsap.to(p.words,{yPercent:0,duration:.9,ease:'power4.out',stagger:.04,delay:t+0.12});
      });
  }
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(init); } else { init(); }
})();

/* ── kinetic headings: word-by-word masked build (opt-in via .kine-head) ── */
(function(){
  if(typeof gsap === 'undefined' || typeof SplitText === 'undefined') return;
  var reduce=false; try{ reduce = matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){}
  function init(){
    gsap.utils.toArray('.kine-head').forEach(function(h){
      var words;
      try{ words = new SplitText(h, { type:'lines,words', mask:'lines' }).words; }catch(e){ return; }
      if(reduce) return;
      gsap.set(words, { yPercent:118, filter:'blur(8px)', opacity:0 });
      var done=false;
      function go(){ if(done) return; done=true; gsap.to(words, { yPercent:0, filter:'blur(0px)', opacity:1, duration:1.15, ease:'power3.out', stagger:.09 }); }
      if(typeof ScrollTrigger !== 'undefined'){ ScrollTrigger.create({ trigger:h, start:'top 84%', once:true, onEnter:go }); }
      if('IntersectionObserver' in window){ new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting) go(); }); }, { threshold:0.35 }).observe(h); }
      setTimeout(go, 2500);   /* safety: never leave the heading hidden */
    });
  }
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(init); } else { init(); }
})();

/* ── contact: form + aside cascade in (fields come alive on focus via CSS) ── */
(function(){
  if(typeof gsap === 'undefined') return;
  var wrap = document.querySelector('.contact-wrap');
  if(!wrap) return;
  var reduce=false; try{ reduce = matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){}
  var blocks = gsap.utils.toArray(wrap.querySelectorAll('.contact-form > .form-row, .contact-form > .field, .contact-form > .submit-row, .contact-aside .block'));
  if(!blocks.length || reduce) return;
  gsap.set(blocks, { opacity:0, y:34 });
  var done=false;
  function go(){ if(done) return; done=true; gsap.to(blocks, { opacity:1, y:0, duration:.9, ease:'power3.out', stagger:.08 }); }
  if(typeof ScrollTrigger !== 'undefined'){ ScrollTrigger.create({ trigger:wrap, start:'top 85%', once:true, onEnter:go }); }
  if('IntersectionObserver' in window){ new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting) go(); }); }, { threshold:0.08 }).observe(wrap); }
  setTimeout(go, 2000);   /* safety: never leave the form hidden */
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
