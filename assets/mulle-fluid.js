/* ──────────────────────────────────────────────────────────────────
   FRITZ — liquid mercury surface
   Damped wave height-field reflecting a synthetic studio.

   There is no photograph. Mercury has almost no diffuse colour of its
   own — what you see is entirely its surroundings, bent by the surface
   — so the material is generated rather than depicted: the wave normal
   is pointed at an environment built from the site's own tokens and
   reflection does the rest. The cursor presses the surface, clean rings
   radiate and refract the studio, then settle. Rare droplets fall in.

   (Replaces the mercury-massif JPEG. A photograph of a mirror can only
   ever show one fixed set of surroundings; a reflected environment moves
   with the surface, which is what the material actually does.)
   ────────────────────────────────────────────────────────────────── */
(function(){
'use strict';

var wrap = document.querySelector('.fluid-wrap');
var canvas = document.getElementById('fluid');
if(!wrap || !canvas) return;

/* Reduced motion does NOT fall back to the CSS panel: the shader still runs, renders a
   single frame and stops. The material is intact, nothing moves. `ok:false` keeps mulle.js
   from driving the intro, the idle splashes or the coverage poll. */
var reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
function fallback(){ wrap.classList.add('fallback'); window.MulleFluid = { ok:false, intro:function(){}, setVeil:function(){} }; }

/* ── context ── */
var params = { alpha:false, depth:false, stencil:false, antialias:false, preserveDrawingBuffer:false };
var isGL2 = true;
var gl = canvas.getContext('webgl2', params);
if(!gl){ isGL2 = false; gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params); }
if(!gl){ fallback(); return; }

var texType;
if(isGL2){
  if(!gl.getExtension('EXT_color_buffer_float')){ fallback(); return; }
  gl.getExtension('OES_texture_float_linear');
  texType = gl.HALF_FLOAT;
}else{
  var hf = gl.getExtension('OES_texture_half_float');
  var hfl = gl.getExtension('OES_texture_half_float_linear');
  if(!hf || !hfl){ fallback(); return; }
  texType = hf.HALF_FLOAT_OES;
}
var internalFmt = isGL2 ? gl.RGBA16F : gl.RGBA;

/* ── tuning ── */
var isMobile = window.matchMedia('(max-width:767px)').matches;
var WAVE_RES    = isMobile ? 320 : 520;   /* height-field resolution — high enough for crisp rings */
var WAVE_ITERS  = 2;                      /* wave steps per frame — ring expansion speed */
var WAVE_DAMP   = 0.9885;                  /* energy loss per step — rings die in ~1.5s */
var RADIUS_WAVE = 0.0011;  /* tight footprint — the wow is depth, not size */
var DPR         = Math.min(window.devicePixelRatio || 1, 1.5);

/* ── the resting surface ──
   A perfectly flat mirror reflecting a gradient head-on returns one flat colour, so the
   field needs permanent structure or the hero is empty again in a new way. The swell is
   ANISOTROPIC on purpose — stretched hard on X — so it reads as a level liquid sheet with
   long low standing waves rather than isotropic noise. Two layers drift against each other
   at different rates, so nothing ever visibly repeats (no ~0.2Hz oscillation to perceive).
   Values chosen from a four-variant render sweep; see the hero execution plan. */
var AMB_SX1 = 0.85, AMB_SY1 = 3.1;    /* layer 1 stretch */
var AMB_SX2 = 0.55, AMB_SY2 = 5.0;    /* layer 2 stretch */
var AMB_AMT = 0.185;                  /* how hard the swell bends the normal */
var BODY_AMT = 0.230, BODY_Y = 0.38;  /* wide shallow sheet curve — keeps the quiet zone up-left, under the type */
var SEAM = 0.24, SEAM_W = 14.0;       /* the studio horizon; without it a mirror reads as plastic */
/* the swell costs 18 noise evaluations per pixel, so it is computed ONCE per frame into a
   small buffer (gradient stored in RG) instead of at full canvas resolution */
var AMB_RES = isMobile ? 128 : 256;

/* GLSL ES 1.0 has no implicit int→float: every injected literal must carry a decimal. */
function f(x){ return Number(x).toFixed(4); }

/* ── shaders ── */
var VERT = [
  'precision highp float;',
  'attribute vec2 aPosition;',
  'varying vec2 vUv, vL, vR, vT, vB;',
  'uniform vec2 texelSize;',
  'void main(){',
  '  vUv = aPosition*0.5+0.5;',
  '  vL = vUv - vec2(texelSize.x,0.0);',
  '  vR = vUv + vec2(texelSize.x,0.0);',
  '  vT = vUv + vec2(0.0,texelSize.y);',
  '  vB = vUv - vec2(0.0,texelSize.y);',
  '  gl_Position = vec4(aPosition,0.0,1.0);',
  '}'
].join('\n');

/* classic two-buffer ripple: r = height now, g = height one step ago */
var FRAG_WAVE = [
  'precision highp float;',
  'varying vec2 vUv, vL, vR, vT, vB;',
  'uniform sampler2D uWave;',
  'uniform float uDamp;',
  'void main(){',
  '  vec2 c = texture2D(uWave, vUv).rg;',
  '  float sum = texture2D(uWave, vL).r + texture2D(uWave, vR).r',
  '            + texture2D(uWave, vT).r + texture2D(uWave, vB).r;',
  '  float next = (sum * 0.5 - c.g) * uDamp;',
  /* absorb energy at the borders so rings never bounce back into the frame */
  '  float ek = smoothstep(0.0,0.03,vUv.x)*smoothstep(0.0,0.03,1.0-vUv.x)',
  '           * smoothstep(0.0,0.03,vUv.y)*smoothstep(0.0,0.03,1.0-vUv.y);',
  '  next *= mix(0.86, 1.0, ek);',
  '  gl_FragColor = vec4(next, c.r, 0.0, 1.0);',
  '}'
].join('\n');

var FRAG_SPLAT = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uTarget;',
  'uniform float uAspect, uRadius;',
  'uniform vec3 uColor;',
  'uniform vec2 uPoint;',
  'void main(){',
  '  vec2 p = vUv - uPoint;',
  '  p.x *= uAspect;',
  '  vec3 splat = exp(-dot(p,p)/uRadius) * uColor;',
  '  vec3 base = texture2D(uTarget, vUv).xyz + splat;',
  '  gl_FragColor = vec4(base, 1.0);',
  '}'
].join('\n');

