/* ──────────────────────────────────────────────────────────────────
   FRITZ — liquid mercury reveal
   Navier-Stokes fluid sim (stable fluids, ping-pong FBOs).
   The dye field is a mercury film covering a chrome light field;
   cursor velocity erases the film, the film slowly flows back.
   Future shader image: set REVEAL_IMAGE to a path — one line swap.
   ────────────────────────────────────────────────────────────────── */
(function(){
'use strict';

var REVEAL_IMAGE = null; /* e.g. 'assets/reveal.jpg' */

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
var SIM_RES        = isMobile ? 96  : 144;
var DYE_RES        = isMobile ? 384 : 560;
var PRESSURE_ITERS = 20;
var CURL           = 21;
var VEL_DISS       = 0.45;   /* velocity decay /s */
var REFILL         = 0.055;  /* mercury heals back /s */
var SPLAT_FORCE    = 5200;
var RADIUS_VEL     = 0.0021;
var RADIUS_ERASE   = 0.0042;
var DPR            = Math.min(window.devicePixelRatio || 1, 1.5);

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

var FRAG_ADVECT = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uVelocity, uSource;',
  'uniform vec2 texelSize;',
  'uniform float dt, uDecay, uRefill;',
  'void main(){',
  '  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;',
  '  vec4 c = texture2D(uSource, coord) * uDecay;',
  '  c.r = min(c.r + uRefill * dt, 1.0);',
  '  gl_FragColor = c;',
  '}'
].join('\n');

var FRAG_DIVERGENCE = [
  'precision mediump float;',
  'varying vec2 vUv, vL, vR, vT, vB;',
  'uniform sampler2D uVelocity;',
  'void main(){',
  '  float L = texture2D(uVelocity, vL).x;',
  '  float R = texture2D(uVelocity, vR).x;',
  '  float T = texture2D(uVelocity, vT).y;',
  '  float B = texture2D(uVelocity, vB).y;',
  '  vec2 C = texture2D(uVelocity, vUv).xy;',
  '  if(vL.x < 0.0){ L = -C.x; }',
  '  if(vR.x > 1.0){ R = -C.x; }',
  '  if(vT.y > 1.0){ T = -C.y; }',
  '  if(vB.y < 0.0){ B = -C.y; }',
  '  gl_FragColor = vec4(0.5*(R-L+T-B), 0.0, 0.0, 1.0);',
  '}'
].join('\n');

var FRAG_CURL = [
  'precision mediump float;',
  'varying vec2 vUv, vL, vR, vT, vB;',
  'uniform sampler2D uVelocity;',
  'void main(){',
  '  float L = texture2D(uVelocity, vL).y;',
  '  float R = texture2D(uVelocity, vR).y;',
  '  float T = texture2D(uVelocity, vT).x;',
  '  float B = texture2D(uVelocity, vB).x;',
  '  gl_FragColor = vec4(0.5*(R-L-T+B), 0.0, 0.0, 1.0);',
  '}'
].join('\n');

var FRAG_VORTICITY = [
  'precision highp float;',
  'varying vec2 vUv, vL, vR, vT, vB;',
  'uniform sampler2D uVelocity, uCurl;',
  'uniform float uCurlStrength, dt;',
  'void main(){',
  '  float L = texture2D(uCurl, vL).x;',
  '  float R = texture2D(uCurl, vR).x;',
  '  float T = texture2D(uCurl, vT).x;',
  '  float B = texture2D(uCurl, vB).x;',
  '  float C = texture2D(uCurl, vUv).x;',
  '  vec2 force = 0.5*vec2(abs(T)-abs(B), abs(R)-abs(L));',
  '  force /= length(force) + 0.0001;',
  '  force *= uCurlStrength * C;',
  '  force.y *= -1.0;',
  '  vec2 vel = texture2D(uVelocity, vUv).xy + force * dt;',
  '  gl_FragColor = vec4(clamp(vel,-1000.0,1000.0), 0.0, 1.0);',
  '}'
].join('\n');

var FRAG_PRESSURE = [
  'precision mediump float;',
  'varying vec2 vUv, vL, vR, vT, vB;',
  'uniform sampler2D uPressure, uDivergence;',
  'void main(){',
  '  float L = texture2D(uPressure, vL).x;',
  '  float R = texture2D(uPressure, vR).x;',
  '  float T = texture2D(uPressure, vT).x;',
  '  float B = texture2D(uPressure, vB).x;',
  '  float div = texture2D(uDivergence, vUv).x;',
  '  gl_FragColor = vec4((L+R+B+T-div)*0.25, 0.0, 0.0, 1.0);',
  '}'
].join('\n');

var FRAG_GRADIENT = [
  'precision mediump float;',
  'varying vec2 vUv, vL, vR, vT, vB;',
  'uniform sampler2D uPressure, uVelocity;',
  'void main(){',
  '  float L = texture2D(uPressure, vL).x;',
  '  float R = texture2D(uPressure, vR).x;',
  '  float T = texture2D(uPressure, vT).x;',
  '  float B = texture2D(uPressure, vB).x;',
  '  vec2 vel = texture2D(uVelocity, vUv).xy - vec2(R-L, T-B);',
  '  gl_FragColor = vec4(vel, 0.0, 1.0);',
  '}'
].join('\n');

var FRAG_SPLAT = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uTarget;',
  'uniform float uAspect, uRadius, uClamp;',
  'uniform vec3 uColor;',
  'uniform vec2 uPoint;',
  'void main(){',
  '  vec2 p = vUv - uPoint;',
  '  p.x *= uAspect;',
  '  vec3 splat = exp(-dot(p,p)/uRadius) * uColor;',
  '  vec3 base = texture2D(uTarget, vUv).xyz + splat;',
  '  if(uClamp > 0.5){ base = clamp(base, 0.0, 1.0); }',
  '  gl_FragColor = vec4(base, 1.0);',
  '}'
].join('\n');

