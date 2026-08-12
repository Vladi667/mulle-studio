/* ──────────────────────────────────────────────────────────────────
   FRITZ — choreography
   Lenis smooth scroll + GSAP ScrollTrigger / SplitText
   ────────────────────────────────────────────────────────────────── */
(function(){
'use strict';

var reducedMQ = window.matchMedia('(prefers-reduced-motion:reduce)');
var reduced = reducedMQ.matches;
/* the OS setting can be toggled while the page is open — the choreography that has
   already run stays put, but everything gated on `reduced` after this respects it */
try{ reducedMQ.addEventListener('change', function(e){ reduced = e.matches; }); }
catch(e){ try{ reducedMQ.addListener(function(e){ reduced = e.matches; }); }catch(e2){} }
var hasHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
var hasGSAP = typeof gsap !== 'undefined';
function isFR(){ return (document.documentElement.lang || '').slice(0,2) === 'fr'; }   /* 'fr' or 'fr-CH' */

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
  /* expo-out tail: the page keeps drifting ~300ms after the wheel stops — the
     post-input glide that reads as film rather than website */
  lenis = new Lenis({ duration:1.1, smoothWheel:true,
    easing:function(t){ return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
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

/* ── contact: click-to-copy the email, morphs into a confirmation (works without GSAP) ── */
(function(){
  var b = document.getElementById('mailXL'); if(!b) return;
  var addr = b.getAttribute('data-copy') || b.textContent.trim();
  var busy = false;
  b.addEventListener('click', function(){
    if(busy) return;
    var fr = isFR();
    function done(){
      busy = true; b.classList.add('copied');
      b.textContent = fr ? 'Copié ✓' : 'Copied ✓';
      setTimeout(function(){ b.textContent = addr; b.classList.remove('copied'); busy = false; }, 1500);
    }
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(addr).then(done, done); }
    else {
      try{ var t = document.createElement('textarea'); t.value = addr; t.style.position='fixed'; t.style.opacity='0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }catch(e){}
      done();
    }
  });
  b.addEventListener('pointerenter', function(){ if(typeof window.MulleDecode === 'function' && !b.classList.contains('copied')) window.MulleDecode(b, 460); });
})();

/* ── contact: live studio status from Geneva time + visitor local time (works without GSAP) ── */
(function(){
  var st = document.getElementById('studioStatus'); if(!st) return;
  var txt = st.querySelector('.ss-text');
  var localEl = document.getElementById('ssLocal');
  function zParts(){
    var f = new Intl.DateTimeFormat('en-GB', { timeZone:'Europe/Zurich', hour12:false, weekday:'short', hour:'2-digit', minute:'2-digit' });
    var o = {}; f.formatToParts(new Date()).forEach(function(p){ o[p.type] = p.value; }); return o;
  }
  function upd(){
    var fr = isFR();
    var p = zParts(); var h = parseInt(p.hour, 10);
    var wk = ['Mon','Tue','Wed','Thu','Fri'].indexOf(p.weekday) > -1;
    var open = wk && h >= 9 && h < 18;
    st.classList.toggle('open', open);
    if(txt) txt.textContent = open
      ? (fr ? 'Studio ouvert — réponse aujourd’hui' : 'Studio open — reply today')
      : (fr ? 'Fermé — réponse sous 24 h' : 'Closed — reply within 24 h');
    if(localEl){
      try{
        var lt = new Intl.DateTimeFormat(fr ? 'fr-CH' : 'en-GB', { hour12:false, hour:'2-digit', minute:'2-digit' }).format(new Date());
        localEl.textContent = (fr ? 'Vous ' : 'You ') + lt + ' · ' + (fr ? 'Genève ' : 'Geneva ') + p.hour + ':' + p.minute;
      }catch(e){}
    }
  }
  upd(); setInterval(upd, 30000);
})();

/* ── M4: keynote crop marks — frame the kinetic-type stage as a printed plate ── */
(function(){
  var stage = document.querySelector('.kn-stage'); if(!stage) return;
  ['tl','tr','bl','br'].forEach(function(c){
    var s = document.createElement('span'); s.className = 'kn-crop ' + c; s.setAttribute('aria-hidden','true'); stage.appendChild(s);
  });
  var fig = document.createElement('span'); fig.className = 'kn-fig'; fig.setAttribute('aria-hidden','true'); fig.textContent = 'FIG. 01'; stage.appendChild(fig);
})();

/* ── FALLING FORWARD — every inner page ends in one giant "Next" band that pulls you
      into the next page in the ring (replaces the old three-pill crosslinks). No-JS keeps
      the original crosslinks as the fallback. ── */
(function(){
  var RING = {
    'marketing.html':  { href:'brand-web.html',  n:'02', en:'Brand & Website', fr:'Marque & Site',    ken:'Identity and interface, one piece.',  kfr:'Identité et interface, d’un seul tenant.' },
    'brand-web.html':  { href:'growth-ops.html', n:'03', en:'Growth Ops',      fr:'Growth Ops',        ken:'Systems and tracking, measured end to end.', kfr:'Systèmes et mesure, de bout en bout.' },
    'growth-ops.html': { href:'our-work.html',   n:'04', en:'Selected Work',   fr:'Travaux choisis',   ken:'See it in the world.',                 kfr:'Le travail en conditions réelles.' },
    'our-work.html':   { href:'about.html',      n:'05', en:'The Studio',      fr:'Le studio',         ken:'Who makes it, and how.',               kfr:'Qui le fait, et comment.' },
    'about.html':      { href:'contact.html',    n:'06', en:'Start a project', fr:'Démarrer un projet', ken:'Bring us the noise.',                  kfr:'Amenez-nous le bruit.' },
    'contact.html':    { href:'our-work.html',   n:'04', en:'Selected Work',   fr:'Travaux choisis',   ken:'See the work.',                        kfr:'Voir le travail.' }
  };
  var here = location.pathname.split('/').pop() || 'index.html';
  var nx = RING[here]; if(!nx) return;
  var cl = document.querySelector('.crosslinks');
  var foot = document.querySelector('.site-foot');
  if(!cl && !foot) return;
  var fr = isFR();
  var band = document.createElement('a');
  band.className = 'nextband'; band.href = nx.href; band.setAttribute('data-reveal', '');
  band.innerHTML =
    '<span class="nb-ghost" aria-hidden="true">' + nx.n + '</span>' +
    '<span class="nb-eye"><span class="nb-hr" aria-hidden="true"></span>' + (fr ? 'La suite' : 'Next') + ' — ' + nx.n + ' / 06</span>' +
    '<span class="nb-row"><span class="nb-title">' + (fr ? nx.fr : nx.en) + '</span><span class="nb-arr" aria-hidden="true">→</span></span>' +
    '<span class="nb-kick">' + (fr ? nx.kfr : nx.ken) + '</span>';
  if(cl){ cl.parentNode.insertBefore(band, cl); cl.parentNode.removeChild(cl); }
  else { foot.parentNode.insertBefore(band, foot); }
  band.addEventListener('pointerenter', function(){
    if(typeof window.MulleDecode === 'function'){ window.MulleDecode(band.querySelector('.nb-title'), 460); }
  });
})();

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
    var base = '/assets/logos/' + slug(name);   /* absolute: works from /fr/ pages too */
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

/* ── magnetic elements — nav, every CTA, links; label drifts 1.6× the pill (two-layer) ── */
if(hasHover && !reduced && hasGSAP){
  var magSel = '[data-magnetic], .btn, .xlink, .index-link, .langtog button, .contact-form button[type="submit"], .mb-send';
  var magSeen = [];
  document.querySelectorAll(magSel).forEach(function(el){
    if(magSeen.indexOf(el) > -1) return; magSeen.push(el);
    var strong = el.classList.contains('btn') || el.classList.contains('outro-cta');
    var pull = strong ? .3 : .22;
    var qx = gsap.quickTo(el, 'x', { duration:.4, ease:'power3.out' });
    var qy = gsap.quickTo(el, 'y', { duration:.4, ease:'power3.out' });
    var lab = el.querySelector('span:not(.arr):not(.plus):not(.sub):not(.ln)');
    var lx = lab ? gsap.quickTo(lab, 'x', { duration:.4, ease:'power3.out' }) : null;
    var ly = lab ? gsap.quickTo(lab, 'y', { duration:.4, ease:'power3.out' }) : null;
    el.addEventListener('pointermove', function(e){
      var r = el.getBoundingClientRect();
      var mx = e.clientX - r.left - r.width/2, my = e.clientY - r.top - r.height/2;
      qx(mx * pull); qy(my * pull);
      if(lx){ lx(mx * pull * .6); ly(my * pull * .6); }   /* label pushes further → 1.6× total */
    });
    el.addEventListener('pointerleave', function(){ qx(0); qy(0); if(lx){ lx(0); ly(0); } });
  });
}

/* ── plate cursor tilt — gives the chrome plates material depth ──
   Direct manipulation, so it tracks the pointer 1:1. Two things keep it honest:
   the rect is measured once on enter (measuring inside pointermove forces a
   synchronous layout on every event), and the write is batched into rAF so a
   burst of coalesced moves produces one style write per frame, not per event. */
if(hasHover && !reduced){
  document.querySelectorAll('.plate-visual, .case-plate').forEach(function(el){
    var r = null, raf = null, px = 0, py = 0;
    function measure(){ r = el.getBoundingClientRect(); }
    function paint(){
      raf = null;
      if(!r) return;
      var rx = ((py - r.top) / r.height - 0.5) * -7;
      var ry = ((px - r.left) / r.width - 0.5) * 7;
      el.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    }
    el.addEventListener('pointerenter', measure);
    el.addEventListener('pointermove', function(e){
      if(!r) measure();
      px = e.clientX; py = e.clientY;
      if(raf == null) raf = requestAnimationFrame(paint);
    });
    el.addEventListener('pointerleave', function(){
      if(raf != null){ cancelAnimationFrame(raf); raf = null; }
      r = null;
      el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    });
    /* a scrolled page invalidates the cached rect */
    window.addEventListener('scroll', function(){ if(r) measure(); }, { passive:true });
  });
}

/* ── disciplines: ghost-ink register ──
   Above the no-GSAP/reduced-motion return for the same reason as the FAQ:
   which name is inked is state, not decoration, so it has to resolve even
   when nothing is allowed to move. ── */
(function(){
  var stage = document.querySelector('.disc-stage'); if(!stage) return;
  var rows  = Array.prototype.slice.call(stage.querySelectorAll('.disc-row'));
  var cards = Array.prototype.slice.call(stage.querySelectorAll('.dp-card'));
  var reg   = stage.querySelector('.disc-reg');
  if(!rows.length) return;
  var cur = -1;

  function place(){
    if(!reg || cur < 0 || !rows[cur]) return;
    reg.style.height = rows[cur].offsetHeight + 'px';
    reg.style.transform = 'translateY(' + rows[cur].offsetTop + 'px)';
  }
  function setActive(i){
    if(i === cur || i < 0 || i >= rows.length) return;
    cur = i;
    for(var n = 0; n < rows.length; n++){
      rows[n].classList.toggle('is-active', n === i);
      if(cards[n]) cards[n].classList.toggle('is-on', n === i);
    }
    place();
  }

  rows.forEach(function(r, i){
    if(hasHover){ r.addEventListener('pointerenter', function(){ setActive(i); }); }
    r.addEventListener('focusin', function(){ setActive(i); });
  });

  setActive(0);
  requestAnimationFrame(place);            /* first real measurement after layout */
  window.addEventListener('resize', place);

  /* touch has no hover to drive it — the name nearest the middle of the viewport wins */
  if(!hasHover && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      for(var k = 0; k < entries.length; k++){
        if(entries[k].isIntersecting) setActive(rows.indexOf(entries[k].target));
      }
    }, { rootMargin:'-45% 0px -45% 0px', threshold:0 });
    rows.forEach(function(r){ io.observe(r); });
  }
})();

/* ── FAQ accordions ──
   Deliberately above the no-GSAP/reduced-motion return below: collapsing is a
   content-density feature, not a motion feature, so it has to work everywhere.
   The markup renders expanded; this collapses it. If this script never runs,
   every answer stays visible — which is the correct failure mode for SEO. ── */
(function(){
  var items = document.querySelectorAll('.faq-item');
  if(!items.length) return;
  Array.prototype.forEach.call(items, function(item, i){
    var btn = item.querySelector('.faq-q'), panel = item.querySelector('.faq-a');
    if(!btn || !panel) return;
    panel.id = panel.id || ('faq-a-' + (i + 1));
    btn.setAttribute('aria-controls', panel.id);
    item.classList.add('is-collapsed');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function(){
      var open = item.classList.toggle('is-collapsed') === false;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
})();

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
  /* the voice settles first, high in the clean sky */
  tl.from('.hero-eyeline', { y:-12, opacity:0, duration:.9, ease:'power3.out' }, .05);
  /* the massif's wordmark surfaces out of the pool — rises to rest on the waterline —
     then its reflection resolves underneath it */
  tl.from('.hero-wm-main', { y:72, opacity:0, duration:1.3, ease:'power4.out' }, .16)
    .from('.hero-wm-echo', { opacity:0, duration:1.1, ease:'power2.out' }, .62);
  /* action, then proof, rise in under the pool */
  tl.from('.hero-foot', { y:18, opacity:0, duration:.85, ease:'power3.out' }, .78);
  revealChrome(tl, .85);
  if(window.MulleFluid && window.MulleFluid.ok){
    tl.call(window.MulleFluid.intro, null, .12);
  }
  /* subtle scroll depth — the wordmark lags the frame slightly, so it appears to hang in the
     pool as the hero lifts away (the .hero-inner scroll-out below carries the fade) */
  gsap.to('.hero-wm', { yPercent:9, ease:'none',
    scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom 40%', scrub:true } });
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
  document.body.classList.add('is-transitioning');   /* lock clicks/scroll behind the sheet */
  if(lenis){ lenis.stop(); }
  gsap.to(wipe, {
    yPercent:0, borderRadius:'0px', duration:.55, ease:'power3.inOut',
    onComplete:function(){ window.location.href = href; }
  });
}
window.MulleNav = navTransition;

/* bfcache restore (iOS back-swipe, Chrome fwd/back) hands the page back mid-transition —
   the ink sheet and Lenis were left covering/stopped. Reset them so we don't strand the user. */
window.addEventListener('pageshow', function(e){
  if(!e.persisted) return;
  document.body.classList.remove('is-transitioning');
  gsap.set(wipe, { yPercent:105, borderRadius:'50% 50% 0 0 / 14% 14% 0 0' });
  if(lenis){ lenis.start(); }
});

document.addEventListener('click', function(e){
  if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  var a = e.target.closest('a');
  if(!a) return;
  var href = a.getAttribute('href');
  if(!href || href.charAt(0) === '#' || a.target === '_blank' || a.hasAttribute('download')) return;
  var url; try{ url = new URL(a.href, location.href); }catch(_){ return; }
  if(url.origin !== location.origin) return;
  e.preventDefault();
  if(url.pathname === location.pathname){              /* already here → glide to top */
    if(menuOpen){ setMenu(false); }
    if(lenis){ lenis.scrollTo(0, { duration:1 }); }
    else { window.scrollTo({ top:0, behavior:'smooth' }); }
    return;
  }
  navTransition(a.href);
}, true);

/* hover-intent prefetch: warm the next page the instant intent shows, so the
   0.55s wipe hides the fetch entirely. One <link rel=prefetch> per URL, deduped. */
(function(){
  var done = {};
  function warm(e){
    var a = e.target.closest && e.target.closest('a');
    if(!a) return;
    var href = a.getAttribute('href');
    if(!href || href.charAt(0) === '#' || a.target === '_blank' || a.hasAttribute('download')) return;
    var url; try{ url = new URL(a.href, location.href); }catch(_){ return; }
    if(url.origin !== location.origin || url.pathname === location.pathname) return;
    if(done[url.pathname]) return; done[url.pathname] = 1;
    var l = document.createElement('link');
    l.rel = 'prefetch'; l.href = url.pathname; l.as = 'document';
    document.head.appendChild(l);
  }
  document.addEventListener('pointerover', warm);
  document.addEventListener('focusin', warm);
  document.addEventListener('touchstart', warm, { passive:true });
})();

/* counter preloader on first visit only; quick drain on every navigation after */
var seen = false;
try{ seen = sessionStorage.getItem('mulle_seen') === '1'; }catch(_){}
/* always play the counting preloader on the landing/home page; inner pages
   keep the quick drain after the first visit so navigation stays snappy */
var isHome = location.pathname === '/' || /index\.html?$/.test(location.pathname);
if(pre && (!seen || isHome)){
  try{ sessionStorage.setItem('mulle_seen', '1'); }catch(_){}
  var smallPre = window.matchMedia('(max-width:767px)').matches;   /* snappier count on phones */
  var preTl = gsap.timeline();
  preTl.to(counter, {
      v:100, duration: smallPre ? 0.6 : 1.15, ease:'power2.inOut',
      onUpdate:function(){
        var v = Math.round(counter.v);
        if(preCount){ preCount.textContent = (v < 10 ? '00' : v < 100 ? '0' : '') + v; }
        if(preBar){ preBar.style.transform = 'scaleX(' + (v/100) + ')'; }
      }
    })
    .to(pre, { yPercent:-100, duration: smallPre ? 0.6 : 0.85, ease:'power4.inOut',
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

/* ── manifesto: THE REGISTER — five type ribbons stream in opposing directions and
   brake, one scroll-owned beat at a time, into flush register on a vertical hairline.
   The section performs its own third rule: precision, not decoration.
   Desktop = pinned scrub built from the translated source paragraph (no SplitText —
   the FR re-split hazard is structurally eliminated); mobile = lateral entrances;
   reduced motion never reaches this code (boot bails) and the source renders as a
   clean static list via CSS. ── */
(function(){
  var man = document.querySelector('.manifesto');
  if(!man || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  var doc = man.querySelector('.m-doc');
  if(!doc) return;
  var mks = gsap.utils.toArray(doc.querySelectorAll('.mk'));
  var exs = gsap.utils.toArray(doc.querySelectorAll('.m-ex'));
  if(mks.length < 2) return;

  /* the pinned register resolve now runs on mobile too (was a lateral slide-in on <=900px) */

  /* acceleration schedule: the first lock gets the long teaching runway, 2–5 compress.
     Each rail is near-still (ambient drift) until its .26-wide active window opens,
     cruises, then gears down through a linear brake into the stop — Lenis's expo-out
     tail rounds the corner into a physical settle. */
  var LOCKS  = [.26, .44, .58, .70, .80];
  var DIRS   = [-90, 64, -78, 54, -70];          /* vw offsets — alternating opposition, descending magnitude */
  var WINDOW = .26, BRAKE = .045;
  var NUMS   = ['01','02','03','04','05'];
  var fr = (document.documentElement.lang || '').toLowerCase().indexOf('fr') === 0;

  function build(){
    var stage = document.createElement('div');
    stage.className = 'm-stage'; stage.setAttribute('aria-hidden','true');
    var axis = document.createElement('span'); axis.className = 'm-axis'; stage.appendChild(axis);
    var railsBox = document.createElement('div'); railsBox.className = 'm-rails'; stage.appendChild(railsBox);
    var ledger = document.createElement('span'); ledger.className = 'm-ledger'; stage.appendChild(ledger);

    function ghostCell(html){ var s = document.createElement('span'); s.className = 'm-cell'; s.innerHTML = html; return s; }
    function dash(){ var s = document.createElement('span'); s.className = 'm-dash'; return s; }

    var rails = [], locks = [], ghosts = [], twLs = [], twBs = [], keys = [], nums = [];
    mks.forEach(function(mk, i){
      var rail = document.createElement('div'); rail.className = 'm-rail';
      /* the ghost stream is the REAL excess prose — the sentence this rule replaces */
      var ghostHTML = exs[i] ? exs[i].innerHTML : mk.textContent;
      var lock = document.createElement('span'); lock.className = 'm-lock';
      var twL = document.createElement('span'); twL.className = 'tw-l'; twL.innerHTML = mk.innerHTML;
      var twB = document.createElement('span'); twB.className = 'tw-b'; twB.innerHTML = mk.innerHTML;
      var num = document.createElement('span'); num.className = 'm-rnum'; num.textContent = NUMS[i];
      lock.appendChild(twL); lock.appendChild(twB); lock.appendChild(num);
      [ghostCell(ghostHTML), dash(), lock, dash(), ghostCell(ghostHTML), dash(), ghostCell(ghostHTML)]
        .forEach(function(p){ rail.appendChild(p); });
      railsBox.appendChild(rail);
      rails.push(rail); locks.push(lock);
      ghosts.push(gsap.utils.toArray(rail.querySelectorAll('.m-cell, .m-dash')));
      twLs.push(twL); twBs.push(twB); keys.push(twB.querySelector('.mkey')); nums.push(num);
    });
    var roff = document.createElement('span'); roff.className = 'm-roff'; railsBox.appendChild(roff);
    man.appendChild(stage);
    man.classList.add('m-reg-live');

    /* register geometry — everything derives from these two, re-measured on every refresh
       (invalidateOnRefresh): a resize mid-pin can never break alignment */
    function finalX(i){
      var axisX = axis.getBoundingClientRect().left;
      var railX = rails[i].getBoundingClientRect().left - (parseFloat(gsap.getProperty(rails[i], 'x')) || 0);
      return axisX - railX - locks[i].offsetLeft;
    }
    function vw(n){ return window.innerWidth * (n / 100); }

    /* FR guard: the longest translated line must fit between the register line and the
       right margin — scale the rail down rather than crop a locked rule */
    function fit(){
      var axisX = axis.getBoundingClientRect().left;
      var avail = window.innerWidth - axisX - (parseFloat(getComputedStyle(man).paddingRight) || 0) - 8;
      rails.forEach(function(rail, i){
        rail.style.fontSize = '';
        var w = locks[i].getBoundingClientRect().width;
        if(w > avail){ rail.style.fontSize = (parseFloat(getComputedStyle(rail).fontSize) * avail / w) + 'px'; }
      });
    }
    fit();
    ScrollTrigger.addEventListener('refreshInit', fit);

    /* deterministic ledger — threshold text swaps, fully reversible */
    var resolved = false, lastN = -1;
    function ledgerUpdate(p){
      if(p >= .885){
        if(!resolved){ resolved = true; ledger.textContent = fr ? '5 RÈGLES — ALIGNÉES' : '5 RULES — IN REGISTER'; }
        return;
      }
      if(resolved){ resolved = false; lastN = -1; }
      var n = 0; for(var i = 0; i < LOCKS.length; i++){ if(p >= LOCKS[i]) n++; }
      if(n !== lastN){ lastN = n; ledger.textContent = (fr ? 'REGISTRE' : 'REGISTER') + ' — 0' + n + '/05'; }
    }

    /* approach — the first currents are already crossing as the section rises off the deck */
    rails.forEach(function(rail, i){
      gsap.fromTo(rail,
        { x: function(){ return finalX(i) + vw(DIRS[i]) * 1.12; } },
        { x: function(){ return finalX(i) + vw(DIRS[i]); }, ease:'none',
          scrollTrigger:{ trigger:man, start:'top bottom', end:'top top', scrub:true, invalidateOnRefresh:true } });
    });

    /* the master field — one pin, one timeline, everything ease:none inside the scrub */
    var tl = gsap.timeline({ scrollTrigger:{
      trigger:man, start:'top top', end:'+=320%', pin:true, scrub:true,
      anticipatePin:1, invalidateOnRefresh:true,
      onUpdate:function(self){ ledgerUpdate(self.progress); }
    }});

    tl.fromTo(axis, { scaleY:0 }, { scaleY:1, duration:.08, ease:'none' }, .04);
    tl.fromTo(ledger, { autoAlpha:0 }, { autoAlpha:1, duration:.04, ease:'none' }, .06);

    rails.forEach(function(rail, i){
      var L = LOCKS[i], W = Math.max(0, L - WINDOW);
      /* ambient drift → cruise → brake: three linear segments, a visible gear-down */
      if(W > 0){
        tl.fromTo(rail, { x: function(){ return finalX(i) + vw(DIRS[i]); } },
          { x: function(){ return finalX(i) + vw(DIRS[i]) * .92; }, duration: W, ease:'none' }, 0);
        tl.to(rail, { x: function(){ return finalX(i) + vw(DIRS[i]) * .10; }, duration: (L - BRAKE) - W, ease:'none' }, W);
      }else{
        tl.fromTo(rail, { x: function(){ return finalX(i) + vw(DIRS[i]); } },
          { x: function(){ return finalX(i) + vw(DIRS[i]) * .10; }, duration: L - BRAKE, ease:'none' }, 0);
      }
      tl.to(rail, { x: function(){ return finalX(i); }, duration: BRAKE, ease:'none' }, L - BRAKE);
      /* the lock: twins crossfade while the rail is still finishing its travel, so the
         300→500 width delta is masked by motion (never tween wght per frame) */
      tl.fromTo(twLs[i], { opacity:1 }, { opacity:0, duration:.03, ease:'none' }, L - .025);
      tl.fromTo(twBs[i], { opacity:0 }, { opacity:1, duration:.03, ease:'none' }, L - .025);
      /* numeral clicks in at the hairline */
      tl.fromTo(nums[i], { autoAlpha:0, x:-6 }, { autoAlpha:1, x:0, duration:.02, ease:'none' }, L + .005);
      /* the key word flushes blue one beat after the line lands — the only accent event */
      if(keys[i]){ tl.fromTo(keys[i], { color:'#1D1D1F' }, { color:'#0071E3', duration:.025, ease:'none' }, L + .02); }
      /* the duplicates evaporate */
      tl.to(ghosts[i], { opacity:0, duration:.05, ease:'none' }, L);
    });

    /* rule-off under the finished list, then a held still frame before the exit drift */
    tl.fromTo(roff, { scaleX:0 }, { scaleX:1, duration:.05, ease:'none' }, .88);
    tl.to(stage, { y:'-2vh', duration:.06, ease:'none' }, .94);

    ledgerUpdate(0);
  }

  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(function(){ try{ build(); ScrollTrigger.refresh(); }catch(e){} });
  } else { build(); }
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

/* ── work: rows arrive with a curtain reveal — frame wipes open, media settles,
      title builds in masked lines, specs stagger ── */
gsap.utils.toArray('.wk-row').forEach(function(row){
  var frame = row.querySelector('.wk-frame');
  var canvas = row.querySelector('.wk-canvas');
  var name = row.querySelector('.wk-row-name');
  var meta = row.querySelectorAll('.wk-row-n, .wk-row-type, .wk-row-desc, .wk-row-specs');
  var tl = gsap.timeline({ scrollTrigger:{ trigger:row, start:'top 85%' } });
  if(frame){
    tl.fromTo(frame, { clipPath:'inset(0 0 100% 0)' }, { clipPath:'inset(0 0 0% 0)', duration:1.0, ease:'power4.out' }, 0);
    if(canvas){ tl.fromTo(canvas, { scale:1.14 }, { scale:1, duration:1.1, ease:'power3.out' }, 0); }
  } else {
    tl.from(row, { y:42, opacity:0, duration:.9, ease:'power3.out' }, 0);
  }
  if(name){ revealHeading(name); }
  if(meta.length){ tl.from(meta, { y:20, opacity:0, duration:.7, stagger:.07, ease:'power3.out' }, 0.18); }
});

/* ── work: lightbox — films play fullscreen WITH SOUND; images open large.
      (the SoYou lead links to the live site, so it's left as a link) ── */
(function(){
  var canvases = gsap.utils.toArray('.wk-canvas');
  var elig = canvases.filter(function(c){
    if(c.closest('a.wk-visit-link')) return false;                          // external-site lead → leave the link
    return c.getAttribute('data-video') || c.getAttribute('data-img') || c.querySelector('.wk-img');
  });
  if(!elig.length) return;
  var lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('aria-hidden', 'true');
  lb.innerHTML = '<button type="button" class="lb-close" aria-label="Close">✕</button><div class="lb-stage"></div>';
  document.body.appendChild(lb);
  var stage = lb.querySelector('.lb-stage'), closeBtn = lb.querySelector('.lb-close');
  var isOpen = false;
  function close(){
    if(!isOpen) return; isOpen = false;
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
    if(lenis){ lenis.start(); }
    setTimeout(function(){ stage.innerHTML = ''; }, 420);
  }
  function open(node){
    var base = node.getAttribute('data-video');
    var imgEl = node.querySelector('.wk-img');
    var imgSrc = node.getAttribute('data-img') || (imgEl ? imgEl.getAttribute('src') : null);
    stage.innerHTML = '';
    if(base){
      var v = document.createElement('video');
      v.src = base; v.controls = true; v.autoplay = true; v.loop = true;
      v.playsInline = true; v.setAttribute('playsinline', '');
      var poster = node.getAttribute('data-poster'); if(poster){ v.poster = poster; }
      stage.appendChild(v);
      var p = v.play(); if(p && p.catch){ p.catch(function(){}); }
    } else if(imgSrc){
      var im = document.createElement('img');
      im.src = imgSrc; im.alt = (imgEl ? imgEl.getAttribute('alt') : node.getAttribute('data-alt')) || '';
      stage.appendChild(im);
    } else { return; }
    isOpen = true; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    if(lenis){ lenis.stop(); }
  }
  elig.forEach(function(c){
    c.setAttribute('data-lb', '');
    c.addEventListener('click', function(e){ e.preventDefault(); open(c); });
  });
  closeBtn.addEventListener('click', close);
  lb.addEventListener('click', function(e){ if(e.target === lb) close(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && isOpen){ close(); } });
})();

/* ── work: liquid-mercury hover on the image plates — WebGL, desktop-only.
      At rest it renders the plain image; hover ripples the surface like touched mercury;
      fast scroll leans it. HARD-GATED: if WebGL or the texture fails at any step, no canvas
      is mounted and the original <img> is left untouched. ── */
(function(){
  if(reduced) return;
  var mobile = window.matchMedia('(max-width:900px)').matches;
  if(!mobile && !hasHover) return;                        /* desktop without a mouse: skip */
  /* desktop: all plates (hover-driven). mobile: ONLY the home strip .wd-shot (scroll-driven,
     gated so just the centred tile renders) — the Work page's many tiles stay desktop-only. */
  var sel = mobile ? '.wd-shot' : '.wk-canvas, .plate-visual, .wd-shot';
  var plates = Array.prototype.slice.call(document.querySelectorAll(sel))
    .filter(function(c){ return c.getAttribute('data-img') || c.querySelector('img') || c.getAttribute('data-video') || c.querySelector('video'); });
  if(!plates.length) return;

  var VERT = 'attribute vec2 aPos;varying vec2 vUv;void main(){vUv=aPos*0.5+0.5;gl_Position=vec4(aPos,0.0,1.0);}';
  var FRAG = [
    'precision mediump float;varying vec2 vUv;',
    'uniform sampler2D uTex;uniform vec2 uCover;uniform vec2 uMouse;',
    'uniform float uHover;uniform float uVel;uniform float uTime;',
    'void main(){',
    '  vec2 uv=(vUv-0.5)*uCover+0.5;',
    '  uv.x+=uVel*(uv.y-0.5);',                          /* scroll lean */
    '  vec2 d=uv-uMouse;float dist=length(d);',
    '  float ring=smoothstep(0.5,0.0,dist);',
    '  float wave=sin(dist*40.0-uTime*5.2);',
    '  uv+=normalize(d+1e-5)*wave*0.008*ring*uHover;',   /* ripple (softened) */
    '  uv+=d*0.038*ring*uHover;',                        /* swell toward cursor (softened) */
    '  gl_FragColor=texture2D(uTex,uv);',
    '}'
  ].join('');

  function compile(gl, type, src){
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }

  plates.forEach(function(host){
    /* video tiles: run the SAME liquid shader with the <video> as a live texture. Work-page
       data-video tiles inject a video.wk-vid; the home strip's .wd-shot already has video.pf-vid */
    if(host.getAttribute('data-video') || (host.classList.contains('wd-shot') && host.querySelector('video.pf-vid'))){
      var tries = 0;
      (function waitVid(){
        var vid = host.querySelector('video.wk-vid, video.pf-vid');
        if(vid && vid.readyState >= 2 && vid.videoWidth){ try{ build(host, vid, true); }catch(e){} return; }
        if(tries++ < 400){ setTimeout(waitVid, 120); }
      })();
      return;
    }
    var imgEl = host.querySelector('img');
    var src = host.getAttribute('data-img') || (imgEl && imgEl.getAttribute('src'));
    if(!src) return;
    var image = new Image(); image.decoding = 'async';
    image.onload = function(){ try{ build(host, image); }catch(e){} };
    image.src = src;
  });

  function build(host, image, isVideo){
    var cv = document.createElement('canvas'); cv.className = 'wk-gl'; cv.setAttribute('aria-hidden', 'true');
    var gl = cv.getContext('webgl', { antialias:true, alpha:false }) || cv.getContext('experimental-webgl');
    if(!gl) return;
    var vs = compile(gl, gl.VERTEX_SHADER, VERT), fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if(!vs || !fs) return;
    var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    try{ gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image); }catch(e){ return; }
    var uCover = gl.getUniformLocation(prog, 'uCover'), uMouse = gl.getUniformLocation(prog, 'uMouse'),
        uHover = gl.getUniformLocation(prog, 'uHover'), uVel = gl.getUniformLocation(prog, 'uVel'), uTime = gl.getUniformLocation(prog, 'uTime');

    host.appendChild(cv);                          /* mount only after full GL success */

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var iw = image.naturalWidth || image.videoWidth || image.width || 1, ih = image.naturalHeight || image.videoHeight || image.height || 1;
    function resize(){
      var w = host.clientWidth, h = host.clientHeight; if(!w || !h) return;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
      var cc = w / h, ic = iw / ih, cx, cy;
      if(cc > ic){ cx = 1; cy = ic / cc; } else { cx = cc / ic; cy = 1; }
      gl.useProgram(prog); gl.uniform2f(uCover, cx, cy);
    }
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('load', resize);

    var mx = .5, my = .5, tmx = .5, tmy = .5, hov = 0, thov = 0, vel = 0, lastY = window.pageYOffset || 0, t0 = performance.now(), lastVT = -1;
    /* PERF: home-strip tiles ripple ONLY while hovered — at rest the plain <video>/<img> shows
       (GL canvas hidden, its rAF parked); hover wakes the canvas, it ripples, then sleeps again.
       Work-page plates keep the original visible-gated continuous render (gated = false). */
    var gated = host.classList.contains('wd-shot');
    if(gated){ cv.style.opacity = '0'; cv.style.transition = 'opacity .25s ease'; }
    host.addEventListener('pointermove', function(e){ var r = host.getBoundingClientRect(); tmx = (e.clientX - r.left) / r.width; tmy = 1 - (e.clientY - r.top) / r.height; thov = 1; if(gated) wake(); });
    host.addEventListener('pointerenter', function(){ thov = 1; if(gated) wake(); });
    host.addEventListener('pointerleave', function(){ thov = 0; });

    var visible = false, raf = null;
    function wake(){ cv.style.opacity = '1'; if(raf == null){ raf = requestAnimationFrame(tick); } }
    function tick(){
      if(!gated && !visible){ raf = null; return; }
      mx += (tmx - mx) * .12; my += (tmy - my) * .12; hov += (thov - hov) * .08;
      var y = window.pageYOffset || 0;
      var dv = (lenis && lenis.velocity != null) ? lenis.velocity : (y - lastY); lastY = y;
      vel += (Math.max(-1, Math.min(1, dv * 0.03)) - vel) * .1;
      gl.useProgram(prog);
      if(isVideo && image.readyState >= 2 && image.currentTime !== lastVT){ lastVT = image.currentTime; try{ gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image); }catch(e){} }
      gl.uniform2f(uMouse, mx, my); gl.uniform1f(uHover, hov); gl.uniform1f(uVel, vel * 0.06); gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if(gated && thov < .001 && hov < .01){ cv.style.opacity = '0'; raf = null; return; }   /* settled → sleep, reveal plain media */
      raf = requestAnimationFrame(tick);
    }
    function start(){ if(raf == null){ raf = requestAnimationFrame(tick); } }
    if(gated){ /* driven by hover (wake) on desktop, or by the scroll driver below on mobile */ }
    else if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ es.forEach(function(e){ visible = e.isIntersecting; if(visible) start(); }); }, { threshold:0 }).observe(host);
    } else { visible = true; start(); }
  }
})();

/* ── mobile: scroll-driven mercury — touch has no hover, so the .wd-shot nearest the viewport
   centre is "woken" via synthetic pointer events as you scroll the pinned takeover. Only that
   one tile renders (the shader's gated sleep/wake handles the rest), so it stays light. ── */
(function(){
  if(reduced || !window.matchMedia('(max-width:900px)').matches) return;
  var shots = Array.prototype.slice.call(document.querySelectorAll('.wd-shot'));
  if(!shots.length) return;
  var active = null, raf = null;
  function centred(){
    var cx = window.innerWidth / 2, best = null, bestD = 1e9;
    for(var i = 0; i < shots.length; i++){
      var r = shots[i].getBoundingClientRect();
      if(r.width === 0 || r.bottom <= 0 || r.top >= window.innerHeight) continue;
      var d = Math.abs((r.left + r.width / 2) - cx);
      if(d < bestD){ bestD = d; best = shots[i]; }
    }
    return best;
  }
  function tick(){
    raf = null;
    var s = centred();
    if(s !== active){
      if(active){ try{ active.dispatchEvent(new PointerEvent('pointerleave')); }catch(e){} }
      active = s;
    }
    if(s){
      var r = s.getBoundingClientRect();
      try{ s.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); }catch(e){}
    }
  }
  function schedule(){ if(raf == null){ raf = requestAnimationFrame(tick); } }
  window.addEventListener('scroll', schedule, { passive:true });
  if(window.lenis && typeof lenis.on === 'function'){ try{ lenis.on('scroll', schedule); }catch(e){} }
  window.addEventListener('resize', schedule);
  schedule();
})();

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
(function(){
  var small = window.matchMedia('(max-width:767px)').matches;
  document.querySelectorAll('.wk-canvas[data-video]').forEach(function(c){
    var base = c.getAttribute('data-video'); if(!base || !window.fetch) return;
    var pick = small ? base.replace(/\.mp4$/, '-mobile.mp4') : base;
    /* confirm the chosen file exists; fall back to the desktop file if a mobile one is missing */
    fetch(pick, { method:'HEAD' }).then(function(r){ return r.ok ? pick : base; }, function(){ return base; })
    .then(function(finalSrc){
      var v = document.createElement('video');
      v.className = 'wk-vid'; v.muted = true; v.loop = true;
      v.playsInline = true; v.setAttribute('playsinline',''); v.preload = 'none';
      var p = c.getAttribute('data-poster'); if(p){ v.poster = p; }
      v.addEventListener('playing', function(){ c.classList.add('is-playing'); });
      c.appendChild(v);
      var loaded = false;
      function show(){ if(!loaded){ loaded = true; v.src = finalSrc; } var pr = v.play(); if(pr && pr.catch){ pr.catch(function(){}); } }
      if('IntersectionObserver' in window){
        new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? show() : v.pause(); }); }, { threshold:0.25, rootMargin:'200px 0px' }).observe(c);
      } else { show(); }
    }).catch(function(){});
  });
})();


/* ── home 'Selected' film plate — lazy load, mobile rendition, play only in view ── */
(function(){
  var vids = document.querySelectorAll('.pf-vid'); if(!vids.length) return;   // may be several film plates now
  var small = window.matchMedia('(max-width:767px)').matches;
  vids.forEach(function(v){
    /* every .pf-vid (home strip included) takes the light rendition on phones. If a -mobile
       file is ever missing, the <source> errors and we restore the full file once — a missing
       rendition can never leave a blank frame again. */
    if(small){
      var s = v.querySelector('source');
      if(s && s.src && s.src.indexOf('-mobile.mp4') === -1){
        var full = s.src;
        s.addEventListener('error', function onErr(){
          s.removeEventListener('error', onErr);
          s.src = full; v.load();
        });
        s.src = full.replace(/\.mp4(\?.*)?$/, '-mobile.mp4');
        v.load();
      }
    }
    if(v.closest('.wd-stack')) return;   /* home strip loops: the carousel IIFE owns play/pause */
    function play(){ var p = v.play(); if(p && p.catch){ p.catch(function(){}); } }
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? play() : v.pause(); }); }, { threshold:0.25, rootMargin:'200px 0px' }).observe(v);
    } else { play(); }
  });
})();

