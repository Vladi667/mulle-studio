/* ──────────────────────────────────────────────────────────────────
   FRITZ — liquid mercury surface
   Damped wave height-field over the mercury-massif photograph.
   The image is crisp at rest; the cursor presses the surface and
   clean rings radiate, refracting the picture like ripples on
   mercury, then settle. Rare droplets fall into the pool.
   (Replaces the earlier Navier-Stokes film — dye advection smears
   like smoke over a photograph; a wave field ripples like liquid.)
   ────────────────────────────────────────────────────────────────── */
(function(){
'use strict';

var REVEAL_IMAGE = '/assets/hero-mercury.jpg';   /* absolute: shared by EN (root) and FR (/fr/) pages */

var wrap = document.querySelector('.fluid-wrap');
var canvas = document.getElementById('fluid');
if(!wrap || !canvas) return;

var reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
function fallback(){ wrap.classList.add('fallback'); window.MulleFluid = { ok:false, intro:function(){}, setVeil:function(){} }; }
if(reduced){ fallback(); return; }

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
/* vertical framing — the raw photo sits its waterline at ~80% of the frame, too low
   for a wordmark to rest on. A negative shift samples deeper into the pool, lifting the
   waterline to ~60% so the massif surfaces mid-frame with the mirror pool spread below. */
var IMG_SHIFT   = -0.185;
var DPR         = Math.min(window.devicePixelRatio || 1, 1.5);

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

/* display: the photograph, refracted by the wave surface */
var FRAG_DISPLAY = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uWave, uImage;',
  'uniform vec2 uWaveTexel, uRes;',
  'uniform float uVeil, uHasImage, uImageAspect, uImgShift;',
  '',
  '/* object-fit:cover so the image never stretches */',
  'vec2 coverUV(vec2 uv, vec2 res, float imgAspect){',
  '  float ca = res.x / max(res.y, 1.0);',
  '  vec2 s = vec2(1.0);',
  '  if(ca > imgAspect){ s.y = imgAspect / ca; } else { s.x = ca / imgAspect; }',
  '  return (uv - 0.5) * s + 0.5;',
  '}',
  '',
  'void main(){',
  '  float h  = texture2D(uWave, vUv).r;',
  '  float hl = texture2D(uWave, vUv - vec2(uWaveTexel.x,0.0)).r;',
  '  float hr = texture2D(uWave, vUv + vec2(uWaveTexel.x,0.0)).r;',
  '  float hb = texture2D(uWave, vUv - vec2(0.0,uWaveTexel.y)).r;',
  '  float ht = texture2D(uWave, vUv + vec2(0.0,uWaveTexel.y)).r;',
  '  vec2 grad = vec2(hr-hl, ht-hb);',
  '  vec2 disp = grad * 0.78;',
  '  vec2 imgUv = clamp(coverUV(vUv, uRes, uImageAspect) + disp + vec2(0.0, uImgShift), 0.001, 0.999);',
  '  vec3 col = (uHasImage > 0.5) ? texture2D(uImage, imgUv).rgb : vec3(0.945, 0.949, 0.957);',
  '  /* mercury glint riding the wave crests — the only additive light */',
  '  vec3 n = normalize(vec3(-grad*10.0, 1.0));',
  '  vec3 lightDir = normalize(vec3(-0.4, 0.65, 0.75));',
  '  float spec = pow(max(dot(reflect(-lightDir, n), vec3(0.0,0.0,1.0)), 0.0), 48.0);',
  '  float act = smoothstep(0.0015, 0.02, abs(h) + length(grad));',
  '  col += spec * 0.30 * act;',
  '  col *= 1.0 - clamp(-h*0.8, 0.0, 0.03);',
  '  col = mix(col, vec3(0.851, 0.867, 0.898), clamp(uVeil, 0.0, 1.0)*0.92);',
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

var progWave, progSplat, progDisplay, progCopy;
try{
  progWave    = program(FRAG_WAVE);
  progSplat   = program(FRAG_SPLAT);
  progDisplay = program(FRAG_DISPLAY);
  progCopy    = program(FRAG_COPY_R);
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

/* the photograph */
var imageTex = null, hasImage = 0, imageAspect = 16/9;
if(REVEAL_IMAGE){
  var img = new Image();
  img.onload = function(){
    imageAspect = img.width / Math.max(img.height, 1);
    imageTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    hasImage = 1;
  };
  img.src = REVEAL_IMAGE;
}

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

/* ── pointer ── */
var hero = document.querySelector('.hero') || wrap;
var px = 0.5, py = 0.5, hasPointer = false;
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

/* ambient life: a rare droplet falls into the mercury pool (the image's own liquid),
   one quiet ring — the massif itself stays perfectly still until touched */
var nextDrop = performance.now() + 2600;
function drift(now){
  if(now < nextDrop){ return; }
  nextDrop = now + 4200 + Math.random()*3400;
  queueSplat(0.22 + Math.random()*0.56, 0.06 + Math.random()*0.10, 0.042);
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

function render(){
  gl.useProgram(progDisplay.p);
  gl.uniform1i(progDisplay.u.uWave, wave.read.attach(0));
  if(imageTex){ gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, imageTex); gl.uniform1i(progDisplay.u.uImage, 1); }
  gl.uniform2f(progDisplay.u.uWaveTexel, wave.texel[0], wave.texel[1]);
  gl.uniform2f(progDisplay.u.uRes, canvas.width, canvas.height);
  gl.uniform1f(progDisplay.u.uVeil, veil);
  gl.uniform1f(progDisplay.u.uHasImage, hasImage);
  if(progDisplay.u.uImageAspect){ gl.uniform1f(progDisplay.u.uImageAspect, imageAspect); }
  if(progDisplay.u.uImgShift){ gl.uniform1f(progDisplay.u.uImgShift, IMG_SHIFT); }
  blit(null);
}

function frame(now){
  requestAnimationFrame(frame);
  if(!running){ last = now; return; }
  var dt = Math.min((now - last)/1000, 0.033);
  last = now;
  if(dt <= 0){ return; }
  drift(now);
  applySplats();
  step();
  render();
}
requestAnimationFrame(frame);

window.MulleFluid = {
  ok:true,
  intro:intro,
  setVeil:function(v){ veil = Math.max(0, Math.min(1, v)); },
  splash:function(x, y){ queueSplat(x, y, 0.07); },
  coverage:coverage
};
})();