/* ── noise, shared by the ambient pass ── */
var GLSL_NOISE = [
  'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }',
  'float vnoise(vec2 p){',
  '  vec2 i = floor(p), f = fract(p);',
  '  vec2 u = f*f*(3.0-2.0*f);',
  '  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), u.x),',
  '             mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);',
  '}',
  'float fbm3(vec2 p){',
  '  float v = 0.0, a = 0.5;',
  '  v += a*vnoise(p); p *= 2.03; a *= 0.5;',
  '  v += a*vnoise(p); p *= 2.01; a *= 0.5;',
  '  v += a*vnoise(p);',
  '  return v;',
  '}'
].join('\n');

/* ambient pass: the swell's GRADIENT, written to RG at AMB_RES.
   Paying 18 noise evaluations per pixel at full canvas resolution is the difference between
   a shader that runs and one that doesn't; here it costs one small quad per frame and the
   display pass gets it back with a single LINEAR fetch (the softness of the upsample is
   wanted — this is a swell, not a texture). */
var FRAG_AMB = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform float uTime;',
  GLSL_NOISE,
  'float swell(vec2 uv, float t){',
  '  vec2 q1 = uv * vec2(' + f(AMB_SX1) + ', ' + f(AMB_SY1) + ');',
  '  vec2 q2 = uv * vec2(' + f(AMB_SX2) + ', ' + f(AMB_SY2) + ');',
  '  float a = fbm3(q1 + vec2(t*0.021, -t*0.029));',
  '  float b = fbm3(q2 + vec2(-t*0.015, t*0.023) + 17.7);',
  '  return a*0.58 + b*0.42;',
  '}',
  'void main(){',
  '  float e = 0.0035;',
  '  float s0 = swell(vUv, uTime);',
  '  float sx = swell(vUv + vec2(e,0.0), uTime);',
  '  float sy = swell(vUv + vec2(0.0,e), uTime);',
  '  gl_FragColor = vec4((sx-s0)/e, (sy-s0)/e, 0.0, 1.0);',
  '}'
].join('\n');