/* ── home deck banners: the loop crossfades in over the sharp poster whenever it is
   actually rendering frames (ignition re-adds .is-live after every pause cycle) ── */
(function(){
  document.querySelectorAll('.wd-media .pf-vid').forEach(function(v){
    v.addEventListener('playing', function(){ v.classList.add('is-live'); });
  });
})();

/* ── mobile: sticky "Start a project" CTA — appears after the first screen, hides near the footer ── */
(function(){
  if(/contact\.html$/.test(location.pathname)) return;   /* the form is already on this page */
  var a = document.createElement('a');
  a.className = 'sticky-cta'; a.href = 'contact.html';
  var fr = (function(){ try{ var s = localStorage.getItem('fritz_lang'); if(s) return s === 'fr'; }catch(e){} return (navigator.language||'').toLowerCase().indexOf('fr') === 0; })();
  a.innerHTML = '<span>' + (fr ? 'Démarrer un projet' : 'Start a project') + '</span><span class="sc-arr" aria-hidden="true">→</span>';
  document.body.appendChild(a);
  var foot = document.querySelector('.site-foot');
  function upd(){
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var past = y > window.innerHeight * 0.6;
    var nearFoot = foot ? (foot.getBoundingClientRect().top < window.innerHeight + 40) : false;
    a.classList.toggle('show', past && !nearFoot);
  }
  window.addEventListener('scroll', upd, { passive:true });
  window.addEventListener('resize', upd, { passive:true });
  upd();
})();

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

