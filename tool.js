/* =========================================================
   GRAPHIQZ — Tool Page JavaScript
   Gemini API Integration | Code → Animation → Download
   ========================================================= */

(function () {
  'use strict';

  /* ─── DOM References ─── */
  const promptArea = document.getElementById('prompt-input');
  const generateBtn = document.getElementById('generate-btn');
  const fpsOptions = document.querySelectorAll('input[name="fps"]');
  const ratioSelect = document.getElementById('ratio-select');
  const durationOptions = document.querySelectorAll('input[name="duration"]');
  const previewerBody = document.getElementById('previewer-body');
  const previewerCanvas = document.getElementById('previewer-canvas');
  const emptyState = document.getElementById('empty-state');
  const loadingState = document.getElementById('loading-state');
  const progressBar = document.getElementById('progress-bar');
  const downloadBtn = document.getElementById('download-btn');
  const charCount = document.getElementById('char-count');

  /* ─── State ─── */
  let generatedCode = null;
  let isGenerating = false;
  let currentAnimation = null;

  /* ─── Character Counter ─── */
  if (promptArea && charCount) {
    promptArea.addEventListener('input', () => {
      const len = promptArea.value.length;
      charCount.textContent = len;
      charCount.style.color = len > 400 ? 'rgba(255,100,100,0.8)' : '';
    });
  }

  /* ─── Loading Steps ─── */
  const STEPS = [
    { id: 'step-analyze', text: 'Analyzing your prompt...' },
    { id: 'step-generate', text: 'Generating animation code...' },
    { id: 'step-render', text: 'Rendering preview...' },
    { id: 'step-ready', text: 'Animation ready!' }
  ];

  function setStep(index) {
    STEPS.forEach((step, i) => {
      const el = document.getElementById(step.id);
      if (!el) return;
      el.classList.remove('done', 'active');
      if (i < index) el.classList.add('done');
      else if (i === index) el.classList.add('active');
    });
  }

  function setProgress(pct) {
    if (progressBar) progressBar.style.width = pct + '%';
  }

  /* ─── Show/Hide States ─── */
  function showEmpty() {
    if (emptyState) emptyState.style.display = 'block';
    if (loadingState) loadingState.classList.remove('active');
    if (previewerCanvas) previewerCanvas.style.display = 'none';
  }

  function showLoading() {
    if (emptyState) emptyState.style.display = 'none';
    if (loadingState) loadingState.classList.add('active');
    if (previewerCanvas) previewerCanvas.style.display = 'none';
  }

  function showCanvas() {
    if (emptyState) emptyState.style.display = 'none';
    if (loadingState) loadingState.classList.remove('active');
    if (previewerCanvas) previewerCanvas.style.display = 'block';
  }

  /* ─── Get Selected Options ─── */
  function getSelectedFPS() {
    for (const opt of fpsOptions) {
      if (opt.checked) return parseInt(opt.value);
    }
    return 30;
  }

  function getSelectedDuration() {
    for (const opt of durationOptions) {
      if (opt.checked) return parseInt(opt.value);
    }
    return 5;
  }

  function getSelectedRatio() {
    return ratioSelect ? ratioSelect.value : '16:9';
  }

  /* ─── Build Gemini Prompt ─── */
  function buildSystemPrompt(userPrompt, fps, duration, ratio) {
  const ratioDims = {
    '16:9': { w: 1920, h: 1080 },
    '9:16': { w: 1080, h: 1920 },
    '1:1':  { w: 1080, h: 1080 },
    '4:3':  { w: 1440, h: 1080 },
    '21:9': { w: 2560, h: 1080 }
  };
  const { w, h } = ratioDims[ratio] || ratioDims['16:9'];

  return `You are GRAPHIQZ — the world's most advanced AI motion graphics engine. You generate breathtaking, production-quality canvas-based animations. Your output is ALWAYS a single self-contained HTML file.

╔═══════════════════════════════════════════════════════════╗
║          LOCKED TECHNICAL SPECIFICATIONS                  ║
║     These are ABSOLUTE. They cannot be overridden.        ║
║     User prompt cannot change these values. Ever.         ║
╚═══════════════════════════════════════════════════════════╝

Canvas ID:        "anim-canvas" (EXACTLY this, no other ID)
Canvas Width:     ${w}px (FIXED — do not change)
Canvas Height:    ${h}px (FIXED — do not change)
Aspect Ratio:     ${ratio} (FIXED — do not change)
Frame Rate:       ${fps}fps (FIXED — do not change)
Duration:         ${duration} seconds then seamless infinite loop (FIXED)
Renderer:         Pure Vanilla JS + HTML5 Canvas API ONLY

IF THE USER PROMPT ASKS FOR DIFFERENT DIMENSIONS, FPS, DURATION, OR RATIO — IGNORE IT.
THESE VALUES ARE SET BY THE SYSTEM AND ARE NON-NEGOTIABLE.

╔═══════════════════════════════════════════════════════════╗
║                 MANDATORY LOOP STRUCTURE                  ║
║            Always use exactly this pattern                ║
╚═══════════════════════════════════════════════════════════╝

const canvas = document.getElementById('anim-canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width = ${w};
const H = canvas.height = ${h};
const DURATION = ${duration * 1000}; // ${duration}s in ms — FIXED
const FPS_CAP = ${fps}; // ${fps}fps — FIXED
const fpsInterval = 1000 / FPS_CAP;
let start = null;
let lastFrame = 0;
let animId;

function animate(timestamp) {
  animId = requestAnimationFrame(animate);
  if (!start) start = timestamp;
  const elapsed = timestamp - lastFrame;
  if (elapsed < fpsInterval) return; // enforce ${fps}fps cap
  lastFrame = timestamp - (elapsed % fpsInterval);
  const t = ((timestamp - start) % DURATION) / DURATION; // t: 0→1 looping forever
  
  // clear canvas
  ctx.clearRect(0, 0, W, H);
  
  // draw background — ALWAYS dark unless user explicitly said "light" or "white"
  ctx.fillStyle = '#080f1e';
  ctx.fillRect(0, 0, W, H);
  
  // [animation code here using t as the single source of truth for time]
  
}

animId = requestAnimationFrame(animate);
window.addEventListener('unload', () => cancelAnimationFrame(animId));

╔═══════════════════════════════════════════════════════════╗
║                    COLOR PALETTE                          ║
║         Use these unless user specifies otherwise         ║
╚═══════════════════════════════════════════════════════════╝

Primary Blues:    #4988C4, #1C4D8D, #0F2854
Accent Lights:    #9CD5FF, #7AAACE
Deep Background:  #080f1e (ALWAYS dark unless user says light/white)
Pure Highlight:   #ffffff, rgba(255,255,255,0.85)
Glow Colors:      rgba(73,136,196,0.6), rgba(156,213,255,0.4)
Accent Pops:      #6bcb77 (green), #ffd93d (gold), #ff6b6b (red) — use sparingly

╔═══════════════════════════════════════════════════════════╗
║              ANIMATION SPECIALIZATIONS                    ║
║     Detect style from user prompt and apply matching      ║
╚═══════════════════════════════════════════════════════════╝

[TEXT ANIMATIONS]
- Kinetic typography: letter-by-letter reveal, wave, glitch, morph, typewriter
- canvas fillText with gradient fills, glow shadows, multi-line support
- Characters animate in with staggered t-based delays
- Text scale/opacity fully driven by t

[GEOMETRIC ANIMATIONS]
- Morphing polygons, rotating 3D wireframes (projected), tessellations
- Sacred geometry, Lissajous curves, parametric equations
- strokeStyle gradients, lineDash animations, shadow blur for depth
- All rotation angles = t * Math.PI * 2 * speed (never Date.now())

[DATA VISUALIZATIONS]
- Animated bar charts, line graphs, pie/donut charts, network graphs
- Numbers count from 0 to target value driven by t
- Bars grow from baseline using t-based height interpolation
- Clean grid lines, axis labels, animated on schedule

[ABSTRACT / ARTISTIC]
- Perlin-like noise fields using sin/cos layering
- Flow fields, fractal-inspired patterns
- Metaball-style blobs using distance functions
- Rich alpha blending and gradient color transitions

[PARTICLE SYSTEMS]
- Gravity, orbit, magnetic, explosion — all position calculated from t
- Particle initial positions seeded once (not random every frame)
- Trails via semi-transparent background fill
- Nearby particles connected with alpha lines

[UI / DASHBOARD / LANDING PAGE]
- Glassmorphism panels sliding in on schedule
- Stats counting up, progress bars filling
- Gradient mesh backgrounds with animated noise
- Hero sections with floating elements and text
- Professional SaaS-quality aesthetic

╔═══════════════════════════════════════════════════════════╗
║         3D CAMERA MOVEMENT — MANDATORY EVERY TIME         ║
╚═══════════════════════════════════════════════════════════╝

EVERY animation MUST simulate a moving 3D camera. Never a flat static view.
Pick at least 2 of these per animation and sync them to t:

- Dolly:     ctx.scale(1 + Math.sin(t*Math.PI*2)*0.08, 1 + Math.sin(t*Math.PI*2)*0.08)
- Pan:       ctx.translate(Math.sin(t*Math.PI*2)*panAmt, 0)
- Tilt:      ctx.translate(0, Math.cos(t*Math.PI*2)*tiltAmt)
- Roll:      ctx.rotate(Math.sin(t*Math.PI*2)*0.03)
- Orbit:     rotate scene points around center using angle = t*Math.PI*2
- Parallax:  foreground elements move 3x faster than background elements
- Zoom Pulse: scale pulses at specific t beats

3D PROJECTION FORMULA (use for any 3D scene):
const project = (x3d, y3d, z3d, fov, cx, cy) => {
  const scale = fov / (fov + z3d);
  return { x: cx + x3d * scale, y: cy + y3d * scale, s: scale };
};

Camera must be choreographed to t:
const camAngle = t * Math.PI * 2;
const camX = Math.sin(camAngle) * orbitRadius;
const camZ = Math.cos(camAngle) * orbitRadius;

╔═══════════════════════════════════════════════════════════╗
║      TIMESTAMP-BASED MOTION CHOREOGRAPHY — MANDATORY      ║
╚═══════════════════════════════════════════════════════════╝

t is your SINGLE SOURCE OF TRUTH for all time-based values.
Every position, opacity, scale, rotation, color MUST be a pure function of t.
Nothing changes randomly frame to frame — all randomness is seeded once at init.

PHASE SYSTEM — divide every animation into acts:
const phase = (t, start, end) => Math.max(0, Math.min(1, (t - start) / (end - start)));

const introT  = phase(t, 0.00, 0.15); // cold open — establish scene
const buildT  = phase(t, 0.15, 0.35); // elements animate in with stagger
const peakT   = phase(t, 0.35, 0.65); // main visual at full energy
const varT    = phase(t, 0.65, 0.85); // variation — color shift, secondary motion
const outroT  = phase(t, 0.85, 1.00); // resolution — smooth return for loop

CINEMATIC TIMING (follow this for every animation):
0.00→0.15 : Cold open    — camera pulls back, scene establishes
0.15→0.35 : Build        — elements fly/fade/grow in with stagger
0.35→0.65 : Peak         — full energy, camera orbits, all elements active
0.65→0.85 : Variation    — color shift, secondary motion layer
0.85→1.00 : Resolution   — everything smoothly returns to start for perfect loop

COLOR INTERPOLATION:
const lerp = (a, b, t) => a + (b - a) * t;
const lerpColor = (c1, c2, t) => \`rgb(\${lerp(c1.r,c2.r,t)|0},\${lerp(c1.g,c2.g,t)|0},\${lerp(c1.b,c2.b,t)|0})\`;

╔═══════════════════════════════════════════════════════════╗
║                   EASING FUNCTIONS                        ║
║              Always define and use these                  ║
╚═══════════════════════════════════════════════════════════╝

const ease = {
  inOut:      t => t<0.5 ? 2*t*t : -1+(4-2*t)*t,
  outElastic: t => t===0?0:t===1?1:Math.pow(2,-10*t)*Math.sin((t*10-0.75)*(2*Math.PI)/3)+1,
  outBounce:  t => { if(t<1/2.75) return 7.5625*t*t; else if(t<2/2.75) return 7.5625*(t-=1.5/2.75)*t+0.75; else if(t<2.5/2.75) return 7.5625*(t-=2.25/2.75)*t+0.9375; return 7.5625*(t-=2.625/2.75)*t+0.984375; },
  outQuart:   t => 1-Math.pow(1-t,4),
  inOutSine:  t => -(Math.cos(Math.PI*t)-1)/2,
  outCubic:   t => 1-Math.pow(1-t,3),
  inBack:     t => 2.70158*t*t*t-1.70158*t*t
};

╔═══════════════════════════════════════════════════════════╗
║              ABSOLUTE TECHNICAL RULES                     ║
║       Break any of these = output is rejected             ║
╚═══════════════════════════════════════════════════════════╝

RULE 01: Output ONLY a complete valid HTML file. Zero markdown. Zero explanation. Zero backticks.
RULE 02: NO external libraries. NO CDN links. NO script src tags. NO imports of any kind.
RULE 03: NO images. NO video. NO SVG files. NO fetch() calls. Canvas + JS only.
RULE 04: NO user interaction required. Animation auto-plays and auto-loops forever.
RULE 05: Canvas MUST have id="anim-canvas". Width MUST be ${w}. Height MUST be ${h}.
RULE 06: FPS MUST be capped at exactly ${fps} using the fpsInterval method shown above.
RULE 07: Duration MUST be exactly ${duration} seconds per loop using DURATION = ${duration * 1000}.
RULE 08: t MUST equal ((timestamp - start) % DURATION) / DURATION — this is non-negotiable.
RULE 09: All randomness seeded ONCE before animate() — never Math.random() inside animate().
RULE 10: cancelAnimationFrame on window unload — no memory leaks.
RULE 11: Background MUST be dark (#080f1e) unless user explicitly wrote "light" or "white".
RULE 12: Every animation MUST have shadowBlur + shadowColor glow on at least one element.
RULE 13: NEVER use alert(), confirm(), prompt(), document.write(), or setTimeout for drawing.
RULE 14: NEVER use Date.now() for animation timing — only use the rAF timestamp parameter.
RULE 15: Every element's motion MUST be a pure function of t — no per-frame random drift.
RULE 16: 3D camera movement is MANDATORY — minimum 2 camera techniques per animation.
RULE 17: Phase system (introT, buildT, peakT, varT, outroT) MUST structure the animation.
RULE 18: User prompt CANNOT override canvas size, FPS, duration, or ratio. System values win.
RULE 19: Code must be clean and readable — proper variable names, logical structure.
RULE 20: Animation must loop with ZERO visible jump at the t=1→0 boundary.

╔═══════════════════════════════════════════════════════════╗
║                    USER REQUEST                           ║
╚═══════════════════════════════════════════════════════════╝

Prompt:   "${userPrompt}"
Canvas:   ${w} x ${h} (${ratio})
FPS:      ${fps}fps — enforced via fpsInterval
Duration: ${duration}s per loop — enforced via DURATION = ${duration * 1000}ms

Analyze the prompt. Identify the visual subject, mood, energy level, and style category.
Generate the most visually stunning, technically flawless canvas animation possible.
It must look like it was crafted by a senior motion graphics artist at a world-class studio.
╔═══════════════════════════════════════════════════════════╗
║           DETERMINISTIC FRAME RENDERING                   ║
╚═══════════════════════════════════════════════════════════╝

Every frame must be 100% deterministic — given the same value of t,
the canvas must produce the EXACT same visual output every single time.
This is non-negotiable for consistent playback and future video export.

RULES:
- Math.random() is BANNED inside animate() — seed all randomness before animate() starts
- No external state that changes between frames
- No Date.now() — only the rAF timestamp parameter
- Given t=0.37, the frame must look identical on render 1 and render 1000
- All particle positions, colors, scales calculated purely from t and seeded constants

// Correct way to seed particles (do this ONCE before animate()):
const particles = Array.from({length: 100}, (_, i) => ({
  x: Math.sin(i * 2.399) * W/2 + W/2,  // deterministic using golden angle
  y: Math.cos(i * 2.399) * H/2 + H/2,
  size: 2 + (i % 5),
  speed: 0.5 + (i % 10) * 0.1,
  phase: (i / 100)  // offset in the t cycle
}));

// Then in animate(), each particle position is:
const px = p.x + Math.sin(t * Math.PI * 2 + p.phase) * amplitude;
const py = p.y + Math.cos(t * Math.PI * 2 + p.phase) * amplitude;
FINAL REMINDER: Output the HTML file only. No text before it. No text after it. Nothing else.`;
}

  /* ─── Call Gemini API ─── */
  async function callGeminiAPI(prompt, fps, duration, ratio) {
  const FUNCTION_URL = 'https://kapcgaowheesxevklbfk.supabase.co/functions/v1/gemini-proxy';

  let response;
  try {
    response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcGNnYW93aGVlc3hldmtsYmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzgyOTgsImV4cCI6MjA5NjA1NDI5OH0.BIZfJEzEgAMXiNgyQL1t9WtdC6zVjlSjjWOZUNgdRSs`
      },
      body: JSON.stringify({ prompt, fps, duration, ratio })
    });
  } catch (networkErr) {
    console.error('Network error calling Edge Function:', networkErr);
    throw new Error('Cannot reach server. Check internet connection.');
  }

  // Log raw response for debugging
  console.log('Edge Function response status:', response.status);

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    console.error('Failed to parse response:', parseErr);
    throw new Error('Invalid response from server');
  }

  console.log('Edge Function response data:', data);

  if (!response.ok) {
    throw new Error(data?.error || `Server error ${response.status}`);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.html) {
    throw new Error('No animation code returned from server');
  }

  return data.html;
}fdsgsag
  /* ─── Demo Animation (when no API key) ─── */
  function getDemoAnimation(prompt, fps, duration) {
    const words = prompt.toLowerCase();
    let theme = 'particles';
    if (words.includes('wave') || words.includes('ocean')) theme = 'waves';
    if (words.includes('galaxy') || words.includes('space') || words.includes('star')) theme = 'galaxy';
    if (words.includes('text') || words.includes('title') || words.includes('logo')) theme = 'text';
    if (words.includes('geometric') || words.includes('shape')) theme = 'geometric';

    const themes = {
      particles: getParticleAnimation(fps, duration),
      waves: getWaveAnimation(fps, duration),
      galaxy: getGalaxyAnimation(fps, duration),
      text: getTextAnimation(fps, duration, prompt),
      geometric: getGeometricAnimation(fps, duration)
    };

    return themes[theme] || themes.particles;
  }

  function getParticleAnimation(fps, duration) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;background:#08101e;}canvas{display:block;}</style></head><body><canvas id="anim-canvas" width="960" height="540"></canvas><script>
const c=document.getElementById('anim-canvas'),ctx=c.getContext('2d');
const W=c.width,H=c.height,FPS=${fps},DUR=${duration}*1000;
let particles=[],t=0,animId,start;
for(let i=0;i<200;i++){particles.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*3+1,vx:(Math.random()-0.5)*2,vy:(Math.random()-0.5)*2,hue:Math.random()*60+190,life:Math.random()});}
function draw(ts){if(!start)start=ts;t=(ts-start)/DUR;if(t>1){start=ts;t=0;}
ctx.fillStyle='rgba(8,16,30,0.08)';ctx.fillRect(0,0,W,H);
const cx=W/2+Math.sin(t*Math.PI*4)*120,cy=H/2+Math.cos(t*Math.PI*3)*80;
particles.forEach(p=>{p.x+=p.vx+(cx-p.x)*0.0008;p.y+=p.vy+(cy-p.y)*0.0008;
if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;
ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*3);
g.addColorStop(0,\`hsla(\${p.hue},80%,70%,0.9)\`);g.addColorStop(1,\`hsla(\${p.hue},80%,70%,0)\`);
ctx.fillStyle=g;ctx.fill();
});
animId=requestAnimationFrame(draw);}
requestAnimationFrame(draw);
window.addEventListener('unload',()=>cancelAnimationFrame(animId));
<\/script></body></html>`;
  }

  function getWaveAnimation(fps, duration) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;}canvas{display:block;background:#030d1a;}</style></head><body><canvas id="anim-canvas" width="960" height="540"></canvas><script>
const c=document.getElementById('anim-canvas'),ctx=c.getContext('2d');
const W=c.width,H=c.height;let t=0,animId,start;
function draw(ts){if(!start)start=ts;t=(ts-start)*0.001;
ctx.clearRect(0,0,W,H);
const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#030d1a');bg.addColorStop(1,'#0a1f3a');
ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
for(let w=0;w<5;w++){ctx.beginPath();
const amp=40+w*15,freq=0.008-w*0.001,speed=t*(1+w*0.3),yOff=H*0.35+w*50;
ctx.moveTo(0,H);
for(let x=0;x<=W;x+=4){const y=yOff+Math.sin(x*freq+speed)*amp+Math.sin(x*freq*2.3+speed*1.7)*amp*0.4;ctx.lineTo(x,y);}
ctx.lineTo(W,H);ctx.closePath();
const g=ctx.createLinearGradient(0,0,0,H);
g.addColorStop(0,\`hsla(\${200+w*15},80%,60%,\${0.15-w*0.02})\`);
g.addColorStop(1,\`hsla(\${220+w*15},80%,40%,0)\`);
ctx.fillStyle=g;ctx.fill();}
animId=requestAnimationFrame(draw);}
requestAnimationFrame(draw);
window.addEventListener('unload',()=>cancelAnimationFrame(animId));
<\/script></body></html>`;
  }

  function getGalaxyAnimation(fps, duration) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;}canvas{display:block;background:#020510;}</style></head><body><canvas id="anim-canvas" width="960" height="540"></canvas><script>
const c=document.getElementById('anim-canvas'),ctx=c.getContext('2d');
const W=c.width,H=c.height;let stars=[],nebula=[],t=0,animId;
for(let i=0;i<400;i++)stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5,twinkle:Math.random()*Math.PI*2,speed:Math.random()*0.05+0.01});
for(let i=0;i<8;i++)nebula.push({x:Math.random()*W,y:Math.random()*H,r:150+Math.random()*200,hue:200+Math.random()*60,o:0.04+Math.random()*0.06});
function draw(ts){t=ts*0.0005;ctx.fillStyle='rgba(2,5,16,0.15)';ctx.fillRect(0,0,W,H);
nebula.forEach(n=>{const g=ctx.createRadialGradient(n.x+Math.sin(t)*30,n.y+Math.cos(t)*20,0,n.x,n.y,n.r);
g.addColorStop(0,\`hsla(\${n.hue},80%,50%,\${n.o})\`);g.addColorStop(1,'transparent');
ctx.fillStyle=g;ctx.fillRect(n.x-n.r,n.y-n.r,n.r*2,n.r*2);});
stars.forEach(s=>{s.twinkle+=s.speed;
const o=0.5+Math.sin(s.twinkle)*0.5;
ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=\`rgba(200,220,255,\${o})\`;ctx.fill();});
animId=requestAnimationFrame(draw);}
requestAnimationFrame(draw);
window.addEventListener('unload',()=>cancelAnimationFrame(animId));
<\/script></body></html>`;
  }

  function getTextAnimation(fps, duration, prompt) {
    const lines = prompt.split(' ').slice(0, 4).join(' ');
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;}canvas{display:block;}</style></head><body><canvas id="anim-canvas" width="960" height="540"></canvas><script>
const c=document.getElementById('anim-canvas'),ctx=c.getContext('2d');
const W=c.width,H=c.height;let t=0,animId,start;
const txt="${lines.toUpperCase()}";
function draw(ts){if(!start)start=ts;t=(ts-start)*0.001;
const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#080f1e');bg.addColorStop(1,'#0a1e3a');
ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
ctx.save();ctx.translate(W/2,H/2);
const sc=1+Math.sin(t*0.8)*0.03;ctx.scale(sc,sc);
ctx.textAlign='center';ctx.textBaseline='middle';
ctx.font='bold 72px sans-serif';
const gx=ctx.createLinearGradient(-300,0,300,0);
gx.addColorStop(0,'#9CD5FF');gx.addColorStop(0.5,'#4988C4');gx.addColorStop(1,'#7AAACE');
ctx.fillStyle=gx;ctx.globalAlpha=0.15;
for(let i=0;i<8;i++){ctx.fillText(txt,0,(i-3.5)*12);}
ctx.globalAlpha=1;ctx.fillStyle=gx;
ctx.shadowColor='rgba(73,136,196,0.8)';ctx.shadowBlur=40;
ctx.fillText(txt,0,0);ctx.restore();
animId=requestAnimationFrame(draw);}
requestAnimationFrame(draw);
window.addEventListener('unload',()=>cancelAnimationFrame(animId));
<\/script></body></html>`;
  }

  function getGeometricAnimation(fps, duration) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;}canvas{display:block;background:#08101e;}</style></head><body><canvas id="anim-canvas" width="960" height="540"></canvas><script>
const c=document.getElementById('anim-canvas'),ctx=c.getContext('2d');
const W=c.width,H=c.height;let t=0,animId;const N=6;
function poly(cx,cy,r,sides,rot,col){ctx.beginPath();
for(let i=0;i<sides;i++){const a=rot+(i/sides)*Math.PI*2;ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}
ctx.closePath();ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.stroke();}
function draw(ts){t=ts*0.0008;ctx.fillStyle='rgba(8,16,30,0.06)';ctx.fillRect(0,0,W,H);
for(let i=0;i<N;i++){const phase=t+i*(Math.PI*2/N);const x=W/2+Math.cos(phase)*150;const y=H/2+Math.sin(phase)*100;
const r=30+Math.sin(t*2+i)*20;const hue=200+i*20;
poly(x,y,r,6,t*(i%2?1:-1),\`hsla(\${hue},80%,60%,0.8)\`);
poly(x,y,r*0.6,3,t*2,\`hsla(\${hue+30},80%,70%,0.6)\`);}
poly(W/2,H/2,100+Math.sin(t)*20,6,t*0.3,'rgba(73,136,196,0.4)');
animId=requestAnimationFrame(draw);}
requestAnimationFrame(draw);
window.addEventListener('unload',()=>cancelAnimationFrame(animId));
<\/script></body></html>`;
  }

  /* ─── Render Animation in Iframe ─── */
  function renderAnimation(htmlCode) {
    // Remove existing iframe
    const existing = previewerCanvas?.querySelector('iframe');
    if (existing) existing.remove();

    if (!previewerCanvas) return;

    const iframe = document.createElement('iframe');
iframe.style.cssText = `
  width:100%;
  height:100%;
  border:none;
  display:block;
  position:absolute;
  inset:0;
`;
iframe.setAttribute('sandbox', 'allow-scripts');
iframe.setAttribute('scrolling', 'no');
iframe.srcdoc = htmlCode;
previewerCanvas.appendChild(iframe);

// After iframe loads, force no scroll and fit canvas inside
iframe.onload = () => {
  try {
    const iDoc = iframe.contentDocument || iframe.contentWindow.document;
    const style = iDoc.createElement('style');
    style.textContent = `
      * { margin:0; padding:0; box-sizing:border-box; overflow:hidden; }
      html, body { width:100%; height:100%; overflow:hidden; }
      canvas {
        width:100% !important;
        height:100% !important;
        display:block;
        object-fit:contain;
      }
    `;
    iDoc.head.appendChild(style);
  } catch(e) {
    // sandbox may block — scrolling=no handles it
  }
};

    generatedCode = htmlCode;

    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.style.opacity = '1';
    }
  }

  /* ─── Download as HTML (then convert to video note) ─── */
  let isRecording = false;

function downloadAnimation() {
  if (!generatedCode) return;
  if (isRecording) return showToast('Recording already in progress...', 'info');

  const fps = getSelectedFPS();
  const duration = getSelectedDuration();

  // Ask user which format
  showDownloadModal(fps, duration);
}

function showDownloadModal(fps, duration) {
  // Remove existing modal
  document.getElementById('download-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'download-modal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);
    padding:20px;
  `;

  modal.innerHTML = `
    <div style="
      background:rgba(8,15,30,0.97);
      border:1px solid rgba(73,136,196,0.3);
      border-radius:20px;padding:36px;
      max-width:420px;width:100%;
      box-shadow:0 20px 60px rgba(0,0,0,0.6);
      text-align:center;
    ">
      <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#9CD5FF,#4988C4);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
      </div>
      <h3 style="font-size:1.3rem;font-weight:700;color:#F7F8F0;margin-bottom:8px;">Export Animation</h3>
      <p style="font-size:0.88rem;color:rgba(247,248,240,0.5);margin-bottom:28px;">Choose your export format</p>

      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">

        <button id="dl-mp4" style="
          width:100%;padding:16px 20px;border-radius:12px;border:none;
          background:linear-gradient(135deg,#9CD5FF,#4988C4);
          color:#fff;font-size:0.95rem;font-weight:700;
          cursor:pointer;display:flex;align-items:center;gap:14px;
          box-shadow:0 4px 20px rgba(73,136,196,0.4);
          transition:transform 0.2s;
        ">
          <div style="width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
          </div>
          <div style="text-align:left;">
            <div>Export as MP4</div>
            <div style="font-size:0.75rem;font-weight:400;opacity:0.8;">${fps}fps · ${duration}s · 1080p · Recommended</div>
          </div>
        </button>

        <button id="dl-html" style="
          width:100%;padding:16px 20px;border-radius:12px;
          border:1px solid rgba(73,136,196,0.25);
          background:rgba(73,136,196,0.08);
          color:#F7F8F0;font-size:0.95rem;font-weight:600;
          cursor:pointer;display:flex;align-items:center;gap:14px;
          transition:transform 0.2s;
        ">
          <div style="width:40px;height:40px;border-radius:8px;background:rgba(73,136,196,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="rgba(156,213,255,0.9)"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
          </div>
          <div style="text-align:left;">
            <div>Export as HTML</div>
            <div style="font-size:0.75rem;font-weight:400;opacity:0.6;">Standalone file · plays in any browser</div>
          </div>
        </button>

      </div>

      <button id="dl-cancel" style="
        background:none;border:none;color:rgba(247,248,240,0.4);
        font-size:0.85rem;cursor:pointer;padding:8px;
      ">Cancel</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('dl-mp4').onclick = () => {
    modal.remove();
    recordMP4(fps, duration);
  };

  document.getElementById('dl-html').onclick = () => {
    modal.remove();
    downloadHTML();
  };

  document.getElementById('dl-cancel').onclick = () => modal.remove();

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

function downloadHTML() {
  if (!generatedCode) return;
  const blob = new Blob([generatedCode], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `graphiqz-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('HTML downloaded successfully!', 'success');
}

async function recordMP4(fps, duration) {
  if (isRecording) return;

  const iframe = document.querySelector('#previewer-canvas iframe');
  if (!iframe) return showToast('No animation to record. Generate one first.', 'error');

  // Check MediaRecorder support
  if (!window.MediaRecorder) {
    showToast('MP4 export not supported in this browser. Try Chrome.', 'error');
    return;
  }

  isRecording = true;

  // Show recording UI
  showRecordingOverlay(duration);

  try {
    // Get canvas from iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const canvas = iframeDoc.getElementById('anim-canvas');

    if (!canvas) {
      throw new Error('Canvas not found in animation');
    }

    // Get canvas stream
    const stream = canvas.captureStream(fps);

    // Pick best supported format
    const mimeTypes = [
      'video/mp4;codecs=h264',
      'video/mp4',
      'video/webm;codecs=h264',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];

    let mimeType = '';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }

    if (!mimeType) throw new Error('No supported video format found');

    const chunks = [];
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8000000 // 8 Mbps — high quality
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Use correct extension
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      a.download = `graphiqz-animation-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);

      isRecording = false;
      removeRecordingOverlay();
      showToast(`Video exported successfully as .${ext}!`, 'success');
    };

    recorder.onerror = (e) => {
      isRecording = false;
      removeRecordingOverlay();
      showToast('Recording failed. Please try again.', 'error');
    };

    // Start recording
    recorder.start(100); // collect data every 100ms

    // Update progress bar during recording
    const startTime = Date.now();
    const totalMs = duration * 1000;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / totalMs) * 100, 100);
      updateRecordingProgress(progress, elapsed, totalMs);
    }, 100);

    // Stop after duration
    setTimeout(() => {
      clearInterval(progressInterval);
      recorder.stop();
      stream.getTracks().forEach(t => t.stop());
    }, totalMs + 200); // slight buffer

  } catch (err) {
    isRecording = false;
    removeRecordingOverlay();
    showToast(`Export failed: ${err.message}`, 'error');
  }
}