/* display: a synthetic studio, reflected by the wave surface */
var FRAG_DISPLAY = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uWave, uAmbTex;',
  'uniform vec2 uWaveTexel, uRes;',
  'uniform float uVeil;',
  '',
  '/* the studio the mercury reflects — one key light, a vertical sweep, a horizon seam.',
  '   Every value is a locked site token, and nothing bottoms out to black: the hero has to',
  '   stay inside the page\'s own value range, which is exactly what the photograph did not. */',
  'vec3 env(vec3 r){',
  '  float y = clamp(r.y*0.5 + 0.5, 0.0, 1.0);',
  '  vec3 deep   = vec3(0.557,0.588,0.639);',   /* --chrome-2 #8E96A3 */
  '  vec3 chrome = vec3(0.780,0.800,0.839);',   /* --chrome-1 #C7CCD6 */
  '  vec3 mid    = vec3(0.929,0.933,0.949);',   /* --bg-deep  #EDEEF2 */
  '  vec3 sky    = vec3(0.965,0.965,0.972);',   /* --bg       #F5F5F7 */
  '  vec3 col = mix(deep, chrome, smoothstep(0.02, 0.36, y));',
  '  col = mix(col, mid, smoothstep(0.32, 0.58, y));',
  '  col = mix(col, sky, smoothstep(0.54, 0.86, y));',
  '  /* lilac ambient in the upper hemisphere — the page already casts this light on <html> */',
  '  col = mix(col, vec3(0.851,0.831,0.910), smoothstep(0.60,1.0,y)*0.20);',
  '  /* the horizon seam: a studio cyc wall. Without it a mirror reads as plastic. */',
  '  float seam = exp(-pow((y-0.5)*' + f(SEAM_W) + ', 2.0));',
  '  col = mix(col, vec3(1.0), seam*' + f(SEAM) + ');',
  '  /* key light, high left — the highlight that travels across the surface */',
  '  vec3 key = normalize(vec3(-0.38,0.66,0.65));',
  '  float kd = max(dot(r,key), 0.0);',
  '  col += vec3(1.0)*pow(kd,190.0)*0.80;',
  '  col += vec3(1.0)*pow(kd,14.0)*0.09;',
  '  /* dim fill from the right so the shadow side never goes dead */',
  '  vec3 fill = normalize(vec3(0.72,0.26,0.64));',
  '  col += vec3(0.92,0.93,0.96)*pow(max(dot(r,fill),0.0),30.0)*0.07;',
  '  return col;',
  '}',
  '',
  'void main(){',
  '  /* three terms bend the normal: the ripple field (zero at rest), the ambient swell,',
  '     and a wide shallow body curve so the field reads as liquid rather than a plane */',
  '  float hl = texture2D(uWave, vUv - vec2(uWaveTexel.x,0.0)).r;',
  '  float hr = texture2D(uWave, vUv + vec2(uWaveTexel.x,0.0)).r;',
  '  float hb = texture2D(uWave, vUv - vec2(0.0,uWaveTexel.y)).r;',
  '  float ht = texture2D(uWave, vUv + vec2(0.0,uWaveTexel.y)).r;',
  '  vec2 gWave = vec2(hr-hl, ht-hb) * 26.0;',
  '  vec2 gAmb  = texture2D(uAmbTex, vUv).rg * ' + f(AMB_AMT) + ';',
  '  vec2 gBody = -(vUv - vec2(0.5,' + f(BODY_Y) + ')) * ' + f(BODY_AMT) + ';',
  '',
  '  vec3 N = normalize(vec3(-(gWave + gAmb + gBody), 1.0));',
  '  vec3 V = vec3(0.0,0.0,1.0);',
  '  vec3 col = env(reflect(-V, N));',
  '  /* Fresnel — grazing angles brighten. Mercury is very nearly all mirror. */',
  '  col = mix(col, vec3(1.0), pow(1.0 - max(dot(N,V),0.0), 5.0)*0.12);',
  '  /* crest glint, only where the surface is actually moving */',
  '  float act = smoothstep(0.02, 0.55, length(gWave));',
  '  vec3 keyd = normalize(vec3(-0.38,0.66,0.65));',
  '  col += pow(max(dot(reflect(-keyd, N), V), 0.0), 90.0) * 0.34 * act;',
  '',
  '  col = mix(col, vec3(0.851, 0.867, 0.898), clamp(uVeil, 0.0, 1.0)*0.92);',
  '  /* dither — the environment is a very shallow gradient, which is exactly what bands at 8-bit */',
  '  float g = fract(sin(dot(vUv*uRes, vec2(12.9898,78.233)))*43758.5453);',
  '  col += (g-0.5)*0.012;',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