/* rows are real <a class="disc-link"> now, so the global link interceptor above
   routes them through navTransition — no per-row click handler needed. */

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
  var media = visual && visual.querySelector('.pp-img, .pf-vid');
  if(media){
    /* parallax lives on --py; hover-zoom lives on --ps (see CSS) so neither clobbers the other */
    gsap.fromTo(media,
      { '--py':'-7%' }, { '--py':'7%', ease:'none',
      scrollTrigger:{ trigger:visual, start:'top bottom', end:'bottom top', scrub:true } });
  }
});

/* ── home 'Selected work' — GSAP PINNED horizontal takeover with strong liquid velocity skew.
   The section pins at the top; vertical scroll becomes horizontal travel of the row; scroll
   velocity skews the frames hard and springs them back to rest. ── */
(function(){
  var section = document.querySelector('.works');
  var stack = document.querySelector('.wd-stack');
  if(!section || !stack) return;
  var cards = gsap.utils.toArray(stack.querySelectorAll('.wd-card'));
  if(!cards.length) return;
  var shots = cards.map(function(c){ return c.querySelector('.wd-shot'); }).filter(Boolean);

  /* furniture entrances — same vocabulary as every other chapter */
  var hdr = document.querySelector('.wd-hdr');
  if(hdr){
    gsap.fromTo(hdr, { '--hx':0 }, { '--hx':1, duration:.9, ease:'power2.inOut',
      scrollTrigger:{ trigger:'.works', start:'top 84%', once:true } });
    gsap.from(hdr.children, { y:14, opacity:0, duration:.7, stagger:.06, ease:'power3.out',
      scrollTrigger:{ trigger:'.works', start:'top 84%', once:true } });
  }
  revealHeading(document.querySelector('.wd-title'));

  /* frames rise in on first entry (cleared afterwards so the travel system owns transforms) */
  gsap.from(shots, { yPercent:14, autoAlpha:0, duration:.7, stagger:.07, ease:'power3.out', clearProps:'all',
    scrollTrigger:{ trigger:stack, start:'top 88%', once:true } });

  /* loops autoplay while the section is on screen — driven by an IntersectionObserver, kept
     independent of the pin so playback never stalls when the section is pinned */
  var vids = cards.map(function(c){ return c.querySelector('video.pf-vid'); }).filter(Boolean);
  vids.forEach(function(v){ try{ if(v.preload === 'none'){ v.preload = 'metadata'; } }catch(e){} });
  function play(v){ var p = v.play(); if(p && p.catch){ p.catch(function(){}); } }
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ vids.forEach(play); }
        else { vids.forEach(function(v){ v.pause(); }); }
      });
    }, { threshold: 0.12 });
    io.observe(section);
  } else { vids.forEach(play); }

  /* reduced-motion only: no pin — CSS gives a bar-less touch scroll. Otherwise the pinned
     takeover runs on mobile too, for the same scroll feeling as desktop. */
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  function maxX(){
    var last = cards[cards.length - 1];
    var span = (last.offsetLeft + last.offsetWidth) - cards[0].offsetLeft;
    return Math.max(0, span - stack.clientWidth + 8);
  }

  /* strong liquid: scroll velocity -> hard skew on the frames, springs back to rest */
  var setSkew = gsap.quickSetter(shots, 'skewX', 'deg');
  var clampSkew = gsap.utils.clamp(-16, 16);
  var proxy = { s:0 };

  /* the pinned takeover: pin the section, hold the row still for a beat (movement starts a
     little later), then travel across its overflow */
  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: function(){ return '+=' + Math.round(maxX() * 1.15 + 40); },
      pin: true, pinSpacing: true, anticipatePin: 1, scrub: 1, invalidateOnRefresh: true,
      onUpdate: function(self){
        var sk = clampSkew(self.getVelocity() / -220);
        if(Math.abs(sk) > Math.abs(proxy.s)){
          proxy.s = sk;
          gsap.to(proxy, { s:0, duration:.9, ease:'power3', overwrite:true,
            onUpdate:function(){ setSkew(proxy.s); } });
        }
      }
    }
  });
  tl.to(cards, { x:0, duration:0.15 });                                  // hold — movement begins later
  tl.to(cards, { x:function(){ return -maxX(); }, ease:'none', duration:1.0 });
})();

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

