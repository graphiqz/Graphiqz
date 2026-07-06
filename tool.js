/* =========================================================
   GRAPHIQZ — Tool Page JavaScript (Redesigned)
   ========================================================= */

(function () {
  'use strict';
  if (window._graphiqzInitialized) return;
  window._graphiqzInitialized = true;

  /* ─── DOM ─── */
  const promptArea     = document.getElementById('prompt-input');
  const generateBtn    = document.getElementById('generate-btn');
  const ratioSelect    = document.getElementById('ratio-select');
  const progressBar    = document.getElementById('progress-bar');
  const downloadBtn    = document.getElementById('download-btn');
  const downloadGroup  = document.getElementById('download-group');
  const centerIdle     = document.getElementById('center-idle');
  const genCard        = document.getElementById('gen-card');
  const genCardLoading = document.getElementById('gen-card-loading');
  const genCardResult  = document.getElementById('gen-card-result');
  const genStatusText  = document.getElementById('gen-status-text');
  const previewerCanvas = document.getElementById('previewer-canvas');

  /* ─── State ─── */
  let generatedCode = null;
  let isGenerating  = false;
  let isRecording   = false;
  let selectedFps   = 30;
  let selectedDur   = 5;
  let activeController = null;

  /* ─── FPS buttons ─── */
  document.querySelectorAll('.opt-btn[data-fps]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('pro-gate')) {
        showToast('60 FPS requires Pro plan.', 'info');
        return;
      }
      document.querySelectorAll('.opt-btn[data-fps]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedFps = parseInt(btn.dataset.fps);
    });
  });

  /* ─── Duration buttons ─── */
  document.querySelectorAll('.opt-btn[data-dur]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('pro-gate')) {
        showToast('Longer durations require Pro plan.', 'info');
        return;
      }
      document.querySelectorAll('.opt-btn[data-dur]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDur = parseInt(btn.dataset.dur);
    });
  });

  /* ─── Auto-resize textarea ─── */
  if (promptArea) {
    promptArea.addEventListener('input', () => {
      promptArea.style.height = 'auto';
      promptArea.style.height = Math.min(promptArea.scrollHeight, 120) + 'px';
    });
  }

  /* ─── Loading Steps ─── */
  const STEPS = ['step-analyze', 'step-generate', 'step-render', 'step-ready'];

  function setStep(index) {
    STEPS.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('done', 'active');
      if (i < index) el.classList.add('done');
      else if (i === index) el.classList.add('active');
    });
  }

  function setProgress(pct) {
    if (progressBar) progressBar.style.width = pct + '%';
  }

  /* ─── Show generation card ─── */
  function showGeneratingCard() {
    // Fade out idle text
    if (centerIdle) {
      centerIdle.style.animation = 'cardFadeOut 0.3s ease both';
      setTimeout(() => { centerIdle.style.display = 'none'; }, 300);
    }
    // Show card with fade+pan up
    if (genCard) {
      genCard.style.display = 'block';
      genCard.style.animation = 'cardFadeUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both';
    }
    // Show loading, hide result
    if (genCardLoading) genCardLoading.style.display = 'flex';
    if (genCardResult)  genCardResult.style.display  = 'none';
  }

  /* ─── Replace card with result ─── */
  function showResultCard(htmlCode) {
    if (genCardLoading) genCardLoading.style.display = 'none';
    if (genCardResult)  genCardResult.style.display  = 'block';

    // Remove old iframe
    const old = previewerCanvas?.querySelector('iframe');
    if (old) old.remove();

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.setAttribute('scrolling', 'no');
    iframe.srcdoc = htmlCode;

    iframe.onload = () => {
      try {
        const iDoc = iframe.contentDocument || iframe.contentWindow.document;
        const style = iDoc.createElement('style');
        style.textContent = `
          *{margin:0!important;padding:0!important;box-sizing:border-box!important;}
          html,body{width:100%!important;height:100%!important;overflow:hidden!important;background:#080f1e!important;}
          canvas{position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;display:block!important;}
        `;
        iDoc.head.appendChild(style);
      } catch(e) {}
    };

    if (previewerCanvas) previewerCanvas.appendChild(iframe);

    generatedCode = htmlCode;
    if (downloadGroup) downloadGroup.style.display = 'flex';
  }

  /* ─── Fade out card, then regenerate ─── */
  function fadeOutCardThenGenerate(cb) {
    if (!genCard || genCard.style.display === 'none') {
      cb();
      return;
    }
    genCard.style.animation = 'cardFadeOut 0.35s ease both';
    setTimeout(() => {
      genCard.style.display = 'none';
      genCard.style.animation = '';
      cb();
    }, 350);
  }

  /* ─── Call API ─── */
  async function callGeminiAPI(prompt, fps, duration, ratio) {
    const FUNCTION_URL = 'https://kapcgaowheesxevklbfk.supabase.co/functions/v1/gemini-proxy';

    if (activeController) activeController.abort();
    activeController = new AbortController();

    let response;
    try {
      response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcGNnYW93aGVlc3hldmtsYmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzgyOTgsImV4cCI6MjA5NjA1NDI5OH0.BIZfJEzEgAMXiNgyQL1t9WtdC6zVjlSjjWOZUNgdRSs`
        },
        body: JSON.stringify({ prompt, fps, duration, ratio }),
        signal: activeController.signal
      });
    } catch(err) {
      if (err.name === 'AbortError') throw new Error('Cancelled.');
      throw new Error('Cannot reach server.');
    }

    console.log('Edge Function status:', response.status);
    let data;
    try { data = await response.json(); } catch { throw new Error('Invalid response'); }
    console.log('Edge Function data:', data);

    if (!response.ok || data.error) throw new Error(data?.error || `Error ${response.status}`);
    if (!data.html) throw new Error('No animation returned');
    return data.html;
  }

  /* ─── Main Generate ─── */
  async function generate() {
    if (isGenerating) return;
    const prompt = promptArea?.value?.trim();
    if (!prompt) {
      showToast('Describe your animation first.', 'error');
      promptArea?.focus();
      return;
    }

    const fps      = selectedFps;
    const duration = selectedDur;
    const ratio    = ratioSelect ? ratioSelect.value : '16:9';

    // If card already showing, fade it out first
    fadeOutCardThenGenerate(async () => {
      isGenerating = true;
      if (generateBtn) generateBtn.disabled = true;

      showGeneratingCard();
      setProgress(0);
      setStep(0);

      try {
        if (genStatusText) genStatusText.textContent = 'Analyzing your prompt...';
        setProgress(15);
        await sleep(400);

        setStep(1);
        if (genStatusText) genStatusText.textContent = 'Generating animation...';
        setProgress(40);

        const code = await callGeminiAPI(prompt, fps, duration, ratio);

        setStep(2);
        if (genStatusText) genStatusText.textContent = 'Rendering preview...';
        setProgress(80);
        await sleep(400);

        setStep(3);
        setProgress(100);
        await sleep(200);

        showResultCard(code);
        showToast('Animation ready!', 'success');

      } catch(err) {
        console.error(err);
        showToast(err.message || 'Generation failed.', 'error');
        // Reset card
        if (genCard) {
          genCard.style.animation = 'cardFadeOut 0.3s ease both';
          setTimeout(() => {
            genCard.style.display = 'none';
            if (centerIdle) { centerIdle.style.display = 'block'; centerIdle.style.animation = 'fadeUp 0.4s ease both'; }
          }, 300);
        }
      } finally {
        isGenerating = false;
        if (generateBtn) generateBtn.disabled = false;
      }
    });
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ─── Recording ─── */
  function downloadAnimation() {
    if (!generatedCode) return;
    if (isRecording) return showToast('Recording in progress...', 'info');
    showDownloadModal(selectedFps, selectedDur);
  }

  function showDownloadModal(fps, duration) {
    document.getElementById('download-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'download-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);padding:20px;';
    modal.innerHTML = `
      <div style="background:rgba(8,15,30,0.97);border:1px solid rgba(73,136,196,0.3);border-radius:20px;padding:36px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.6);text-align:center;">
        <h3 style="font-size:1.3rem;font-weight:700;color:#F7F8F0;margin-bottom:8px;">Export Animation</h3>
        <p style="font-size:0.88rem;color:rgba(247,248,240,0.5);margin-bottom:28px;">Choose export format</p>
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
          <button id="dl-mp4" style="width:100%;padding:16px 20px;border-radius:12px;border:none;background:linear-gradient(135deg,#9CD5FF,#4988C4);color:#fff;font-size:0.95rem;font-weight:700;cursor:pointer;">
            Export as WebM Video (${fps}fps · ${duration}s)
          </button>
          <button id="dl-html" style="width:100%;padding:16px 20px;border-radius:12px;border:1px solid rgba(73,136,196,0.25);background:rgba(73,136,196,0.08);color:#F7F8F0;font-size:0.95rem;font-weight:600;cursor:pointer;">
            Export as HTML
          </button>
        </div>
        <button id="dl-cancel" style="background:none;border:none;color:rgba(247,248,240,0.4);font-size:0.85rem;cursor:pointer;padding:8px;">Cancel</button>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('dl-mp4').onclick  = () => { modal.remove(); recordMP4(fps, duration); };
    document.getElementById('dl-html').onclick = () => { modal.remove(); downloadHTML(); };
    document.getElementById('dl-cancel').onclick = () => modal.remove();
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  }

  function downloadHTML() {
    if (!generatedCode) return;
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `graphiqz-${Date.now()}.html`; a.click();
    URL.revokeObjectURL(url);
    showToast('HTML downloaded!', 'success');
  }

  async function recordMP4(fps, duration) {
    if (isRecording) return;
    const iframe = document.querySelector('#previewer-canvas iframe');
    if (!iframe) return showToast('No animation to record.', 'error');
    if (!window.MediaRecorder) return showToast('Use Chrome for recording.', 'error');

    isRecording = true;
    showRecordingOverlay(duration);

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const sourceCanvas = iframeDoc.getElementById('anim-canvas');
      if (!sourceCanvas) throw new Error('Canvas not found');

      const W = sourceCanvas.width;
      const H = sourceCanvas.height;
      const totalFrames = fps * duration;
      const frameMs = 1000 / fps;

      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const offCtx = off.getContext('2d', { alpha: false });

      const mimeTypes = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
      const mimeType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
      if (!mimeType) throw new Error('No supported format');

      const stream = off.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 50000000 });
      const chunks = [];

      recorder.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `graphiqz-${Date.now()}.webm`; a.click();
        URL.revokeObjectURL(url);
        isRecording = false;
        removeRecordingOverlay();
        showToast(`Exported ${W}x${H} @ ${fps}fps!`, 'success');
      };

      recorder.start(1000);

      let frame = 0;
      const startReal = performance.now();

      const tick = () => {
        if (!isRecording || frame >= totalFrames) {
          recorder.stop();
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        offCtx.drawImage(sourceCanvas, 0, 0, W, H);
        frame++;
        updateRecordingProgress(
          Math.min((frame / totalFrames) * 100, 100),
          performance.now() - startReal,
          duration * 1000
        );
        const next = startReal + frame * frameMs;
        setTimeout(tick, Math.max(0, next - performance.now()));
      };

      setTimeout(tick, 200);

    } catch(err) {
      isRecording = false;
      removeRecordingOverlay();
      showToast(`Export failed: ${err.message}`, 'error');
    }
  }

  function showRecordingOverlay(duration) {
    document.getElementById('recording-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'recording-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);backdrop-filter:blur(12px);';
    overlay.innerHTML = `
      <div style="background:rgba(8,15,30,0.97);border:1px solid rgba(73,136,196,0.3);border-radius:20px;padding:40px 36px;max-width:380px;width:100%;text-align:center;">
        <div style="width:16px;height:16px;border-radius:3px;background:#ff6b6b;margin:0 auto 20px;animation:recPulse 1s ease-in-out infinite;"></div>
        <h3 style="color:#F7F8F0;margin-bottom:6px;">Recording</h3>
        <p style="color:rgba(247,248,240,0.5);font-size:0.85rem;margin-bottom:24px;">Capturing ${duration}s at full resolution</p>
        <div style="background:rgba(73,136,196,0.1);border-radius:99px;height:6px;overflow:hidden;margin-bottom:12px;">
          <div id="rec-progress-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#4988C4,#9CD5FF);border-radius:99px;transition:width 0.1s linear;"></div>
        </div>
        <div id="rec-progress-text" style="font-size:0.82rem;color:rgba(247,248,240,0.4);">0%</div>
        <style>@keyframes recPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}</style>
      </div>`;
    document.body.appendChild(overlay);
  }

  function updateRecordingProgress(percent, elapsed, total) {
    const bar  = document.getElementById('rec-progress-bar');
    const text = document.getElementById('rec-progress-text');
    if (bar)  bar.style.width = percent + '%';
    if (text) { const rem = Math.max(0, Math.ceil((total - elapsed) / 1000)); text.textContent = `${Math.round(percent)}% · ${rem}s remaining`; }
  }

  function removeRecordingOverlay() { document.getElementById('recording-overlay')?.remove(); }

  /* ─── Toast ─── */
  function showToast(message, type = 'info') {
    document.querySelector('.graphiqz-toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'graphiqz-toast';
    toast.style.cssText = `position:fixed;bottom:100px;right:30px;z-index:9999;padding:14px 22px;border-radius:12px;background:var(--bg-glass-strong);backdrop-filter:blur(20px);border:1px solid ${type==='success'?'rgba(107,203,119,0.4)':'var(--border-glass)'};color:var(--text-primary);font-size:0.88rem;box-shadow:var(--shadow-card);animation:slideInToast 0.3s ease;max-width:320px;`;
    toast.textContent = message;
    document.head.insertAdjacentHTML('beforeend','<style>@keyframes slideInToast{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}</style>');
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity='0'; toast.style.transition='opacity 0.3s'; setTimeout(()=>toast.remove(),300); }, 4000);
  }

  /* ─── Event Listeners ─── */
  if (generateBtn && !generateBtn._bound) {
    generateBtn.addEventListener('click', generate);
    generateBtn._bound = true;
  }

  if (promptArea) {
    promptArea.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); generate(); }
    });
  }

  if (downloadBtn && !downloadBtn._bound) {
    downloadBtn.addEventListener('click', downloadAnimation);
    downloadBtn._bound = true;
  }

  document.querySelectorAll('.pro-gate').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      showToast('This feature requires Pro plan.', 'info');
    });
  });

})();