var FRAG_COPY_R = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uTex;',
  'void main(){ gl_FragColor = vec4(vec3(abs(texture2D(uTex, vUv).r)*4.0), 1.0); }'
].join('\n');

/* ── GL plumbing ── */
function compile(type, src){
  var s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){ throw new Error(gl.getShaderInfoLog(s)); }
  return s;
}
function program(fragSrc){
  var p = gl.createProgram();
  p && gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragSrc));
  gl.bindAttribLocation(p, 0, 'aPosition');
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p, gl.LINK_STATUS)){ throw new Error(gl.getProgramInfoLog(p)); }
  var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for(var i=0;i<n;i++){ var info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
  return { p:p, u:u };
}

var quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

function blit(target){
  if(target){ gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); gl.viewport(0, 0, target.w, target.h); }
  else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); }
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function createFBO(w, h){
  var tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFmt, w, h, 0, gl.RGBA, texType, null);
  var fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE){ return null; }
  return {
    tex:tex, fbo:fbo, w:w, h:h, texel:[1/w, 1/h],
    attach:function(id){ gl.activeTexture(gl.TEXTURE0+id); gl.bindTexture(gl.TEXTURE_2D, this.tex); return id; }
  };
}
function doubleFBO(w, h){
  var a = createFBO(w, h), b = createFBO(w, h);
  if(!a || !b){ return null; }
  return {
    w:w, h:h, texel:[1/w, 1/h],
    get read(){ return a; }, get write(){ return b; },
    swap:function(){ var t=a; a=b; b=t; }
  };
}

var progWave, progSplat, progDisplay, progCopy, progAmb;
try{
  progWave    = program(FRAG_WAVE);
  progSplat   = program(FRAG_SPLAT);
  progDisplay = program(FRAG_DISPLAY);
  progCopy    = program(FRAG_COPY_R);
  progAmb     = program(FRAG_AMB);
}catch(e){ fallback(); return; }

/* tiny RGBA8 target for surface-activity readback */
var COV = 16;
var covTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, covTex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, COV, COV, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
var covFbo = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, covFbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, covTex, 0);
var covOk = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
var covBuf = new Uint8Array(COV * COV * 4);
function coverage(){
  if(!covOk || !wave){ return null; }
  gl.useProgram(progCopy.p);
  gl.uniform1i(progCopy.u.uTex, wave.read.attach(0));
  gl.bindFramebuffer(gl.FRAMEBUFFER, covFbo);
  gl.viewport(0, 0, COV, COV);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.readPixels(0, 0, COV, COV, gl.RGBA, gl.UNSIGNED_BYTE, covBuf);
  var sum = 0;
  for(var i = 0; i < covBuf.length; i += 4){ sum += covBuf[i]; }
  return sum / (COV * COV) / 255;
}

