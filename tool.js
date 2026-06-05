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
      '16:9': '1920x1080',
      '9:16': '1080x1920',
      '1:1': '1080x1080',
      '4:3': '1440x1080',
      '21:9': '2560x1080'
    };
    const dims = ratioDims[ratio] || '1920x1080';
    const [w, h] = dims.split('x');

    return `You are an expert creative coder specializing in canvas-based motion graphics and animations.

Your task: Generate a self-contained HTML file with a <canvas> element that renders a beautiful, professional motion graphic animation.

USER REQUEST: "${userPrompt}"

TECHNICAL REQUIREMENTS:
- Canvas dimensions: ${w}x${h} pixels (aspect ratio ${ratio})
- Target FPS: ${fps}
- Duration: ${duration} seconds total animation
- Use requestAnimationFrame for smooth rendering
- The animation must loop seamlessly OR show a complete story arc
- Use vibrant gradients, particle systems, geometric animations, or typography animations
- Color palette: blues, cyans, and deep navies (professional motion graphic feel)

CODE REQUIREMENTS:
- Output ONLY a complete, valid HTML file — no markdown, no explanation
- The <canvas> must have id="anim-canvas"
- Include a self-contained <script> tag with all animation logic
- The animation starts automatically on load
- No external libraries — pure vanilla JS and Canvas API only
- Include proper cleanup / cancelAnimationFrame on window unload
- The code must be production-quality and visually stunning

OUTPUT: HTML file content only. No text before or after.`;
  }

  /* ─── Call Gemini API ─── */
  async function callGeminiAPI(prompt, fps, duration, ratio) {
    const GEMINI_KEY = window.GRAPHIQZ_CONFIG?.geminiKey || 'DEMO_MODE';

    if (GEMINI_KEY === 'DEMO_MODE') {
      // Demo fallback animation
      return getDemoAnimation(prompt, fps, duration);
    }

    const systemPrompt = buildSystemPrompt(prompt, fps, duration, ratio);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 8192 }
        })
      }
    );

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

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
  function downloadAnimation() {
    if (!generatedCode) return;

    const fps = getSelectedFPS();
    const duration = getSelectedDuration();

    // Create download
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphiqz-animation-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);

    // Show info toast
    showToast(`Animation downloaded! Open in browser to view your ${fps}fps ${duration}s animation.`, 'success');
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
