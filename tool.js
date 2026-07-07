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
  const genLoadingTitle = document.getElementById('gen-loading-title');
  const genLoadingSub   = document.getElementById('gen-loading-sub');
  const genResult     = document.getElementById('gen-result');
  const previewCanvas = document.getElementById('previewer-canvas');

  /* ─── State ─── */
  let generatedCode    = null;
  let isGenerating     = false;
  let isRecording      = false;
  let selectedFps      = 30;
  let selectedDur      = 5;
  let activeController = null;

  /* ─── FPS pills ─── */
  document.querySelectorAll('[data-fps]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('pro-locked')) {
        showToast('60 FPS requires Pro plan.', 'info'); return;
      }
      document.querySelectorAll('[data-fps]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedFps = parseInt(btn.dataset.fps);
    });
  });

  /* ─── Duration pills ─── */
  document.querySelectorAll('[data-dur]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('pro-locked')) {
        showToast('Longer durations require Pro plan.', 'info'); return;
      }
      document.querySelectorAll('[data-dur]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDur = parseInt(btn.dataset.dur);
    });
  });

  /* ─── Auto-resize textarea ─── */
  if (promptInput) {
    promptInput.addEventListener('input', () => {
      promptInput.style.height = 'auto';
      promptInput.style.height = Math.min(promptInput.scrollHeight, 100) + 'px';
    });
  }

  /* ─── Steps ─── */
  const STEPS = ['step-analyze','step-generate','step-render','step-ready'];
  function setStep(i) {
    STEPS.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('active','done');
      if (idx < i) el.classList.add('done');
      else if (idx === i) el.classList.add('active');
    });
  }
  function setProgress(p) { if (progressBar) progressBar.style.width = p + '%'; }

  /* ─── Card transitions ─── */
  function showLoadingCard() {
    // Hide idle
    if (stageIdle) { stageIdle.style.opacity = '0'; stageIdle.style.pointerEvents = 'none'; }
    // Show card
    genCard.classList.remove('hide');
    genCard.classList.add('show');
    // Show loading, hide result
    genLoading.style.display = 'flex';
    genResult.classList.remove('show');
    if (downloadBtn) downloadBtn.classList.remove('show');
    setProgress(0); setStep(0);
  }

  function showResultInCard(htmlCode) {
    // Hide loading
    genLoading.style.display = 'none';
    // Clear old iframe
    if (previewCanvas) previewCanvas.innerHTML = '';
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.srcdoc = htmlCode;
    iframe.onload = () => {
      try {
        const iDoc = iframe.contentDocument || iframe.contentWindow.document;
        const s = iDoc.createElement('style');
        s.textContent = `
          *{margin:0!important;padding:0!important;box-sizing:border-box!important;}
          html,body{width:100%!important;height:100%!important;overflow:hidden!important;background:#080f1e!important;}
          canvas{position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;display:block!important;}
        `;
        iDoc.head.appendChild(s);
      } catch(e) {}
    };
    if (previewCanvas) previewCanvas.appendChild(iframe);
    // Show result
    genResult.classList.add('show');
    if (downloadBtn) downloadBtn.classList.add('show');
    generatedCode = htmlCode;
  }

  function fadeOutCard(cb) {
    if (!genCard.classList.contains('show')) { cb(); return; }
    genCard.classList.remove('show');
    genCard.classList.add('hide');
    setTimeout(() => {
      genCard.classList.remove('hide');
      cb();
    }, 380);
  }

  /* ─── API Call ─── */
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

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data?.error || `Error ${res.status}`);
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

    const doGenerate = async () => {
      isGenerating = true;
      if (generateBtn) generateBtn.disabled = true;

      showLoadingCard();

      try {
        if (genLoadingTitle) genLoadingTitle.textContent = 'Analyzing your prompt...';
        if (genLoadingSub)   genLoadingSub.textContent   = 'Understanding what you want';
        setStep(0); setProgress(15);
        await sleep(400);

        setStep(1);
        if (genLoadingTitle) genLoadingTitle.textContent = 'Generating animation...';
        if (genLoadingSub)   genLoadingSub.textContent   = 'AI is writing the code';
        setProgress(40);

        const code = await callAPI(prompt, fps, duration, ratio);

        setStep(2);
        if (genLoadingTitle) genLoadingTitle.textContent = 'Rendering preview...';
        if (genLoadingSub)   genLoadingSub.textContent   = 'Almost done!';
        setProgress(80);
        await sleep(350);

        setStep(3);
        setProgress(100);
        await sleep(200);

        showResultInCard(code);
        showToast('Animation ready!', 'success');

      } catch(err) {
        console.error(err);
        showToast(err.message || 'Generation failed. Try again.', 'error');
        // Reset to idle
        genCard.classList.remove('show');
        genCard.classList.add('hide');
        setTimeout(() => {
          genCard.classList.remove('hide');
          if (stageIdle) { stageIdle.style.opacity = '1'; stageIdle.style.pointerEvents = ''; }
        }, 380);
      } finally {
        isGenerating = false;
        if (generateBtn) generateBtn.disabled = false;
      }
    };

    // If card already visible, fade out first then regenerate
    if (genCard.classList.contains('show')) {
      fadeOutCard(doGenerate);
    } else {
      doGenerate();
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
    m.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);backdrop-filter:blur(12px);padding:20px;';
    m.innerHTML = `
      <div style="background:rgba(8,15,30,0.97);border:1px solid rgba(73,136,196,0.3);border-radius:20px;padding:36px;max-width:400px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
        <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#9CD5FF,#4988C4);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
        </div>
        <h3 style="color:#F7F8F0;font-size:1.2rem;font-weight:700;margin-bottom:6px;">Export Animation</h3>
        <p style="color:rgba(247,248,240,0.45);font-size:0.85rem;margin-bottom:24px;">Choose your format</p>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
          <button id="dl-webm" style="padding:15px;border-radius:12px;border:none;background:linear-gradient(135deg,#4988C4,#9CD5FF);color:white;font-size:0.9rem;font-weight:700;cursor:pointer;">
            Export as WebM Video &nbsp;·&nbsp; ${fps}fps · ${duration}s
          </button>
          <button id="dl-html" style="padding:15px;border-radius:12px;border:1px solid rgba(73,136,196,0.25);background:rgba(73,136,196,0.07);color:#F7F8F0;font-size:0.9rem;font-weight:600;cursor:pointer;">
            Export as HTML File
          </button>
        </div>
        <button id="dl-cancel" style="background:none;border:none;color:rgba(247,248,240,0.35);font-size:0.82rem;cursor:pointer;">Cancel</button>
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
      const frameMs = 1000 / fps;

      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const offCtx = off.getContext('2d', { alpha: false });

      const types = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
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
        const next = t0 + frame * frameMs;
        setTimeout(tick, Math.max(0, next - performance.now()));
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
    o.style.cssText = 'position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);backdrop-filter:blur(14px);';
    o.innerHTML = `
      <div style="background:rgba(8,15,30,0.97);border:1px solid rgba(73,136,196,0.25);border-radius:20px;padding:40px 36px;max-width:360px;width:100%;text-align:center;">
        <div style="width:16px;height:16px;border-radius:3px;background:#ff6b6b;margin:0 auto 20px;animation:rPulse 1s ease-in-out infinite;"></div>
        <h3 style="color:#F7F8F0;font-size:1.1rem;font-weight:700;margin-bottom:6px;">Recording</h3>
        <p style="color:rgba(247,248,240,0.45);font-size:0.82rem;margin-bottom:22px;">Capturing ${duration}s at full resolution</p>
        <div style="background:rgba(73,136,196,0.1);border-radius:99px;height:5px;overflow:hidden;margin-bottom:10px;">
          <div id="rec-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#4988C4,#9CD5FF);border-radius:99px;transition:width 0.15s linear;"></div>
        </div>
        <div id="rec-txt" style="color:rgba(247,248,240,0.35);font-size:0.8rem;">0%</div>
        <style>@keyframes rPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.75)}}</style>
      </div>`;
    document.body.appendChild(o);
  }

  function updateRecordingProgress(pct, elapsed, total) {
    const bar = document.getElementById('rec-bar');
    const txt = document.getElementById('rec-txt');
    if (bar) bar.style.width = pct + '%';
    if (txt) { const rem = Math.max(0, Math.ceil((total - elapsed) / 1000)); txt.textContent = `${Math.round(pct)}% · ${rem}s remaining`; }
  }

  function removeRecordingOverlay() { document.getElementById('rec-overlay')?.remove(); }

  /* ─── Toast ─── */
  function showToast(msg, type = 'info') {
    document.querySelector('.gq-toast')?.remove();
    const t = document.createElement('div');
    t.className = 'gq-toast';
    t.style.cssText = `position:fixed;bottom:90px;right:24px;z-index:99999;padding:13px 20px;border-radius:12px;background:rgba(8,15,30,0.95);backdrop-filter:blur(20px);border:1px solid ${type==='success'?'rgba(107,203,119,0.4)':type==='error'?'rgba(255,107,107,0.4)':'rgba(73,136,196,0.3)'};color:#F7F8F0;font-size:0.875rem;box-shadow:0 8px 32px rgba(0,0,0,0.4);animation:tUp 0.3s ease both;max-width:300px;font-family:var(--font-body);`;
    t.textContent = msg;
    document.head.insertAdjacentHTML('beforeend','<style>@keyframes tUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}</style>');
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(),300); }, 4000);
  }

  /* ─── Event listeners ─── */
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