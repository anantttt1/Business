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

  /** Snapshot of form state that templates can read without localStorage (file:// ZIP). */
  function buildExportPayload(state) {
    var payload = {
      fullName: state.fullName || '',
      title: state.title || '',
      tagline: state.tagline || '',
      about: state.about || '',
      location: state.location || '',
      email: state.email || '',
      phone: state.phone || '',
      resumeUrl: state.resumeUrl || '',
      github: state.github || '',
      linkedin: state.linkedin || '',
      website: state.website || '',
      leetcode: state.leetcode || '',
      leetcodeUsername: state.leetcodeUsername || '',
      hackerrank: state.hackerrank || '',
      skills: state.skills || [],
      education: state.education || [],
      experience: state.experience || [],
      projects: state.projects || [],
      certifications: state.certifications || [],
      accent: state.accent || '',
      themeMode: state.themeMode || '',
      templateId: state.templateId || '',
      photoData: state.photoData || ''
    };
    // Prefer explicit leetcode username field; fall back to URL-ish value
    if (!payload.leetcodeUsername && payload.leetcode) {
      payload.leetcodeUsername = String(payload.leetcode)
        .replace(/^@/, '')
        .replace(/.*leetcode\.com\/(u\/)?/i, '')
        .replace(/\/$/, '');
    }
    return payload;
  }

  function injectExportData(jsSource, state) {
    var payload = buildExportPayload(state);
    var json;
    try {
      json = JSON.stringify(payload);
    } catch (e) {
      // photoData can be huge; if stringify fails, drop photo from payload
      var copy = Object.assign({}, payload);
      delete copy.photoData;
      json = JSON.stringify(copy);
    }
    var bootstrap =
      '/* AP Creative Studio — embedded portfolio data from builder */\n' +
      'window.__PB_EXPORT_DATA__ = ' + json + ';\n' +
      '(function(){try{if(window.__PB_EXPORT_DATA__){localStorage.setItem("ap-pb-v1",JSON.stringify(window.__PB_EXPORT_DATA__));' +
      'if(window.__PB_EXPORT_DATA__.photoData){localStorage.setItem("ap-pb-photo",window.__PB_EXPORT_DATA__.photoData);sessionStorage.setItem("ap-pb-photo",window.__PB_EXPORT_DATA__.photoData);}}}' +
      'catch(e){}})();\n';
    return bootstrap + jsSource;
  }

  function prepareHtml(html, cfg) {
    html = html.replace(/href="\/portfolio-builder\/templates\/[^"]+\/(template[^\"]*\.css)"/g, 'href="$1"');
    html = html.replace(/src="\/portfolio-builder\/templates\/[^"]+\/template\.js"/g, 'src="template.js"');
    html = html.replace(/href="heatmap\.css"/g, 'href="heatmap.css"');
    html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + escapeHtml(cfg.name) + ' — Portfolio</title>');
    return html;
  }

  function readmeFor(state) {
    return (
      '# ' + (state.fullName || 'My') + ' Portfolio\n\n' +
      'Generated with AP Creative Studio Portfolio Builder.\n\n' +
      'Your details are already filled in. Open `index.html` in a browser to view.\n'
    );
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

  var SUPPORTED = ['modern-dark-3d', 'signature-orange', 'ember-editorial', 'paper-atelier', 'ideas-impact', 'color-pop'];
  var EXTRA_CSS = {
    'ideas-impact': ['template-b.css', 'template-c.css', 'template-d.css']
  };

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
        js = await fetchText(base + 'template.js');
        if (tid === 'signature-orange') {
          try { heatCss = await fetchText(base + 'heatmap.css'); } catch (e) {}
        }
      } catch (fetchErr) {
        throw new Error('Template load failed: ' + (fetchErr && fetchErr.message ? fetchErr.message : String(fetchErr)));
      }

      html = prepareHtml(html, cfg);
      // Embed user form data so the ZIP works offline / on any device without builder localStorage
      js = injectExportData(js, state);

      var files = [
        { name: 'my-portfolio/index.html', data: html },
        { name: 'my-portfolio/template.css', data: css },
        { name: 'my-portfolio/template.js', data: js },
        { name: 'my-portfolio/README.md', data: readmeFor(state) }
      ];
      if (heatCss) files.push({ name: 'my-portfolio/heatmap.css', data: heatCss });

      var extras = EXTRA_CSS[tid] || [];
      for (var i = 0; i < extras.length; i++) {
        try {
          var extra = await fetchText(base + extras[i]);
          files.push({ name: 'my-portfolio/' + extras[i], data: extra });
        } catch (e) {}
      }

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
