(function () {
  'use strict';

  const STORAGE_KEY = 'ap-pb-v1';
  const params = new URLSearchParams(location.search);
  const templateId = params.get('template') || 'modern-dark-3d';
  const templates = window.PB_TEMPLATES || [];
  const tplMeta = templates.find((t) => t.id === templateId) || templates[0] || { id: 'modern-dark-3d', name: 'Modern Dark 3D', accent: '#7190ff' };

  const $ = (s) => document.querySelector(s);
  const state = loadState();

  function defaultState() {
    const demo = JSON.parse(JSON.stringify(window.PB_DEMO || {}));
    demo.templateId = tplMeta.id;
    demo.accent = tplMeta.accent || demo.accent || '#7190ff';
    demo.themeMode = tplMeta.theme || 'dark';
    return demo;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return defaultState();
      parsed.templateId = tplMeta.id;
      return Object.assign(defaultState(), parsed);
    } catch (e) {
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      setStatus('Could not autosave (storage full or blocked). Export still works.', true);
    }
  }

  function setStatus(msg, isErr) {
    const el = $('#pb-status');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-err', !!isErr);
    el.classList.toggle('is-ok', !!msg && !isErr);
  }

  function bindField(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = state[key] || '';
    el.addEventListener('input', function () {
      state[key] = el.value;
      saveState();
      renderPreview();
    });
  }

  function renderSkills() {
    const row = $('#skills-chips');
    if (!row) return;
    row.textContent = '';
    (state.skills || []).forEach(function (sk, i) {
      const chip = document.createElement('span');
      chip.className = 'pb-chip';
      chip.appendChild(document.createTextNode(sk));
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Remove ' + sk);
      btn.textContent = '\u00d7';
      btn.addEventListener('click', function () {
        state.skills.splice(i, 1);
        saveState();
        renderSkills();
        renderPreview();
      });
      chip.appendChild(btn);
      row.appendChild(chip);
    });
  }

  function entryCard(title, fields, onRemove) {
    const box = document.createElement('div');
    box.className = 'pb-list-item';
    const head = document.createElement('div');
    head.className = 'entry-head';
    const strong = document.createElement('strong');
    strong.textContent = title;
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'btn o';
    rm.textContent = 'Remove';
    rm.style.minHeight = '32px';
    rm.style.padding = '4px 10px';
    rm.style.fontSize = '.8rem';
    rm.addEventListener('click', onRemove);
    head.appendChild(strong);
    head.appendChild(rm);
    box.appendChild(head);
    fields.forEach(function (f) {
      const field = document.createElement('div');
      field.className = 'pb-field';
      const lab = document.createElement('label');
      lab.textContent = f.label;
      let input;
      if (f.multiline) {
        input = document.createElement('textarea');
        input.rows = 2;
      } else {
        input = document.createElement('input');
        if (f.type) input.type = f.type;
      }
      input.value = f.value || '';
      input.addEventListener('input', function () {
        f.onChange(input.value);
        saveState();
        renderPreview();
      });
      field.appendChild(lab);
      field.appendChild(input);
      box.appendChild(field);
    });
    return box;
  }

  function renderEducation() {
    const list = $('#edu-list');
    if (!list) return;
    list.textContent = '';
    (state.education || []).forEach(function (ed, i) {
      list.appendChild(
        entryCard('Education ' + (i + 1), [
          { label: 'Institution', value: ed.institution, onChange: function (v) { ed.institution = v; } },
          { label: 'Degree', value: ed.degree, onChange: function (v) { ed.degree = v; } },
          { label: 'Field', value: ed.field, onChange: function (v) { ed.field = v; } },
          { label: 'Start year', value: ed.start, onChange: function (v) { ed.start = v; } },
          { label: 'End year', value: ed.end, onChange: function (v) { ed.end = v; } },
          { label: 'Description', value: ed.description, multiline: true, onChange: function (v) { ed.description = v; } }
        ], function () {
          state.education.splice(i, 1);
          saveState();
          renderEducation();
          renderPreview();
        })
      );
    });
  }

  function renderExperience() {
    const list = $('#exp-list');
    if (!list) return;
    list.textContent = '';
    (state.experience || []).forEach(function (ex, i) {
      list.appendChild(
        entryCard('Experience ' + (i + 1), [
          { label: 'Company', value: ex.company, onChange: function (v) { ex.company = v; } },
          { label: 'Role', value: ex.role, onChange: function (v) { ex.role = v; } },
          { label: 'Start', value: ex.start, onChange: function (v) { ex.start = v; } },
          { label: 'End', value: ex.end, onChange: function (v) { ex.end = v; } },
          { label: 'URL', value: ex.url, type: 'url', onChange: function (v) { ex.url = v; } },
          { label: 'Description', value: ex.description, multiline: true, onChange: function (v) { ex.description = v; } }
        ], function () {
          state.experience.splice(i, 1);
          saveState();
          renderExperience();
          renderPreview();
        })
      );
    });
  }

  function renderProjects() {
    const list = $('#proj-list');
    if (!list) return;
    list.textContent = '';
    (state.projects || []).forEach(function (pr, i) {
      list.appendChild(
        entryCard('Project ' + (i + 1), [
          { label: 'Name', value: pr.name, onChange: function (v) { pr.name = v; } },
          { label: 'Description', value: pr.description, multiline: true, onChange: function (v) { pr.description = v; } },
          { label: 'Technologies', value: pr.tech, onChange: function (v) { pr.tech = v; } },
          { label: 'Live URL', value: pr.liveUrl, type: 'url', onChange: function (v) { pr.liveUrl = v; } },
          { label: 'GitHub URL', value: pr.githubUrl, type: 'url', onChange: function (v) { pr.githubUrl = v; } }
        ], function () {
          state.projects.splice(i, 1);
          saveState();
          renderProjects();
          renderPreview();
        })
      );
    });
  }

  function renderCerts() {
    const list = $('#cert-list');
    if (!list) return;
    list.textContent = '';
    (state.certifications || []).forEach(function (c, i) {
      list.appendChild(
        entryCard('Certification ' + (i + 1), [
          { label: 'Name', value: c.name, onChange: function (v) { c.name = v; } },
          { label: 'Organization', value: c.org, onChange: function (v) { c.org = v; } },
          { label: 'Year', value: c.year, onChange: function (v) { c.year = v; } },
          { label: 'Credential URL', value: c.url, type: 'url', onChange: function (v) { c.url = v; } }
        ], function () {
          state.certifications.splice(i, 1);
          saveState();
          renderCerts();
          renderPreview();
        })
      );
    });
  }

  function safeText(s) {
    return String(s == null ? '' : s);
  }

  function renderPreview() {
    const root = $('#pb-preview');
    if (!root) return;
    root.textContent = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:28px 22px;color:#eef2ff;font:15px/1.55 Inter,system-ui,sans-serif;background:#080a10;min-height:460px';

    const accent = state.accent || '#7190ff';

    const hero = document.createElement('div');
    hero.style.marginBottom = '28px';
    const name = document.createElement('h1');
    name.style.cssText = 'font:700 clamp(1.6rem,4vw,2.4rem)/1.15 Space Grotesk,Inter,sans-serif;margin:0 0 8px';
    name.textContent = safeText(state.fullName) || 'Your Name';
    const role = document.createElement('p');
    role.style.cssText = 'margin:0 0 10px;color:' + accent + ';font-weight:600';
    role.textContent = safeText(state.title) || 'Your Title';
    const tag = document.createElement('p');
    tag.style.cssText = 'margin:0;color:#a3abc0;max-width:52ch';
    tag.textContent = safeText(state.tagline) || safeText(state.about).slice(0, 160);
    hero.appendChild(name);
    hero.appendChild(role);
    hero.appendChild(tag);
    wrap.appendChild(hero);

    if (state.about) {
      const about = document.createElement('section');
      about.style.marginBottom = '22px';
      const h = document.createElement('h2');
      h.style.cssText = 'font-size:1.1rem;margin:0 0 8px;color:' + accent;
      h.textContent = 'About';
      const p = document.createElement('p');
      p.style.cssText = 'margin:0;color:#c5cbe0';
      p.textContent = safeText(state.about);
      about.appendChild(h);
      about.appendChild(p);
      wrap.appendChild(about);
    }

    if ((state.skills || []).length) {
      const sec = document.createElement('section');
      sec.style.marginBottom = '22px';
      const h = document.createElement('h2');
      h.style.cssText = 'font-size:1.1rem;margin:0 0 10px;color:' + accent;
      h.textContent = 'Skills';
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
      state.skills.forEach(function (sk) {
        const chip = document.createElement('span');
        chip.style.cssText = 'padding:6px 10px;border-radius:8px;border:1px solid #27334b;background:#ffffff08;font-size:.82rem';
        chip.textContent = sk;
        row.appendChild(chip);
      });
      sec.appendChild(h);
      sec.appendChild(row);
      wrap.appendChild(sec);
    }

    function listSection(title, items, lineFn) {
      if (!items || !items.length) return;
      const sec = document.createElement('section');
      sec.style.marginBottom = '22px';
      const h = document.createElement('h2');
      h.style.cssText = 'font-size:1.1rem;margin:0 0 10px;color:' + accent;
      h.textContent = title;
      sec.appendChild(h);
      items.forEach(function (it) {
        const card = document.createElement('div');
        card.style.cssText = 'padding:12px 0;border-bottom:1px solid #1a2233';
        lineFn(card, it);
        sec.appendChild(card);
      });
      wrap.appendChild(sec);
    }

    listSection('Experience', state.experience, function (card, ex) {
      const t = document.createElement('strong');
      t.textContent = safeText(ex.role) + (ex.company ? ' \u00b7 ' + safeText(ex.company) : '');
      const d = document.createElement('div');
      d.style.cssText = 'font-size:.82rem;color:#99a5bf;margin:4px 0';
      d.textContent = [ex.start, ex.end].filter(Boolean).join(' \u2013 ');
      const p = document.createElement('p');
      p.style.cssText = 'margin:0;color:#c5cbe0;font-size:.92rem';
      p.textContent = safeText(ex.description);
      card.appendChild(t);
      card.appendChild(d);
      card.appendChild(p);
    });

    listSection('Education', state.education, function (card, ed) {
      const t = document.createElement('strong');
      t.textContent = safeText(ed.degree) + (ed.field ? ' in ' + safeText(ed.field) : '');
      const d = document.createElement('div');
      d.style.cssText = 'font-size:.82rem;color:#99a5bf;margin:4px 0';
      d.textContent = safeText(ed.institution) + ' \u00b7 ' + [ed.start, ed.end].filter(Boolean).join(' \u2013 ');
      card.appendChild(t);
      card.appendChild(d);
    });

    listSection('Projects', state.projects, function (card, pr) {
      const t = document.createElement('strong');
      t.textContent = safeText(pr.name);
      const p = document.createElement('p');
      p.style.cssText = 'margin:4px 0;color:#c5cbe0;font-size:.92rem';
      p.textContent = safeText(pr.description);
      const tech = document.createElement('div');
      tech.style.cssText = 'font-size:.8rem;color:#99a5bf';
      tech.textContent = safeText(pr.tech);
      card.appendChild(t);
      card.appendChild(p);
      card.appendChild(tech);
    });

    const contact = document.createElement('section');
    contact.style.marginTop = '18px';
    const ch = document.createElement('h2');
    ch.style.cssText = 'font-size:1.1rem;margin:0 0 8px;color:' + accent;
    ch.textContent = 'Contact';
    contact.appendChild(ch);
    if (state.email) {
      const e = document.createElement('div');
      e.textContent = state.email;
      contact.appendChild(e);
    }
    if (state.location) {
      const l = document.createElement('div');
      l.style.color = '#99a5bf';
      l.textContent = state.location;
      contact.appendChild(l);
    }
    wrap.appendChild(contact);

    root.appendChild(wrap);
  }

  function validate() {
    const email = (state.email || '').trim();
    const name = (state.fullName || '').trim();
    const title = (state.title || '').trim();
    const err = $('#err-email');
    if (!name || !title) {
      setStatus('Name and professional title are required.', true);
      return false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (err) {
        err.hidden = false;
        err.textContent = 'Enter a valid email address.';
      }
      setStatus('Please fix the highlighted fields.', true);
      return false;
    }
    if (err) err.hidden = true;
    return true;
  }

  async function downloadZip() {
    if (!validate()) return;
    const btn = $('#btn-download');
    if (btn) btn.disabled = true;
    setStatus('Generating ZIP\u2026');
    try {
      if (typeof JSZip === 'undefined') throw new Error('ZIP library failed to load');
      if (typeof window.PB_exportModernDark !== 'function') throw new Error('Exporter missing');
      const blob = await window.PB_exportModernDark(state);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = (state.fullName || 'my-portfolio')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'my-portfolio';
      a.href = url;
      a.download = safeName + '-portfolio.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      setStatus('Download started \u2014 extract the ZIP and open index.html.');
    } catch (e) {
      console.error(e);
      setStatus('Export failed: ' + (e && e.message ? e.message : 'unknown error'), true);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  const titleEl = $('#pb-editor-title');
  if (titleEl) titleEl.textContent = 'Customize \u00b7 ' + (tplMeta.name || 'Template');
  const label = $('#pb-template-label');
  if (label) label.textContent = tplMeta.name || templateId;

  bindField('f-name', 'fullName');
  bindField('f-title', 'title');
  bindField('f-tagline', 'tagline');
  bindField('f-about', 'about');
  bindField('f-location', 'location');
  bindField('f-email', 'email');
  bindField('f-phone', 'phone');
  bindField('f-resume', 'resumeUrl');
  bindField('f-github', 'github');
  bindField('f-linkedin', 'linkedin');
  bindField('f-website', 'website');
  bindField('f-leetcode', 'leetcode');
  bindField('f-hackerrank', 'hackerrank');

  const accent = $('#f-accent');
  if (accent) {
    accent.value = state.accent || '#7190ff';
    accent.addEventListener('input', function () {
      state.accent = accent.value;
      saveState();
      renderPreview();
    });
  }

  if ($('#btn-add-skill')) {
    $('#btn-add-skill').addEventListener('click', function () {
      const input = $('#f-skill');
      const v = (input && input.value || '').trim();
      if (!v) return;
      if (!state.skills) state.skills = [];
      if (!state.skills.includes(v)) state.skills.push(v);
      if (input) input.value = '';
      saveState();
      renderSkills();
      renderPreview();
    });
  }

  if ($('#btn-add-edu')) {
    $('#btn-add-edu').addEventListener('click', function () {
      if (!state.education) state.education = [];
      state.education.push({ institution: '', degree: '', field: '', start: '', end: '', description: '' });
      saveState();
      renderEducation();
    });
  }
  if ($('#btn-add-exp')) {
    $('#btn-add-exp').addEventListener('click', function () {
      if (!state.experience) state.experience = [];
      state.experience.push({ company: '', role: '', start: '', end: '', url: '', description: '' });
      saveState();
      renderExperience();
    });
  }
  if ($('#btn-add-proj')) {
    $('#btn-add-proj').addEventListener('click', function () {
      if (!state.projects) state.projects = [];
      state.projects.push({ name: '', description: '', tech: '', liveUrl: '', githubUrl: '', imageData: '' });
      saveState();
      renderProjects();
    });
  }
  if ($('#btn-add-cert')) {
    $('#btn-add-cert').addEventListener('click', function () {
      if (!state.certifications) state.certifications = [];
      state.certifications.push({ name: '', org: '', year: '', url: '', description: '' });
      saveState();
      renderCerts();
    });
  }

  document.querySelectorAll('#theme-seg button').forEach(function (btn) {
    btn.classList.toggle('is-active', btn.dataset.theme === state.themeMode);
    btn.addEventListener('click', function () {
      document.querySelectorAll('#theme-seg button').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      state.themeMode = btn.dataset.theme;
      saveState();
      renderPreview();
    });
  });

  document.querySelectorAll('#viewport-seg button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('#viewport-seg button').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      const panel = document.querySelector('.pb-preview-inner');
      if (panel) {
        panel.classList.toggle('is-mobile', btn.dataset.vp === 'mobile');
        panel.classList.toggle('is-desktop', btn.dataset.vp === 'desktop');
      }
    });
  });

  if ($('#btn-download')) $('#btn-download').addEventListener('click', downloadZip);
  if ($('#btn-reset')) {
    $('#btn-reset').addEventListener('click', function () {
      if (!confirm('Reset all fields to demo content? Your current edits will be cleared.')) return;
      const demo = defaultState();
      Object.keys(state).forEach(function (k) { delete state[k]; });
      Object.assign(state, demo);
      saveState();
      location.reload();
    });
  }

  const photo = $('#f-photo');
  if (photo) {
    photo.addEventListener('change', function () {
      const file = photo.files && photo.files[0];
      if (!file) return;
      if (file.size > 1.5 * 1024 * 1024) {
        setStatus('Photo must be under 1.5 MB.', true);
        photo.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        state.photoData = String(reader.result || '');
        saveState();
        renderPreview();
        setStatus('Photo added.');
      };
      reader.readAsDataURL(file);
    });
  }

  renderSkills();
  renderEducation();
  renderExperience();
  renderProjects();
  renderCerts();
  renderPreview();
  saveState();
})();