/* mercury composite: chrome light field under a refracting metal film */
var FRAG_DISPLAY = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uDye, uImage;',
  'uniform vec2 uDyeTexel, uRes;',
  'uniform float uTime, uVeil, uHasImage;',
  '',
  'vec3 field(vec2 uv, float t){',
  '  vec3 c = vec3(0.929, 0.933, 0.949);',
  '  float g1 = exp(-pow(length(uv-vec2(0.24+0.05*sin(t*0.11), 0.12)), 2.0)*2.0);',
  '  c = mix(c, vec3(1.0), g1*0.9);',
  '  float g2 = exp(-pow(length(uv-vec2(0.88, 0.92)), 2.0)*1.5);',
  '  c = mix(c, vec3(0.557, 0.588, 0.639), g2*0.75);',
  '  float g3 = exp(-pow(length(uv-vec2(0.10, 0.86)), 2.0)*2.2);',
  '  c = mix(c, vec3(0.851, 0.831, 0.910), g3*0.85);',
  '  vec2 bp = vec2(0.62+0.16*cos(t*0.07), 0.46+0.15*sin(t*0.093));',
  '  float g4 = exp(-pow(length(uv-bp), 2.0)*4.2);',
  '  c = mix(c, vec3(0.0, 0.443, 0.890), g4*0.62);',
  '  float g5 = exp(-pow(length(uv-bp*vec2(1.0,1.1)-vec2(0.05,0.06)), 2.0)*9.0);',
  '  c = mix(c, vec3(0.55, 0.78, 1.0), g5*0.5);',
  '  return c;',
  '}',
  '',
  'void main(){',
  '  float d = texture2D(uDye, vUv).r;',
  '  d = clamp(d + uVeil*(1.0-d), 0.0, 1.0);',
  '  float dl = texture2D(uDye, vUv - vec2(uDyeTexel.x,0.0)).r;',
  '  float dr = texture2D(uDye, vUv + vec2(uDyeTexel.x,0.0)).r;',
  '  float db = texture2D(uDye, vUv - vec2(0.0,uDyeTexel.y)).r;',
  '  float dtp = texture2D(uDye, vUv + vec2(0.0,uDyeTexel.y)).r;',
  '  vec2 grad = vec2(dr-dl, dtp-db);',
  '  vec2 refr = grad * 0.07;',
  '  vec3 reveal = (uHasImage > 0.5)',
  '    ? texture2D(uImage, clamp(vUv+refr, 0.0, 1.0)).rgb',
  '    : field(vUv+refr, uTime);',
  '  vec3 n = normalize(vec3(-grad*4.0, 1.0));',
  '  vec3 lightDir = normalize(vec3(-0.4, 0.65, 0.75));',
  '  float diff = 0.5 + 0.5*dot(n, lightDir);',
  '  float spec = pow(max(dot(reflect(-lightDir, n), vec3(0.0,0.0,1.0)), 0.0), 26.0);',
  '  vec3 mercury = mix(vec3(0.760, 0.784, 0.824), vec3(0.972, 0.976, 0.986), diff);',
  '  mercury += spec * 0.55;',
  '  mercury = mix(mercury, reveal, 0.12);',
  '  float edge = clamp(length(grad)*6.0, 0.0, 1.0);',
  '  mercury = mix(mercury, vec3(0.0, 0.443, 0.890), edge*0.25*(1.0-d));',
  '  float cover = smoothstep(0.10, 0.85, d);',
  '  vec3 col = mix(reveal, mercury, cover);',
  '  float g = fract(sin(dot(vUv*uRes, vec2(12.9898,78.233)))*43758.5453);',
  '  col += (g-0.5)*0.014;',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
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
  gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
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

