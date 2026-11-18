(function () {
  'use strict';

  const STORAGE_KEY = 'ap-pb-v1';
  const PHOTO_KEY = 'ap-pb-photo';
  const STEP_KEY = 'ap-pb-step';
  const params = new URLSearchParams(location.search);
  const templateId = params.get('template') || 'modern-dark-3d';
  const templates = window.PB_TEMPLATES || [];
  const tplMeta = templates.find((t) => t.id === templateId) || templates[0] || {
    id: 'modern-dark-3d',
    name: 'Modern Dark 3D',
    accent: '#7190ff'
  };

  const TOTAL_STEPS = 5;
  const STEP_LABELS = [
    'Personal details',
    'Links',
    'Skills',
    'Education & Experience',
    'Projects & Certifications'
  ];

  const $ = (s) => document.querySelector(s);
  const state = loadState();
  let currentStep = loadStep();

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
      if (!parsed.photoData) {
        try {
          const p = localStorage.getItem(PHOTO_KEY) || sessionStorage.getItem(PHOTO_KEY);
          if (p) parsed.photoData = p;
        } catch (e) {}
      }
      return Object.assign(defaultState(), parsed);
    } catch (e) {
      return defaultState();
    }
  }

  function loadStep() {
    try {
      const s = parseInt(localStorage.getItem(STEP_KEY) || '1', 10);
      if (s >= 1 && s <= TOTAL_STEPS) return s;
    } catch (e) {}
    return 1;
  }

  function saveStep(n) {
    try { localStorage.setItem(STEP_KEY, String(n)); } catch (e) {}
  }

  function saveState() {
    try {
      const copy = Object.assign({}, state);
      const photo = copy.photoData || '';
      delete copy.photoData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
      if (photo && photo.indexOf('data:image') === 0) {
        try {
          localStorage.setItem(PHOTO_KEY, photo);
          sessionStorage.setItem(PHOTO_KEY, photo);
        } catch (e2) {
          try { sessionStorage.setItem(PHOTO_KEY, photo); } catch (e3) {}
          setStatus('Photo saved for this session only (storage full).', true);
        }
      }
      state.photoData = photo;
    } catch (e) {
      setStatus('Could not autosave. Export still works.', true);
    }
  }

  function setStatus(msg, isErr) {
    const el = $('#pb-status');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-err', !!isErr);
    el.classList.toggle('is-ok', !!msg && !isErr);
  }

  function goToStep(n) {
    if (n < 1 || n > TOTAL_STEPS) return;
    currentStep = n;
    saveStep(n);

    document.querySelectorAll('.pb-step-panel').forEach(function (panel) {
      const step = parseInt(panel.getAttribute('data-step'), 10);
      const active = step === n;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });

    document.querySelectorAll('.pb-step').forEach(function (el) {
      const step = parseInt(el.getAttribute('data-step'), 10);
      el.classList.toggle('is-active', step === n);
      el.classList.toggle('is-done', step < n);
    });

    const hint = $('#pb-step-hint');
    if (hint) {
      hint.textContent = 'Step ' + n + ' of ' + TOTAL_STEPS + ' · ' + STEP_LABELS[n - 1];
    }

    const prevBtn = $('#btn-prev');
    const nextBtn = $('#btn-next');
    if (prevBtn) prevBtn.hidden = n === 1;
    if (nextBtn) {
      nextBtn.textContent = n === TOTAL_STEPS ? 'Done \u2713' : 'Next \u2192';
      nextBtn.hidden = false;
    }

    const panel = document.querySelector('.pb-step-panel.is-active');
    if (panel) {
      try { panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
    }
  }

  function bindField(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = state[key] || '';
    el.addEventListener('input', function () {
      state[key] = el.value;
      saveState();
    });
  }

  function compressImage(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onerror = function () { reject(new Error('Could not read image')); };
      reader.onload = function () {
        const img = new Image();
        img.onerror = function () { reject(new Error('Invalid image')); };
        img.onload = function () {
          let w = img.width;
          let h = img.height;
          const scale = Math.min(1, maxSide / Math.max(w, h));
          w = Math.round(w * scale);
          h = Math.round(h * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          let data = canvas.toDataURL('image/jpeg', quality);
          if (data.length > 450000 && quality > 0.5) {
            data = canvas.toDataURL('image/jpeg', 0.55);
          }
          resolve(data);
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  }

  function showPhotoThumb(dataUrl) {
    let thumb = document.getElementById('pb-photo-thumb');
    if (!thumb) {
      const field = document.getElementById('f-photo');
      if (!field || !field.parentNode) return;
      thumb = document.createElement('img');
      thumb.id = 'pb-photo-thumb';
      thumb.alt = 'Profile preview';
      thumb.style.cssText =
        'display:block;width:96px;height:96px;object-fit:cover;border-radius:16px;margin-top:10px;border:1px solid rgba(255,255,255,.15)';
      field.parentNode.appendChild(thumb);
    }
    if (dataUrl) {
      thumb.src = dataUrl;
      thumb.hidden = false;
    } else {
      thumb.hidden = true;
    }
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
      list.appendChild(entryCard('Education ' + (i + 1), [
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
      }));
    });
  }

  function renderExperience() {
    const list = $('#exp-list');
    if (!list) return;
    list.textContent = '';
    (state.experience || []).forEach(function (ex, i) {
      list.appendChild(entryCard('Experience ' + (i + 1), [
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
      }));
    });
  }

  function renderProjects() {
    const list = $('#proj-list');
    if (!list) return;
    list.textContent = '';
    (state.projects || []).forEach(function (pr, i) {
      list.appendChild(entryCard('Project ' + (i + 1), [
        { label: 'Name', value: pr.name, onChange: function (v) { pr.name = v; } },
        { label: 'Description', value: pr.description, multiline: true, onChange: function (v) { pr.description = v; } },
        { label: 'Technologies', value: pr.tech, onChange: function (v) { pr.tech = v; } },
        { label: 'Live URL', value: pr.liveUrl, type: 'url', onChange: function (v) { pr.liveUrl = v; } },
        { label: 'GitHub URL', value: pr.githubUrl, type: 'url', onChange: function (v) { pr.githubUrl = v; } }
      ], function () {
        state.projects.splice(i, 1);
        saveState();
        renderProjects();
      }));
    });
  }

  function renderCerts() {
    const list = $('#cert-list');
    if (!list) return;
    list.textContent = '';
    (state.certifications || []).forEach(function (c, i) {
      list.appendChild(entryCard('Certification ' + (i + 1), [
        { label: 'Name', value: c.name, onChange: function (v) { c.name = v; } },
        { label: 'Organization', value: c.org, onChange: function (v) { c.org = v; } },
        { label: 'Year', value: c.year, onChange: function (v) { c.year = v; } },
        { label: 'Credential URL', value: c.url, type: 'url', onChange: function (v) { c.url = v; } }
      ], function () {
        state.certifications.splice(i, 1);
        saveState();
        renderCerts();
      }));
    });
  }

  function validate() {
    const email = (state.email || '').trim();
    const name = (state.fullName || '').trim();
    const title = (state.title || '').trim();
    const err = $('#err-email');
    if (!name || !title) {
      setStatus('Name and professional title are required.', true);
      goToStep(1);
      return false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (err) {
        err.hidden = false;
        err.textContent = 'Enter a valid email address.';
      }
      setStatus('Please fix the highlighted fields.', true);
      goToStep(1);
      return false;
    }
    if (err) err.hidden = true;
    return true;
  }

  function openPreview() {
    if (state.photoData) {
      try {
        sessionStorage.setItem(PHOTO_KEY, state.photoData);
        localStorage.setItem(PHOTO_KEY, state.photoData);
      } catch (e) {}
    }
    saveState();
    setStatus('Opening full template preview\u2026');
    const tpl = templateId || 'modern-dark-3d';
    const url =
      '/portfolio-builder/templates/' + tpl + '/?preview=1&from=builder&t=' +
      Date.now();
    window.open(url, '_blank');
  }

  async function runExport() {
    if (typeof window.PB_exportModernDark !== 'function') throw new Error('Exporter missing');
    if (typeof window.PB_simpleZip !== 'function' && typeof JSZip === 'undefined') {
      throw new Error('ZIP library failed to load \u2014 hard refresh the page');
    }
    if (!state.photoData) {
      try {
        state.photoData = localStorage.getItem(PHOTO_KEY) || sessionStorage.getItem(PHOTO_KEY) || '';
      } catch (e) {}
    }
    state.templateId = templateId || state.templateId || 'modern-dark-3d';
    await window.PB_exportModernDark(state);
  }

  /* window.PB_CONFIG.paymentRequired (config.js): false = 1-month free trial, ZIP downloads straight away */
  const PAYMENT_REQUIRED = !!(window.PB_CONFIG && window.PB_CONFIG.paymentRequired);

  function exportNow(startMsg) {
    setStatus(startMsg);
    runExport()
      .then(function () {
        setStatus('Download started \u2014 extract the ZIP and open index.html.');
      })
      .catch(function (e) {
        console.error(e);
        setStatus('Export failed: ' + (e && e.message ? e.message : 'unknown error'), true);
      });
  }

  function downloadZip() {
    if (!validate()) return;
    saveState();

    if (!PAYMENT_REQUIRED) {
      exportNow('Generating your portfolio ZIP\u2026');
      return;
    }

    if (typeof window.PB_openPayment !== 'function') {
      setStatus('Payment module missing \u2014 hard refresh the page.', true);
      return;
    }

    setStatus('Open payment to unlock ZIP download\u2026');
    window.PB_openPayment(templateId, {
      onApproved: function () {
        exportNow('Payment approved \u2014 generating your portfolio ZIP\u2026');
      }
    });
  }

  if (PAYMENT_REQUIRED) {
    /* payment is back on: restore the original wording on the page */
    const setText = function (id, text) {
      const n = document.getElementById(id);
      if (n) n.textContent = text;
    };
    setText('pb-editor-sub', '5 short steps \u00b7 data saves automatically \u00b7 Download ZIP opens UPI payment.');
    setText('pb-how-3-title', 'Pay the Amount');
    setText('pb-how-3-text', 'Complete payment via UPI. Once successful, your ZIP downloads automatically.');
  }

  const titleEl = $('#pb-editor-title');
  if (titleEl) titleEl.textContent = 'Customize \u00b7 ' + (tplMeta.name || 'Template');

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
    accent.value = state.accent || tplMeta.accent || '#7190ff';
    accent.addEventListener('input', function () {
      state.accent = accent.value;
      saveState();
    });
  }

  if ($('#btn-add-skill')) {
    $('#btn-add-skill').addEventListener('click', function () {
      const input = $('#f-skill');
      const v = ((input && input.value) || '').trim();
      if (!v) return;
      if (!state.skills) state.skills = [];
      if (!state.skills.includes(v)) state.skills.push(v);
      if (input) input.value = '';
      saveState();
      renderSkills();
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
      document.querySelectorAll('#theme-seg button').forEach(function (b) {
        b.classList.remove('is-active');
      });
      btn.classList.add('is-active');
      state.themeMode = btn.dataset.theme;
      saveState();
    });
  });

  if ($('#btn-preview')) $('#btn-preview').addEventListener('click', openPreview);
  if ($('#btn-download')) $('#btn-download').addEventListener('click', downloadZip);
  if ($('#btn-reset')) {
    $('#btn-reset').addEventListener('click', function () {
      if (!confirm('Reset all fields to demo content?')) return;
      try {
        localStorage.removeItem(PHOTO_KEY);
        sessionStorage.removeItem(PHOTO_KEY);
        localStorage.removeItem(STEP_KEY);
      } catch (e) {}
      const demo = defaultState();
      Object.keys(state).forEach(function (k) { delete state[k]; });
      Object.assign(state, demo);
      saveState();
      location.reload();
    });
  }

  if ($('#btn-next')) {
    $('#btn-next').addEventListener('click', function () {
      saveState();
      if (currentStep < TOTAL_STEPS) {
        goToStep(currentStep + 1);
      } else {
        setStatus('All steps done. Click Preview or Download ZIP.');
      }
    });
  }
  if ($('#btn-prev')) {
    $('#btn-prev').addEventListener('click', function () {
      saveState();
      if (currentStep > 1) goToStep(currentStep - 1);
    });
  }

  document.querySelectorAll('.pb-step').forEach(function (el) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', function () {
      const s = parseInt(el.getAttribute('data-step'), 10);
      if (s >= 1 && s <= TOTAL_STEPS) {
        saveState();
        goToStep(s);
      }
    });
  });

  const photo = $('#f-photo');
  if (photo) {
    photo.addEventListener('change', function () {
      const file = photo.files && photo.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        setStatus('Photo must be under 5 MB.', true);
        photo.value = '';
        return;
      }
      setStatus('Processing photo\u2026');
      compressImage(file, 720, 0.72)
        .then(function (dataUrl) {
          state.photoData = dataUrl;
          saveState();
          showPhotoThumb(dataUrl);
          setStatus('Photo saved \u2014 open Preview to see it on the template.');
        })
        .catch(function (err) {
          console.error(err);
          setStatus('Photo failed: ' + (err && err.message ? err.message : 'error'), true);
        });
    });
  }

  if (state.photoData) showPhotoThumb(state.photoData);

  renderSkills();
  renderEducation();
  renderExperience();
  renderProjects();
  renderCerts();
  saveState();
  goToStep(currentStep);
})();