/* ── field ── */
function simSize(base){
  var aspect = canvas.width / Math.max(canvas.height, 1);
  return aspect > 1
    ? { w:Math.round(base*aspect), h:base }
    : { w:base, h:Math.round(base/Math.max(aspect, 0.0001)) };
}
var wave;
function initFields(){
  var d = simSize(WAVE_RES);
  wave = doubleFBO(d.w, d.h);
  if(!wave){ fallback(); return false; }
  return true;
}

function resize(){
  var w = Math.max(2, Math.floor(wrap.clientWidth * DPR));
  var h = Math.max(2, Math.floor(wrap.clientHeight * DPR));
  if(canvas.width === w && canvas.height === h){ return true; }
  canvas.width = w; canvas.height = h;
  return initFields();
}
if(!resize()){ return; }

/* the ambient swell buffer — resolution-independent, so it survives a canvas resize */
var ambFbo = createFBO(AMB_RES, AMB_RES);
if(!ambFbo){ fallback(); return; }

/* ── impulses ── */
var splatQueue = [];
function queueSplat(x, y, amount){
  splatQueue.push({ x:x, y:y, a:amount });
  if(splatQueue.length > 24){ splatQueue.shift(); }
}
function applySplats(){
  if(!splatQueue.length){ return; }
  var aspect = canvas.width / Math.max(canvas.height, 1);
  gl.useProgram(progSplat.p);
  gl.uniform1f(progSplat.u.uAspect, aspect);
  gl.uniform1f(progSplat.u.uRadius, RADIUS_WAVE);
  for(var i=0;i<splatQueue.length;i++){
    var s = splatQueue[i];
    gl.uniform2f(progSplat.u.uPoint, s.x, s.y);
    /* press the surface down — rings radiate from the depression */
    gl.uniform3f(progSplat.u.uColor, -s.a, 0.0, 0.0);
    gl.uniform1i(progSplat.u.uTarget, wave.read.attach(0));
    blit(wave.write); wave.swap();
  }
  splatQueue.length = 0;
}

/* ── pointer ──
   Not bound under reduced motion: a ripple is motion, and the single static frame is the
   whole point of that path. */
var hero = document.querySelector('.hero') || wrap;
var px = 0.5, py = 0.5, hasPointer = false;
if(!reduced){
hero.addEventListener('pointermove', function(e){
  var r = canvas.getBoundingClientRect();
  if(r.width < 2 || r.height < 2){ return; }
  var x = (e.clientX - r.left) / r.width;
  var y = 1.0 - (e.clientY - r.top) / r.height;
  if(!hasPointer){ px = x; py = y; hasPointer = true; return; }
  var dx = x - px, dy = y - py;
  var speed = Math.sqrt(dx*dx + dy*dy);
  if(speed > 0.0004){
    var amt = Math.min(0.024 + speed*2.3, 0.085);
    var steps = Math.min(1 + Math.floor(speed/0.012), 4);
    for(var k=1;k<=steps;k++){ queueSplat(px + dx*k/steps, py + dy*k/steps, amt/steps + amt*0.6); }
  }
  px = x; py = y;
}, { passive:true });
hero.addEventListener('pointerleave', function(){ hasPointer = false; }, { passive:true });
hero.addEventListener('pointerdown', function(e){
  var r = canvas.getBoundingClientRect();
  if(r.width < 2 || r.height < 2){ return; }
  var x = (e.clientX - r.left) / r.width;
  var y = 1.0 - (e.clientY - r.top) / r.height;
  px = x; py = y; hasPointer = true;
  queueSplat(x, y, 0.09);
}, { passive:true });
}

