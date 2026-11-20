(function () {
  'use strict';

  const STORAGE = 'ap-rb-v4';
  const $ = (s) => document.querySelector(s);

  function demoState() {
    return {
      fullName: 'Adam Deo',
      email: 'adam.deo@email.com',
      phone: '+91-98765-43210',
      location: 'New Delhi, 110001',
      portfolio: 'https://portfolio.example.com',
      linkedin: 'https://linkedin.com/in/sample',
      github: 'https://github.com/sample',
      leetcode: 'https://leetcode.com/sample',
      includeEdu: true,
      includeExp: true,
      includeProj: true,
      includeSkills: true,
      includeCert: true,
      includeAch: true,
      education: [
        { degree: 'Bachelor of Technology in Computer Science & Engineering', school: 'XYZ University', score: '9.4 CPI', years: '2020-2024' },
        { degree: 'Intermediate, CBSE Board', school: 'ABC School, Mathura', score: '95%', years: '2019-2020' },
        { degree: 'High School, CBSE Board', school: 'XYZ School, Mathura', score: '96.5%', years: '2017-2018' }
      ],
      experience: [
        {
          role: 'Infosys Springboard Internship',
          org: 'Coding Question Bank',
          period: 'January 2023 - May 2023',
          skillsUsed: 'Java, Python and DSA',
          bullets: 'Created a hands-on question bank to be used for online coding contests'
        }
      ],
      projects: [
        {
          name: 'Health Care System',
          role: 'Data Scientist & Full Stack Developer',
          period: 'August 2023 - December 2023',
          link: 'https://healthcare-sample.demo',
          team: '4',
          tech: 'EJS, Bootstrap, Node, Express, MongoDB',
          bullets: 'Model Training & Prediction using Python, Machine Learning, Decision Tree, Sklearn, Flask, React.\nDisease Prediction system using symptoms and also doctor appointment booking.'
        },
        {
          name: 'Social Media',
          role: 'Full Stack Developer (MERN)',
          period: 'April 2023 - August 2023',
          link: 'https://socialmedia-sample.demo',
          team: 'Individual Project',
          tech: 'React (Frontend), Express (Server), MySQL (Database)',
          bullets: 'Social Media Website to allow users to create accounts, post photos, add likes, comments & follow users.'
        }
      ],
      skillsFs: 'HTML, CSS, JavaScript, Bootstrap, MongoDB, Express, React, NodeJS, Flask, MySQL.',
      skillsLang: 'JAVA, PYTHON, C.',
      skillsCore: 'SQL, DSA, Machine Learning, Cybersecurity.',
      skillsTools: 'Git, Github, VS Code, NAGIOS, JIRA, Burp Suite, ZAP, Docker.',
      skillsSoft: 'Problem solving skills, Efficient Time Management.',
      certifications: [
        { text: 'GOLD Badges & Certifications from HackerRank.', link: 'https://hackerrank.com/sample' },
        { text: 'Certifications from Infosys Springboard in Java, Python, DSA, HTML, CSS, Time Management, Agile.', link: '' }
      ],
      achievements: [
        { text: '1854 contest ratings (Knight) on LeetCode.', link: 'https://leetcode.com/sample' },
        { text: '1577 (max) rating (Specialist) on CodeForces.', link: 'https://codeforces.com/sample' },
        { text: '2200+ Contributions on GitHub.', link: 'https://github.com/sample' },
        { text: 'Freelance tutoring at Tutor.com as part of Trivium Eduservices.', link: '' }
      ]
    };
  }

  function emptyState() {
    return {
      fullName: '', email: '', phone: '', location: '',
      portfolio: '', linkedin: '', github: '', leetcode: '',
      includeEdu: true, includeExp: true, includeProj: true,
      includeSkills: true, includeCert: true, includeAch: true,
      education: [{ degree: '', school: '', score: '', years: '' }],
      experience: [{ role: '', org: '', period: '', skillsUsed: '', bullets: '' }],
      projects: [{ name: '', role: '', period: '', link: '', tech: '', team: '', bullets: '' }],
      skillsFs: '', skillsLang: '', skillsCore: '', skillsTools: '', skillsSoft: '',
      certifications: [{ text: '', link: '' }],
      achievements: [{ text: '', link: '' }]
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return emptyState();
      return Object.assign(emptyState(), JSON.parse(raw));
    } catch (e) {
      return emptyState();
    }
  }

  const state = load();
  const hasUserData = !!(state.fullName || state.email);

  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch (e) {}
  }

  function setStatus(msg, isErr) {
    const el = $('#rb-status');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-err', !!isErr);
    el.classList.toggle('is-ok', !!msg && !isErr);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function bulletsHtml(text) {
    const lines = String(text || '').split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    if (!lines.length) return '';
    return '<ul class="rb-bullets">' + lines.map(function (l) {
      return '<li>' + escapeHtml(l) + '</li>';
    }).join('') + '</ul>';
  }

  function linkOrText(url, label) {
    if (!url) return '';
    const safe = escapeHtml(url);
    return '<a href="' + safe + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(label || safe) + '</a>';
  }

  function buildResumeHtml() {
    const s = (state.fullName || state.email) ? state : demoState();
    const name = (s.fullName || '').trim();
    if (!name && !s.email) {
      return '<div class="rb-a4"><div class="rb-empty">Start typing on the left — your resume appears here live.</div></div>';
    }
    const contactParts = [s.email, s.phone, s.location].filter(Boolean).map(escapeHtml);
    const linkParts = [];
    if (s.portfolio) linkParts.push(linkOrText(s.portfolio, 'Portfolio'));
    if (s.linkedin) linkParts.push(linkOrText(s.linkedin, 'LinkedIn'));
    if (s.leetcode) linkParts.push(linkOrText(s.leetcode, 'LeetCode'));
    if (s.github) linkParts.push(linkOrText(s.github, 'GitHub'));

    let html = '<div class="rb-a4">';
    html += '<h1 class="rb-name">' + escapeHtml(name || 'Your Name') + '</h1>';
    if (contactParts.length) html += '<p class="rb-contact">' + contactParts.join('  |  ') + '</p>';
    if (linkParts.length) html += '<p class="rb-links">' + linkParts.join('  |  ') + '</p>';

    if (s.includeEdu && (s.education || []).some(function (e) { return e.degree || e.school; })) {
      html += '<div class="rb-sec-title">Education</div>';
      s.education.forEach(function (e) {
        if (!e.degree && !e.school) return;
        const leftParts = [];
        if (e.degree) leftParts.push(escapeHtml(e.degree));
        if (e.school) leftParts.push(escapeHtml(e.school));
        if (e.score) leftParts.push('with ' + escapeHtml(e.score));
        html += '<div class="rb-row"><span>' + leftParts.join(', ') + '</span><span class="rb-date">' + escapeHtml(e.years || '') + '</span></div>';
      });
    }

    if (s.includeExp && (s.experience || []).some(function (e) { return e.role || e.org; })) {
      html += '<div class="rb-sec-title">Professional Experience</div>';
      s.experience.forEach(function (e) {
        if (!e.role && !e.org) return;
        html += '<div class="rb-row"><span class="rb-job-title">' + escapeHtml(e.role || '') + '</span><span class="rb-date">' + escapeHtml(e.period || '') + '</span></div>';
        if (e.org) html += '<div class="rb-sub">' + escapeHtml(e.org) + '</div>';
        if (e.skillsUsed) html += '<div class="rb-skills-used">Skills Used: ' + escapeHtml(e.skillsUsed) + '</div>';
        html += bulletsHtml(e.bullets);
      });
    }

    if (s.includeProj && (s.projects || []).some(function (p) { return p.name; })) {
      html += '<div class="rb-sec-title">Projects</div>';
      s.projects.forEach(function (p) {
        if (!p.name) return;
        html += '<div class="rb-row"><span class="rb-job-title">' + escapeHtml(p.name) + '</span><span class="rb-date">' + escapeHtml(p.period || '') + '</span></div>';
        if (p.role) html += '<div class="rb-sub">' + escapeHtml(p.role) + '</div>';
        if (p.link) html += '<div class="rb-meta">Link — ' + linkOrText(p.link, p.link) + '</div>';
        if (p.team) html += '<div class="rb-meta">Team Size: ' + escapeHtml(p.team) + '</div>';
        if (p.tech) html += '<div class="rb-meta">Technologies Used — ' + escapeHtml(p.tech) + '</div>';
        html += bulletsHtml(p.bullets);
      });
    }

    if (s.includeSkills) {
      const skillLines = [
        ['Full-Stack', s.skillsFs],
        ['Programming Languages', s.skillsLang],
        ['Core CS', s.skillsCore],
        ['Tools', s.skillsTools],
        ['Soft Skills', s.skillsSoft]
      ].filter(function (x) { return x[1] && String(x[1]).trim(); });
      if (skillLines.length) {
        html += '<div class="rb-sec-title">Skills</div>';
        skillLines.forEach(function (x) {
          html += '<p class="rb-skills-line"><b>' + escapeHtml(x[0]) + ':</b> ' + escapeHtml(x[1]) + '</p>';
        });
      }
    }

    if (s.includeCert && (s.certifications || []).some(function (c) { return c.text; })) {
      html += '<div class="rb-sec-title">Certifications</div><ul class="rb-bullets">';
      s.certifications.forEach(function (c) {
        if (!c.text) return;
        html += '<li>' + escapeHtml(c.text) + (c.link ? ' — ' + linkOrText(c.link, 'Link') : '') + '</li>';
      });
      html += '</ul>';
    }

    if (s.includeAch && (s.achievements || []).some(function (a) { return a.text; })) {
      html += '<div class="rb-sec-title">Achievements</div><ul class="rb-bullets">';
      s.achievements.forEach(function (a) {
        if (!a.text) return;
        html += '<li>' + escapeHtml(a.text) + (a.link ? ' — ' + linkOrText(a.link, 'Link') : '') + '</li>';
      });
      html += '</ul>';
    }

    html += '</div>';
    return html;
  }

  function updateLive() {
    const live = $('#rb-live-preview');
    if (live) live.innerHTML = buildResumeHtml();
    const printRoot = $('#rb-print-root');
    if (printRoot) printRoot.innerHTML = buildResumeHtml();
  }

  function bind(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = state[key] || '';
    el.addEventListener('input', function () {
      state[key] = el.value; save(); updateLive();
    });
  }

  function bindToggle(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = !!state[key];
    el.addEventListener('change', function () {
      state[key] = el.checked; save(); updateLive();
    });
  }

  function entryCard(title, fields, onRemove) {
    const box = document.createElement('div');
    box.className = 'rb-entry';
    const head = document.createElement('div');
    head.className = 'rb-entry-head';
    const strong = document.createElement('strong');
    strong.textContent = title;
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'btn o rb-rm';
    rm.textContent = 'Remove';
    rm.addEventListener('click', onRemove);
    head.appendChild(strong);
    head.appendChild(rm);
    box.appendChild(head);
    fields.forEach(function (f) {
      const field = document.createElement('div');
      field.className = 'rb-field';
      const lab = document.createElement('label');
      lab.textContent = f.label;
      let input;
      if (f.multiline) {
        input = document.createElement('textarea');
        input.rows = 3;
        input.placeholder = f.placeholder || 'One point per line';
      } else {
        input = document.createElement('input');
        if (f.type) input.type = f.type;
        if (f.placeholder) input.placeholder = f.placeholder;
      }
      input.value = f.value || '';
      input.addEventListener('input', function () {
        f.onChange(input.value); save(); updateLive();
      });
      field.appendChild(lab);
      field.appendChild(input);
      box.appendChild(field);
    });
    return box;
  }

  function renderEdu() {
    const list = $('#edu-list');
    if (!list) return;
    list.textContent = '';
    (state.education || []).forEach(function (ed, i) {
      list.appendChild(entryCard('Education ' + (i + 1), [
        { label: 'Degree / course', value: ed.degree, placeholder: 'B.Tech in CSE', onChange: function (v) { ed.degree = v; } },
        { label: 'School / college', value: ed.school, placeholder: 'University name', onChange: function (v) { ed.school = v; } },
        { label: 'Score / CPI', value: ed.score, placeholder: '9.4 CPI or 95%', onChange: function (v) { ed.score = v; } },
        { label: 'Years', value: ed.years, placeholder: '2020-2024', onChange: function (v) { ed.years = v; } }
      ], function () { state.education.splice(i, 1); save(); renderEdu(); updateLive(); }));
    });
  }

  function renderExp() {
    const list = $('#exp-list');
    if (!list) return;
    list.textContent = '';
    (state.experience || []).forEach(function (ex, i) {
      list.appendChild(entryCard('Experience ' + (i + 1), [
        { label: 'Role / title', value: ex.role, placeholder: 'Internship title', onChange: function (v) { ex.role = v; } },
        { label: 'Organisation / subtitle', value: ex.org, placeholder: 'Company or project', onChange: function (v) { ex.org = v; } },
        { label: 'Period', value: ex.period, placeholder: 'Jan 2023 - May 2023', onChange: function (v) { ex.period = v; } },
        { label: 'Skills Used', value: ex.skillsUsed, placeholder: 'Java, Python, DSA', onChange: function (v) { ex.skillsUsed = v; } },
        { label: 'Points (one per line)', value: ex.bullets, multiline: true, placeholder: 'What you built…', onChange: function (v) { ex.bullets = v; } }
      ], function () { state.experience.splice(i, 1); save(); renderExp(); updateLive(); }));
    });
  }

  function renderProj() {
    const list = $('#proj-list');
    if (!list) return;
    list.textContent = '';
    (state.projects || []).forEach(function (pr, i) {
      list.appendChild(entryCard('Project ' + (i + 1), [
        { label: 'Project name', value: pr.name, placeholder: 'Project name', onChange: function (v) { pr.name = v; } },
        { label: 'Your role', value: pr.role, placeholder: 'Full Stack Developer', onChange: function (v) { pr.role = v; } },
        { label: 'Period', value: pr.period, placeholder: 'Aug 2023 - Dec 2023', onChange: function (v) { pr.period = v; } },
        { label: 'Link', value: pr.link, type: 'url', placeholder: 'https://…', onChange: function (v) { pr.link = v; } },
        { label: 'Team Size', value: pr.team, placeholder: '4 or Individual', onChange: function (v) { pr.team = v; } },
        { label: 'Technologies', value: pr.tech, placeholder: 'React, Node, MongoDB', onChange: function (v) { pr.tech = v; } },
        { label: 'Points (one per line)', value: pr.bullets, multiline: true, onChange: function (v) { pr.bullets = v; } }
      ], function () { state.projects.splice(i, 1); save(); renderProj(); updateLive(); }));
    });
  }

  function renderCert() {
    const list = $('#cert-list');
    if (!list) return;
    list.textContent = '';
    (state.certifications || []).forEach(function (c, i) {
      list.appendChild(entryCard('Certification ' + (i + 1), [
        { label: 'Description', value: c.text, placeholder: 'Certification name', onChange: function (v) { c.text = v; } },
        { label: 'Link (optional)', value: c.link, type: 'url', onChange: function (v) { c.link = v; } }
      ], function () { state.certifications.splice(i, 1); save(); renderCert(); updateLive(); }));
    });
  }

  function renderAch() {
    const list = $('#ach-list');
    if (!list) return;
    list.textContent = '';
    (state.achievements || []).forEach(function (a, i) {
      list.appendChild(entryCard('Achievement ' + (i + 1), [
        { label: 'Description', value: a.text, placeholder: 'Achievement', onChange: function (v) { a.text = v; } },
        { label: 'Link (optional)', value: a.link, type: 'url', onChange: function (v) { a.link = v; } }
      ], function () { state.achievements.splice(i, 1); save(); renderAch(); updateLive(); }));
    });
  }

  function downloadPdf() {
    if (!(state.fullName || '').trim() || !(state.email || '').trim()) {
      setStatus('Name and email are required to download.', true);
      return;
    }
    updateLive();
    setStatus('Opening print dialog — choose “Save as PDF”.');
    setTimeout(function () { window.print(); }, 150);
  }

  bind('f-name', 'fullName');
  bind('f-email', 'email');
  bind('f-phone', 'phone');
  bind('f-location', 'location');
  bind('f-portfolio', 'portfolio');
  bind('f-linkedin', 'linkedin');
  bind('f-github', 'github');
  bind('f-leetcode', 'leetcode');
  bind('f-skills-fs', 'skillsFs');
  bind('f-skills-lang', 'skillsLang');
  bind('f-skills-core', 'skillsCore');
  bind('f-skills-tools', 'skillsTools');
  bind('f-skills-soft', 'skillsSoft');
  bindToggle('sec-edu', 'includeEdu');
  bindToggle('sec-exp', 'includeExp');
  bindToggle('sec-proj', 'includeProj');
  bindToggle('sec-skills', 'includeSkills');
  bindToggle('sec-cert', 'includeCert');
  bindToggle('sec-ach', 'includeAch');

  if ($('#btn-add-edu')) $('#btn-add-edu').addEventListener('click', function () {
    state.education.push({ degree: '', school: '', score: '', years: '' });
    save(); renderEdu(); updateLive();
  });
  if ($('#btn-add-exp')) $('#btn-add-exp').addEventListener('click', function () {
    state.experience.push({ role: '', org: '', period: '', skillsUsed: '', bullets: '' });
    save(); renderExp(); updateLive();
  });
  if ($('#btn-add-proj')) $('#btn-add-proj').addEventListener('click', function () {
    state.projects.push({ name: '', role: '', period: '', link: '', tech: '', team: '', bullets: '' });
    save(); renderProj(); updateLive();
  });
  if ($('#btn-add-cert')) $('#btn-add-cert').addEventListener('click', function () {
    state.certifications.push({ text: '', link: '' });
    save(); renderCert(); updateLive();
  });
  if ($('#btn-add-ach')) $('#btn-add-ach').addEventListener('click', function () {
    state.achievements.push({ text: '', link: '' });
    save(); renderAch(); updateLive();
  });

  if ($('#btn-download')) $('#btn-download').addEventListener('click', downloadPdf);
  if ($('#btn-reset')) {
    $('#btn-reset').addEventListener('click', function () {
      if (!confirm('Clear all fields? Preview will show demo resume again.')) return;
      try { localStorage.removeItem(STORAGE); } catch (e) {}
      location.reload();
    });
  }

  const yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  renderEdu();
  renderExp();
  renderProj();
  renderCert();
  renderAch();
  updateLive();
})();
