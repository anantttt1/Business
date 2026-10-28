(function () {
  'use strict';

  function initials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
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
    const name = state.fullName || 'Your Name';
    const skills = state.skills || [];
    const skillGroups = [
      { title: 'Programming', desc: 'Languages and fundamentals.', tags: skills.slice(0, 3) },
      { title: 'Web Development', desc: 'Tools for building websites and apps.', tags: skills.slice(3, 6) },
      { title: 'Frameworks & Libraries', desc: 'Libraries and frameworks.', tags: skills.slice(6, 9) },
      { title: 'Developer Tools', desc: 'Day-to-day workflow.', tags: skills.slice(9) }
    ].filter(function (g) { return g.tags && g.tags.length; });

    const projects = (state.projects || []).map(function (pr) {
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

    const education = (state.education || []).map(function (ed) {
      return {
        when: [ed.start, ed.end].filter(Boolean).join(' \u2013 '),
        title: ed.degree || ed.title || '',
        place: (ed.institution || '') + (ed.field ? ' \u00b7 ' + ed.field : ''),
        detail: ed.description || ''
      };
    }).concat((state.experience || []).map(function (ex) {
      return {
        when: [ex.start, ex.end].filter(Boolean).join(' \u2013 '),
        title: (ex.role || '') + (ex.company ? ' \u00b7 ' + ex.company : ''),
        place: ex.company || '',
        detail: ex.description || ''
      };
    }));

    const certificates = (state.certifications || []).map(function (c) {
      return { name: c.name || '', org: c.org || '', date: c.year || '', url: c.url || '' };
    });

    return {
      name: name,
      initials: initials(name),
      role: state.title || 'Your Role \u00b7 Your Speciality',
      intro: state.tagline || (state.about || '').slice(0, 220) || 'Write a short introduction here.',
      location: state.location || 'Your Location',
      focus: skills.slice(0, 2).join(' \u00b7 ') || 'Your Main Focus',
      status: 'Open to opportunities',
      resumeUrl: state.resumeUrl || '',
      aboutHeadline: 'Curiosity turns ideas into things people can use.',
      aboutQuote: (state.about || '').slice(0, 140) || 'Add a short personal statement.',
      aboutTitle: 'A little more about me.',
      aboutParagraph1: state.about || 'Write two or three sentences about your background.',
      aboutParagraph2: '',
      focusAreas: skills.slice(0, 4),
      contactEmail: state.email || '',
      contactLocation: state.location || '',
      contactIntro: 'Have a project idea or want to connect? Send a note.',
      social: {
        github: state.github || '',
        leetcode: state.leetcode || '',
        hackerrank: state.hackerrank || '',
        linkedin: state.linkedin || ''
      },
      skills: skillGroups.length ? skillGroups : skills.map(function (s) {
        return { title: s, desc: '', tags: [s] };
      }),
      projects: projects,
      education: education,
      certificates: certificates
    };
  }

  function configToJs(cfg) {
    return 'const CONFIG = ' + JSON.stringify(cfg, null, 2) + ';';
  }

  async function fetchText(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load ' + url + ' (' + res.status + ')');
    return res.text();
  }

  async function buildPortfolioHtml(state) {
    const cfg = buildConfig(state);
    let html = await fetchText('/portfolio-builder/templates/modern-dark-3d/index.html');
    let css = '', js = '';
    try { css = await fetchText('/portfolio-builder/templates/modern-dark-3d/template.css'); } catch (e) { console.warn(e); }
    try { js = await fetchText('/portfolio-builder/templates/modern-dark-3d/template.js'); } catch (e) { console.warn(e); }

    if (js) {
      js = js.replace(/const CONFIG\s*=\s*\{[\s\S]*?\n\s*\};/, configToJs(cfg));
      if (js.indexOf('const CONFIG') === -1) js = configToJs(cfg) + '\n' + js;
    }
    if (css) {
      html = html.replace(/<link[^>]*template\.css[^>]*>/, '<style>\n' + css + '\n</style>');
    }
    if (js) {
      html = html.replace(/<script[^>]*template\.js[^>]*><\/script>/, '<script>\n' + js + '\n</script>');
    }
    html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + escapeHtml(cfg.name) + ' \u2014 Portfolio</title>');
    return html;
  }

  function readmeFor(state) {
    return '# ' + (state.fullName || 'My') + ' Portfolio\n\n' +
      'Generated with **AP Creative Studio Portfolio Builder**.\n\n' +
      'Template: Modern Dark 3D\n\n' +
      '## View locally\n1. Extract this ZIP\n2. Open `index.html` in Chrome or Edge\n\n' +
      '## Deploy\nUpload to Vercel, Netlify, or GitHub Pages.\n';
  }

  async function makeZip(files) {
    if (typeof window.PB_simpleZip === 'function') return window.PB_simpleZip(files);
    if (typeof JSZip !== 'undefined') {
      const zip = new JSZip();
      files.forEach(function (f) { zip.file(f.name, f.data); });
      return zip.generateAsync({ type: 'blob' });
    }
    throw new Error('ZIP library failed to load');
  }

  window.PB_exportModernDark = async function (state) {
    const html = await buildPortfolioHtml(state);
    const files = [
      { name: 'my-portfolio/index.html', data: html },
      { name: 'my-portfolio/README.md', data: readmeFor(state) }
    ];
    if (state.photoData && /^data:image\//.test(state.photoData)) {
      const base64 = state.photoData.split(',')[1] || '';
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      files.push({ name: 'my-portfolio/assets/profile.png', data: bytes });
    }
    return makeZip(files);
  };
})();