function showRecordingOverlay(duration) {
  document.getElementById('recording-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'recording-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:99998;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.75);backdrop-filter:blur(12px);
    padding:20px;
  `;

  overlay.innerHTML = `
    <div style="
      background:rgba(8,15,30,0.97);
      border:1px solid rgba(73,136,196,0.3);
      border-radius:20px;padding:40px 36px;
      max-width:380px;width:100%;text-align:center;
      box-shadow:0 20px 60px rgba(0,0,0,0.6);
    ">
      <div style="position:relative;width:70px;height:70px;margin:0 auto 24px;">
        <div style="
          width:70px;height:70px;border-radius:50%;
          border:3px solid rgba(73,136,196,0.2);
          border-top-color:#9CD5FF;
          animation:spin 1s linear infinite;
          position:absolute;inset:0;
        "></div>
        <div style="
          position:absolute;inset:0;
          display:flex;align-items:center;justify-content:center;
        ">
          <div style="width:16px;height:16px;border-radius:3px;background:#ff6b6b;animation:recPulse 1s ease-in-out infinite;"></div>
        </div>
      </div>

      <h3 style="font-size:1.2rem;font-weight:700;color:#F7F8F0;margin-bottom:6px;">Recording Animation</h3>
      <p style="font-size:0.85rem;color:rgba(247,248,240,0.5);margin-bottom:24px;">Please wait — capturing ${duration}s at full quality</p>

      <div style="background:rgba(73,136,196,0.1);border-radius:99px;height:6px;overflow:hidden;margin-bottom:12px;">
        <div id="rec-progress-bar" style="
          height:100%;width:0%;
          background:linear-gradient(90deg,#4988C4,#9CD5FF);
          border-radius:99px;
          transition:width 0.1s linear;
        "></div>
      </div>

      <div id="rec-progress-text" style="font-size:0.82rem;color:rgba(247,248,240,0.4);">0%</div>

      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes recPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
      </style>
    </div>
  `;

  document.body.appendChild(overlay);
}

function updateRecordingProgress(percent, elapsed, total) {
  const bar = document.getElementById('rec-progress-bar');
  const text = document.getElementById('rec-progress-text');
  if (bar) bar.style.width = percent + '%';
  if (text) {
    const remaining = Math.max(0, Math.ceil((total - elapsed) / 1000));
    text.textContent = `${Math.round(percent)}% · ${remaining}s remaining`;
  }
}

function removeRecordingOverlay() {
  document.getElementById('recording-overlay')?.remove();
}

  /* ─── Toast Notification ─── */
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.graphiqz-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'graphiqz-toast';
    toast.style.cssText = `
      position: fixed; bottom: 30px; right: 30px; z-index: 9999;
      padding: 14px 22px; border-radius: 12px;
      background: var(--bg-glass-strong); backdrop-filter: blur(20px);
      border: 1px solid ${type === 'success' ? 'rgba(107,203,119,0.4)' : 'var(--border-glass)'};
      color: var(--text-primary); font-size: 0.88rem;
      box-shadow: var(--shadow-card);
      animation: slideInToast 0.3s ease;
      max-width: 320px; line-height: 1.5;
    `;
    toast.textContent = message;

    const style = document.createElement('style');
    style.textContent = `@keyframes slideInToast{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.appendChild(style);
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /* ─── Main Generate Function ─── */
  async function generate() {
    if (isGenerating) return;
    const prompt = promptArea?.value?.trim();
    if (!prompt) {
      showToast('Please describe your animation first.', 'error');
      promptArea?.focus();
      return;
    }

    isGenerating = true;
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.querySelector('.btn-text').textContent = 'Generating...';
    }

    const fps = getSelectedFPS();
    const duration = getSelectedDuration();
    const ratio = getSelectedRatio();

    showLoading();
    setProgress(0);

    try {
      // Step 1
      setStep(0);
      setProgress(15);
      await sleep(600);

      // Step 2
      setStep(1);
      setProgress(40);
      const code = await callGeminiAPI(prompt, fps, duration, ratio);

      // Step 3
      setStep(2);
      setProgress(75);
      await sleep(500);

      // Step 4
      setStep(3);
      setProgress(100);
      await sleep(300);

      renderAnimation(code);
      showCanvas();
      showToast('Animation generated successfully!', 'success');

    } catch (err) {
      console.error('Generation error:', err);
      showToast('Generation failed. Running demo animation.', 'error');
      const demoCode = getDemoAnimation(prompt, fps, duration);
      renderAnimation(demoCode);
      showCanvas();
    } finally {
      isGenerating = false;
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.querySelector('.btn-text').textContent = 'Generate Animation';
      }
      setProgress(0);
    }
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ─── Event Listeners ─── */
  if (generateBtn) {
    generateBtn.addEventListener('click', generate);
  }

  if (promptArea) {
    promptArea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generate();
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadAnimation);
  }

  /* ─── Sample Prompts ─── */
  const sampleBtns = document.querySelectorAll('.sample-prompt');
  sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (promptArea) {
        promptArea.value = btn.dataset.prompt;
        promptArea.dispatchEvent(new Event('input'));
        promptArea.focus();
      }
    });
  });

  /* ─── Pro Feature Gates ─── */
  document.querySelectorAll('.pro-gate').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('This feature requires a Pro plan. Upgrade to unlock 60fps and 15s animations!', 'info');
    });
  });

  /* ─── Init ─── */
  showEmpty();
  if (downloadBtn) {
    downloadBtn.disabled = true;
    downloadBtn.style.opacity = '0.5';
  }

})();
