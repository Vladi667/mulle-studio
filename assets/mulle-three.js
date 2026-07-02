/* ──────────────────────────────────────────────────────────────────
   FRITZ — Three.js liquid-mercury layer (homepage)
   One fixed canvas behind content. Matcap-shaded liquid metal:
   procedural studio matcap, displacement with in-shader normal
   recompute, cursor bulge + click pulse, scroll turbulence.
   Scenes: Method blob · Disciplines droplets · Outro centerpiece.
   ────────────────────────────────────────────────────────────────── */
(function(){
'use strict';

if(typeof THREE === 'undefined') return;
if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
/* phones: skip the background WebGL scenes entirely — barely visible there and a real GPU/battery tax; the fluid hero (mulle-fluid.js) stays */
if(window.matchMedia('(max-width:767px)').matches) return;

var anchors = {
  blob:  null,   /* Method now carries the liquid-mercury Coalesce film — no competing 3D blob */
  drops: document.querySelector('.disciplines'),
  finale:document.querySelector('.outro')
};
if(!anchors.blob && !anchors.drops && !anchors.finale) return;

/* ── renderer ── */
var canvas = document.createElement('canvas');
canvas.className = 'three-bg';
canvas.setAttribute('aria-hidden', 'true');
document.body.appendChild(canvas);

var renderer;
try{
  renderer = new THREE.WebGLRenderer({ canvas:canvas, alpha:true, antialias:true, powerPreference:'high-performance' });
}catch(e){ canvas.remove(); return; }
if(!renderer.getContext()){ canvas.remove(); return; }

var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
renderer.setPixelRatio(DPR);
renderer.setClearColor(0x000000, 0);

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0, 6);

function resize(){
  var w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();
var rt = null;
window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(resize, 160); });

