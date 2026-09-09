document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());

  /* ---------- Menú móvil ---------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      const navShell = navLinks.closest('.nav-shell');
      if (navShell) navShell.classList.toggle('is-open', open);
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', open);
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      const navShell = navLinks.closest('.nav-shell');
      if (navShell) navShell.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', false);
    }));
  }


  /* ---------- Tema claro / oscuro ---------- */
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const savedTheme = localStorage.getItem('jfv-theme');
    if (savedTheme === 'dark') document.body.classList.add('dark-mode');
    const updateThemeButton = () => {
      const dark = document.body.classList.contains('dark-mode');
      themeToggle.setAttribute('aria-pressed', dark);
      themeToggle.querySelector('.theme-icon').textContent = dark ? '☀' : '☾';
    };
    updateThemeButton();
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('jfv-theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
      updateThemeButton();
    });
  }

  /* ---------- Barra de progreso de scroll ---------- */
  const progressBar = document.getElementById('scrollProgress');
  const nav = document.querySelector('.nav');
  function onScroll() {
    if (progressBar) {
      const h = document.documentElement;
      const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
      progressBar.style.width = scrolled + '%';
    }
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 30);
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Cursor glow (solo desktop) ---------- */
  const glow = document.getElementById('cursorGlow');
  if (glow && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let gx = mx, gy = my;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      glow.classList.add('is-active');
    });
    (function loop() {
      gx += (mx - gx) * 0.14;
      gy += (my - gy) * 0.14;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Scrollspy del menú ---------- */
  const sections = ['inicio', 'nosotros', 'servicios', 'galeria', 'contacto']
    .map(id => document.getElementById(id))
    .filter(Boolean);
  if (sections.length && navLinks) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.querySelectorAll('a').forEach(a => {
            a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* ---------- Split-text: reveal palabra por palabra ---------- */
  function splitWords(node) {
    const frag = document.createDocumentFragment();
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        child.textContent.split(/(\s+)/).forEach(token => {
          if (token.trim() === '') {
            frag.appendChild(document.createTextNode(token));
          } else {
            const outer = document.createElement('span');
            outer.className = 'word';
            const inner = document.createElement('span');
            inner.className = 'word-inner';
            inner.textContent = token;
            outer.appendChild(inner);
            frag.appendChild(outer);
          }
        });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const clone = child.cloneNode(false);
        clone.appendChild(splitWords(child));
        frag.appendChild(clone);
      }
    });
    return frag;
  }

  const splitTargets = document.querySelectorAll('[data-split]');
  splitTargets.forEach(el => {
    const frag = splitWords(el);
    el.innerHTML = '';
    el.appendChild(frag);
    el.classList.add('split-text');
    el.querySelectorAll('.word-inner').forEach((w, i) => w.style.setProperty('--i', i));
  });

  if ('IntersectionObserver' in window && splitTargets.length) {
    const splitIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          splitIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    splitTargets.forEach(el => splitIO.observe(el));
  } else {
    splitTargets.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Reveal on scroll (bloques) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.setProperty('--i', i);
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Contadores animados ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count || '0');
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.textContent = prefix + val.toLocaleString('es-AR') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(el => countIO.observe(el));
  }

  /* ---------- Botones: magnéticos + ripple ---------- */
  const magnetTargets = document.querySelectorAll('.btn-primary, .btn-ghost');
  magnetTargets.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      btn.style.transition = 'transform .15s ease-out';
      btn.style.transform = `translate(${relX * 0.18}px, ${relY * 0.35}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transition = 'transform .45s cubic-bezier(.22,1,.36,1)';
      btn.style.transform = '';
    });
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height) * 1.4;
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 620);
    });
  });

  /* ---------- Tilt 3D reutilizable (servicios y productos) ---------- */
  function attachTilt(el, { max = 8, scale = 1.02 } = {}) {
    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rotY = (px - 0.5) * max * 2;
      const rotX = (0.5 - py) * max * 2;
      el.classList.add('is-tilting');
      el.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;
    }
    function onLeave() {
      el.classList.remove('is-tilting');
      el.style.transform = '';
    }
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
  }
  window.JFV = window.JFV || {};
  window.JFV.attachTilt = attachTilt;

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.service-card').forEach(el => attachTilt(el, { max: 7, scale: 1.02 }));
  }

  /* ---------- Toast reutilizable ---------- */
  function showToast(text) {
    let toast = document.getElementById('jfvToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'jfvToast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }
  window.JFV.showToast = showToast;



});
