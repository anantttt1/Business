(function () {
  'use strict';
  var PHOTO_KEY = 'ap-pb-photo';
  var CONFIG = {
    name: 'Your Name', role: 'Developer & Creative Thinker', location: 'Your City', email: '',
    resumeUrl: '', leetcodeUsername: '', about: 'I enjoy learning how things work and building useful projects.',
    aboutExtra: '', facts: ['Problem solving', 'Web development', 'Continuous learning'],
    skills: [{ category: 'FRONTEND', items: ['HTML', 'CSS', 'JavaScript'] }, { category: 'TOOLS', items: ['Git', 'VS Code'] }],
    projects: [], certificates: [], socials: [], photoData: '', status: 'OPEN TO OPPORTUNITIES'
  };
  function $(s) { return document.querySelector(s); }
  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' })[c];
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
      var skills = s.skills || [];
      CONFIG.name = s.fullName || CONFIG.name;
      CONFIG.role = s.title || CONFIG.role;
      CONFIG.about = s.about || CONFIG.about;
      CONFIG.aboutExtra = s.tagline || CONFIG.aboutExtra;
      CONFIG.location = s.location || CONFIG.location;
      CONFIG.email = s.email || '';
      CONFIG.resumeUrl = s.resumeUrl || '';
      CONFIG.leetcodeUsername = String(s.leetcodeUsername || s.leetcode || '')
        .replace(/^@/, '').replace(/.*leetcode\.com\/(u\/)?/i, '').replace(/\/$/, '');
      CONFIG.photoData = s.photoData || readPhoto() || '';
      CONFIG.facts = skills.slice(0, 4).length ? skills.slice(0, 4) : CONFIG.facts;
      if (skills.length) {
        CONFIG.skills = [
          { category: 'CORE', items: skills.slice(0, 4) },
          { category: 'TOOLS', items: skills.slice(4, 8) },
          { category: 'MORE', items: skills.slice(8) }
        ].filter(function (g) { return g.items.length; });
      }
      if (s.projects && s.projects.length) {
        CONFIG.projects = s.projects.map(function (pr) {
          return {
            title: pr.name || 'Project', type: pr.category || 'PROJECT', description: pr.description || '',
            tech: typeof pr.tech === 'string' ? pr.tech.split(/[,|]/).map(function (t) { return t.trim(); }).filter(Boolean) : (pr.tech || []),
            url: pr.liveUrl || pr.githubUrl || '#', image: pr.imageData || ''
          };
        });
      }
      if (s.certifications && s.certifications.length) {
        CONFIG.certificates = s.certifications.map(function (c) {
          return { title: c.name || 'Certificate', issuer: c.org || '', year: c.year || '', url: c.url || '' };
        });
      }
      CONFIG.socials = [];
      if (s.github) CONFIG.socials.push({ label: 'GitHub', url: s.github });
      if (s.linkedin) CONFIG.socials.push({ label: 'LinkedIn', url: s.linkedin });
      if (CONFIG.leetcodeUsername) {
        CONFIG.socials.push({ label: 'LeetCode', url: 'https://leetcode.com/u/' + encodeURIComponent(CONFIG.leetcodeUsername) + '/' });
      }
      if (s.website) CONFIG.socials.push({ label: 'Website', url: s.website });
      return true;
    } catch (e) { return false; }
  }
  function render() {
    var name = CONFIG.name || 'Your Name';
    $('#brandName').textContent = name.toUpperCase();
    $('#footerName').textContent = name.toUpperCase();
    $('#heroNameSmall').textContent = name.split(/\s+/)[0].toUpperCase();
    $('#heroRole').textContent = CONFIG.role;
    $('#heroBio').textContent = CONFIG.about;
    $('#aboutText').textContent = CONFIG.about;
    $('#aboutExtra').textContent = CONFIG.aboutExtra || '';
    $('#initials').textContent = initials(name);
    $('#copyrightYear').textContent = new Date().getFullYear();
    $('#locationLabel').textContent = CONFIG.location || 'Your city';
    $('#statusText').textContent = CONFIG.status || 'OPEN TO OPPORTUNITIES';
    var resume = $('#resumeLink');
    if (CONFIG.resumeUrl) { resume.href = CONFIG.resumeUrl; resume.target = '_blank'; resume.rel = 'noreferrer'; }
    else resume.href = '#contact';
    var photo = CONFIG.photoData || readPhoto();
    var img = $('#photoImg'), fb = $('#photoFallback');
    if (photo && img) { img.src = photo; img.hidden = false; if (fb) fb.style.display = 'none'; }
    $('#socialLinks').innerHTML = (CONFIG.socials || []).map(function (item) {
      return '<a href="' + esc(item.url) + '" target="_blank" rel="noreferrer">' + esc(item.label) + ' ↗</a>';
    }).join('');
    $('#aboutFacts').innerHTML = (CONFIG.facts || []).map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('');
    $('#skillsGrid').innerHTML = (CONFIG.skills || []).map(function (g) {
      return '<article class="skill-card"><span class="skill-category">' + esc(g.category) +
        '</span><div class="skill-tags">' + (g.items || []).map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div></article>';
    }).join('');
    if (!CONFIG.projects || !CONFIG.projects.length) {
      $('#projectsGrid').innerHTML = '<p class="muted">Add projects in the builder to showcase them here.</p>';
    } else {
      $('#projectsGrid').innerHTML = CONFIG.projects.map(function (p, i) {
        var media = p.image
          ? '<img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy">'
          : '<div style="aspect-ratio:1.9;display:grid;place-items:center;color:#a8a0a5;font-size:12px">' + esc(p.title) + '</div>';
        return '<article class="project-card"><a class="project-image" href="' + esc(p.url || '#') +
          '" target="_blank" rel="noreferrer">' + media + '</a><div class="project-meta"><span>' +
          String(i + 1).padStart(2, '0') + ' / ' + esc(p.type || 'PROJECT') + '</span><a href="' + esc(p.url || '#') +
          '" target="_blank" rel="noreferrer">↗</a></div><h3>' + esc(p.title) + '</h3><p>' + esc(p.description) +
          '</p><div class="skill-tags">' + (p.tech || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div></article>';
      }).join('');
    }
    if (!CONFIG.certificates || !CONFIG.certificates.length) {
      $('#certificatesGrid').innerHTML = '<p class="muted">Add certificates in the builder when you have them.</p>';
    } else {
      $('#certificatesGrid').innerHTML = CONFIG.certificates.map(function (c, i) {
        var d = '<div class="certificate-icon">✦</div><div><span class="skill-category">CERTIFICATE ' +
          String(i + 1).padStart(2, '0') + '</span><h3>' + esc(c.title) + '</h3><p>' + esc(c.issuer) +
          (c.year ? ' · ' + esc(c.year) : '') + '</p></div><span class="certificate-arrow">↗</span>';
        return c.url ? '<a class="certificate-card" href="' + esc(c.url) + '" target="_blank" rel="noreferrer">' + d + '</a>'
          : '<article class="certificate-card">' + d + '</article>';
      }).join('');
    }
    $('#contactDetails').innerHTML = '<span class="skill-category">CONTACT</span>' +
      (CONFIG.email ? '<a href="mailto:' + esc(CONFIG.email) + '">' + esc(CONFIG.email) + ' ↗</a>'
        : '<span class="muted">Add your email in the builder</span>') +
      '<span class="muted small">' + esc(CONFIG.location || '') + '</span>';
    var u = CONFIG.leetcodeUsername;
    $('#lcUsername').textContent = u ? '@' + u : '@yourusername';
    $('#lcProfileLink').href = u ? 'https://leetcode.com/u/' + encodeURIComponent(u) + '/' : 'https://leetcode.com/';
  }
  function stat(label, value, sub) {
    return '<div class="lc-stat"><span>' + esc(label) + '</span><strong>' + esc(value ?? '—') +
      (sub ? ' <em>' + esc(sub) + '</em>' : '') + '</strong></div>';
  }
  function renderHeatmap(activity) {
    activity = activity || [];
    var heatmap = document.getElementById('leetcodeHeatmap');
    if (!heatmap) return;
    var byDate = {};
    activity.forEach(function (item) { if (item && item.date) byDate[item.date] = Number(item.count) || 0; });
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var end = new Date(today); end.setDate(end.getDate() + (6 - end.getDay()));
    var start = new Date(end); start.setDate(end.getDate() - 363); start.setDate(start.getDate() - start.getDay());
    var total = 0, html = '';
    for (var i = 0; i < 364; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      var count = byDate[key] || 0; total += count;
      var level = count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : count < 7 ? 3 : 4;
      html += '<div class="heat-cell" data-level="' + level + '" title="' + key + ': ' + count + ' submissions"></div>';
    }
    heatmap.innerHTML = html;
    var ht = document.getElementById('heatmapTotal');
    if (ht) ht.textContent = total + ' contributions';
  }
  function parseCalendar(data) {
    var activity = [];
    if (!data) return activity;
    if (Array.isArray(data)) {
      data.forEach(function (row) {
        if (row.date) activity.push({ date: row.date, count: row.count || row.submissionCount || 0 });
      });
      return activity;
    }
    var cal = data.submissionCalendar || data.calendar || data.data || data;
    if (typeof cal === 'string') { try { cal = JSON.parse(cal); } catch (e) { cal = {}; } }
    if (cal && typeof cal === 'object' && !Array.isArray(cal)) {
      Object.keys(cal).forEach(function (ts) {
        var d = new Date(Number(ts) * 1000);
        if (isNaN(d.getTime())) return;
        var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        activity.push({ date: key, count: Number(cal[ts]) || 0 });
      });
    }
    return activity;
  }
  async function loadLeetCode() {
    var username = (CONFIG.leetcodeUsername || '').trim();
    if (!username) {
      $('#lcStats').innerHTML = [stat('TOTAL SOLVED', '—', 'add username'), stat('EASY', '—'), stat('MEDIUM', '—'), stat('HARD', '—')].join('');
      $('#lcUpdated').textContent = 'Set LeetCode username in the builder for live stats.';
      renderHeatmap([]);
      return;
    }
    $('#lcStats').innerHTML = '<div class="lc-loading">Fetching stats…</div>';
    try {
      var response = await fetch('https://leetcode-stats-api.herokuapp.com/' + encodeURIComponent(username));
      var data = await response.json();
      if (!response.ok || data.status === 'error' || data.error) throw new Error('fail');
      $('#lcStats').innerHTML = [
        stat('TOTAL SOLVED', data.totalSolved, 'problems'),
        stat('EASY', data.easySolved),
        stat('MEDIUM', data.mediumSolved),
        stat('HARD', data.hardSolved),
        stat('ACCEPTANCE', data.acceptanceRate != null ? data.acceptanceRate + '%' : '—'),
        stat('RANK', data.ranking != null ? Number(data.ranking).toLocaleString() : '—')
      ].join('');
      $('#lcUpdated').textContent = 'Updated ' + new Date().toLocaleTimeString();
    } catch (e) {
      $('#lcStats').innerHTML = '<div class="lc-loading">Stats temporarily unavailable. Profile link still works.</div>';
      $('#lcUpdated').textContent = 'Could not refresh stats.';
    }
    var heatUrls = [
      'https://alfa-leetcode-api.onrender.com/' + encodeURIComponent(username) + '/calendar',
      'https://leetcode-api-faisalshohag.vercel.app/' + encodeURIComponent(username)
    ];
    function tryHeat(i) {
      if (i >= heatUrls.length) { renderHeatmap([]); return; }
      fetch(heatUrls[i]).then(function (r) { return r.json(); }).then(function (d) {
        var act = parseCalendar(d);
        if (!act.length) throw new Error('empty');
        renderHeatmap(act);
      }).catch(function () { tryHeat(i + 1); });
    }
    tryHeat(0);
  }
  window.addEventListener('storage', function (e) {
    if (e.key === 'ap-pb-v1' || e.key === PHOTO_KEY) { mergeBuilderState(); render(); loadLeetCode(); }
  });
  var params = new URLSearchParams(location.search);
  if (params.get('preview') === '1' || params.get('from') === 'builder') {
    setInterval(function () { mergeBuilderState(); render(); }, 1200);
  }
  var menu = $('#menuToggle');
  if (menu) menu.addEventListener('click', function () { $('#nav').classList.toggle('open'); });
  document.querySelectorAll('#nav a').forEach(function (link) {
    link.addEventListener('click', function () { $('#nav').classList.remove('open'); });
  });
  var refresh = $('#refreshLc');
  if (refresh) refresh.addEventListener('click', loadLeetCode);
  mergeBuilderState();
  render();
  loadLeetCode();
})();