var FRAG_COPY_R = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uTex;',
  'void main(){ gl_FragColor = vec4(texture2D(uTex, vUv).rrr, 1.0); }'
].join('\n');

var progAdvect, progDiv, progCurl, progVort, progPress, progGrad, progSplat, progDisplay, progCopy;
try{
  progAdvect  = program(FRAG_ADVECT);
  progDiv     = program(FRAG_DIVERGENCE);
  progCurl    = program(FRAG_CURL);
  progVort    = program(FRAG_VORTICITY);
  progPress   = program(FRAG_PRESSURE);
  progGrad    = program(FRAG_GRADIENT);
  progSplat   = program(FRAG_SPLAT);
  progDisplay = program(FRAG_DISPLAY);
  progCopy    = program(FRAG_COPY_R);
}catch(e){ fallback(); return; }

/* tiny RGBA8 target for coverage readback (avg mercury-film amount) */
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
  if(!covOk || !dye){ return null; }
  gl.useProgram(progCopy.p);
  gl.uniform1i(progCopy.u.uTex, dye.read.attach(0));
  gl.bindFramebuffer(gl.FRAMEBUFFER, covFbo);
  gl.viewport(0, 0, COV, COV);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.readPixels(0, 0, COV, COV, gl.RGBA, gl.UNSIGNED_BYTE, covBuf);
  var sum = 0;
  for(var i = 0; i < covBuf.length; i += 4){ sum += covBuf[i]; }
  return sum / (COV * COV) / 255;
}

