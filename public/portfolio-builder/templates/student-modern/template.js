(function () {
  'use strict';

  var DEFAULT = {
    name: 'Your Name', role: 'Student Developer',
    tagline: 'I build websites and solve problems with code.',
    about: 'Write a short intro about yourself.',
    location: '', email: '', phone: '', website: '', resumeUrl: '',
    github: '', linkedin: '', leetcode: '', hackerrank: '', photoData: '',
    projects: [], skills: [], education: [], experience: [], certifications: []
  };

  function $(id) { return document.getElementById(id); }
  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'YN';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  function extractUser(urlOrName, host) {
    if (!urlOrName) return '';
    var s = String(urlOrName).trim();
    if (host === 'leetcode') { var m = s.match(/leetcode\.com\/(?:u\/)?([A-Za-z0-9_-]+)/i); if (m) return m[1]; }
    if (host === 'github') { var g = s.match(/github\.com\/([A-Za-z0-9_-]+)/i); if (g) return g[1]; }
    if (/^[A-Za-z0-9_-]+$/.test(s)) return s;
    return s.replace(/^@/, '');
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function loadState() {
    var cfg = Object.assign({}, DEFAULT);
    var params = new URLSearchParams(location.search);
    var isPreview = params.get('preview') === '1' || params.get('from') === 'builder';
    try {
      var s = null;
      if (window.__PB_EXPORT_DATA__ && typeof window.__PB_EXPORT_DATA__ === 'object') s = window.__PB_EXPORT_DATA__;
      else {
        var raw = localStorage.getItem('ap-pb-v1');
        if (!raw && !isPreview) return cfg;
        s = raw ? JSON.parse(raw) : {};
      }
      if (!s || typeof s !== 'object') return cfg;
      if (s.fullName) cfg.name = s.fullName;
      if (s.title) cfg.role = s.title;
      if (s.tagline) cfg.tagline = s.tagline;
      else if (s.about) cfg.tagline = String(s.about).slice(0, 160);
      if (s.about) cfg.about = s.about;
      if (s.location) cfg.location = s.location;
      if (s.email) cfg.email = s.email;
      if (s.phone) cfg.phone = s.phone;
      if (s.website) cfg.website = s.website;
      if (s.resumeUrl) cfg.resumeUrl = s.resumeUrl;
      if (s.github) cfg.github = extractUser(s.github, 'github') || s.github;
      if (s.linkedin) cfg.linkedin = s.linkedin;
      if (s.leetcode) cfg.leetcode = extractUser(s.leetcode, 'leetcode') || s.leetcode;
      if (s.skills && s.skills.length) cfg.skills = s.skills;
      if (s.education && s.education.length) cfg.education = s.education;
      if (s.experience && s.experience.length) cfg.experience = s.experience;
      if (s.certifications && s.certifications.length) cfg.certifications = s.certifications;
      if (s.projects && s.projects.length) {
        cfg.projects = s.projects.map(function (p) {
          return {
            name: p.name || 'Project', type: p.category || p.type || 'Project',
            desc: p.description || p.desc || '',
            tech: typeof p.tech === 'string' ? p.tech : (p.tech || []).join(', '),
            live: p.liveUrl || p.live || '#', code: p.githubUrl || p.code || '#'
          };
        });
      }
      try {
        var ph = s.photoData || localStorage.getItem('ap-pb-photo') || sessionStorage.getItem('ap-pb-photo') || '';
        if (ph && String(ph).indexOf('data:image') === 0) cfg.photoData = ph;
      } catch (e2) {}
    } catch (e) { console.warn(e); }
    return cfg;
  }

  function showPreviewBanner(templateId) {
    var params = new URLSearchParams(location.search);
    if (params.get('preview') !== '1' && params.get('from') !== 'builder') return;
    document.body.classList.add('pb-has-preview-banner');
    var bar = document.createElement('div');
    bar.className = 'pb-preview-banner';
    bar.innerHTML = '<span>Previewing your portfolio</span><span style="display:flex;gap:8px;flex-wrap:wrap"><a href="/portfolio-builder/editor/?template=' + templateId + '">← Back to editor</a><a class="pb-preview-primary" href="/portfolio-builder/editor/?template=' + templateId + '">Edit details</a></span>';
    document.body.insertBefore(bar, document.body.firstChild);
    if (!document.querySelector('link[href*="builder.css"]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/portfolio-builder/builder.css';
      document.head.appendChild(link);
    }
  }

  function renderList(id, items, mapper) {
    var box = $(id);
    if (!box || !items || !items.length) return;
    box.innerHTML = '';
    items.forEach(function (item) {
      var d = document.createElement('div');
      d.className = 'card';
      d.innerHTML = mapper(item);
      box.appendChild(d);
    });
  }

  function bindCommon(cfg) {
    if ($('lcLink') && cfg.leetcode) $('lcLink').href = 'https://leetcode.com/u/' + cfg.leetcode;
    if ($('liLink') && cfg.linkedin) $('liLink').href = cfg.linkedin;
    if ($('ghLink') && cfg.github) $('ghLink').href = 'https://github.com/' + cfg.github;
    if ($('ghLink2') && cfg.github) $('ghLink2').href = 'https://github.com/' + cfg.github;
    if ($('mailLink') && cfg.email) { $('mailLink').href = 'mailto:' + cfg.email; }

    var grid = $('projectCards');
    if (grid) {
      grid.innerHTML = '';
      (cfg.projects.length ? cfg.projects : [{ name: 'Sample Project', type: 'Web', desc: 'Add projects in the editor.', tech: 'HTML, CSS, JS', live: '#', code: '#' }]).forEach(function (p) {
        var card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = '<h3>' + escapeHtml(p.name) + '</h3><p>' + escapeHtml(p.desc || '') +
          '</p><p class="tech">' + escapeHtml(p.tech || '') + '</p><div class="links">' +
          '<a href="' + escapeHtml(p.live || '#') + '" target="_blank" rel="noopener">Live</a> ' +
          '<a href="' + escapeHtml(p.code || '#') + '" target="_blank" rel="noopener">Code</a></div>';
        grid.appendChild(card);
      });
    }

    var skillsEl = $('skillTags');
    if (skillsEl && cfg.skills.length) {
      skillsEl.innerHTML = '';
      cfg.skills.forEach(function (s) {
        var art = document.createElement('article');
        art.className = 'skill-card';
        art.innerHTML = '<div class="skill-symbol">⌘</div><h3>' + escapeHtml(s) + '</h3><p>Skill from your profile</p><span class="skill-level">IN PROGRESS</span>';
        skillsEl.appendChild(art);
      });
    }

    renderList('eduList', cfg.education, function (ed) {
      return '<h3>' + escapeHtml(ed.degree || '') + (ed.field ? ' · ' + escapeHtml(ed.field) : '') + '</h3><p>' +
        escapeHtml(ed.institution || '') + '</p><p>' + escapeHtml([ed.start, ed.end].filter(Boolean).join(' – ')) + '</p>';
    });
    renderList('expList', cfg.experience, function (ex) {
      return '<h3>' + escapeHtml(ex.role || '') + '</h3><p>' + escapeHtml(ex.company || '') + '</p><p>' +
        escapeHtml([ex.start, ex.end].filter(Boolean).join(' – ')) + '</p>';
    });
    renderList('certList', cfg.certifications, function (c) {
      return '<h3>' + escapeHtml(c.name || '') + '</h3><p>' + escapeHtml(c.org || '') + '</p><p>' + escapeHtml(c.year || '') + '</p>';
    });

    if (cfg.leetcode) {
      fetch('https://leetcode-stats-api.herokuapp.com/' + cfg.leetcode)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.status !== 'success') { if ($('lcMsg')) $('lcMsg').textContent = 'Stats unavailable'; return; }
          if ($('lcTotal')) $('lcTotal').textContent = d.totalSolved;
          if ($('lcEasy')) $('lcEasy').textContent = d.easySolved;
          if ($('lcMedium')) $('lcMedium').textContent = d.mediumSolved;
          if ($('lcHard')) $('lcHard').textContent = d.hardSolved;
          if ($('lcMsg')) $('lcMsg').textContent = 'Ranking: ' + d.ranking;
        })
        .catch(function () { if ($('lcMsg')) $('lcMsg').textContent = 'Stats unavailable'; });
    }

    if (cfg.github) {
      fetch('https://api.github.com/users/' + cfg.github)
        .then(function (r) { return r.json(); })
        .then(function (u) {
          if (u.message) return;
          if ($('ghRepos')) $('ghRepos').textContent = u.public_repos;
          if ($('ghFollowers')) $('ghFollowers').textContent = u.followers;
          if ($('ghMsg')) $('ghMsg').textContent = u.bio || 'Loaded';
        });
    }
  }

  var cfg = loadState();
  showPreviewBanner('student-modern');
  document.title = (cfg.name || 'Portfolio') + ' | Student Developer';

  var brand = document.querySelector('.brand');
  if (brand) brand.innerHTML = initials(cfg.name) + '<span>.</span>';
  var mono = document.querySelector('.monogram');
  if (mono) mono.innerHTML = initials(cfg.name) + '<span>.</span>';
  var heroName = document.getElementById('heroName');
  if (heroName) heroName.textContent = cfg.name || 'Your Name';
  var intro = document.querySelector('.hero-intro');
  if (intro && cfg.tagline) {
    intro.innerHTML = "Hey, I'm <strong id=\"heroName\">" + escapeHtml(cfg.name || 'Your Name') +
      "</strong> — " + escapeHtml(cfg.tagline || cfg.about || 'a student who builds useful web experiences.');
  }
  var aboutText = document.getElementById('aboutText');
  if (aboutText && cfg.about) aboutText.textContent = cfg.about;
  if ($('ghLink2') && cfg.github) $('ghLink2').href = 'https://github.com/' + cfg.github;

  bindCommon(cfg);

  (function () {
    var nodes = document.querySelectorAll('.section, .stats-strip, .card, .skill-card, .tracker-card, .hero');
    nodes.forEach(function (n) { n.classList.add('reveal'); });
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    nodes.forEach(function (n) { io.observe(n); });
  })();

  (function () {
    var menuToggle = document.getElementById('menuToggle');
    var nav = document.getElementById('nav');
    if (menuToggle && nav) {
      menuToggle.addEventListener('click', function () { nav.classList.toggle('open'); });
      nav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { nav.classList.remove('open'); });
      });
    }
    var back = document.getElementById('backTop');
    if (back) {
      window.addEventListener('scroll', function () {
        back.classList.toggle('show', window.scrollY > 450);
      });
      back.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  })();
})();
