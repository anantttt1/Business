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

  function buildConfig(state) {
    var name = state.fullName || 'Your Name';
    var skills = state.skills || [];
    var skillGroups = [
      { title: 'Programming', desc: 'Languages and fundamentals.', tags: skills.slice(0, 3) },
      { title: 'Web Development', desc: 'Tools for building websites and apps.', tags: skills.slice(3, 6) },
      { title: 'Frameworks & Libraries', desc: 'Libraries and frameworks.', tags: skills.slice(6, 9) },
      { title: 'Developer Tools', desc: 'Day-to-day workflow.', tags: skills.slice(9) }
    ].filter(function (g) { return g.tags && g.tags.length; });

    var projects = (state.projects || []).map(function (pr) {
      return {
        name: pr.name || 'Project',
        description: pr.description || '',
        tech: typeof pr.tech === 'string'
          ? pr.tech.split(/[,|]/).map(function (t) { return t.trim(); }).filter(Boolean)
          : (pr.tech || []),
        category: pr.category || 'web',
        liveUrl: pr.liveUrl || '',
        githubUrl: pr.githubUrl || ''
      };
    });

    var education = (state.education || []).map(function (ed) {
      return {
        when: [ed.start, ed.end].filter(Boolean).join(' – '),
        title: ed.degree || ed.title || '',
        place: (ed.institution || '') + (ed.field ? ' · ' + ed.field : ''),
        detail: ed.description || ''
      };
    }).concat((state.experience || []).map(function (ex) {
      return {
        when: [ex.start, ex.end].filter(Boolean).join(' – '),
        title: (ex.role || '') + (ex.company ? ' · ' + ex.company : ''),
        place: ex.company || '',
        detail: ex.description || ''
      };
    }));

    var certificates = (state.certifications || []).map(function (c) {
      return { name: c.name || '', org: c.org || '', date: c.year || '', url: c.url || '' };
    });

    var hasPhoto = !!(state.photoData && /^data:image\//.test(state.photoData));

    return {
      name: name,
      initials: initials(name),
      role: state.title || 'Your Role · Your Speciality',
      intro: state.tagline || (state.about || '').slice(0, 220) || 'Write a short introduction here.',
      location: state.location || 'Your Location',
      focus: skills.slice(0, 2).join(' · ') || 'Your Main Focus',
      status: 'Open to opportunities',
      resumeUrl: state.resumeUrl || '',
      photoData: hasPhoto ? 'assets/profile.jpg' : '',
      aboutHeadline: 'Curiosity turns ideas into things people can use.',
      aboutQuote: (state.about || '').slice(0, 160) || 'Add a short personal statement.',
      aboutTitle: 'A little more about me.',
      aboutParagraph1: state.about || 'Write two or three sentences about your background.',
      aboutParagraph2: '',
      focusAreas: skills.slice(0, 4).length ? skills.slice(0, 4) : ['Focus one', 'Focus two', 'Focus three', 'Focus four'],
      contactEmail: state.email || '',
      contactLocation: state.location || 'Your city, country',
      contactIntro: 'Have a project idea or want to connect?',
      social: {
        github: state.github || '',
        leetcode: state.leetcode || '',
        hackerrank: state.hackerrank || '',
        linkedin: state.linkedin || ''
      },
      skills: skillGroups.length
        ? skillGroups
        : skills.map(function (s) {
            return { title: s, desc: '', tags: [s] };
          }),
      projects: projects,
      education: education,
      certificates: certificates
    };
  }

  async function fetchText(url) {
    var res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load ' + url + ' (' + res.status + ')');
    return res.text();
  }

  function prepareHtml(html, cfg) {
    // Relative asset paths for offline ZIP
    html = html.replace(
      /href="\/portfolio-builder\/templates\/modern-dark-3d\/template\.css"/g,
      'href="template.css"'
    );
    html = html.replace(
      /src="\/portfolio-builder\/templates\/modern-dark-3d\/template\.js"/g,
      'src="template.js"'
    );
    html = html.replace(
      /<title>[\s\S]*?<\/title>/,
      '<title>' + escapeHtml(cfg.name) + ' — Developer Portfolio</title>'
    );
    return html;
  }

  function prepareJs(js, cfg) {
    var configLiteral = 'var CONFIG = ' + JSON.stringify(cfg, null, 2) + ';';

    // Replace default CONFIG block if present
    if (/var CONFIG\s*=\s*\{/.test(js)) {
      js = js.replace(/var CONFIG\s*=\s*\{[\s\S]*?\n\s*\};/, configLiteral);
    } else if (/const CONFIG\s*=\s*\{/.test(js)) {
      js = js.replace(/const CONFIG\s*=\s*\{[\s\S]*?\n\s*\};/, configLiteral);
    } else {
      js = configLiteral + '\n' + js;
    }

    // Exported site must NOT read builder localStorage — use baked CONFIG only
    js = js.replace(
      /function mergeBuilderState\s*\([\s\S]*?\n\s*\}\n/,
      'function mergeBuilderState() { return true; }\n'
    );

    // Allow assets/profile.jpg as photo source (not only data:image)
    js = js.replace(
      /if \(src && String\(src\)\.indexOf\('data:image'\) === 0\)/g,
      "if (src && (String(src).indexOf('data:image') === 0 || String(src).indexOf('assets/') === 0))"
    );

    // Strip preview banner logic noise (harmless if left, but cleaner)
    js = js.replace(
      /function showPreviewBanner\s*\([\s\S]*?\n\s*\}\n/,
      'function showPreviewBanner() {}\n'
    );

    return js;
  }

  function readmeFor(state) {
    return (
      '# ' +
      (state.fullName || 'My') +
      ' Portfolio\n\n' +
      'Generated with **AP Creative Studio Portfolio Builder**.\n\n' +
      'Template: **Modern Dark 3D** (full design + animations)\n\n' +
      '## Contents\n' +
      '- `index.html` — main page\n' +
      '- `template.css` — full design styles\n' +
      '- `template.js` — sections, interactions, animations\n' +
      '- `assets/profile.jpg` — profile photo (if uploaded)\n' +
      '- `README.md` — this file\n\n' +
      '## Open locally\n' +
      '1. Extract this ZIP\n' +
      '2. Open `my-portfolio/index.html` in Chrome or Edge\n\n' +
      '## Deploy\n' +
      'Upload the entire `my-portfolio` folder to Vercel, Netlify, or GitHub Pages.\n'
    );
  }

  async function makeZip(files) {
    if (typeof window.PB_simpleZip === 'function') return window.PB_simpleZip(files);
    if (typeof JSZip !== 'undefined') {
      var zip = new JSZip();
      files.forEach(function (f) {
        zip.file(f.name, f.data);
      });
      return zip.generateAsync({ type: 'blob' });
    }
    throw new Error('ZIP library failed to load');
  }

  function dataUrlToBytes(dataUrl) {
    var base64 = dataUrl.split(',')[1] || '';
    var bin = atob(base64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  window.PB_exportModernDark = async function (state) {
    if (!state.photoData) {
      try {
        state.photoData =
          localStorage.getItem('ap-pb-photo') || sessionStorage.getItem('ap-pb-photo') || '';
      } catch (e) {}
    }

    var cfg = buildConfig(state);
    var base = '/portfolio-builder/templates/modern-dark-3d/';

    var html = await fetchText(base + 'index.html');
    var css = await fetchText(base + 'template.css');
    var js = await fetchText(base + 'template.js');

    html = prepareHtml(html, cfg);
    js = prepareJs(js, cfg);

    var files = [
      { name: 'my-portfolio/index.html', data: html },
      { name: 'my-portfolio/template.css', data: css },
      { name: 'my-portfolio/template.js', data: js },
      { name: 'my-portfolio/README.md', data: readmeFor(state) }
    ];

    if (state.photoData && /^data:image\//.test(state.photoData)) {
      files.push({
        name: 'my-portfolio/assets/profile.jpg',
        data: dataUrlToBytes(state.photoData)
      });
    }

    return makeZip(files);
  };
})();
