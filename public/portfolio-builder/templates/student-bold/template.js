(function () {
  'use strict';

  var DEFAULT = {
    name: 'Your Name',
    role: 'Student Developer',
    tagline: 'I build websites and solve problems with code.',
    about: 'Write a short intro about yourself.',
    email: '',
    github: '',
    linkedin: '',
    leetcode: '',
    projects: [],
    skills: []
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
    if (host === 'leetcode') {
      var m = s.match(/leetcode\.com\/(?:u\/)?([A-Za-z0-9_-]+)/i);
      if (m) return m[1];
    }
    if (host === 'github') {
      var g = s.match(/github\.com\/([A-Za-z0-9_-]+)/i);
      if (g) return g[1];
    }
    if (/^[A-Za-z0-9_-]+$/.test(s)) return s;
    return s.replace(/^@/, '');
  }

  function loadState() {
    var cfg = Object.assign({}, DEFAULT);
    var params = new URLSearchParams(location.search);
    var isPreview = params.get('preview') === '1' || params.get('from') === 'builder';
    try {
      var raw = localStorage.getItem('ap-pb-v1');
      if (!raw && !isPreview) return cfg;
      var s = raw ? JSON.parse(raw) : {};
      if (!s || typeof s !== 'object') return cfg;
      if (s.fullName) cfg.name = s.fullName;
      if (s.title) cfg.role = s.title;
      if (s.tagline) cfg.tagline = s.tagline;
      else if (s.about) cfg.tagline = String(s.about).slice(0, 160);
      if (s.about) cfg.about = s.about;
      if (s.email) cfg.email = s.email;
      if (s.github) cfg.github = extractUser(s.github, 'github') || s.github;
      if (s.linkedin) cfg.linkedin = s.linkedin;
      if (s.leetcode) cfg.leetcode = extractUser(s.leetcode, 'leetcode') || s.leetcode;
      if (s.skills && s.skills.length) cfg.skills = s.skills;
      if (s.projects && s.projects.length) {
        cfg.projects = s.projects.map(function (p) {
          return {
            name: p.name || 'Project',
            type: p.category || p.type || 'Project',
            desc: p.description || p.desc || '',
            tech: typeof p.tech === 'string' ? p.tech : (p.tech || []).join(', '),
            live: p.liveUrl || p.live || '#',
            code: p.githubUrl || p.code || '#'
          };
        });
      }
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

  var cfg = loadState();
  showPreviewBanner('student-bold');
  document.title = (cfg.name || 'Portfolio') + ' | B.Tech CSE';

  var parts = String(cfg.name || 'Your Name').trim().split(/\s+/);
  var h1 = document.querySelector('.hero h1');
  if (h1) {
    if (parts.length >= 2) h1.innerHTML = "I'M<br>" + parts[parts.length - 1].toUpperCase();
    else h1.innerHTML = "I'M<br>" + (parts[0] || 'YOU').toUpperCase();
  }
  var marker = document.querySelector('.marker');
  if (marker) marker.textContent = cfg.tagline || marker.textContent;
  var small = document.querySelector('.small');
  if (small) small.textContent = cfg.about || cfg.tagline || small.textContent;
  var aboutText = document.querySelector('.about-text');
  if (aboutText && cfg.about) aboutText.textContent = cfg.about;
  var av = document.querySelector('.avatar');
  if (av) av.textContent = initials(cfg.name);

  if ($('lcLink') && cfg.leetcode) $('lcLink').href = 'https://leetcode.com/u/' + cfg.leetcode;
  if ($('liLink') && cfg.linkedin) $('liLink').href = cfg.linkedin;
  if ($('liLink2') && cfg.linkedin) $('liLink2').href = cfg.linkedin;
  if ($('ghLink') && cfg.github) {
    $('ghLink').href = 'https://github.com/' + cfg.github;
    $('ghLink').textContent = 'github.com/' + cfg.github;
  }
  if ($('mailLink') && cfg.email) {
    $('mailLink').href = 'mailto:' + cfg.email;
    $('mailLink').textContent = cfg.email;
  }

  var grid = $('projectCards');
  if (grid) {
    grid.innerHTML = '';
    (cfg.projects.length ? cfg.projects : [
      { name: 'Sample Project', type: 'Web', desc: 'Add your projects in the editor.', tech: 'HTML, CSS, JS', live: '#', code: '#' }
    ]).forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = '<h3>' + p.name + '</h3><b>' + (p.type || '') + '</b><p>' + (p.desc || '') +
        '</p><p class="tech">' + (p.tech || '') + '</p><div class="links">' +
        '<a href="' + (p.live || '#') + '" target="_blank" rel="noopener">Live</a>' +
        '<a href="' + (p.code || '#') + '" target="_blank" rel="noopener">Code</a></div>';
      grid.appendChild(card);
    });
  }

  if (cfg.leetcode) {
    fetch('https://leetcode-stats-api.herokuapp.com/' + cfg.leetcode)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.status !== 'success') { if ($('lcMsg')) $('lcMsg').textContent = 'Could not load stats.'; return; }
        if ($('lcTotal')) $('lcTotal').textContent = d.totalSolved;
        if ($('lcEasy')) $('lcEasy').textContent = d.easySolved;
        if ($('lcMedium')) $('lcMedium').textContent = d.mediumSolved;
        if ($('lcHard')) $('lcHard').textContent = d.hardSolved;
        if ($('lcMsg')) $('lcMsg').textContent = 'Global ranking: ' + d.ranking;
      })
      .catch(function () { if ($('lcMsg')) $('lcMsg').textContent = 'Stats unavailable.'; });
  } else if ($('lcMsg')) $('lcMsg').textContent = 'Add LeetCode username in the editor';

  if (cfg.github) {
    fetch('https://api.github.com/users/' + cfg.github)
      .then(function (r) { return r.json(); })
      .then(function (u) {
        if (u.message) { if ($('ghMsg')) $('ghMsg').textContent = 'Could not load GitHub.'; return; }
        if ($('ghRepos')) $('ghRepos').textContent = u.public_repos;
        if ($('ghFollowers')) $('ghFollowers').textContent = u.followers;
        if ($('ghMsg')) $('ghMsg').textContent = u.bio || 'GitHub profile loaded';
        if ($('ghGraph')) $('ghGraph').src = 'https://ghchart.rshah.org/' + cfg.github;
      })
      .catch(function () { if ($('ghMsg')) $('ghMsg').textContent = 'GitHub unavailable.'; });
  } else if ($('ghMsg')) $('ghMsg').textContent = 'Add GitHub in the editor';

  (function () {
    var key = 'lc-streak-days';
    var days = [];
    try { days = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) {}
    var today = new Date().toISOString().slice(0, 10);
    function render() {
      var dots = $('streakDots');
      if (!dots) return;
      dots.innerHTML = '';
      for (var i = 0; i < 30; i++) {
        var s = document.createElement('span');
        if (days.indexOf(today) !== -1 && i < Math.min(days.length, 30)) s.className = 'on';
        dots.appendChild(s);
      }
      if ($('streakNum')) $('streakNum').textContent = days.length;
    }
    render();
    if ($('solvedBtn')) {
      $('solvedBtn').addEventListener('click', function () {
        if (days.indexOf(today) === -1) {
          days.push(today);
          try { localStorage.setItem(key, JSON.stringify(days)); } catch (e) {}
          render();
        }
      });
    }
  })();
})();
