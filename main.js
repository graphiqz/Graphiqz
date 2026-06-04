/* =========================================================
   GRAPHIQZ — Core JavaScript
   Theme | Navbar | Scroll Animations | Counters | FAQ
   ========================================================= */

(function () {
  'use strict';

  /* ─── Theme Management ─── */
  const ThemeManager = {
    key: 'graphiqz-theme',
    current: 'dark',

    init() {
      const saved = localStorage.getItem(this.key) || 'dark';
      this.set(saved, false);
      this.bindToggles();
    },

    set(theme, save = true) {
      this.current = theme;
      document.documentElement.setAttribute('data-theme', theme);
      if (save) localStorage.setItem(this.key, theme);
      this.updateIcons(theme);
    },

    toggle() {
      this.set(this.current === 'dark' ? 'light' : 'dark');
    },

    updateIcons(theme) {
      document.querySelectorAll('.theme-icon-sun').forEach(el => {
        el.style.display = theme === 'dark' ? 'block' : 'none';
      });
      document.querySelectorAll('.theme-icon-moon').forEach(el => {
        el.style.display = theme === 'light' ? 'block' : 'none';
      });
    },

    bindToggles() {
      document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.addEventListener('click', () => this.toggle());
      });
    }
  };

  /* ─── Navbar ─── */
  const Navbar = {
    init() {
      const nav = document.querySelector('.navbar');
      const menuToggle = document.querySelector('.menu-toggle');
      const mobileNav = document.querySelector('.mobile-nav');

      if (!nav) return;

      // Scroll effect
      window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
      }, { passive: true });

      // Mobile menu
      if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
          const isOpen = menuToggle.classList.toggle('open');
          mobileNav.classList.toggle('open', isOpen);
          document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Close on link click
        mobileNav.querySelectorAll('a').forEach(link => {
          link.addEventListener('click', () => {
            menuToggle.classList.remove('open');
            mobileNav.classList.remove('open');
            document.body.style.overflow = '';
          });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
          if (!nav.contains(e.target) && !mobileNav.contains(e.target)) {
            menuToggle.classList.remove('open');
            mobileNav.classList.remove('open');
            document.body.style.overflow = '';
          }
        });
      }

      // Active link
      this.setActiveLink();
    },