/* ── fields ── */
function simSize(base){
  var aspect = canvas.width / Math.max(canvas.height, 1);
  return aspect > 1
    ? { w:Math.round(base*aspect), h:base }
    : { w:base, h:Math.round(base/Math.max(aspect, 0.0001)) };
}
var velocity, pressure, divergence, curl, dye;
function initFields(){
  var s = simSize(SIM_RES), d = simSize(DYE_RES);
  velocity   = doubleFBO(s.w, s.h);
  pressure   = doubleFBO(s.w, s.h);
  divergence = createFBO(s.w, s.h);
  curl       = createFBO(s.w, s.h);
  dye        = doubleFBO(d.w, d.h);
  if(!velocity || !pressure || !divergence || !curl || !dye){ fallback(); return false; }
  /* flood the film: dye starts at full coverage */
  gl.useProgram(progSplat.p);
  gl.uniform1f(progSplat.u.uAspect, 1.0);
  gl.uniform1f(progSplat.u.uRadius, 100.0);
  gl.uniform1f(progSplat.u.uClamp, 1.0);
  gl.uniform2f(progSplat.u.uPoint, 0.5, 0.5);
  gl.uniform3f(progSplat.u.uColor, 1.0, 0.0, 0.0);
  gl.uniform1i(progSplat.u.uTarget, dye.read.attach(0));
  blit(dye.write); dye.swap();
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

/* optional reveal image */
var imageTex = null, hasImage = 0;
if(REVEAL_IMAGE){
  var img = new Image();
  img.onload = function(){
    imageTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    hasImage = 1;
  };
  img.src = REVEAL_IMAGE;
}

/* ── splats ── */
var splatQueue = [];
function queueSplat(x, y, dx, dy, erase){
  splatQueue.push({ x:x, y:y, dx:dx, dy:dy, erase:erase });
  if(splatQueue.length > 24){ splatQueue.shift(); }
}
function applySplats(){
  var aspect = canvas.width / Math.max(canvas.height, 1);
  gl.useProgram(progSplat.p);
  gl.uniform1f(progSplat.u.uAspect, aspect);
  for(var i=0;i<splatQueue.length;i++){
    var s = splatQueue[i];
    gl.uniform2f(progSplat.u.uPoint, s.x, s.y);
    /* velocity impulse */
    gl.uniform1f(progSplat.u.uRadius, RADIUS_VEL);
    gl.uniform1f(progSplat.u.uClamp, 0.0);
    gl.uniform3f(progSplat.u.uColor, s.dx*SPLAT_FORCE, s.dy*SPLAT_FORCE, 0.0);
    gl.uniform1i(progSplat.u.uTarget, velocity.read.attach(0));
    blit(velocity.write); velocity.swap();
    /* erase mercury */
    gl.uniform1f(progSplat.u.uRadius, RADIUS_ERASE);
    gl.uniform1f(progSplat.u.uClamp, 1.0);
    gl.uniform3f(progSplat.u.uColor, -s.erase, 0.0, 0.0);
    gl.uniform1i(progSplat.u.uTarget, dye.read.attach(0));
    blit(dye.write); dye.swap();
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
  if(speed > 0.0002){
    queueSplat(x, y, dx, dy, Math.min(0.09 + speed*26.0, 0.6));
  }
  px = x; py = y;
}, { passive:true });
hero.addEventListener('pointerleave', function(){ hasPointer = false; }, { passive:true });

/* idle drift — keeps the surface alive without a cursor (touch, idle) */
var driftT = Math.random()*100, lastDrift = 0;
function drift(now, dt){
  if(now - lastDrift < 55){ return; }
  lastDrift = now;
  driftT += dt*0.7;
  /* two churn points keep the mercury visibly flowing even untouched */
  var x1 = 0.5 + 0.4*Math.sin(driftT*0.9) * Math.cos(driftT*0.37);
  var y1 = 0.46 + 0.34*Math.sin(driftT*0.63 + 1.7);
  queueSplat(x1, y1, 0.0034*Math.cos(driftT*0.9), 0.0034*Math.sin(driftT*0.71), 0.03);
  var x2 = 0.5 + 0.42*Math.cos(driftT*0.5 + 2.0);
  var y2 = 0.5 + 0.36*Math.sin(driftT*0.8);
  queueSplat(x2, y2, -0.003*Math.sin(driftT*0.6), 0.003*Math.cos(driftT*0.45), 0.022);
}

/* scripted intro wipe — called after the preloader lifts */
function intro(){
  var steps = 14;
  for(var i=0;i<steps;i++){
    (function(i){
      setTimeout(function(){
        var k = i/(steps-1);
        var x = 0.18 + 0.64*k;
        var y = 0.55 + 0.16*Math.sin(k*Math.PI*1.4);
        queueSplat(x, y, 0.012, 0.004*Math.cos(k*6.0), 0.5);
      }, i*46);
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

function step(dt){
  gl.disable(gl.BLEND);

  /* curl + vorticity confinement */
  gl.useProgram(progCurl.p);
  gl.uniform2f(progCurl.u.texelSize, velocity.texel[0], velocity.texel[1]);
  gl.uniform1i(progCurl.u.uVelocity, velocity.read.attach(0));
  blit(curl);

  gl.useProgram(progVort.p);
  gl.uniform2f(progVort.u.texelSize, velocity.texel[0], velocity.texel[1]);
  gl.uniform1i(progVort.u.uVelocity, velocity.read.attach(0));
  gl.uniform1i(progVort.u.uCurl, curl.attach(1));
  gl.uniform1f(progVort.u.uCurlStrength, CURL);
  gl.uniform1f(progVort.u.dt, dt);
  blit(velocity.write); velocity.swap();

  /* incompressibility */
  gl.useProgram(progDiv.p);
  gl.uniform2f(progDiv.u.texelSize, velocity.texel[0], velocity.texel[1]);
  gl.uniform1i(progDiv.u.uVelocity, velocity.read.attach(0));
  blit(divergence);

  gl.useProgram(progPress.p);
  gl.uniform2f(progPress.u.texelSize, velocity.texel[0], velocity.texel[1]);
  gl.uniform1i(progPress.u.uDivergence, divergence.attach(1));
  for(var i=0;i<PRESSURE_ITERS;i++){
    gl.uniform1i(progPress.u.uPressure, pressure.read.attach(0));
    blit(pressure.write); pressure.swap();
  }

  gl.useProgram(progGrad.p);
  gl.uniform2f(progGrad.u.texelSize, velocity.texel[0], velocity.texel[1]);
  gl.uniform1i(progGrad.u.uPressure, pressure.read.attach(0));
  gl.uniform1i(progGrad.u.uVelocity, velocity.read.attach(1));
  blit(velocity.write); velocity.swap();

  /* advect velocity (decay, no refill) */
  gl.useProgram(progAdvect.p);
  gl.uniform2f(progAdvect.u.texelSize, velocity.texel[0], velocity.texel[1]);
  gl.uniform1f(progAdvect.u.dt, dt);
  gl.uniform1f(progAdvect.u.uDecay, Math.exp(-VEL_DISS*dt));
  gl.uniform1f(progAdvect.u.uRefill, 0.0);
  gl.uniform1i(progAdvect.u.uVelocity, velocity.read.attach(0));
  gl.uniform1i(progAdvect.u.uSource, velocity.read.attach(0));
  blit(velocity.write); velocity.swap();

  /* advect mercury film (no decay, slow refill) */
  gl.uniform1f(progAdvect.u.uDecay, 1.0);
  gl.uniform1f(progAdvect.u.uRefill, REFILL);
  gl.uniform1i(progAdvect.u.uVelocity, velocity.read.attach(0));
  gl.uniform1i(progAdvect.u.uSource, dye.read.attach(1));
  blit(dye.write); dye.swap();
}

function render(now){
  gl.useProgram(progDisplay.p);
  gl.uniform1i(progDisplay.u.uDye, dye.read.attach(0));
  if(imageTex){ gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, imageTex); gl.uniform1i(progDisplay.u.uImage, 1); }
  gl.uniform2f(progDisplay.u.uDyeTexel, dye.texel[0], dye.texel[1]);
  gl.uniform2f(progDisplay.u.uRes, canvas.width, canvas.height);
  gl.uniform1f(progDisplay.u.uTime, (now - startT)/1000);
  gl.uniform1f(progDisplay.u.uVeil, veil);
  gl.uniform1f(progDisplay.u.uHasImage, hasImage);
  blit(null);
}

function frame(now){
  requestAnimationFrame(frame);
  if(!running){ last = now; return; }
  var dt = Math.min((now - last)/1000, 0.033);
  last = now;
  if(dt <= 0){ return; }
  drift(now, dt);
  applySplats();
  step(dt);
  render(now);
}
requestAnimationFrame(frame);

window.MulleFluid = {
  ok:true,
  intro:intro,
  setVeil:function(v){ veil = Math.max(0, Math.min(1, v)); },
  splash:function(x, y){ queueSplat(x, y, 0.004, 0.004, 0.4); },
  coverage:coverage
};
})();
