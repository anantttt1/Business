(function () {
  'use strict';

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'YN';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  async function fetchText(url) {
    var res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load ' + url + ' (' + res.status + ')');
    return res.text();
  }

  function buildConfig(state) {
    var name = state.fullName || 'Your Name';
    var skills = state.skills || [];
    return {
      name: name,
      initials: initials(name),
      role: state.title || 'Developer',
      intro: state.tagline || (state.about || '').slice(0, 220),
      location: state.location || '',
      resumeUrl: state.resumeUrl || '',
      photoData: state.photoData || '',
      contactEmail: state.email || '',
      contactLocation: state.location || '',
      social: { github: state.github || '', linkedin: state.linkedin || '', leetcode: state.leetcode || '' },
      skills: skills,
      projects: state.projects || [],
      education: state.education || [],
      certificates: state.certifications || []
    };
  }

  function prepareHtml(html, cfg) {
    html = html.replace(/href="\/portfolio-builder\/templates\/[^"]+\/template\.css"/g, 'href="template.css"');
    html = html.replace(/src="\/portfolio-builder\/templates\/[^"]+\/template\.js"/g, 'src="template.js"');
    html = html.replace(/href="heatmap\.css"/g, 'href="heatmap.css"');
    html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + escapeHtml(cfg.name) + ' — Portfolio</title>');
    return html;
  }

  function readmeFor(state) {
    return '# ' + (state.fullName || 'My') + ' Portfolio\n\nGenerated with AP Creative Studio Portfolio Builder.\n';
  }

  async function makeZip(files) {
    if (typeof window.PB_simpleZip === 'function') return window.PB_simpleZip(files);
    if (typeof JSZip !== 'undefined') {
      var zip = new JSZip();
      files.forEach(function (f) { zip.file(f.name, f.data); });
      return zip.generateAsync({ type: 'blob' });
    }
    throw new Error('ZIP library failed to load — hard refresh the page');
  }

  var SUPPORTED = ['modern-dark-3d', 'signature-orange', 'ember-editorial', 'paper-atelier'];
  var OWN_JS = ['signature-orange', 'ember-editorial', 'paper-atelier'];

  window.PB_exportModernDark = async function (state) {
    try {
      if (!state.photoData) {
        try {
          state.photoData = localStorage.getItem('ap-pb-photo') || sessionStorage.getItem('ap-pb-photo') || '';
        } catch (e) {}
      }
      var cfg = buildConfig(state);
      var tid = state.templateId || 'modern-dark-3d';
      if (SUPPORTED.indexOf(tid) < 0) tid = 'modern-dark-3d';
      var base = '/portfolio-builder/templates/' + tid + '/';

      var html, css, js, heatCss = '';
      try {
        html = await fetchText(base + 'index.html');
        css = await fetchText(base + 'template.css');
        js = await fetchText((OWN_JS.indexOf(tid) >= 0 ? base : base) + 'template.js');
        if (tid === 'signature-orange') {
          try { heatCss = await fetchText(base + 'heatmap.css'); } catch (e) {}
        }
      } catch (fetchErr) {
        throw new Error('Template load failed: ' + (fetchErr && fetchErr.message ? fetchErr.message : String(fetchErr)));
      }

      html = prepareHtml(html, cfg);

      var files = [
        { name: 'my-portfolio/index.html', data: html },
        { name: 'my-portfolio/template.css', data: css },
        { name: 'my-portfolio/template.js', data: js },
        { name: 'my-portfolio/README.md', data: readmeFor(state) }
      ];
      if (heatCss) files.push({ name: 'my-portfolio/heatmap.css', data: heatCss });

      if (state.photoData && String(state.photoData).indexOf('data:image') === 0) {
        files.push({ name: 'my-portfolio/assets/profile.jpg', data: state.photoData });
      }

      var blob = await makeZip(files);
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (state.fullName || 'portfolio').replace(/\s+/g, '-').toLowerCase() + '-portfolio.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
})();
