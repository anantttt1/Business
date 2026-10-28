(() => {
  'use strict';
  const STORAGE_KEY = 'ap-pb-v1';
  const PHOTO_KEY = 'ap-pb-photo';
  function loadBuilderConfig() {
    const cfg = {
      name: 'YOUR NAME', role: 'YOUR ROLE · YOUR SPECIALITY',
      tagline: 'YOUR SHORT INTRODUCTION GOES HERE.',
      location: 'YOUR CITY, COUNTRY', focus: 'YOUR MAIN FOCUS',
      availability: 'OPEN TO OPPORTUNITIES', email: 'YOUR_EMAIL@EXAMPLE.COM',
      profileImage: '', manifesto: 'Curiosity is a creative superpower.',
      about: 'Write about your background and what you love building.',
      approach: 'Share how you work and what you want to learn next.',
      focusOne: 'Problem solving', focusTwo: 'Full-stack development',
      focusThree: 'Building products', focusFour: 'Continuous learning',
      leetcodeUsername: '', leetcodeApiBase: 'https://leetcode-stats.tashif.codes',
      profiles: { github: '', leetcode: '', hackerrank: '', linkedin: '' },
      projects: [], certificates: []
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          if (s.fullName) cfg.name = s.fullName;
          if (s.title) cfg.role = s.title;
          if (s.tagline) cfg.tagline = s.tagline;
          if (s.about) cfg.about = s.about;
          if (s.location) cfg.location = s.location;
          if (s.email) cfg.email = s.email;
          if (s.github) cfg.profiles.github = s.github;
          if (s.linkedin) cfg.profiles.linkedin = s.linkedin;
          if (s.hackerrank) cfg.profiles.hackerrank = s.hackerrank;
          const lc = String(s.leetcodeUsername || s.leetcode || '').replace(/^@/, '').replace(/.*leetcode\.com\/(u\/)?/i, '').replace(/\/$/, '');
          if (lc) { cfg.leetcodeUsername = lc; cfg.profiles.leetcode = 'https://leetcode.com/u/' + encodeURIComponent(lc) + '/'; }
          if (s.photoData) cfg.profileImage = s.photoData;
          if (s.skills && s.skills.length) {
            cfg.focusOne = s.skills[0] || cfg.focusOne;
            cfg.focusTwo = s.skills[1] || cfg.focusTwo;
            cfg.focusThree = s.skills[2] || cfg.focusThree;
            cfg.focusFour = s.skills[3] || cfg.focusFour;
          }
          if (s.projects && s.projects.length) {
            cfg.projects = s.projects.map((pr, i) => ({
              title: pr.name || ('Project ' + (i + 1)),
              date: pr.year || '2026',
              category: (String(pr.category || 'web').toLowerCase().includes('ai') ? 'ai' : String(pr.category || 'web').toLowerCase().includes('other') ? 'other' : 'web'),
              description: pr.description || '',
              tech: typeof pr.tech === 'string' ? pr.tech.split(/[,|]/).map(t => t.trim()).filter(Boolean) : (pr.tech || []),
              liveUrl: pr.liveUrl || '', sourceUrl: pr.githubUrl || ''
            }));
          }
          if (s.certifications && s.certifications.length) {
            cfg.certificates = s.certifications.map(c => ({
              title: c.name || 'Certificate', issuer: c.org || '', date: c.year || '', url: c.url || ''
            }));
          }
        }
      }
    } catch (_) {}
    try { if (!cfg.profileImage) cfg.profileImage = localStorage.getItem(PHOTO_KEY) || sessionStorage.getItem(PHOTO_KEY) || ''; } catch (_) {}
    return cfg;
  }
  window.PORTFOLIO_CONFIG = loadBuilderConfig();
  const CONFIG = window.PORTFOLIO_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  function showToast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
  $$('[data-config]').forEach(n => { if (CONFIG[n.dataset.config] !== undefined) n.textContent = CONFIG[n.dataset.config]; });
  document.title = (CONFIG.name || 'Portfolio') + ' — Creative Developer Portfolio';
  const bi = $('#brandInitials');
  if (bi) {
    const p = String(CONFIG.name || 'Y').trim().split(/\s+/);
    bi.textContent = p.length >= 2 ? (p[0][0] + '.').toUpperCase() : (p[0] || 'Y').slice(0, 1).toUpperCase() + '.';
  }
  const yr = $('#current-year'); if (yr) yr.textContent = String(new Date().getFullYear());
  $$('[data-profile]').forEach(link => {
    const key = link.dataset.profile;
    const url = CONFIG.profiles && CONFIG.profiles[key];
    if (url && /^https?:/i.test(url)) {
      link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    } else {
      link.href = '#';
      link.addEventListener('click', e => { e.preventDefault(); showToast('Add your ' + key + ' URL in the builder.'); });
    }
  });
  if (CONFIG.projects && CONFIG.projects.length) {
    CONFIG.projects.forEach((project, index) => {
      const card = $('[data-project="' + index + '"]');
      if (!card) return;
      const title = $('h3', card); const desc = $('p', card);
      if (title) title.textContent = project.title;
      if (desc) desc.textContent = project.description || '';
      const tagRoot = $('.project-tags', card);
      if (tagRoot && project.tech) tagRoot.innerHTML = project.tech.map(t => '<span>' + t + '</span>').join('');
      card.dataset.category = project.category || 'web';
    });
  }
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    $$('[data-filter]').forEach(item => item.classList.toggle('active', item === button));
    const selected = button.dataset.filter;
    let visible = 0;
    $$('.project-card').forEach(card => {
      const show = selected === 'all' || card.dataset.category === selected;
      card.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });
    const counter = $('#project-counter');
    if (counter) counter.textContent = 'SHOWING ' + visible + ' PROJECT' + (visible === 1 ? '' : 'S');
  }));
  const savedTheme = (() => { try { return localStorage.getItem('your-portfolio-theme'); } catch { return null; } })();
  if (savedTheme === 'dark') document.body.classList.add('theme-dark');
  $('#theme-toggle')?.addEventListener('click', () => {
    document.body.classList.toggle('theme-dark');
    try { localStorage.setItem('your-portfolio-theme', document.body.classList.contains('theme-dark') ? 'dark' : 'light'); } catch {}
  });
  const menuToggle = $('#menu-toggle'); const mobileNav = $('#mobile-nav');
  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileNav?.classList.toggle('is-open', open);
  });
  $$('#mobile-nav a').forEach(a => a.addEventListener('click', () => mobileNav?.classList.remove('is-open')));
  const revealNodes = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    }), { threshold: 0.08 });
    revealNodes.forEach(n => io.observe(n));
  } else revealNodes.forEach(n => n.classList.add('is-visible'));
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const bar = $('#scroll-progress-bar');
    if (bar) bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  }, { passive: true });
  if (CONFIG.profileImage) {
    const target = $('#profile-image-target');
    if (target) {
      target.classList.add('image-mode');
      const img = document.createElement('img');
      img.className = 'user-media-image'; img.src = CONFIG.profileImage; img.alt = 'Profile';
      target.insertBefore(img, target.firstChild);
    }
  }
  if (CONFIG.certificates && CONFIG.certificates.length) {
    CONFIG.certificates.forEach((cert, index) => {
      const card = $$('.certificate-card')[index];
      if (!card) return;
      const title = $('.certificate-content h3', card);
      if (title) title.textContent = cert.title;
      const desc = $('.certificate-content p', card);
      if (desc) desc.textContent = (cert.issuer || '') + (cert.date ? ' · ' + cert.date : '');
    });
  }
  $('#contact-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const email = String(CONFIG.email || '').trim();
    if (!email || email.includes('EXAMPLE')) { showToast('Set your email in the Portfolio Builder first.'); return; }
    const fd = new FormData(form);
    const body = 'Hi ' + CONFIG.name + ',\n\n' + String(fd.get('message') || '') + '\n\n---\nFrom: ' + String(fd.get('name') || '') + '\nReply to: ' + String(fd.get('email') || '');
    window.location.href = 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent(String(fd.get('subject') || '')) + '&body=' + encodeURIComponent(body);
    showToast('Email draft prepared.');
  });
  async function syncLeetCode(username) {
    const clean = String(username || '').trim().replace(/^@/, '');
    if (!clean || !/^[a-zA-Z0-9_-]{1,30}$/.test(clean)) { showToast('Enter a valid LeetCode username.'); return; }
    const btn = $('#sync-leetcode'); if (btn) btn.disabled = true;
    try {
      const base = CONFIG.leetcodeApiBase || 'https://leetcode-stats.tashif.codes';
      const res = await fetch(base + '/' + encodeURIComponent(clean) + '/stats', { cache: 'no-store' });
      const raw = await res.json();
      const d = raw.data || raw;
      const easy = Number(d.easySolved || d.easy || 0);
      const medium = Number(d.mediumSolved || d.medium || 0);
      const hard = Number(d.hardSolved || d.hard || 0);
      const total = Number(d.totalSolved || easy + medium + hard);
      const set = (id, v) => { const el = $(id); if (el) el.textContent = String(v); };
      set('#lc-total', total); set('#lc-easy', easy); set('#lc-medium', medium); set('#lc-hard', hard);
      const pill = $('#lc-status'); if (pill) pill.textContent = ' LIVE DATA';
      showToast('Synced ' + clean + ' stats.');
    } catch (err) { showToast('LeetCode sync failed. Try again later.'); }
    finally { if (btn) btn.disabled = false; }
  }
  $('#sync-leetcode')?.addEventListener('click', () => syncLeetCode($('#leetcode-username')?.value));
  if (CONFIG.leetcodeUsername) {
    const input = $('#leetcode-username');
    if (input) input.value = CONFIG.leetcodeUsername;
    setTimeout(() => syncLeetCode(CONFIG.leetcodeUsername), 200);
  }
  const params = new URLSearchParams(location.search);
  if (params.get('preview') === '1' || params.get('from') === 'builder') {
    setInterval(() => {
      window.PORTFOLIO_CONFIG = loadBuilderConfig();
      $$('[data-config]').forEach(n => {
        const k = n.dataset.config;
        if (window.PORTFOLIO_CONFIG[k] !== undefined) n.textContent = window.PORTFOLIO_CONFIG[k];
      });
    }, 1500);
  }
})();
