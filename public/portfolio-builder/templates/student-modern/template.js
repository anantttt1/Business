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
      if (s.hackerrank) cfg.hackerrank = s.hackerrank;
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

  function applyPhoto(cfg) {
    if (!cfg.photoData) return;
    var av = document.querySelector('.avatar');
    if (av) {
      av.style.backgroundImage = 'url(' + cfg.photoData + ')';
      av.style.backgroundSize = 'cover';
      av.style.backgroundPosition = 'center';
      av.textContent = '';
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
    if ($('mailLink') && cfg.email) { $('mailLink').href = 'mailto:' + cfg.email; $('mailLink').textContent = cfg.email; }
    if ($('resumeLink') && cfg.resumeUrl) { $('resumeLink').href = cfg.resumeUrl; $('resumeLink').style.display = ''; }
    if ($('phoneLink') && cfg.phone) { $('phoneLink').href = 'tel:' + cfg.phone; $('phoneLink').textContent = cfg.phone; }
    if ($('webLink') && cfg.website) { $('webLink').href = cfg.website; $('webLink').textContent = cfg.website.replace(/^https?:\/\//, ''); }

    var grid = $('projectCards');
    if (grid) {
      grid.innerHTML = '';
      (cfg.projects.length ? cfg.projects : [{ name: 'Sample Project', type: 'Web', desc: 'Add projects in the editor.', tech: 'HTML, CSS, JS', live: '#', code: '#' }]).forEach(function (p) {
        var card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = '<h3>' + escapeHtml(p.name) + '</h3><b>' + escapeHtml(p.type || '') + '</b><p>' + escapeHtml(p.desc || '') +
          '</p><p class="tech">' + escapeHtml(p.tech || '') + '</p><div class="links">' +
          '<a href="' + escapeHtml(p.live || '#') + '" target="_blank" rel="noopener">Live</a>' +
          '<a href="' + escapeHtml(p.code || '#') + '" target="_blank" rel="noopener">Code</a></div>';
        grid.appendChild(card);
      });
    }

    var skillsEl = $('skillList') || $('skillTags');
    if (skillsEl && cfg.skills.length) {
      skillsEl.innerHTML = '';
      cfg.skills.forEach(function (s) {
        var span = document.createElement('span');
        span.textContent = s;
        skillsEl.appendChild(span);
      });
    }

    renderList('eduList', cfg.education, function (ed) {
      return '<h3>' + escapeHtml(ed.degree || '') + (ed.field ? ' · ' + escapeHtml(ed.field) : '') + '</h3><b>' +
        escapeHtml(ed.institution || '') + '</b><p>' + escapeHtml([ed.start, ed.end].filter(Boolean).join(' – ')) +
        '</p><p>' + escapeHtml(ed.description || '') + '</p>';
    });
    renderList('expList', cfg.experience, function (ex) {
      return '<h3>' + escapeHtml(ex.role || '') + '</h3><b>' + escapeHtml(ex.company || '') + '</b><p>' +
        escapeHtml([ex.start, ex.end].filter(Boolean).join(' – ')) + '</p><p>' + escapeHtml(ex.description || '') + '</p>';
    });
    renderList('certList', cfg.certifications, function (c) {
      var t = escapeHtml(c.name || '');
      if (c.url) t = '<a href="' + escapeHtml(c.url) + '" target="_blank" rel="noopener">' + t + '</a>';
      return '<h3>' + t + '</h3><b>' + escapeHtml(c.org || '') + '</b><p>' + escapeHtml(c.year || '') + '</p>';
    });

    if (cfg.leetcode) {
      fetch('https://leetcode-stats-api.herokuapp.com/' + cfg.leetcode)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.status !== 'success') { if ($('lcMsg')) $('lcMsg').textContent = 'Stats unavailable'; return; }
          if ($('lcTotal')) $('lcTotal').textContent = d.totalSolved;
          if ($('lcMsg')) $('lcMsg').textContent = 'Ranking: ' + d.ranking;
        })
        .catch(function () { if ($('lcMsg')) $('lcMsg').textContent = 'Stats unavailable'; });
    } else if ($('lcMsg')) $('lcMsg').textContent = 'Add LeetCode in the editor';

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
  var intro = document.querySelector('.hero-intro');
  if (intro) {
    intro.innerHTML = "Hey, I'm <strong>" + escapeHtml(cfg.name || 'Your Name') +
      "</strong> — " + escapeHtml(cfg.tagline || cfg.about || 'a student who builds useful web experiences.');
  }
  var aboutP = document.querySelector('#about > p');
  if (aboutP && cfg.about) aboutP.textContent = cfg.about;
  bindCommon(cfg);
})();
