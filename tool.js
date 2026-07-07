/* =========================================================
   GRAPHIQZ — Tool Page JavaScript
   ========================================================= */
(function () {
  'use strict';
  if (window._graphiqzInitialized) return;
  window._graphiqzInitialized = true;

  /* ─── DOM ─── */
  const promptInput   = document.getElementById('prompt-input');
  const generateBtn   = document.getElementById('generate-btn');
  const ratioSelect   = document.getElementById('ratio-select');
  const progressBar   = document.getElementById('progress-bar');
  const downloadBtn   = document.getElementById('download-btn');
  const stageIdle     = document.getElementById('stage-idle');
  const genCard       = document.getElementById('gen-card');
  const genLoading    = document.getElementById('gen-loading');
  const genLTitle     = document.getElementById('gen-ltitle');
  const genLSub       = document.getElementById('gen-lsub');
  const genResult     = document.getElementById('gen-result');
  const previewCanvas = document.getElementById('previewer-canvas');

  /* ─── State ─── */
  let generatedCode    = null;
  let isGenerating     = false;
  let isRecording      = false;
  let selectedFps      = 30;
  let selectedDur      = 5;
  let activeController = null;

  /* ─── Theme toggle (topbar) ─── */
  const themeBtn = document.getElementById('tool-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const html = document.documentElement;
      const isDark = html.getAttribute('data-theme') === 'dark';
      html.setAttribute('data-theme', isDark ? 'light' : 'dark');
      localStorage.setItem('gq-theme', isDark ? 'light' : 'dark');
      const sun  = themeBtn.querySelector('.theme-icon-sun');
      const moon = themeBtn.querySelector('.theme-icon-moon');
      if (sun)  sun.style.display  = isDark ? 'none'  : '';
      if (moon) moon.style.display = isDark ? ''      : 'none';
    });
    // Apply saved theme
    const saved = localStorage.getItem('gq-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
      const sun  = themeBtn.querySelector('.theme-icon-sun');
      const moon = themeBtn.querySelector('.theme-icon-moon');
      if (saved === 'light') {
        if (sun)  sun.style.display  = 'none';
        if (moon) moon.style.display = '';
      }
    }
  }

  /* ─── Pills ─── */
  document.querySelectorAll('[data-fps]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('locked')) { showToast('60 FPS requires Pro.', 'info'); return; }
      document.querySelectorAll('[data-fps]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedFps = parseInt(btn.dataset.fps);
    });
  });

  document.querySelectorAll('[data-dur]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('locked')) { showToast('Longer durations require Pro.', 'info'); return; }
      document.querySelectorAll('[data-dur]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDur = parseInt(btn.dataset.dur);
    });
  });

  /* ─── Auto-resize textarea ─── */
  if (promptInput) {
    promptInput.addEventListener('input', () => {
      promptInput.style.height = 'auto';
      promptInput.style.height = Math.min(promptInput.scrollHeight, 88) + 'px';
    });
  }

  /* ─── Steps ─── */
  const STEPS = ['step-analyze','step-generate','step-render','step-ready'];
  function setStep(i) {
    STEPS.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('active','done');
      if (idx < i)       el.classList.add('done');
      else if (idx === i) el.classList.add('active');
    });
  }
  function setProgress(p) { if (progressBar) progressBar.style.width = p + '%'; }

  /* ─── Show loading card ─── */
  function showLoadingCard() {
    if (stageIdle) stageIdle.classList.add('out');
    genLoading.style.display = 'flex';
    genResult.classList.remove('show');
    if (downloadBtn) downloadBtn.classList.remove('show');
    setProgress(0); setStep(-1);
    genCard.classList.remove('exit');
    genCard.classList.add('show');
  }

  /* ─── Show result ─── */
  function showResultInCard(htmlCode) {
    genLoading.style.display = 'none';
    if (previewCanvas) previewCanvas.innerHTML = '';

    // Build complete HTML with canvas scaling injected before </head>
    const scalingCSS = `
<style>
html,body{margin:0!important;padding:0!important;width:100%!important;height:100%!important;overflow:hidden!important;background:#080f1e!important;}
canvas#anim-canvas{position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;display:block!important;object-fit:contain!important;}
</style>`;

    let injected = htmlCode;
    if (injected.includes('</head>')) {
      injected = injected.replace('</head>', scalingCSS + '</head>');
    } else {
      injected = scalingCSS + injected;
    }

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.srcdoc = injected;

    if (previewCanvas) previewCanvas.appendChild(iframe);
    genResult.classList.add('show');
    if (downloadBtn) downloadBtn.classList.add('show');
    generatedCode = htmlCode;
  }

  /* ─── Fade out card ─── */
  function fadeOutCard(cb) {
    if (!genCard.classList.contains('show')) { cb(); return; }
    genCard.classList.add('exit');
    genCard.classList.remove('show');
    setTimeout(cb, 400);
  }

  /* ─── Reset to idle ─── */
  function resetToIdle() {
    genCard.classList.add('exit');
    genCard.classList.remove('show');
    setTimeout(() => {
      genCard.classList.remove('exit');
      if (stageIdle) stageIdle.classList.remove('out');
    }, 400);
  }

  /* ─── API ─── */
  async function callAPI(prompt, fps, duration, ratio) {
    const URL = 'https://kapcgaowheesxevklbfk.supabase.co/functions/v1/gemini-proxy';
    if (activeController) activeController.abort();
    activeController = new AbortController();

    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcGNnYW93aGVlc3hldmtsYmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzgyOTgsImV4cCI6MjA5NjA1NDI5OH0.BIZfJEzEgAMXiNgyQL1t9WtdC6zVjlSjjWOZUNgdRSs`
      },
      body: JSON.stringify({ prompt, fps, duration, ratio }),
      signal: activeController.signal
    });

    let data;
    try { data = await res.json(); } catch { throw new Error('Invalid server response'); }
    if (!res.ok || data.error) throw new Error(data?.error || `Server error ${res.status}`);
    if (!data.html) throw new Error('No animation returned');
    return data.html;
  }

  /* ─── Generate ─── */
  async function generate() {
    if (isGenerating) return;
    const prompt = promptInput?.value?.trim();
    if (!prompt) { showToast('Describe your animation first.', 'error'); promptInput?.focus(); return; }

    const fps      = selectedFps;
    const duration = selectedDur;
    const ratio    = ratioSelect?.value || '16:9';

    const doGen = async () => {
      isGenerating = true;
      if (generateBtn) generateBtn.disabled = true;

      showLoadingCard();

      try {
        if (genLTitle) genLTitle.textContent = 'Analyzing your prompt...';
        if (genLSub)   genLSub.textContent   = 'Understanding what you want';
        setStep(0); setProgress(15);
        await sleep(400);

        setStep(1);
        if (genLTitle) genLTitle.textContent = 'Generating animation...';
        if (genLSub)   genLSub.textContent   = 'AI is crafting your motion graphics';
        setProgress(42);

        const code = await callAPI(prompt, fps, duration, ratio);

        setStep(2);
        if (genLTitle) genLTitle.textContent = 'Rendering preview...';
        if (genLSub)   genLSub.textContent   = 'Almost there!';
        setProgress(82);
        await sleep(300);

        setStep(3); setProgress(100);
        await sleep(160);

        showResultInCard(code);
        showToast('Animation ready! ✨', 'success');

      } catch(err) {
        console.error('Generation error:', err);
        showToast(err.message || 'Generation failed. Try again.', 'error');
        resetToIdle();
      } finally {
        isGenerating = false;
        if (generateBtn) generateBtn.disabled = false;
      }
    };

    if (genCard.classList.contains('show')) {
      fadeOutCard(doGen);
    } else {
      doGen();
    }
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ─── Download ─── */
  if (downloadBtn && !downloadBtn._bound) {
    downloadBtn.addEventListener('click', () => {
      if (!generatedCode || isRecording) return;
      showDownloadModal(selectedFps, selectedDur);
    });
    downloadBtn._bound = true;
  }

  function showDownloadModal(fps, duration) {
    document.getElementById('dl-modal')?.remove();
    const m = document.createElement('div');
    m.id = 'dl-modal';
    m.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);backdrop-filter:blur(14px);padding:20px;';
    m.innerHTML = `
      <div style="background:var(--bg-secondary,#0a1628);border:1px solid var(--border-glass);border-radius:18px;padding:32px;max-width:380px;width:100%;text-align:center;box-shadow:var(--shadow-card);">
        <div style="width:48px;height:48px;border-radius:50%;background:var(--grad-accent);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='22' height='22' fill='white'><path d='M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z'/></svg>
        </div>
        <h3 style="color:var(--text-primary);font-size:1.15rem;font-weight:700;margin-bottom:5px;font-family:var(--font-heading);">Export Animation</h3>
        <p style="color:var(--text-muted);font-size:0.83rem;margin-bottom:22px;">Choose your format</p>
        <div style="display:flex;flex-direction:column;gap:9px;margin-bottom:18px;">
          <button id="dl-webm" style="padding:14px;border-radius:11px;border:none;background:var(--grad-accent);color:white;font-size:0.88rem;font-weight:700;cursor:pointer;font-family:var(--font-body);">
            WebM Video · ${fps}fps · ${duration}s
          </button>
          <button id="dl-html" style="padding:14px;border-radius:11px;border:1px solid var(--border-glass);background:var(--bg-glass);color:var(--text-primary);font-size:0.88rem;font-weight:600;cursor:pointer;font-family:var(--font-body);">
            HTML File
          </button>
        </div>
        <button id="dl-cancel" style="background:none;border:none;color:var(--text-muted);font-size:0.8rem;cursor:pointer;font-family:var(--font-body);">Cancel</button>
      </div>`;
    document.body.appendChild(m);
    document.getElementById('dl-webm').onclick   = () => { m.remove(); recordVideo(fps, duration); };
    document.getElementById('dl-html').onclick   = () => { m.remove(); downloadHTML(); };
    document.getElementById('dl-cancel').onclick = () => m.remove();
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
  }

  function downloadHTML() {
    if (!generatedCode) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([generatedCode], { type:'text/html' }));
    a.download = `graphiqz-${Date.now()}.html`;
    a.click();
    showToast('HTML downloaded!', 'success');
  }

  async function recordVideo(fps, duration) {
    if (isRecording) return;
    const iframe = previewCanvas?.querySelector('iframe');
    if (!iframe) return showToast('No animation to record.', 'error');
    if (!window.MediaRecorder) return showToast('Use Chrome for recording.', 'error');

    isRecording = true;
    showRecordingOverlay(duration);

    try {
      const iDoc = iframe.contentDocument || iframe.contentWindow.document;
      const src  = iDoc.getElementById('anim-canvas');
      if (!src) throw new Error('Canvas not found');

      const W = src.width, H = src.height;
      const totalFrames = fps * duration;
      const frameMs     = 1000 / fps;

      const off    = document.createElement('canvas');
      off.width    = W; off.height = H;
      const offCtx = off.getContext('2d', { alpha: false });

      const types    = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
      const mimeType = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
      if (!mimeType) throw new Error('No supported video format');

      const stream   = off.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 50_000_000 });
      const chunks   = [];

      recorder.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = `graphiqz-${W}x${H}-${Date.now()}.webm`;
        a.click();
        isRecording = false;
        removeRecordingOverlay();
        showToast(`Exported ${W}x${H} @ ${fps}fps!`, 'success');
      };
      recorder.onerror = () => {
        isRecording = false;
        removeRecordingOverlay();
        showToast('Recording failed.', 'error');
      };

      recorder.start(1000);
      let frame = 0;
      const t0  = performance.now();

      const tick = () => {
        if (!isRecording || frame >= totalFrames) {
          recorder.stop();
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        offCtx.drawImage(src, 0, 0, W, H);
        frame++;
        updateRecordingProgress(
          Math.min((frame / totalFrames) * 100, 100),
          performance.now() - t0,
          duration * 1000
        );
        const nextTime = t0 + frame * frameMs;
        setTimeout(tick, Math.max(0, nextTime - performance.now()));
      };
      setTimeout(tick, 150);

    } catch(err) {
      isRecording = false;
      removeRecordingOverlay();
      showToast(`Export failed: ${err.message}`, 'error');
    }
  }

  function showRecordingOverlay(duration) {
    document.getElementById('rec-overlay')?.remove();
    const o = document.createElement('div');
    o.id = 'rec-overlay';
    o.style.cssText = 'position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(14px);';
    o.innerHTML = `
      <div style="background:var(--bg-secondary,#0a1628);border:1px solid var(--border-glass);border-radius:18px;padding:38px 32px;max-width:340px;width:100%;text-align:center;box-shadow:var(--shadow-card);">
        <div style="width:14px;height:14px;border-radius:3px;background:#ff6b6b;margin:0 auto 18px;animation:rp 1s ease-in-out infinite;"></div>
        <h3 style="color:var(--text-primary);font-size:1.05rem;font-weight:700;margin-bottom:5px;font-family:var(--font-heading);">Recording</h3>
        <p style="color:var(--text-muted);font-size:0.8rem;margin-bottom:20px;">Capturing ${duration}s at full resolution</p>
        <div style="background:var(--bg-glass);border-radius:99px;height:4px;overflow:hidden;margin-bottom:9px;">
          <div id="rec-bar" style="height:100%;width:0%;background:var(--grad-accent);border-radius:99px;transition:width 0.12s linear;"></div>
        </div>
        <div id="rec-txt" style="color:var(--text-muted);font-size:0.78rem;">0%</div>
        <style>@keyframes rp{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.35;transform:scale(0.72)}}</style>
      </div>`;
    document.body.appendChild(o);
  }

  function updateRecordingProgress(pct, elapsed, total) {
    const bar = document.getElementById('rec-bar');
    const txt = document.getElementById('rec-txt');
    if (bar) bar.style.width = pct + '%';
    if (txt) {
      const rem = Math.max(0, Math.ceil((total - elapsed) / 1000));
      txt.textContent = `${Math.round(pct)}% · ${rem}s remaining`;
    }
  }

  function removeRecordingOverlay() { document.getElementById('rec-overlay')?.remove(); }

  /* ─── Toast ─── */
  function showToast(msg, type = 'info') {
    document.querySelector('.gq-toast')?.remove();
    const t = document.createElement('div');
    t.className = 'gq-toast';
    const bc = type === 'success' ? 'rgba(107,203,119,0.4)' :
               type === 'error'   ? 'rgba(255,107,107,0.4)' :
                                    'var(--border-glass)';
    t.style.cssText = `position:fixed;bottom:86px;right:22px;z-index:9997;padding:12px 18px;border-radius:11px;background:var(--bg-secondary,#0a1628);backdrop-filter:blur(20px);border:1px solid ${bc};color:var(--text-primary);font-size:0.86rem;box-shadow:var(--shadow-card);max-width:290px;font-family:var(--font-body);animation:tup 0.28s ease both;`;
    t.textContent = msg;
    if (!document.getElementById('gq-ts')) {
      const s = document.createElement('style');
      s.id = 'gq-ts';
      s.textContent = '@keyframes tup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}';
      document.head.appendChild(s);
    }
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.28s'; setTimeout(()=>t.remove(),280); }, 3800);
  }

  /* ─── Events ─── */
  if (generateBtn && !generateBtn._bound) {
    generateBtn.addEventListener('click', generate);
    generateBtn._bound = true;
  }

  if (promptInput) {
    promptInput.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); generate(); }
    });
  }

})();