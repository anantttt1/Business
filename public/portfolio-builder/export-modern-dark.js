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

  function buildExportPayload(state) {
    return {
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
  }

  function injectBootstrap(jsSource, payload) {
    var bootstrap =
      '(function(){try{window.__PB_EXPORT_DATA__=' +
      JSON.stringify(payload) +
      ';if(window.__PB_EXPORT_DATA__){localStorage.setItem("ap-pb-v1",JSON.stringify(window.__PB_EXPORT_DATA__));' +
      'if(window.__PB_EXPORT_DATA__.photoData){localStorage.setItem("ap-pb-photo",window.__PB_EXPORT_DATA__.photoData);sessionStorage.setItem("ap-pb-photo",window.__PB_EXPORT_DATA__.photoData);}}}' +
      'catch(e){}})();\n';
    return bootstrap + jsSource;
  }

  window.PB_exportModernDark = async function (state) {
    try {
      var tid = state.templateId || 'modern-dark-3d';
      var base = '/portfolio-builder/templates/' + tid + '/';
      var html, css, js, heatCss = '';
      try {
        html = await fetchText(base + 'index.html');
        css = await fetchText(base + 'template.css');
        js = await fetchText(base + 'template.js');
        try {
          heatCss = await fetchText(base + 'heatmap.css');
        } catch (e) {}
      } catch (fetchErr) {
        throw new Error(
          'Template load failed: ' +
            (fetchErr && fetchErr.message ? fetchErr.message : String(fetchErr))
        );
      }

      html = html.replace(
        /href=\"\/portfolio-builder\/templates\/[^\"]+\/(template[^\"]*\.css)\"/g,
        'href="$1"'
      );
      html = html.replace(
        /src=\"\/portfolio-builder\/templates\/[^\"]+\/template\.js\"/g,
        'src="template.js"'
      );

      var payload = buildExportPayload(state);
      var jsOut = injectBootstrap(js, payload);

      var files = [
        { name: 'my-portfolio/index.html', data: html },
        { name: 'my-portfolio/template.css', data: css },
        { name: 'my-portfolio/template.js', data: jsOut }
      ];
      if (heatCss) {
        files.push({ name: 'my-portfolio/heatmap.css', data: heatCss });
      }

      var extrasMap = {
        'ideas-impact': ['template-b.css', 'template-c.css', 'template-d.css']
      };
      var extras = extrasMap[tid] || [];
      for (var i = 0; i < extras.length; i++) {
        try {
          var extra = await fetchText(base + extras[i]);
          files.push({ name: 'my-portfolio/' + extras[i], data: extra });
        } catch (e) {}
      }

      var slug = String(state.fullName || 'portfolio')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'portfolio';
      var zipName = slug + '-portfolio.zip';

      if (typeof window.PB_simpleZip === 'function') {
        window.PB_simpleZip(files, zipName);
      } else if (typeof JSZip !== 'undefined') {
        var zip = new JSZip();
        files.forEach(function (f) {
          zip.file(f.name, f.data);
        });
        var blob = await zip.generateAsync({ type: 'blob' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = zipName;
        a.click();
        setTimeout(function () {
          URL.revokeObjectURL(a.href);
        }, 2000);
      } else {
        throw new Error('ZIP library failed to load');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
})();