/* ── about · Origin — THE READING HEAD. The section pins and the beats track travels through a
   fixed window past a stationary blue head. Every frame is computed from scroll progress: each
   beat's distance from the head drives its scale, opacity, blur and lateral drift, so the whole
   section is one continuous scrub — no entrance animations, nothing that fires once. ── */
(function(){
  var org = document.querySelector('.org');
  if(!org || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  var section = org.closest('section');
  var stage = org.querySelector('.org-stage');
  var strip = org.querySelector('.org-beats');
  var beats = gsap.utils.toArray('.org-beat', org);
  if(!section || !stage || !strip || !beats.length) return;
  var fill  = org.querySelector('.org-track > i');
  var numEl = org.querySelector('[data-org-num]');
  var idxEl = org.querySelector('[data-org-idx]');
  var YEARS = ['MMXXI','MMXXII','MMXXIV','MMXXVI'];
  var total = beats.length;

  /* reduced motion: unwrap the stage into a plain readable list, no pin, no transforms */
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){
    stage.style.height = 'auto'; stage.style.overflow = 'visible';
    stage.style.webkitMaskImage = 'none'; stage.style.maskImage = 'none';
    strip.style.position = 'static';
    var head = org.querySelector('.org-head'); if(head) head.style.display = 'none';
    if(fill) fill.style.setProperty('--fill','100%');
    if(numEl) numEl.textContent = YEARS[YEARS.length-1];
    return;
  }

  /* half-window spacers top and bottom, so beat 01 starts ON the head and the last beat ends on
     it — without these the outer beats never reach the reading line at all */
  function layout(){
    var pad = Math.max(0, (stage.clientHeight - beats[0].offsetHeight) / 2);
    strip.style.paddingTop = pad + 'px';
    strip.style.paddingBottom = pad + 'px';
  }
  layout();

  var current = -1;
  function setIndex(i){
    if(i === current) return;
    var up = i > current;
    current = i;
    if(numEl){
      numEl.textContent = YEARS[i] || YEARS[YEARS.length - 1];
      gsap.fromTo(numEl, { yPercent: up ? 105 : -105 }, { yPercent:0, duration:.4, ease:'power4.out', overwrite:true });
    }
    if(idxEl) idxEl.textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + total).slice(-2);
  }

  function travel(){ return Math.max(1, strip.scrollHeight - stage.clientHeight); }

  /* one render pass — everything below is a pure function of scroll progress. Transforms go
     through a single gsap.set per beat: separate quickSetters for x and scale on the same
     element fight over the transform cache and silently drop the scale. */
  function render(p){
    var t = travel(), focus = stage.clientHeight / 2, span = beats[0].offsetHeight * 1.35;
    gsap.set(strip, { y: -p * t });
    var best = 1e9, closest = 0;
    for(var i = 0; i < beats.length; i++){
      var b = beats[i];
      var centre = b.offsetTop - p * t + b.offsetHeight / 2;
      var d = Math.min(Math.abs(centre - focus) / span, 1);
      gsap.set(b, {
        scale: 1 - d * 0.14,
        x: d * 16,
        opacity: 1 - d * 0.76,
        filter: d < 0.02 ? 'none' : 'blur(' + (d * 3.2).toFixed(2) + 'px)'
      });
      if(d < best){ best = d; closest = i; }
    }
    if(fill) fill.style.setProperty('--fill', (p * 100).toFixed(2) + '%');
    setIndex(closest);
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top 12%',
    end: function(){ return '+=' + Math.round(Math.max(900, travel() * 3.0)); },
    pin: true, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
    onUpdate: function(self){ render(self.progress); },
    onRefresh: function(self){ layout(); render(self.progress); }
  });
  render(0);
})();

