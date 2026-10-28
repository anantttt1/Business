(() => {
  'use strict';
  const PHOTO_KEY = 'ap-pb-photo';
  const STORAGE_KEY = 'ap-pb-v1';
  function loadConfig() {
    const cfg = {
      name: 'Your Name', role: 'Software Engineer · Developer', roleShort: 'Developer · Builder',
      intro: 'I build thoughtful digital experiences and turn complex problems into useful products.',
      location: 'Your City', focus: 'Full-stack · DSA · AI', availability: 'Open to opportunities',
      aboutOne: 'I am building a strong foundation in programming, data structures, web development and applied problem solving.',
      aboutTwo: 'I enjoy turning early ideas into practical prototypes and learning through real projects.',
      email: '', resumeUrl: '', github: '', linkedin: '', leetcode: '', hackerrank: '', photoData: '',
      skills: [], projects: [], education: [], certificates: [], leetcodeStats: { total: '', easy: '', medium: '', hard: '' }
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          cfg.name = s.fullName || cfg.name;
          cfg.role = s.title || cfg.role;
          cfg.roleShort = (s.title || cfg.roleShort).split(/[·|,]/)[0].trim() + ' · Builder';
          cfg.intro = s.tagline || s.about || cfg.intro;
          cfg.aboutOne = s.about || cfg.aboutOne;
          cfg.aboutTwo = s.tagline || cfg.aboutTwo;
          cfg.location = s.location || cfg.location;
          cfg.email = s.email || '';
          cfg.resumeUrl = s.resumeUrl || '';
          cfg.github = s.github || '';
          cfg.linkedin = s.linkedin || '';
          cfg.leetcode = String(s.leetcodeUsername || s.leetcode || '').replace(/^@/, '').replace(/.*leetcode\.com\/(u\/)?/i, '').replace(/\/$/, '');
          cfg.hackerrank = s.hackerrank || '';
          cfg.photoData = s.photoData || '';
          if (s.skills && s.skills.length) cfg.skills = s.skills;
          if (s.projects && s.projects.length) {
            cfg.projects = s.projects.map((pr, i) => ({
              title: pr.name || 'Project', description: pr.description || '',
              tech: typeof pr.tech === 'string' ? pr.tech.split(/[,|]/).map(t => t.trim()).filter(Boolean) : (pr.tech || []),
              liveUrl: pr.liveUrl || '', githubUrl: pr.githubUrl || '',
              category: (pr.category || 'web').toLowerCase().includes('ai') ? 'ai' : (pr.category || 'web').toLowerCase().includes('other') ? 'other' : 'web',
              year: pr.year || '2026', index: i + 1
            }));
          }
          if (s.education && s.education.length) cfg.education = s.education;
          if (s.certifications && s.certifications.length) {
            cfg.certificates = s.certifications.map(c => ({ title: c.name || 'Certificate', issuer: c.org || '', year: c.year || '', url: c.url || '' }));
          }
        }
      }
    } catch (_) {}
    try { if (!cfg.photoData) cfg.photoData = localStorage.getItem(PHOTO_KEY) || sessionStorage.getItem(PHOTO_KEY) || ''; } catch (_) {}
    return cfg;
  }
  let config = loadConfig();
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  function initials(name) {
    const p = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return 'YN';
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function applyConfig() {
    config = loadConfig();
    $$('[data-config]').forEach((el) => {
      const key = el.dataset.config;
      if (Object.prototype.hasOwnProperty.call(config, key) && config[key] != null) el.textContent = String(config[key]);
    });
    const bi = $('#brandInitials'); if (bi) bi.textContent = initials(config.name);
    const yr = $('#current-year'); if (yr) yr.textContent = String(new Date().getFullYear());
    const resume = $('#resumeLink');
    if (resume) {
      if (config.resumeUrl) { resume.href = config.resumeUrl; resume.setAttribute('download', ''); resume.target = '_blank'; resume.rel = 'noopener noreferrer'; }
      else { resume.href = '#contact'; resume.removeAttribute('download'); }
    }
    const gh = config.github || 'https://github.com/';
    const li = config.linkedin || 'https://www.linkedin.com/';
    const lc = config.leetcode ? 'https://leetcode.com/u/' + encodeURIComponent(config.leetcode) + '/' : 'https://leetcode.com/';
    const hr = config.hackerrank || 'https://www.hackerrank.com/';
    const setHref = (sel, url) => { const el = $(sel); if (el) el.href = url; };
    setHref('.social-shortcuts a[aria-label="GitHub"]', gh);
    setHref('.social-shortcuts a[aria-label="LinkedIn"]', li);
    setHref('.social-shortcuts a[aria-label="LeetCode"]', lc);
    const rows = $$('.profile-row');
    if (rows[0]) rows[0].href = gh; if (rows[1]) rows[1].href = lc; if (rows[2]) rows[2].href = hr; if (rows[3]) rows[3].href = li;
    setHref('.contact-details a[href*="linkedin.com"]', li);
    if (config.photoData) {
      const preview = $('#portrait-preview'), plus = $('#upload-plus'), title = $('#portrait-title'), hint = $('#portrait-hint'), upload = $('.portrait-upload');
      if (preview) { preview.src = config.photoData; preview.hidden = false; }
      if (plus) plus.hidden = true;
      if (title) title.textContent = 'YOUR PORTRAIT';
      if (hint) hint.textContent = 'Photo from builder';
      if (upload) upload.classList.add('has-photo');
    }
    if (config.skills && config.skills.length) {
      const skillCards = $$('.skill-card');
      const groups = [
        { title: 'Core Skills', items: config.skills.slice(0, 4) },
        { title: 'Tools & Stack', items: config.skills.slice(4, 8) },
        { title: 'More', items: config.skills.slice(8, 12) }
      ].filter(g => g.items.length);
      skillCards.forEach((card, i) => {
        if (!groups[i]) return;
        const h3 = card.querySelector('h3'), tags = card.querySelector('.tags');
        if (h3) h3.textContent = groups[i].title;
        if (tags) tags.innerHTML = groups[i].items.map(s => '<span>' + escapeHtml(s) + '</span>').join('');
      });
    }
    if (config.projects && config.projects.length) {
      const grid = $('#projects-grid');
      if (grid) {
        grid.innerHTML = config.projects.map((p, i) => {
          const cat = p.category || 'web';
          const tech = (p.tech || []).map(t => '<span>' + escapeHtml(t) + '</span>').join('');
          const links = [];
          if (p.liveUrl) links.push('<a href="' + escapeHtml(p.liveUrl) + '" target="_blank" rel="noopener noreferrer">Live Demo ↗</a>');
          if (p.githubUrl) links.push('<a href="' + escapeHtml(p.githubUrl) + '" target="_blank" rel="noopener noreferrer">Source Code ↗</a>');
          return '<article class="project-card panel reveal is-visible" data-category="' + escapeHtml(cat) + '">' +
            '<div class="project-preview preview-violet"><div class="mock-window"><div class="mock-dots"><i></i><i></i><i></i></div>' +
            '<div class="mock-line line-long"></div><div class="mock-line line-short"></div><div class="mock-blocks"><span></span><span></span><span></span></div></div>' +
            '<span class="preview-label">' + String(i + 1).padStart(2, '0') + ' / PROJECT</span></div>' +
            '<div class="project-body"><div class="project-meta"><span>Project / ' + String(i + 1).padStart(2, '0') + '</span><time>' + escapeHtml(p.year || '2026') + '</time></div>' +
            '<h3>' + escapeHtml(p.title) + '</h3><p>' + escapeHtml(p.description) + '</p>' +
            '<div class="tags">' + tech + '</div><div class="project-links">' + links.join('') + '</div></div></article>';
        }).join('');
        const count = $('#project-count');
        if (count) count.textContent = 'Showing ' + config.projects.length + ' projects · All projects';
      }
    }
    if (config.certificates && config.certificates.length) {
      const grid = $('#cert-grid');
      if (grid) {
        const icons = ['✧', '◇', '⌘', '✳'];
        grid.innerHTML = config.certificates.map((c, i) => {
          const link = c.url ? '<a href="' + escapeHtml(c.url) + '" target="_blank" rel="noopener noreferrer" class="certificate-link">View certificate ↗</a>' : '<span class="certificate-link">No link</span>';
          return '<article class="certificate-card panel reveal is-visible"><div class="cert-icon">' + icons[i % icons.length] +
            '</div><div class="cert-info"><h3>' + escapeHtml(c.title) + '</h3><p>' + escapeHtml(c.issuer || 'Credential') +
            '</p><small>' + escapeHtml(c.year || '') + (c.year ? ' · ' : '') + link + '</small></div></article>';
        }).join('');
      }
    }
    if (config.education && config.education.length) {
      const timeline = $('.timeline');
      if (timeline) {
        timeline.innerHTML = config.education.map(ed => {
          const date = [ed.start, ed.end].filter(Boolean).join(' — ') || 'Ongoing';
          const title = [ed.degree, ed.field].filter(Boolean).join(' — ') || 'Education';
          return '<article class="timeline-item"><span class="timeline-diamond"></span><div class="timeline-date">' +
            escapeHtml(date) + '</div><h3>' + escapeHtml(title) + '</h3><p class="timeline-subtitle">' +
            escapeHtml(ed.institution || '') + '</p><p>' + escapeHtml(ed.description || '') + '</p></article>';
        }).join('');
      }
    }
    const emailDisplay = $('#email-display');
    const emailContactLink = $('#email-contact-link');
    if (emailDisplay) emailDisplay.textContent = config.email || 'Add email in the builder';
    if (emailContactLink) emailContactLink.href = config.email ? 'mailto:' + config.email : '#contact';
  }
  const toast = $('#toast');
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message; toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3000);
  }
  const themeButton = $('.theme-toggle');
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('impact-portfolio-theme') || 'dark'; } catch (_) {}
  document.body.dataset.theme = savedTheme === 'light' ? 'light' : 'dark';
  if (themeButton) {
    const updateThemeLabel = () => {
      const light = document.body.dataset.theme === 'light';
      themeButton.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
      themeButton.title = light ? 'Switch to dark theme' : 'Switch to light theme';
    };
    updateThemeLabel();
    themeButton.addEventListener('click', () => {
      document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('impact-portfolio-theme', document.body.dataset.theme); } catch (_) {}
      updateThemeLabel();
      showToast((document.body.dataset.theme === 'light' ? 'Light' : 'Dark') + ' theme enabled');
    });
  }
  const menuButton = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  if (menuButton && mobileNav) {
    const closeMenu = () => { mobileNav.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation menu'); };
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      mobileNav.hidden = !open;
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    });
    $$('a', mobileNav).forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }
  const navLinks = $$('.desktop-nav .nav-link');
  const sectionTargets = navLinks.map((link) => $(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sectionTargets.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === '#' + visible.target.id));
    }, { rootMargin: '-28% 0px -56% 0px', threshold: [0, .1, .25, .5] });
    sectionTargets.forEach((s) => sectionObserver.observe(s));
  }
  const revealElements = $$('.reveal:not(.is-visible)');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -35px 0px' });
    revealElements.forEach((el, i) => { el.style.transitionDelay = (Math.min(i % 4, 3) * 45) + 'ms'; revealObserver.observe(el); });
  } else { revealElements.forEach((el) => el.classList.add('is-visible')); }
  const filterLabels = { all: 'All projects', web: 'Web', ai: 'AI / Data', other: 'Other' };
  $$('.filter-button').forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter || 'all';
      $$('.filter-button').forEach((item) => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
      let shown = 0;
      $$('.project-card').forEach((card) => {
        const matches = filter === 'all' || card.dataset.category === filter;
        card.hidden = !matches;
        if (matches) { shown += 1; card.classList.add('is-visible'); }
      });
      const countLabel = $('#project-count');
      if (countLabel) countLabel.textContent = 'Showing ' + shown + ' project' + (shown === 1 ? '' : 's') + ' · ' + (filterLabels[filter] || filterLabels.all);
    });
  });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const tiltElements = [$('#profile-card-outer'), ...$$('.tilt-card')].filter(Boolean);
    tiltElements.forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const maxTilt = element.id === 'profile-card-outer' ? 9 : 4.5;
        element.style.transform = 'perspective(1000px) rotateX(' + ((.5 - y) * maxTilt * 2).toFixed(2) + 'deg) rotateY(' + ((x - .5) * maxTilt * 2).toFixed(2) + 'deg) translateY(-2px)';
      });
      element.addEventListener('pointerleave', () => {
        element.style.transform = element.id === 'profile-card-outer' ? 'rotate(3.5deg) translate(5px, 4px)' : '';
      });
    });
  }
  const contactForm = $('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;
      const formData = new FormData(contactForm);
      if (!config.email) { showToast('Add your email in the Portfolio Builder first.'); return; }
      const body = 'Hi ' + config.name + ',\n\n' + String(formData.get('message') || '') + '\n\n---\nFrom: ' + String(formData.get('name') || '') + '\nReply-to: ' + String(formData.get('email') || '');
      window.location.href = 'mailto:' + encodeURIComponent(config.email) + '?subject=' + encodeURIComponent(String(formData.get('subject') || '')) + '&body=' + encodeURIComponent(body);
      showToast('Email draft prepared.');
    });
  }
  const params = new URLSearchParams(location.search);
  if (params.get('preview') === '1' || params.get('from') === 'builder') setInterval(applyConfig, 1200);
  window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY || e.key === PHOTO_KEY) applyConfig(); });
  applyConfig();
})();
