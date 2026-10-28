(function () {
  'use strict';
  var PHOTO_KEY = 'ap-pb-photo';
  var CONFIG = {
    name: 'Your Name',
    role: 'Developer & Creative Thinker',
    location: 'Your City',
    email: '',
    summary: 'I\'m a curious developer and creative thinker turning ideas into useful, thoughtful digital experiences.',
    aboutLead: 'I like to understand the why, enjoy the how, and keep improving what I make.',
    aboutBody: 'Use this space to share your background, interests, learning journey and the kind of work you hope to do next.',
    github: '',
    linkedin: '',
    leetcodeUsername: '',
    photoData: '',
    skills: [],
    projects: [],
    certificates: [],
    facts: ['Curiosity-led learning', 'Thoughtful development', 'Practical problem solving']
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
      CONFIG.summary = s.tagline || s.about || CONFIG.summary;
      CONFIG.aboutLead = (s.tagline || CONFIG.aboutLead);
      CONFIG.aboutBody = s.about || CONFIG.aboutBody;
      CONFIG.location = s.location || CONFIG.location;
      CONFIG.email = s.email || '';
      CONFIG.github = s.github || '';
      CONFIG.linkedin = s.linkedin || '';
      CONFIG.leetcodeUsername = String(s.leetcodeUsername || s.leetcode || '')
        .replace(/^@/, '').replace(/.*leetcode\.com\/(u\/)?/i, '').replace(/\/$/, '');
      CONFIG.photoData = s.photoData || readPhoto() || '';
      if (s.skills && s.skills.length) {
        CONFIG.skills = s.skills;
        CONFIG.facts = s.skills.slice(0, 4);
      }
      if (s.projects && s.projects.length) {
        CONFIG.projects = s.projects.map(function (pr) {
          return {
            title: pr.name || 'Project',
            type: pr.category || 'PROJECT',
            description: pr.description || '',
            tech: typeof pr.tech === 'string' ? pr.tech.split(/[,|]/).map(function (t) { return t.trim(); }).filter(Boolean) : (pr.tech || []),
            url: pr.liveUrl || pr.githubUrl || '#',
            image: pr.imageData || ''
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

  function render() {
    var name = CONFIG.name || 'Your Name';
    $('#brandName').textContent = name;
    $('#footerName').textContent = name;
    $('#heroSummary').textContent = CONFIG.summary;
    $('#aboutLead').textContent = CONFIG.aboutLead;
    $('#aboutBody').textContent = CONFIG.aboutBody;
    $('#location').textContent = CONFIG.location || 'Your City';
    $('#copyrightYear').textContent = new Date().getFullYear();
    $('#initials').textContent = initials(name);

    var photo = CONFIG.photoData || readPhoto();
    var img = $('#photoImg'), fb = $('#photoFallback');
    if (photo && img) {
      img.src = photo;
      img.hidden = false;
      if (fb) fb.style.display = 'none';
    }

    $('#aboutPills').innerHTML = (CONFIG.facts || []).map(function (f) {
      return '<span>' + esc(f) + '</span>';
    }).join('');

    var email = CONFIG.email || '';
    $('#contactEmail').textContent = email || 'hello@example.com';
    $('#contactEmail').href = email ? 'mailto:' + email : '#contact';
    $('#emailLink').href = email ? 'mailto:' + email : '#contact';

    var socials = [];
    if (CONFIG.github) socials.push({ label: 'GitHub', url: CONFIG.github });
    if (CONFIG.linkedin) socials.push({ label: 'LinkedIn', url: CONFIG.linkedin });
    if (CONFIG.leetcodeUsername) {
      socials.push({ label: 'LeetCode', url: 'https://leetcode.com/u/' + encodeURIComponent(CONFIG.leetcodeUsername) + '/' });
    }
    $('#contactSocials').innerHTML = socials.map(function (s) {
      return '<a href="' + esc(s.url) + '" target="_blank" rel="noreferrer">' + esc(s.label) + ' ↗</a>';
    }).join('');

    var projects = CONFIG.projects || [];
    if (!projects.length) {
      $('#projectsGrid').innerHTML = '<p class="body-copy" style="grid-column:1/-1">Add projects in the builder to showcase them here.</p>';
    } else {
      $('#projectsGrid').innerHTML = projects.map(function (p, i) {
        var media = p.image
          ? '<img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy">'
          : '<div class="project-placeholder">' + esc(p.title) + '</div>';
        return '<article class="project-card">' +
          '<a class="project-image" href="' + esc(p.url || '#') + '" target="_blank" rel="noreferrer">' + media + '</a>' +
          '<div class="project-meta"><span>' + String(i + 1).padStart(2, '0') + ' / ' + esc(p.type || 'PROJECT') + '</span>' +
          '<a href="' + esc(p.url || '#') + '" target="_blank" rel="noreferrer">↗</a></div>' +
          '<h3>' + esc(p.title) + '</h3><p>' + esc(p.description) + '</p>' +
          '<div class="tech-tags">' + (p.tech || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div></article>';
      }).join('');
    }

    var skills = CONFIG.skills || [];
    if (!skills.length) {
      $('#skillGroups').innerHTML = '<p class="body-copy">Add skills in the builder.</p>';
    } else {
      var groups = [
        { category: 'CORE', items: skills.slice(0, 4) },
        { category: 'TOOLS', items: skills.slice(4, 8) },
        { category: 'MORE', items: skills.slice(8) }
      ].filter(function (g) { return g.items.length; });
      $('#skillGroups').innerHTML = groups.map(function (g) {
        return '<div class="skill-group"><h3>' + esc(g.category) + '</h3><div class="skill-items">' +
          g.items.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div></div>';
      }).join('');
    }

    var certs = CONFIG.certificates || [];
    if (!certs.length) {
      $('#certificatesGrid').innerHTML = '<p class="body-copy" style="grid-column:1/-1">Add certificates in the builder when you have them.</p>';
    } else {
      $('#certificatesGrid').innerHTML = certs.map(function (c, i) {
        var content = '<span class="certificate-icon">✦</span><div><span class="micro-label">MILESTONE ' +
          String(i + 1).padStart(2, '0') + '</span><h3>' + esc(c.title) + '</h3><p>' +
          esc(c.issuer) + (c.year ? ' · ' + esc(c.year) : '') + '</p></div><span class="certificate-arrow">↗</span>';
        return c.url
          ? '<a class="certificate-card" href="' + esc(c.url) + '" target="_blank" rel="noreferrer">' + content + '</a>'
          : '<article class="certificate-card">' + content + '</article>';
      }).join('');
    }

    var u = CONFIG.leetcodeUsername;
    $('#lcUsername').textContent = u ? '@' + u : '@yourusername';
    $('#lcProfileLink').href = u ? 'https://leetcode.com/u/' + encodeURIComponent(u) + '/' : 'https://leetcode.com/';
  }

  function statCard(label, value, suffix) {
    return '<div class="lc-stat"><span>' + esc(label) + '</span><strong>' + esc(value) +
      (suffix ? ' <em>' + esc(suffix) + '</em>' : '') + '</strong></div>';
  }

  async function loadLeetCode() {
    var username = (CONFIG.leetcodeUsername || '').trim();
    var box = $('#lcStats');
    if (!username) {
      box.innerHTML = [statCard('TOTAL SOLVED', '—', 'add username'), statCard('EASY', '—'), statCard('MEDIUM', '—'), statCard('HARD', '—')].join('');
      $('#lcStatus').textContent = 'Set LeetCode username in the builder for live stats.';
      return;
    }
    box.innerHTML = '<div class="lc-loading">Fetching public stats…</div>';
    $('#lcStatus').textContent = 'Connecting…';
    try {
      var res = await fetch('https://leetcode-stats-api.herokuapp.com/' + encodeURIComponent(username));
      var data = await res.json();
      if (!res.ok || data.status === 'error' || data.error || data.totalSolved == null) throw new Error('fail');
      box.innerHTML = [
        statCard('TOTAL SOLVED', data.totalSolved, 'problems'),
        statCard('EASY', data.easySolved),
        statCard('MEDIUM', data.mediumSolved),
        statCard('HARD', data.hardSolved)
      ].join('');
      $('#lcStatus').textContent = 'Updated ' + new Date().toLocaleTimeString();
    } catch (e) {
      box.innerHTML = '<div class="lc-loading">Stats temporarily unavailable. Profile link still works.</div>';
      $('#lcStatus').textContent = 'Unable to fetch stats right now.';
    }
  }

  window.addEventListener('storage', function (e) {
    if (e.key === 'ap-pb-v1' || e.key === PHOTO_KEY) { mergeBuilderState(); render(); loadLeetCode(); }
  });
  var params = new URLSearchParams(location.search);
  if (params.get('preview') === '1' || params.get('from') === 'builder') {
    setInterval(function () { mergeBuilderState(); render(); }, 1200);
  }

  var menu = $('#menuToggle');
  var nav = $('#mainNav');
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
  var refresh = $('#refreshLc');
  if (refresh) refresh.addEventListener('click', loadLeetCode);

  mergeBuilderState();
  render();
  loadLeetCode();
})();
