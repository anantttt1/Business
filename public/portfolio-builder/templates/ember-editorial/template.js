(function () {
  'use strict';
  var PHOTO_KEY = 'ap-pb-photo';
  var CONFIG = {
    name: 'Your Name',
    role: 'Developer & Creative Thinker',
    location: 'Your City',
    email: '',
    about: 'I build thoughtful digital experiences, solve problems, and turn ideas into useful projects.',
    tagline: '',
    github: '',
    linkedin: '',
    leetcode: '',
    photoData: '',
    skills: [],
    projects: [],
    certificates: [],
    lcSolved: '—',
    lcEasy: '—',
    lcMedium: '—',
    lcHard: '—',
    lcStreak: '—'
  };

  function $(s) { return document.querySelector(s); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function initials(name) {
    var p = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return 'YN';
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }
  function ghHandle(url) {
    if (!url) return '@yourusername';
    try {
      var m = String(url).match(/github\.com\/([^\/?#]+)/i);
      if (m) return '@' + m[1];
    } catch (e) {}
    return '@yourusername';
  }
  function readPhoto() {
    try { return localStorage.getItem(PHOTO_KEY) || sessionStorage.getItem(PHOTO_KEY) || ''; } catch (e) { return ''; }
  }

  function mergeBuilderState() {
    var params = new URLSearchParams(location.search);
    var isPreview = params.get('preview') === '1' || params.get('from') === 'builder';
    try {
      var raw = localStorage.getItem('ap-pb-v1');
      if (!raw && !isPreview) return false;
      var s = raw ? JSON.parse(raw) : {};
      if (!s || typeof s !== 'object') s = {};
      CONFIG.name = s.fullName || CONFIG.name;
      CONFIG.role = s.title || CONFIG.role;
      CONFIG.about = s.about || CONFIG.about;
      CONFIG.tagline = s.tagline || '';
      CONFIG.location = s.location || CONFIG.location;
      CONFIG.email = s.email || '';
      CONFIG.github = s.github || '';
      CONFIG.linkedin = s.linkedin || '';
      CONFIG.leetcode = String(s.leetcode || s.leetcodeUsername || '').trim();
      if (CONFIG.leetcode && CONFIG.leetcode.indexOf('http') !== 0) {
        CONFIG.leetcode = 'https://leetcode.com/u/' + CONFIG.leetcode.replace(/^@/, '') + '/';
      }
      CONFIG.photoData = s.photoData || readPhoto() || '';
      CONFIG.skills = s.skills || [];
      if (s.projects && s.projects.length) {
        CONFIG.projects = s.projects.map(function (pr) {
          return {
            title: pr.name || 'Project',
            description: pr.description || '',
            tech: typeof pr.tech === 'string' ? pr.tech.split(/[,|]/).map(function (t) { return t.trim(); }).filter(Boolean) : (pr.tech || []),
            url: pr.liveUrl || pr.githubUrl || '#'
          };
        });
      }
      if (s.certifications && s.certifications.length) {
        CONFIG.certificates = s.certifications.map(function (c) {
          return { title: c.name || 'Certificate', issuer: c.org || '', year: c.year || '', url: c.url || '' };
        });
      }
      return true;
    } catch (e) { return false; }
  }

  function renderActivity() {
    var grid = document.getElementById('activity-grid');
    if (!grid || grid.children.length) return;
    for (var i = 0; i < 91; i++) {
      var cell = document.createElement('span');
      var seed = (i * 17 + i * i * 3) % 11;
      var level = seed < 4 ? 0 : seed < 6 ? 1 : seed < 8 ? 2 : seed < 10 ? 3 : 4;
      cell.className = 'activity-cell' + (level > 0 ? ' level-' + level : '');
      cell.title = 'Illustrative placeholder activity';
      grid.appendChild(cell);
    }
  }

  function render() {
    var name = CONFIG.name || 'Your Name';
    var role = CONFIG.role || 'Developer';
    $('#brandName').textContent = name;
    $('#footerName').textContent = name;
    $('#footerName2').textContent = name;
    $('#heroName').textContent = name;
    $('#heroRole').textContent = role;
    $('#heroBio').textContent = CONFIG.tagline || CONFIG.about || '';
    $('#aboutName').textContent = name;
    $('#aboutRole').textContent = role;
    $('#aboutText').textContent = CONFIG.about || '';
    $('#aboutLead').innerHTML = "I'm <span>" + esc(name) + "</span> — <span>" + esc(role) + "</span> with an interest in building useful, user-friendly digital experiences.";
    $('#locationLabel').textContent = CONFIG.location || 'Your City';
    $('#initials').textContent = initials(name);
    $('#year').textContent = new Date().getFullYear();
    $('#liName').textContent = name;
    $('#liRole').textContent = role;
    $('#liLocation').textContent = CONFIG.location || 'Your City';

    var photo = CONFIG.photoData || readPhoto();
    var img = $('#photoImg'), fb = $('#photoFallback');
    if (photo && img) {
      img.src = photo;
      img.hidden = false;
      if (fb) fb.style.display = 'none';
    }
    var liAv = $('#liAvatar');
    if (liAv) {
      if (photo) {
        liAv.innerHTML = '<img src="' + esc(photo) + '" alt="">';
      } else {
        liAv.textContent = initials(name);
      }
    }

    var socials = [];
    if (CONFIG.github) socials.push({ label: 'GitHub ↗', url: CONFIG.github });
    if (CONFIG.linkedin) socials.push({ label: 'LinkedIn ↗', url: CONFIG.linkedin });
    if (CONFIG.leetcode) socials.push({ label: 'LeetCode ↗', url: CONFIG.leetcode });
    $('#socialLinks').innerHTML = socials.map(function (s) {
      return '<a href="' + esc(s.url) + '" target="_blank" rel="noreferrer">' + esc(s.label) + '</a>';
    }).join('');

    var tags = (CONFIG.skills || []).slice(0, 6);
    if (!tags.length) tags = ['Problem Solving', 'Web Development', 'Continuous Learning'];
    $('#aboutTags').innerHTML = tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');

    var projects = CONFIG.projects || [];
    var arts = ['art-one', 'art-two', 'art-three'];
    var symbols = ['✳', '⌘', '✦'];
    if (!projects.length) {
      $('#projectsGrid').innerHTML = '<p class="muted" style="grid-column:1/-1">Add projects in the builder to showcase them here.</p>';
      $('#projectCount').textContent = '00';
    } else {
      $('#projectCount').textContent = '01 — ' + String(projects.length).padStart(2, '0');
      $('#projectsGrid').innerHTML = projects.map(function (p, i) {
        var art = arts[i % 3];
        var sym = symbols[i % 3];
        var feat = i === 0 ? ' project-feature' : '';
        var tech = (p.tech || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
        return '<article class="project-card' + feat + '">' +
          '<div class="project-art ' + art + '"><span class="art-label">PROJECT PREVIEW</span><span class="art-symbol">' + sym + '</span>' +
          (i % 3 === 0 ? '<div class="art-lines"></div>' : i % 3 === 1 ? '<div class="art-circle"></div>' : '<div class="art-grid"></div>') +
          '</div>' +
          '<div class="project-info"><div><p class="project-type">' + String(i + 1).padStart(2, '0') + ' / PROJECT</p><h3>' + esc(p.title) + '</h3></div>' +
          '<a class="round-link" href="' + esc(p.url || '#') + '" target="_blank" rel="noreferrer" aria-label="Open project">↗</a></div>' +
          '<p class="project-description">' + esc(p.description) + '</p>' +
          '<div class="tag-list">' + tech + '</div></article>';
      }).join('');
    }

    var certs = CONFIG.certificates || [];
    var prevs = ['', ' certificate-preview-two', ' certificate-preview-three'];
    var icons = ['✧', '✦', '✳'];
    if (!certs.length) {
      $('#certificatesGrid').innerHTML = '<p class="muted" style="grid-column:1/-1">Add certificates in the builder when you have them.</p>';
    } else {
      $('#certificatesGrid').innerHTML = certs.map(function (c, i) {
        var body = '<div class="certificate-preview' + prevs[i % 3] + '"><span>' + icons[i % 3] + '</span><small>CERTIFICATE PREVIEW</small></div>' +
          '<div class="certificate-info"><div><h3>' + esc(c.title) + '</h3><p>' + esc(c.issuer) + (c.year ? ' · ' + esc(c.year) : '') + '</p></div>' +
          '<a class="round-link" href="' + esc(c.url || '#') + '" target="_blank" rel="noreferrer" aria-label="View certificate">↗</a></div>';
        return c.url ? '<a class="certificate-card" href="' + esc(c.url) + '" target="_blank" rel="noreferrer" style="display:block;color:inherit">' + body + '</a>' :
          '<article class="certificate-card">' + body + '</article>';
      }).join('');
    }

    // Static LeetCode display only — no API
    $('#lcSolved').textContent = CONFIG.lcSolved;
    $('#lcEasy').textContent = CONFIG.lcEasy;
    $('#lcMedium').textContent = CONFIG.lcMedium;
    $('#lcHard').textContent = CONFIG.lcHard;
    $('#lcStreak').textContent = CONFIG.lcStreak;
    var lcUrl = CONFIG.leetcode || 'https://leetcode.com/';
    $('#lcLink').href = lcUrl;
    $('#lcTextLink').href = lcUrl;

    var gh = CONFIG.github || '#';
    $('#ghLink').href = gh;
    $('#ghTextLink').href = gh;
    $('#ghHandle').textContent = ghHandle(CONFIG.github);

    var li = CONFIG.linkedin || '#';
    $('#liLink').href = li;
    $('#liTextLink').href = li;

    var email = CONFIG.email || '';
    $('#emailBtn').href = email ? 'mailto:' + email : '#contact';
  }

  window.addEventListener('storage', function (e) {
    if (e.key === 'ap-pb-v1' || e.key === PHOTO_KEY) { mergeBuilderState(); render(); }
  });
  var params = new URLSearchParams(location.search);
  if (params.get('preview') === '1' || params.get('from') === 'builder') {
    setInterval(function () { mergeBuilderState(); render(); }, 1200);
  }

  var menu = $('#menuToggle');
  var nav = $('#nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
      });
    });
  }

  mergeBuilderState();
  render();
  renderActivity();
})();
