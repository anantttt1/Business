(function () {
  'use strict';

  const STORAGE_KEY = 'ap-pb-v1';
  const PHOTO_KEY = 'ap-pb-photo';
  const params = new URLSearchParams(location.search);
  const templateId = params.get('template') || 'modern-dark-3d';
  const templates = window.PB_TEMPLATES || [];
  const tplMeta = templates.find((t) => t.id === templateId) || templates[0] || {
    id: 'modern-dark-3d',
    name: 'Modern Dark 3D',
    accent: '#7190ff'
  };

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
      // Restore photo from dedicated key if missing in state
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

  function saveState() {
    try {
      const copy = Object.assign({}, state);
      // Keep photo out of main JSON blob to avoid quota blow-ups when possible
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
          // Further shrink if still huge
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
        })
      );
    });
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

  function openPreview() {
    // Ensure photo is available to the template tab
    if (state.photoData) {
      try {
        sessionStorage.setItem(PHOTO_KEY, state.photoData);
        localStorage.setItem(PHOTO_KEY, state.photoData);
      } catch (e) {}
    }
    saveState();
    setStatus('Opening full template preview…');
    const url =
      '/portfolio-builder/templates/modern-dark-3d/?preview=1&from=builder&t=' +
      Date.now();
    window.open(url, '_blank');
  }

  async function downloadZip() {
    if (!validate()) return;
    const btn = $('#btn-download');
    if (btn) btn.disabled = true;
    setStatus('Generating ZIP…');
    try {
      if (typeof window.PB_exportModernDark !== 'function') throw new Error('Exporter missing');
      if (typeof window.PB_simpleZip !== 'function' && typeof JSZip === 'undefined') {
        throw new Error('ZIP library failed to load');
      }
      // Attach photo for export
      if (!state.photoData) {
        try {
          state.photoData = localStorage.getItem(PHOTO_KEY) || sessionStorage.getItem(PHOTO_KEY) || '';
        } catch (e) {}
      }
      const blob = await window.PB_exportModernDark(state);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName =
        (state.fullName || 'my-portfolio')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'my-portfolio';
      a.href = url;
      a.download = safeName + '-portfolio.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      setStatus('Download started — extract the ZIP and open index.html.');
    } catch (e) {
      console.error(e);
      setStatus('Export failed: ' + (e && e.message ? e.message : 'unknown error'), true);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  const titleEl = $('#pb-editor-title');
  if (titleEl) titleEl.textContent = 'Customize · ' + (tplMeta.name || 'Template');

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
      } catch (e) {}
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
      if (file.size > 5 * 1024 * 1024) {
        setStatus('Photo must be under 5 MB.', true);
        photo.value = '';
        return;
      }
      setStatus('Processing photo…');
      compressImage(file, 720, 0.72)
        .then(function (dataUrl) {
          state.photoData = dataUrl;
          saveState();
          showPhotoThumb(dataUrl);
          setStatus('Photo saved — open Preview to see it on the template.');
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
})();