/* ── procedural studio matcap — the reflections that sell the metal ── */
function makeMatcap(){
  var c = document.createElement('canvas');
  c.width = c.height = 256;
  var g = c.getContext('2d');
  /* base: dark liquid-metal body with a lit upper crescent — high
     contrast against the light page so the mercury reads as an object */
  var base = g.createRadialGradient(108, 96, 6, 128, 132, 134);
  base.addColorStop(0, '#C2CAD6');
  base.addColorStop(.34, '#69707D');
  base.addColorStop(.62, '#272C34');
  base.addColorStop(.85, '#101319');
  base.addColorStop(1, '#05060A');
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  /* key light — sharp bright hotspot, upper left */
  var key = g.createRadialGradient(84, 60, 2, 84, 60, 74);
  key.addColorStop(0, 'rgba(255,255,255,1)');
  key.addColorStop(.32, 'rgba(255,255,255,.7)');
  key.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = key; g.fillRect(0, 0, 256, 256);
  /* tight secondary specular */
  var spec = g.createRadialGradient(150, 104, 1, 150, 104, 30);
  spec.addColorStop(0, 'rgba(255,255,255,.9)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = spec; g.fillRect(0, 0, 256, 256);
  /* electric blue rim — strong, lower right (the brand pop) */
  var rim = g.createRadialGradient(206, 186, 4, 200, 178, 96);
  rim.addColorStop(0, 'rgba(40,140,255,.95)');
  rim.addColorStop(.45, 'rgba(0,113,227,.5)');
  rim.addColorStop(1, 'rgba(0,113,227,0)');
  g.fillStyle = rim; g.fillRect(0, 0, 256, 256);
  /* studio ring light — bright reflective arc */
  g.strokeStyle = 'rgba(255,255,255,.75)';
  g.lineWidth = 4;
  g.shadowColor = 'rgba(255,255,255,.95)';
  g.shadowBlur = 16;
  g.beginPath(); g.arc(128, 130, 108, Math.PI*1.02, Math.PI*1.62); g.stroke();
  g.shadowBlur = 0;
  var tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  return tex;
}
var matcap = makeMatcap();

/* ── shaders ── */
var SNOISE = [
  'vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}',
  'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
  'float snoise(vec3 v){',
  '  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);',
  '  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);',
  '  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);',
  '  vec3 x1=x0-i1+1.0*C.xxx;vec3 x2=x0-i2+2.0*C.xxx;vec3 x3=x0-1.0+3.0*C.xxx;',
  '  i=mod(i,289.0);',
  '  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
  '  float n_=1.0/7.0;vec3 ns=n_*D.wyz-D.xzx;',
  '  vec4 j=p-49.0*floor(p*ns.z*ns.z);',
  '  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);',
  '  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);',
  '  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);',
  '  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));',
  '  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
  '  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);',
  '  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
  '  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;',
  '  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;',
  '  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));',
  '}'
].join('\n');

var MATCAP_FRAG = [
  'precision highp float;',
  'uniform sampler2D uMatcap;',
  'uniform float uAlpha;',
  'varying vec3 vN; varying vec3 vV;',
  'void main(){',
  '  vec3 N = normalize(vN);',
  '  vec3 V = normalize(vV);',
  '  vec2 muv = N.xy * 0.49 + 0.5;',
  '  vec3 col = texture2D(uMatcap, muv).rgb;',
  '  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.6);',
  '  col += vec3(0.04, 0.49, 1.0) * fres * 0.85;',
  '  gl_FragColor = vec4(col, uAlpha);',
  '}'
].join('\n');

/* liquid: layered noise displacement, normals recomputed from the
   displaced surface so light truly flows over the waves */
var LIQUID_VERT = [
  'precision highp float;',
  'uniform float uTime, uAmp, uPointerK;',
  'uniform vec3 uPointer;',
  'varying vec3 vN; varying vec3 vV;',
  SNOISE,
  'float field(vec3 p){',
  '  return snoise(p*1.15 + uTime*0.20)*0.62 + snoise(p*2.6 - uTime*0.14)*0.38;',
  '}',
  'vec3 disp(vec3 p, float r){',
  '  vec3 n = normalize(p);',
  '  float d = field(p) * uAmp;',
  '  vec3 vn = normalize(normalMatrix * n);',
  '  float b = pow(max(dot(vn, normalize(uPointer)), 0.0), 4.0);',
  '  d += b * uPointerK;',
  '  return p + n * d;',
  '}',
  'void main(){',
  '  float r = length(position);',
  '  vec3 n0 = normalize(position);',
  '  vec3 t = normalize(abs(n0.y) < 0.99 ? cross(n0, vec3(0.0,1.0,0.0)) : cross(n0, vec3(1.0,0.0,0.0)));',
  '  vec3 b = normalize(cross(n0, t));',
  '  float e = 0.10;',
  '  vec3 p0 = disp(position, r);',
  '  vec3 p1 = disp(normalize(position + t*e) * r, r);',
  '  vec3 p2 = disp(normalize(position + b*e) * r, r);',
  '  vec3 newN = normalize(cross(p1 - p0, p2 - p0));',
  '  if(dot(newN, n0) < 0.0){ newN = -newN; }',
  '  vec4 mv = modelViewMatrix * vec4(p0, 1.0);',
  '  vN = normalize(normalMatrix * newN);',
  '  vV = normalize(-mv.xyz);',
  '  gl_Position = projectionMatrix * mv;',
  '}'
].join('\n');

var PLAIN_VERT = [
  'precision highp float;',
  'varying vec3 vN; varying vec3 vV;',
  'void main(){',
  '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
  '  vN = normalize(normalMatrix * normal);',
  '  vV = normalize(-mv.xyz);',
  '  gl_Position = projectionMatrix * mv;',
  '}'
].join('\n');

function liquidMaterial(amp, alpha){
  return new THREE.ShaderMaterial({
    transparent:true,
    uniforms:{
      uTime:{value:0}, uAmp:{value:amp}, uAlpha:{value:alpha},
      uPointer:{value:new THREE.Vector3(0,0,1)}, uPointerK:{value:0},
      uMatcap:{value:matcap}
    },
    vertexShader:LIQUID_VERT, fragmentShader:MATCAP_FRAG
  });
}
function matcapMaterial(alpha){
  return new THREE.ShaderMaterial({
    transparent:true,
    uniforms:{ uAlpha:{value:alpha}, uMatcap:{value:matcap} },
    vertexShader:PLAIN_VERT, fragmentShader:MATCAP_FRAG
  });
}

/* ── scene 1 · Method blob ── */
var blob = null;
if(anchors.blob){
  blob = new THREE.Mesh(new THREE.IcosahedronGeometry(2.3, 32), liquidMaterial(0.2, 0.96));
  blob.position.set(1.7, 0, 0);
  blob.visible = false;
  scene.add(blob);
}

/* ── scene 2 · Disciplines droplets ── */
var drops = null, dropData = [];
if(anchors.drops){
  var count = window.innerWidth < 768 ? 18 : 38;
  drops = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.3, 4), matcapMaterial(0.95), count);
  drops.visible = false;
  var dummy = new THREE.Object3D();
  for(var i = 0; i < count; i++){
    var band = i % 3;
    var o = {
      x:(Math.random()-0.5)*9, y:(Math.random()-0.5)*6, z:-1.5 - band*1.6,
      s:0.6 + Math.random()*1.5, sp:0.2 + Math.random()*0.5, ph:Math.random()*6.28
    };
    dropData.push(o);
    dummy.position.set(o.x, o.y, o.z); dummy.scale.setScalar(o.s); dummy.updateMatrix();
    drops.setMatrixAt(i, dummy.matrix);
  }
  drops.instanceMatrix.needsUpdate = true;
  drops.userData.dummy = dummy;
  scene.add(drops);
}

