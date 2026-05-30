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