/* ambient life: a rare droplet falls into the mercury, one quiet ring —
   the surface holds its swell and nothing else moves until it is touched.
   Confined to the right half, clear of both the type column on the left and the proof row
   along the bottom: a ring breaking across a client logo reads as a defect, and it put the
   only busy part of the surface exactly where the marks needed to stay legible. It also
   gives the empty right side of the composition something to do. */
var nextDrop = performance.now() + 2600;
function drift(now){
  if(now < nextDrop){ return; }
  nextDrop = now + 4200 + Math.random()*3400;
  queueSplat(0.52 + Math.random()*0.42, 0.34 + Math.random()*0.50, 0.042);
}

/* scripted intro — a wave crosses the pool as the page opens */
function intro(){
  var steps = 6;
  for(var i=0;i<steps;i++){
    (function(i){
      setTimeout(function(){
        queueSplat(0.16 + 0.68*(i/(steps-1)), 0.10, 0.06);
      }, i*110);
    })(i);
  }
}

/* ── frame loop ── */
var veil = 0, running = true, last = performance.now(), startT = last;

if('IntersectionObserver' in window){
  new IntersectionObserver(function(entries){
    running = entries[0].isIntersecting;
  }, { threshold:0 }).observe(wrap);
}
document.addEventListener('visibilitychange', function(){
  if(document.hidden){ running = false; }
  else { running = true; last = performance.now(); }
});

var resizeTimer = null;
window.addEventListener('resize', function(){
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resize, 180);
});

function step(){
  gl.disable(gl.BLEND);
  gl.useProgram(progWave.p);
  gl.uniform1f(progWave.u.uDamp, WAVE_DAMP);
  for(var i=0;i<WAVE_ITERS;i++){
    gl.uniform2f(progWave.u.texelSize, wave.texel[0], wave.texel[1]);
    gl.uniform1i(progWave.u.uWave, wave.read.attach(0));
    blit(wave.write); wave.swap();
  }
}

/* ambient pass — the swell's gradient, one small quad. On phones it updates every other
   frame: the swell is the part nobody is touching, so it yields budget to the ripples. */
function stepAmbient(t){
  gl.useProgram(progAmb.p);
  gl.uniform1f(progAmb.u.uTime, t);
  blit(ambFbo);
}

function render(){
  gl.useProgram(progDisplay.p);
  gl.uniform1i(progDisplay.u.uWave, wave.read.attach(0));
  gl.uniform1i(progDisplay.u.uAmbTex, ambFbo.attach(1));
  gl.uniform2f(progDisplay.u.uWaveTexel, wave.texel[0], wave.texel[1]);
  gl.uniform2f(progDisplay.u.uRes, canvas.width, canvas.height);
  gl.uniform1f(progDisplay.u.uVeil, veil);
  blit(null);
}

var frameN = 0;
function frame(now){
  requestAnimationFrame(frame);
  if(!running){ last = now; return; }
  var dt = Math.min((now - last)/1000, 0.033);
  last = now;
  if(dt <= 0){ return; }
  frameN++;
  if(!isMobile || (frameN & 1) === 0){ stepAmbient((now - startT)/1000); }
  drift(now);
  applySplats();
  step();
  render();
}

if(reduced){
  /* one frame, then nothing. A fixed time offset picks a settled configuration of the
     swell rather than the noise field's t=0 phase. `ok:false` stops mulle.js from running
     the intro, the idle splashes and the coverage poll — the canvas keeps its single frame.
     setVeil still redraws, because the scroll veil is a fade, not vestibular motion. */
  stepAmbient(12.0);
  render();
  window.MulleFluid = {
    ok:false,
    intro:function(){},
    setVeil:function(v){ veil = Math.max(0, Math.min(1, v)); render(); }
  };
}else{
  stepAmbient(0);
  requestAnimationFrame(frame);
  window.MulleFluid = {
    ok:true,
    intro:intro,
    setVeil:function(v){ veil = Math.max(0, Math.min(1, v)); },
    splash:function(x, y){ queueSplat(x, y, 0.07); },
    coverage:coverage
  };
}
})();