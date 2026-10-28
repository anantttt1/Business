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
    return {
      name: name,
      initials: initials(name),
      role: state.title || 'Your Role',
      intro: state.tagline || (state.about || '').slice(0, 180) || 'Write a short introduction here.',
      location: state.location || '',
      focus: (state.skills || []).slice(0, 2).join(' \u00b7 ') || 'Your Main Focus',
      status: 'Open to opportunities',
      resumeUrl: state.resumeUrl || '',
      aboutHeadline: 'Curiosity turns ideas into things people can use.',
      aboutQuote: (state.about || '').slice(0, 120) || 'Add a short personal statement.',
      aboutTitle: 'A little more about me.',
      aboutParagraph1: state.about || 'Write a few sentences about your background and the work you enjoy.',
      aboutParagraph2: '',
      focusAreas: (state.skills || []).slice(0, 4),
      contactEmail: state.email || '',
      contactLocation: state.location || '',
      contactIntro: 'Have a project idea or want to connect? Send a note.',
      social: {
        github: state.github || '',
        leetcode: state.leetcode || '',
        hackerrank: state.hackerrank || '',
        linkedin: state.linkedin || ''
      },
      leetcodeEndpoint: '',
      leetcodeUsername: ''
    };
  }

  function configToJs(cfg) {
    return 'const CONFIG = ' + JSON.stringify(cfg, null, 2) + ';';
  }

  function buildSkillsHtml(skills) {
    if (!skills || !skills.length) return '';
    return skills.map(function (sk) {
      return '<article class="panel skill-card"><div class="skill-icon">\u25c6</div><h3>' +
        escapeHtml(sk) + '</h3><p>Skill</p><div class="tags"><span class="tag">' +
        escapeHtml(sk) + '</span></div></article>';
    }).join('');
  }

  function buildProjectsHtml(projects) {
    if (!projects || !projects.length) return '';
    return projects.map(function (pr, i) {
      const covers = ['', ' cover-cyan', ' cover-pink', ' cover-gold'];
      const cover = covers[i % covers.length];
      const links = [];
      if (pr.liveUrl) links.push('<a href="' + escapeHtml(pr.liveUrl) + '" target="_blank" rel="noopener noreferrer">Live demo</a>');
      if (pr.githubUrl) links.push('<a href="' + escapeHtml(pr.githubUrl) + '" target="_blank" rel="noopener noreferrer">Source</a>');
      return '<article class="panel project-card" data-category="web">' +
        '<div class="project-cover' + cover + '"><div class="browser-frame"><div class="browser-bar"><i></i><i></i><i></i></div><div class="browser-content"><div class="mock-line"></div><div class="mock-line short"></div></div></div></div>' +
        '<div class="project-body"><h3>' + escapeHtml(pr.name || 'Project') + '</h3><p>' +
        escapeHtml(pr.description || '') + '</p><div class="tags">' +
        (pr.tech || '').split(/[,|]/).map(function (t) {
          t = t.trim();
          return t ? '<span class="tag">' + escapeHtml(t) + '</span>' : '';
        }).join('') +
        '</div><div class="project-links">' + links.join(' ') + '</div></div></article>';
    }).join('');
  }

  async function fetchTemplate() {
    const res = await fetch('/portfolio-builder/templates/modern-dark-3d/index.html', { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load template HTML (' + res.status + ')');
    return res.text();
  }

  function injectConfig(html, cfg) {
    const js = configToJs(cfg);
    return html.replace(/const CONFIG = \{[\s\S]*?\n  \};/, js);
  }

  function injectDynamicSections(html, state) {
    if ((state.skills || []).length) {
      html = html.replace(
        /<div class="skills-grid"[^>]*id="skillsGrid"[^>]*>[\s\S]*?<\/div>\s*(?=<\/div>\s*<\/section>)/,
        '<div class="skills-grid" id="skillsGrid">' + buildSkillsHtml(state.skills) + '</div>'
      );
    }
    if ((state.projects || []).length) {
      html = html.replace(
        /<div class="projects-grid"[^>]*id="projectsGrid"[^>]*>[\s\S]*?<\/div>\s*(?=<div class="section-cta"|<\/div>\s*<\/section>)/,
        '<div class="projects-grid" id="projectsGrid">' + buildProjectsHtml(state.projects) + '</div>'
      );
    }
    return html;
  }

  function readmeFor(state) {
    return '# ' + (state.fullName || 'My') + ' Portfolio\n\n' +
      'Generated with **AP Creative Studio Portfolio Builder**.\n\n' +
      '## View locally\n1. Extract this ZIP\n2. Open `index.html` in Chrome or Edge\n\n' +
      '## Deploy\nUpload the folder to Vercel, Netlify, or GitHub Pages. No build step required.\n\n' +
      'Template base: Modern Dark 3D Portfolio.\n';
  }

  window.PB_exportModernDark = async function (state) {
    let html = await fetchTemplate();
    const cfg = buildConfig(state);
    html = injectConfig(html, cfg);
    html = injectDynamicSections(html, state);
    html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + escapeHtml(cfg.name) + ' \u2014 Portfolio</title>');

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