async initUserIcon() {
  const { createClient } = supabase;
  const _supabase = createClient(
    'https://kapcgaowheesxevklbfk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcGNnYW93aGVlc3hldmtsYmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzgyOTgsImV4cCI6MjA5NjA1NDI5OH0.BIZfJEzEgAMXiNgyQL1t9WtdC6zVjlSjjWOZUNgdRSs'
  );

  const { data: { session } } = await _supabase.auth.getSession();
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  if (session) {
    const name = session.user.user_metadata?.full_name || session.user.email;
    const letter = name.charAt(0).toUpperCase();

    // Remove sign in button if present, add avatar
    const existingSignIn = navActions.querySelector('a[href="signin.html"]');
    if (existingSignIn) existingSignIn.remove();

    const avatar = document.createElement('div');
    avatar.id = 'user-avatar';
    avatar.style.cssText = `
      width:38px;height:38px;border-radius:50%;
      background:var(--grad-accent);
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:0.95rem;color:#fff;
      cursor:pointer;position:relative;
      box-shadow:0 2px 12px rgba(73,136,196,0.45);
      flex-shrink:0;user-select:none;
      border:2px solid rgba(73,136,196,0.4);
    `;
    avatar.textContent = letter;

    const dropdown = document.createElement('div');
    dropdown.id = 'user-dropdown';
    dropdown.style.cssText = `
      position:absolute;top:calc(100% + 10px);right:0;
      min-width:200px;padding:8px;
      background:var(--bg-glass-strong);
      backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
      border:1px solid var(--border-glass);
      border-radius:var(--radius-md);
      box-shadow:var(--shadow-card);
      display:none;z-index:9999;
    `;

    const nameEl = document.createElement('div');
    nameEl.style.cssText = `
      padding:10px 14px 8px;
      font-size:0.82rem;font-weight:600;
      color:var(--text-muted);
      border-bottom:1px solid var(--border-glass);
      margin-bottom:6px;
    `;
    nameEl.textContent = name.length > 24 ? name.slice(0,24)+'...' : name;

    const signOutBtn = document.createElement('button');
    signOutBtn.style.cssText = `
      width:100%;padding:10px 14px;
      background:none;border:none;
      border-radius:var(--radius-sm);
      font-family:var(--font-body);font-size:0.9rem;font-weight:600;
      color:rgba(255,100,100,0.9);cursor:pointer;
      text-align:left;display:flex;align-items:center;gap:10px;
      transition:background 0.2s;
    `;
    signOutBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="rgba(255,100,100,0.9)">
        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
      </svg>
      Sign Out
    `;
    signOutBtn.onmouseover = () => signOutBtn.style.background = 'rgba(255,100,100,0.08)';
    signOutBtn.onmouseout = () => signOutBtn.style.background = 'none';
    signOutBtn.onclick = async () => {
      await _supabase.auth.signOut();
      window.location.reload();
    };

    dropdown.appendChild(nameEl);
    dropdown.appendChild(signOutBtn);
    avatar.appendChild(dropdown);

    // Toggle dropdown
    avatar.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.style.display === 'block';
      dropdown.style.display = isOpen ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });

    // Insert avatar before the first button in nav-actions
    navActions.insertBefore(avatar, navActions.firstChild);

  } else {
    // Not logged in — show Sign In button if not already there
    if (!navActions.querySelector('a[href="signin.html"]')) {
      const signInBtn = document.createElement('a');
      signInBtn.href = 'signin.html';
      signInBtn.className = 'btn btn-secondary';
      signInBtn.style.cssText = 'font-size:0.88rem;padding:9px 18px;';
      signInBtn.textContent = 'Sign In';
      navActions.insertBefore(signInBtn, navActions.firstChild);
    }
  }
},
    setActiveLink() {
      const path = window.location.pathname.split('/').pop() || 'index.html';
      document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === path || (path === 'index.html' && href === 'index.html')) {
          link.classList.add('active');
        }
      });
    }
  };

  /* ─── Scroll Animation Observer ─── */
  const ScrollAnimator = {
    init() {
      const elements = document.querySelectorAll(
        '.fade-up, .fade-left, .fade-right, .fade-in'
      );

      if (!elements.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      elements.forEach(el => observer.observe(el));
    }
  };

  /* ─── Counter Animation ─── */
  const CounterAnimator = {
    init() {
      const counters = document.querySelectorAll('[data-count]');
      if (!counters.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      counters.forEach(counter => observer.observe(counter));
    },

    animate(el) {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = parseInt(el.dataset.duration) || 2000;
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
      const start = Date.now();

      const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = easeOutQuart(progress) * target;

        el.textContent = prefix + value.toFixed(decimals) + suffix;

        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + target.toFixed(decimals) + suffix;
      };

      requestAnimationFrame(tick);
    }
  };

  /* ─── FAQ Accordion ─── */
  const FAQ = {
    init() {
      document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = btn.closest('.faq-item');
          const isOpen = item.classList.contains('open');

          // Close all
          document.querySelectorAll('.faq-item.open').forEach(open => {
            open.classList.remove('open');
          });

          // Toggle current
          if (!isOpen) item.classList.add('open');
        });
      });
    }
  };

  /* ─── Pricing Toggle ─── */
  const PricingToggle = {
    init() {
      const toggle = document.getElementById('billing-toggle');
      if (!toggle) return;

      toggle.addEventListener('change', () => {
        const isYearly = toggle.checked;
        document.querySelectorAll('.price-amount').forEach(el => {
          const monthly = el.dataset.monthly;
          const yearly = el.dataset.yearly;
          if (monthly && yearly) {
            const target = isYearly ? parseFloat(yearly) : parseFloat(monthly);
            CounterAnimator.animate(el);
            el.dataset.count = target;
          }
        });
      });
    }
  };

  /* ─── Smooth Page Transitions ─── */
  const PageTransition = {
    init() {
      // Add transition overlay
      const overlay = document.createElement('div');
      overlay.id = 'page-transition';
      overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: var(--bg-primary);
        opacity: 0; pointer-events: none;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(overlay);

      // Fade in on load
      document.addEventListener('DOMContentLoaded', () => {
        overlay.style.opacity = '0';
      });

      // Intercept navigation
      document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('http') || link.target === '_blank') return;

        link.addEventListener('click', (e) => {
          e.preventDefault();
          overlay.style.opacity = '1';
          overlay.style.pointerEvents = 'all';
          setTimeout(() => {
            window.location.href = href;
          }, 300);
        });
      });
    }
  };

  /* ─── Testimonials Duplicate for Infinite Scroll ─── */
  const Testimonials = {
    init() {
      const track = document.querySelector('.testimonials-track');
      if (!track) return;

      const cards = track.innerHTML;
      track.innerHTML = cards + cards; // duplicate for seamless loop
    }
  };

  /* ─── Particle Dots Background (Canvas) ─── */
  const ParticleField = {
    canvas: null,
    ctx: null,
    particles: [],
    animId: null,

    init(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      this.createParticles();
      this.animate();
      window.addEventListener('resize', () => this.resize(), { passive: true });
    },

    resize() {
      if (!this.canvas) return;
      this.canvas.width = this.canvas.offsetWidth;
      this.canvas.height = this.canvas.offsetHeight;
    },

    createParticles() {
      this.particles = [];
      const count = Math.floor((this.canvas.width * this.canvas.height) / 12000);
      for (let i = 0; i < Math.min(count, 60); i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          r: Math.random() * 1.5 + 0.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
    },

    animate() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const particleColor = isDark ? '73, 136, 196' : '53, 88, 114';

      this.particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = this.canvas.width;
        if (p.x > this.canvas.width) p.x = 0;
        if (p.y < 0) p.y = this.canvas.height;
        if (p.y > this.canvas.height) p.y = 0;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${particleColor}, ${p.opacity})`;
        this.ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < this.particles.length; j++) {
          const q = this.particles[j];
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 100) {
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(q.x, q.y);
            this.ctx.strokeStyle = `rgba(${particleColor}, ${(1 - dist / 100) * 0.12})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
          }
        }
      });

      this.animId = requestAnimationFrame(() => this.animate());
    }
  };

  /* ─── Copy to Clipboard ─── */
  window.copyToClipboard = function (text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = orig, 2000);
    });
  };

  /* ─── Initialize Everything ─── */
  document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    Navbar.init();
    Navbar.initUserIcon();
    ScrollAnimator.init();
    CounterAnimator.init();
    FAQ.init();
    PricingToggle.init();
    Testimonials.init();

    // Particle canvas if present
    ParticleField.init('hero-particles');
  });

  // Expose for page-specific use
  window.Graphiqz = {
    ThemeManager,
    Navbar,
    ScrollAnimator,
    CounterAnimator,
    ParticleField
  };
})();
