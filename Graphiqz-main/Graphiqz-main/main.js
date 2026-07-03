/* =========================================================
   GRAPHIQZ — Core JavaScript
   ========================================================= */

(function () {
  'use strict';

  const SUPA_URL = 'https://kapcgaowheesxevklbfk.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcGNnYW93aGVlc3hldmtsYmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzgyOTgsImV4cCI6MjA5NjA1NDI5OH0.BIZfJEzEgAMXiNgyQL1t9WtdC6zVjlSjjWOZUNgdRSs';

  /* ─── Theme ─── */
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

      window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
      }, { passive: true });

      if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
          const isOpen = menuToggle.classList.toggle('open');
          mobileNav.classList.toggle('open', isOpen);
          document.body.style.overflow = isOpen ? 'hidden' : '';
        });
        mobileNav.querySelectorAll('a').forEach(link => {
          link.addEventListener('click', () => {
            menuToggle.classList.remove('open');
            mobileNav.classList.remove('open');
            document.body.style.overflow = '';
          });
        });
        document.addEventListener('click', (e) => {
          if (!nav.contains(e.target) && !mobileNav.contains(e.target)) {
            menuToggle.classList.remove('open');
            mobileNav.classList.remove('open');
            document.body.style.overflow = '';
          }
        });
      }
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

  /* ─── Auth / Avatar ─── */
  const Auth = {
    client: null,

    init() {
      // Poll until Supabase SDK is available
      const check = setInterval(() => {
        if (typeof window.supabase === 'undefined') return;
        clearInterval(check);

        this.client = window.supabase.createClient(SUPA_URL, SUPA_KEY);

        // Check existing session first
        this.client.auth.getSession().then(({ data: { session } }) => {
          this.renderNav(session);
        });

        // Listen for auth changes (Google redirect, login, logout)
        this.client.auth.onAuthStateChange((event, session) => {
          this.renderNav(session);
          if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
            history.replaceState(null, '', window.location.pathname);
          }
        });

      }, 50);
    },

    renderNav(session) {
      const navActions = document.querySelector('.nav-actions');
      const mobileNav = document.querySelector('.mobile-nav');
      if (!navActions) return;

      // Clean up previous elements
      document.getElementById('user-avatar')?.remove();
      navActions.querySelector('a[href="signin.html"]')?.remove();
      mobileNav?.querySelector('.mobile-auth-wrap')?.remove();

      const themeBtn = navActions.querySelector('.theme-toggle');

      if (session && session.user) {
        const meta = session.user.user_metadata || {};
        const name = meta.full_name || meta.name || session.user.email || 'U';
        const letter = name.charAt(0).toUpperCase();

        /* ── Desktop Avatar ── */
        const avatar = document.createElement('div');
        avatar.id = 'user-avatar';
        avatar.style.cssText = `
          width:38px;height:38px;border-radius:50%;
          background:linear-gradient(135deg,#9CD5FF,#4988C4);
          display:flex;align-items:center;justify-content:center;
          font-weight:700;font-size:0.95rem;color:#fff;
          cursor:pointer;position:relative;
          box-shadow:0 2px 12px rgba(73,136,196,0.5);
          flex-shrink:0;user-select:none;
          border:2px solid rgba(156,213,255,0.4);
        `;
        avatar.textContent = letter;

        const dropdown = document.createElement('div');
        dropdown.style.cssText = `
          position:absolute;top:calc(100% + 10px);right:0;
          min-width:210px;padding:8px;
          background:rgba(8,15,30,0.96);
          backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
          border:1px solid rgba(73,136,196,0.25);
          border-radius:14px;
          box-shadow:0 20px 60px rgba(0,0,0,0.5);
          display:none;z-index:9999;
        `;

        const nameEl = document.createElement('div');
        nameEl.style.cssText = `
          padding:10px 14px;font-size:0.82rem;font-weight:600;
          color:rgba(247,248,240,0.45);
          border-bottom:1px solid rgba(73,136,196,0.15);
          margin-bottom:6px;white-space:nowrap;
          overflow:hidden;text-overflow:ellipsis;
        `;
        nameEl.textContent = name.length > 26 ? name.slice(0,26)+'...' : name;

        const signOutBtn = document.createElement('button');
        signOutBtn.style.cssText = `
          width:100%;padding:10px 14px;background:none;border:none;
          border-radius:8px;font-size:0.9rem;font-weight:600;
          color:rgba(255,100,100,0.9);cursor:pointer;
          text-align:left;display:flex;align-items:center;gap:10px;
          transition:background 0.2s;
        `;
        signOutBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="rgba(255,100,100,0.9)">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>Sign Out`;
        signOutBtn.onmouseover = () => signOutBtn.style.background = 'rgba(255,100,100,0.08)';
        signOutBtn.onmouseout = () => signOutBtn.style.background = 'none';
        signOutBtn.onclick = async () => {
          await this.client.auth.signOut();
          window.location.reload();
        };

        dropdown.appendChild(nameEl);
        dropdown.appendChild(signOutBtn);
        avatar.appendChild(dropdown);

        avatar.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
        document.addEventListener('click', () => {
          dropdown.style.display = 'none';
        });

        // Insert avatar BEFORE theme toggle on desktop
        if (themeBtn) navActions.insertBefore(avatar, themeBtn);
        else navActions.appendChild(avatar);

        /* ── Mobile: account row inside hamburger menu ── */
        if (mobileNav) {
          const wrap = document.createElement('div');
          wrap.className = 'mobile-auth-wrap';
          wrap.style.cssText = `margin-top:8px;display:flex;flex-direction:column;gap:8px;`;

          // Account row
          const accountRow = document.createElement('div');
          accountRow.style.cssText = `
            display:flex;align-items:center;gap:10px;
            padding:12px 16px;
            background:rgba(73,136,196,0.08);
            border:1px solid rgba(73,136,196,0.18);
            border-radius:10px;
          `;
          accountRow.innerHTML = `
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#9CD5FF,#4988C4);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;color:#fff;flex-shrink:0;">${letter}</div>
            <span style="font-size:0.88rem;color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>
          `;

          // Bottom row: theme toggle + sign out
          const bottomRow = document.createElement('div');
          bottomRow.style.cssText = `display:flex;gap:8px;`;

          const mobileThemeBtn = document.createElement('button');
          mobileThemeBtn.style.cssText = `
            flex:1;padding:10px;border-radius:10px;
            border:1px solid rgba(73,136,196,0.2);
            background:rgba(73,136,196,0.07);
            display:flex;align-items:center;justify-content:center;gap:8px;
            font-size:0.85rem;font-weight:600;color:var(--text-secondary);
            cursor:pointer;
          `;
          mobileThemeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-14a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V4a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1zM4.22 5.64a1 1 0 0 1 1.42-1.42l.7.71a1 1 0 0 1-1.41 1.41l-.71-.7zM17.66 19.07a1 1 0 1 1 1.41-1.41l.71.7a1 1 0 0 1-1.42 1.42l-.7-.71zM3 12a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1zm17 0a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2h-1a1 1 0 0 1-1-1zM5.64 19.07l-.7.71a1 1 0 0 1-1.42-1.42l.71-.7a1 1 0 0 1 1.41 1.41zM19.07 5.64a1 1 0 1 1 1.41 1.41l-.7.71a1 1 0 0 1-1.42-1.42l.71-.7z"/></svg>
            Theme
          `;
          mobileThemeBtn.onclick = () => ThemeManager.toggle();

          const mobileSignOut = document.createElement('button');
          mobileSignOut.style.cssText = `
            flex:1;padding:10px;border-radius:10px;
            border:1px solid rgba(255,100,100,0.2);
            background:rgba(255,100,100,0.07);
            font-size:0.85rem;font-weight:600;
            color:rgba(255,100,100,0.9);cursor:pointer;
            display:flex;align-items:center;justify-content:center;gap:8px;
          `;
          mobileSignOut.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="rgba(255,100,100,0.9)">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>Sign Out`;
          mobileSignOut.onclick = async () => {
            await this.client.auth.signOut();
            window.location.reload();
          };

          bottomRow.appendChild(mobileThemeBtn);
          bottomRow.appendChild(mobileSignOut);
          wrap.appendChild(accountRow);
          wrap.appendChild(bottomRow);
          mobileNav.appendChild(wrap);
        }

      } else {
        /* ── Not logged in ── */

        // Desktop sign in button
        const signInBtn = document.createElement('a');
        signInBtn.href = 'signin.html';
        signInBtn.className = 'btn btn-secondary';
        signInBtn.style.cssText = 'font-size:0.88rem;padding:9px 18px;';
        signInBtn.textContent = 'Sign In';
        if (themeBtn) navActions.insertBefore(signInBtn, themeBtn);
        else navActions.appendChild(signInBtn);

        // Mobile: sign in + theme toggle
        if (mobileNav) {
          const wrap = document.createElement('div');
          wrap.className = 'mobile-auth-wrap';
          wrap.style.cssText = `display:flex;gap:8px;margin-top:8px;`;

          const mobileSignIn = document.createElement('a');
          mobileSignIn.href = 'signin.html';
          mobileSignIn.style.cssText = `
            flex:1;display:flex;align-items:center;justify-content:center;
            padding:11px;border-radius:10px;
            background:linear-gradient(135deg,#9CD5FF,#4988C4);
            font-size:0.92rem;font-weight:600;color:#fff;
            text-decoration:none;box-shadow:0 4px 16px rgba(73,136,196,0.4);
          `;
          mobileSignIn.textContent = 'Sign In';

          const mobileThemeBtn = document.createElement('button');
          mobileThemeBtn.style.cssText = `
            width:44px;height:44px;border-radius:10px;
            border:1px solid rgba(73,136,196,0.2);
            background:rgba(73,136,196,0.07);
            display:flex;align-items:center;justify-content:center;
            cursor:pointer;flex-shrink:0;
          `;
          mobileThemeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-14a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V4a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1zM4.22 5.64a1 1 0 0 1 1.42-1.42l.7.71a1 1 0 0 1-1.41 1.41l-.71-.7zM17.66 19.07a1 1 0 1 1 1.41-1.41l.71.7a1 1 0 0 1-1.42 1.42l-.7-.71zM3 12a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1zm17 0a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2h-1a1 1 0 0 1-1-1zM5.64 19.07l-.7.71a1 1 0 0 1-1.42-1.42l.71-.7a1 1 0 0 1 1.41 1.41zM19.07 5.64a1 1 0 1 1 1.41 1.41l-.7.71a1 1 0 0 1-1.42-1.42l.71-.7z"/></svg>
          `;
          mobileThemeBtn.onclick = () => ThemeManager.toggle();

          wrap.appendChild(mobileSignIn);
          wrap.appendChild(mobileThemeBtn);
          mobileNav.appendChild(wrap);
        }
      }
    }
  };

  /* ─── Scroll Animations ─── */
  const ScrollAnimator = {
    init() {
      const elements = document.querySelectorAll('.fade-up, .fade-left, .fade-right, .fade-in');
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
        el.textContent = prefix + (easeOutQuart(progress) * target).toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + target.toFixed(decimals) + suffix;
      };
      requestAnimationFrame(tick);
    }
  };

  /* ─── FAQ ─── */
  const FAQ = {
    init() {
      document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = btn.closest('.faq-item');
          const isOpen = item.classList.contains('open');
          document.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
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
            el.dataset.count = isYearly ? parseFloat(yearly) : parseFloat(monthly);
            CounterAnimator.animate(el);
          }
        });
      });
    }
  };

  /* ─── Testimonials ─── */
  const Testimonials = {
    init() {
      const track = document.querySelector('.testimonials-track');
      if (!track) return;
      const cards = track.innerHTML;
      track.innerHTML = cards + cards;
    }
  };

  /* ─── Particles ─── */
  const ParticleField = {
    canvas: null, ctx: null, particles: [], animId: null,
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
      const c = isDark ? '73,136,196' : '53,88,114';
      this.particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = this.canvas.width;
        if (p.x > this.canvas.width) p.x = 0;
        if (p.y < 0) p.y = this.canvas.height;
        if (p.y > this.canvas.height) p.y = 0;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${c},${p.opacity})`;
        this.ctx.fill();
        for (let j = i + 1; j < this.particles.length; j++) {
          const q = this.particles[j];
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 100) {
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(q.x, q.y);
            this.ctx.strokeStyle = `rgba(${c},${(1 - dist / 100) * 0.12})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
          }
        }
      });
      this.animId = requestAnimationFrame(() => this.animate());
    }
  };

  /* ─── Init ─── */
  document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    Navbar.init();
    Auth.init();
    ScrollAnimator.init();
    CounterAnimator.init();
    FAQ.init();
    PricingToggle.init();
    Testimonials.init();
    ParticleField.init('hero-particles');
  });

  window.Graphiqz = { ThemeManager, Navbar, Auth, ScrollAnimator, CounterAnimator, ParticleField };
})();