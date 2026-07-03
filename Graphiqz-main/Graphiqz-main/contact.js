/* =========================================================
   GRAPHIQZ — Contact Page JavaScript
   Resend API Integration | Form Validation
   ========================================================= */

(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const successState = document.getElementById('form-success');
  const formBody = document.getElementById('form-body');

  if (!form) return;

  /* ─── Validation ─── */
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.style.borderColor = 'rgba(255,100,100,0.6)';
    field.style.boxShadow = '0 0 0 3px rgba(255,100,100,0.1)';

    let errEl = field.parentNode.querySelector('.field-error');
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'field-error';
      errEl.style.cssText = 'display:block;color:rgba(255,100,100,0.9);font-size:0.78rem;margin-top:5px;';
      field.parentNode.appendChild(errEl);
    }
    errEl.textContent = message;
  }

  function clearErrors() {
    form.querySelectorAll('.field-error').forEach(el => el.remove());
    form.querySelectorAll('input, select, textarea').forEach(el => {
      el.style.borderColor = '';
      el.style.boxShadow = '';
    });
  }

  function validate() {
    clearErrors();
    let valid = true;

    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const subject = document.getElementById('subject')?.value.trim();
    const message = document.getElementById('message')?.value.trim();

    if (!name || name.length < 2) {
      showError('name', 'Please enter your full name');
      valid = false;
    }

    if (!email || !validateEmail(email)) {
      showError('email', 'Please enter a valid email address');
      valid = false;
    }

    if (!subject) {
      showError('subject', 'Please select a subject');
      valid = false;
    }

    if (!message || message.length < 20) {
      showError('message', 'Message must be at least 20 characters');
      valid = false;
    }

    return valid;
  }

  /* ─── Send via Resend ─── */
  async function sendEmail(data) {
    const RESEND_KEY = window.GRAPHIQZ_CONFIG?.resendKey || '';

    if (!RESEND_KEY) {
      // Demo mode
      console.log('Contact form (demo mode):', data);
      await new Promise(r => setTimeout(r, 1500));
      return { success: true };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Graphiqz Contact <contact@graphiqz.ai>',
        to: ['hello@graphiqz.ai'],
        reply_to: data.email,
        subject: `[Graphiqz Contact] ${data.subject} — from ${data.name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#08101e;color:#F7F8F0;padding:40px;border-radius:16px;">
            <h2 style="background:linear-gradient(135deg,#9CD5FF,#4988C4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:24px;">
              New Contact from Graphiqz
            </h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;color:#7AAACE;font-weight:600;width:120px;">Name:</td><td style="padding:10px 0;">${data.name}</td></tr>
              <tr><td style="padding:10px 0;color:#7AAACE;font-weight:600;">Email:</td><td style="padding:10px 0;"><a href="mailto:${data.email}" style="color:#9CD5FF;">${data.email}</a></td></tr>
              <tr><td style="padding:10px 0;color:#7AAACE;font-weight:600;">Company:</td><td style="padding:10px 0;">${data.company || '—'}</td></tr>
              <tr><td style="padding:10px 0;color:#7AAACE;font-weight:600;">Subject:</td><td style="padding:10px 0;">${data.subject}</td></tr>
            </table>
            <div style="margin-top:24px;padding:20px;background:rgba(73,136,196,0.1);border-radius:10px;border:1px solid rgba(73,136,196,0.2);">
              <p style="color:#7AAACE;font-weight:600;margin-bottom:10px;">Message:</p>
              <p style="line-height:1.7;color:#F7F8F0;">${data.message.replace(/\n/g, '<br>')}</p>
            </div>
            <p style="margin-top:24px;font-size:0.8rem;color:rgba(247,248,240,0.4);">Sent via Graphiqz Contact Form</p>
          </div>
        `
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Send failed');
    return { success: true };
  }

  /* ─── Submit Handler ─── */

// Paste this inside your js/contact.js file
form.addEventListener('submit', async function (e) {
  e.preventDefault();
  
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });

    // In the success block:
if (response.status === 200) {
    form.style.display = 'none'; // Hide the form
    document.getElementById('success-email').textContent = data.email;
    
    const successDiv = document.getElementById('form-success');
    successDiv.style.display = 'flex';
successDiv.style.flexDirection = 'column';
successDiv.style.alignItems = 'center';
successDiv.style.gap = '16px';
successDiv.style.padding = '50px 20px';
successDiv.style.textAlign = 'center';
    successDiv.style.opacity = '1';
} else {
      throw new Error("Failed");
    }
  } catch (err) {
    alert("Error sending message.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Message";
  }
});

  /* ─── Real-time Validation ─── */
  form.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('blur', () => {
      const errEl = el.parentNode.querySelector('.field-error');
      if (errEl) errEl.remove();
      el.style.borderColor = '';
      el.style.boxShadow = '';
    });
  });

})();