/* ── scene 3 · Outro centerpiece — the mercury core ── */
var finale = null;
if(anchors.finale){
  finale = new THREE.Mesh(new THREE.IcosahedronGeometry(2.0, 48), liquidMaterial(0.27, 0.98));
  finale.position.set(0, -0.4, -0.4);
  finale.visible = false;
  scene.add(finale);
}

/* ── visibility gating ── */
var active = {};
function gate(key, el, obj){
  if(!el || !obj) return;
  new IntersectionObserver(function(es){
    active[key] = es[0].isIntersecting;
    obj.visible = es[0].isIntersecting;
  }, { threshold:0, rootMargin:'10% 0px 10% 0px' }).observe(el);
}
gate('blob', anchors.blob, blob);
gate('drops', anchors.drops, drops);
gate('finale', anchors.finale, finale);

/* ── pointer · hover · pulse · scroll ── */
var pointer = { x:0, y:0, tx:0, ty:0 };
window.addEventListener('pointermove', function(e){
  pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
}, { passive:true });

var finaleHover = false, pulse = 0;
if(anchors.finale){
  anchors.finale.addEventListener('pointerenter', function(){ finaleHover = true; }, { passive:true });
  anchors.finale.addEventListener('pointerleave', function(){ finaleHover = false; }, { passive:true });
  anchors.finale.addEventListener('pointerdown', function(){ pulse = 1; }, { passive:true });
}

var scrollV = 0, lastScroll = window.scrollY || 0;
window.addEventListener('scroll', function(){
  var y = window.scrollY || 0;
  scrollV = y - lastScroll; lastScroll = y;
}, { passive:true });

/* ── loop ── */
var running = true, clock = new THREE.Clock(), pk = 0;
document.addEventListener('visibilitychange', function(){ running = !document.hidden; });
function anyActive(){ return active.blob || active.drops || active.finale; }

function frame(){
  requestAnimationFrame(frame);
  if(!running || !anyActive()){ return; }
  var dt = Math.min(clock.getDelta(), 0.05);
  var t = clock.elapsedTime;
  pointer.x += (pointer.tx - pointer.x) * 0.06;
  pointer.y += (pointer.ty - pointer.y) * 0.06;
  scrollV *= 0.9;
  pulse = Math.max(0, pulse - dt * 1.6);
  var turb = Math.min(Math.abs(scrollV) * 0.004, 0.14);
  var pdir = new THREE.Vector3(pointer.x * 1.4, pointer.y * 1.4, 1.0);

  if(blob && active.blob){
    var u = blob.material.uniforms;
    u.uTime.value = t;
    u.uAmp.value = 0.2 + turb;
    u.uPointer.value.copy(pdir);
    u.uPointerK.value = 0.12;
    blob.rotation.y += dt * 0.22;
    blob.rotation.x = pointer.y * 0.18;
  }
  if(drops && active.drops){
    var dummy = drops.userData.dummy;
    for(var i = 0; i < dropData.length; i++){
      var o = dropData[i];
      dummy.position.set(
        o.x + pointer.x * (1.0 + o.z * -0.15) * 0.4,
        o.y + Math.sin(t * o.sp + o.ph) * 0.4,
        o.z);
      dummy.rotation.set(t * o.sp * 0.5, t * o.sp * 0.7, 0);
      dummy.scale.setScalar(o.s);
      dummy.updateMatrix();
      drops.setMatrixAt(i, dummy.matrix);
    }
    drops.instanceMatrix.needsUpdate = true;
  }
  if(finale && active.finale){
    var f = finale.material.uniforms;
    f.uTime.value = t;
    f.uAmp.value = 0.27 + turb;
    f.uPointer.value.copy(pdir);
    pk += (((finaleHover ? 0.42 : 0.12) + pulse * 0.6) - pk) * Math.min(dt * 5, 1);
    f.uPointerK.value = pk;
    finale.rotation.y += dt * 0.16;
    finale.rotation.z = Math.sin(t * 0.12) * 0.08;
    finale.position.x = pointer.x * 0.25;
    finale.position.y = -0.4 + pointer.y * 0.15;
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

window.MulleThree = { renderer:renderer, scene:scene, camera:camera, blob:blob, drops:drops, finale:finale };

})();
