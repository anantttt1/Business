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
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildConfig(state) {
    const name = state.fullName || 'Your Name';
    return {
      name: name,
      initials: initials(name),
      role: state.title || 'Your Role',
      intro: state.tagline || (state.about || '').slice(0, 180) || 'Write a short introduction here.',
      location: state.location || '',
      focus: (state.skills || []).slice(0, 2).join(' · ') || 'Your Main Focus',
      status: 'Open to opportunities',
      resumeUrl: state.resumeUrl || '',
      aboutParagraph1: state.about || 'Write a few sentences about your background.',
      contactEmail: state.email || '',
      contactLocation: state.location || '',
      contactIntro: 'Have a project idea or want to connect?',
      social: {
        github: state.github || '',
        leetcode: state.leetcode || '',
        hackerrank: state.hackerrank || '',
        linkedin: state.linkedin || ''
      },
      skills: state.skills || [],
      experience: state.experience || [],
      education: state.education || [],
      projects: state.projects || []
    };
  }

  function configToJs(cfg) {
    return 'const CONFIG = ' + JSON.stringify(cfg, null, 2) + ';';
  }

  async function fetchTemplate() {
    const res = await fetch('/portfolio-builder/templates/modern-dark-3d/index.html', { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load template HTML (' + res.status + ')');
    return res.text();
  }

  function injectConfig(html, cfg) {
    return html.replace(/const CONFIG = \{[\s\S]*?\n\};/, configToJs(cfg));
  }

  function readmeFor(state) {
    return '# ' + (state.fullName || 'My') + ' Portfolio\n\n' +
      'Generated with **AP Creative Studio Portfolio Builder**.\n\n' +
      '## View locally\n1. Extract this ZIP\n2. Open `index.html` in Chrome or Edge\n\n' +
      '## Deploy\nUpload to Vercel, Netlify, or GitHub Pages. No build step required.\n';
  }

  window.PB_exportModernDark = async function (state) {
    let html = await fetchTemplate();
    const cfg = buildConfig(state);
    html = injectConfig(html, cfg);
    html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + escapeHtml(cfg.name) + ' — Portfolio</title>');

    const zip = new JSZip();
    const folder = zip.folder('my-portfolio');
    folder.file('index.html', html);
    folder.file('README.md', readmeFor(state));
    folder.folder('assets');

    if (state.photoData && /^data:image\//.test(state.photoData)) {
      const base64 = state.photoData.split(',')[1] || '';
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      folder.file('assets/profile.png', bytes);
    }

    return zip.generateAsync({ type: 'blob' });
  };
})();