/* ── inner pages: quiet scrub depth — the ghost numerals and the hero aura drift against the
   page as it moves, so the empty field reads as parallax rather than as a flat backdrop ── */
(function(){
  if(typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  gsap.utils.toArray('.sec-ghost').forEach(function(g){
    gsap.fromTo(g, { yPercent:-9 }, { yPercent:9, ease:'none',
      scrollTrigger:{ trigger:g.closest('section') || g, start:'top bottom', end:'bottom top', scrub:.8 } });
  });

  /* the container only — .hero-aura b carries its own CSS keyframes and must not be fought */
  gsap.utils.toArray('.page-hero .hero-aura').forEach(function(a){
    gsap.fromTo(a, { yPercent:0 }, { yPercent:14, ease:'none',
      scrollTrigger:{ trigger:a.closest('section') || a, start:'top top', end:'bottom top', scrub:.9 } });
  });
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
/* about · values: the "after" term re-materialises on hover — subtraction as the payoff */
document.querySelectorAll('.value').forEach(function(v){
  var a = v.querySelector('.ba .a'); if(!a) return;
  v.addEventListener('pointerenter', function(){ decode(a, 460); });
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

/* ── Geist display-weight — display headlines thicken (wght 300 → native 600/700) as they
   enter. The width axis stays locked at 125% (font-stretch untouched); only weight morphs, so
   it reads as machined metal gaining mass. The SplitText reveals lock line breaks into fixed
   divs, so the weight change cannot rewrap; <em> ghost-words keep their own 300 and stay thin
   while the line around them thickens. Runs after boot() so the injected .nextband exists;
   skipped under reduced-motion or if Geist failed to load (elements then rest at their CSS
   weight). ── */
function displayWeightMorph(){
  if(reduced || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if(!(document.fonts && document.fonts.check && document.fonts.check('600 48px Geist'))) return;
  var SELS = '.disc-head h2,.disc-row .t,.works-head h2,.wd-title,.section h2,.page-hero h1,.wk-row-name,.crosslinks h2,.nextband .nb-title,.outro-cta';
  gsap.utils.toArray(SELS).forEach(function(el){
    var target = parseInt(getComputedStyle(el).fontWeight, 10) || 700;
    gsap.fromTo(el, { fontWeight: 300 }, {
      fontWeight: target, duration: 1.15, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onComplete: function(){ el.style.removeProperty('font-weight'); }
    });
  });
  ScrollTrigger.refresh();
}
if(document.fonts && document.fonts.ready){ document.fonts.ready.then(displayWeightMorph); } else { displayWeightMorph(); }

})();
