(function () {
  'use strict';
  const templates = window.PB_TEMPLATES || [];
  const gallery = document.getElementById('pb-gallery');
  const empty = document.getElementById('pb-empty');
  const countEl = document.getElementById('pb-count');
  const search = document.getElementById('pb-search');
  let activeCat = 'all';
  let query = '';

  function matches(t) {
    if (activeCat !== 'all' && t.category !== activeCat) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.tagline.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.features || []).some(function (f) {
        return f.toLowerCase().includes(q);
      })
    );
  }

  function card(t) {
    const el = document.createElement('article');
    el.className = 'pb-card glass';
    el.setAttribute('role', 'listitem');
    el.dataset.id = t.id;

    const thumb = document.createElement('div');
    thumb.className = 'pb-card-thumb';
    if (t.preview) {
      const img = document.createElement('img');
      img.alt = t.name + ' preview';
      img.loading = 'lazy';
      img.width = 640;
      img.height = 400;
      img.src = t.preview;
      img.addEventListener('error', function () {
        img.remove();
        const fb = document.createElement('div');
        fb.className = 'pb-thumb-fallback';
        const s = document.createElement('span');
        s.textContent = t.name;
        fb.appendChild(s);
        thumb.appendChild(fb);
      });
      thumb.appendChild(img);
    } else {
      const fb = document.createElement('div');
      fb.className = 'pb-thumb-fallback';
      const s = document.createElement('span');
      s.textContent = t.name;
      fb.appendChild(s);
      thumb.appendChild(fb);
    }

    const body = document.createElement('div');
    body.className = 'pb-card-body';

    const h3 = document.createElement('h3');
    h3.textContent = t.name;

    const p = document.createElement('p');
    p.textContent = t.tagline;

    const tags = document.createElement('div');
    tags.className = 'pb-tags';
    (t.features || []).slice(0, 4).forEach(function (f) {
      const span = document.createElement('span');
      span.className = 'pb-tag';
      span.textContent = f;
      tags.appendChild(span);
    });

    const actions = document.createElement('div');
    actions.className = 'pb-card-actions';

    const view = document.createElement('a');
    view.className = 'btn o';
    view.textContent = 'View Template';
    view.href = '/portfolio-builder/templates/modern-dark-3d/';
    view.target = '_blank';
    view.rel = 'noopener noreferrer';

    const customize = document.createElement('a');
    customize.className = 'btn p';
    customize.textContent = 'Customize';
    customize.href = '/portfolio-builder/editor/?template=' + encodeURIComponent(t.id);

    actions.appendChild(view);
    actions.appendChild(customize);

    body.appendChild(h3);
    body.appendChild(p);
    body.appendChild(tags);
    body.appendChild(actions);

    el.appendChild(thumb);
    el.appendChild(body);
    return el;
  }

  function render() {
    if (!gallery) return;
    gallery.textContent = '';
    const list = templates.filter(matches);
    if (countEl) {
      countEl.textContent =
        list.length === 0
          ? 'No templates found'
          : list.length + ' template' + (list.length === 1 ? '' : 's');
    }
    if (empty) empty.hidden = list.length > 0;
    list.forEach(function (t) {
      gallery.appendChild(card(t));
    });
  }

  document.querySelectorAll('.pb-filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.pb-filter').forEach(function (b) {
        b.classList.remove('is-active');
      });
      btn.classList.add('is-active');
      activeCat = btn.dataset.cat || 'all';
      render();
    });
  });

  if (search) {
    search.addEventListener('input', function () {
      query = search.value.trim();
      render();
    });
  }

  render();
})();
