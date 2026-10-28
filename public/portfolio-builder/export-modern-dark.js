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

  function buildStandaloneHtml(cfg) {
    const skillsHtml = (cfg.skills || []).map(function (sk) {
      return '<div class="card"><h3>' + escapeHtml(sk) + '</h3></div>';
    }).join('');

    const expHtml = (cfg.experience || []).map(function (ex) {
      return '<div class="item"><strong>' + escapeHtml((ex.role || '') + (ex.company ? ' \u00b7 ' + ex.company : '')) +
        '</strong><div class="m">' + escapeHtml([ex.start, ex.end].filter(Boolean).join(' \u2013 ')) +
        '</div><p>' + escapeHtml(ex.description || '') + '</p></div>';
    }).join('');

    const eduHtml = (cfg.education || []).map(function (ed) {
      return '<div class="item"><strong>' + escapeHtml((ed.degree || '') + (ed.field ? ' in ' + ed.field : '')) +
        '</strong><div class="m">' + escapeHtml((ed.institution || '') + ' \u00b7 ' + [ed.start, ed.end].filter(Boolean).join(' \u2013 ')) +
        '</div></div>';
    }).join('');

    const projHtml = (cfg.projects || []).map(function (pr) {
      const tags = (pr.tech || '').split(/[,|]/).map(function (t) {
        t = t.trim();
        return t ? '<span class="tag">' + escapeHtml(t) + '</span>' : '';
      }).join('');
      var links = '';
      if (pr.liveUrl) links += '<a href="' + escapeHtml(pr.liveUrl) + '" target="_blank" rel="noopener noreferrer">Live</a> ';
      if (pr.githubUrl) links += '<a href="' + escapeHtml(pr.githubUrl) + '" target="_blank" rel="noopener noreferrer">GitHub</a>';
      return '<div class="card"><h3>' + escapeHtml(pr.name || 'Project') + '</h3><p>' +
        escapeHtml(pr.description || '') + '</p><div class="tags">' + tags + '</div>' +
        (links ? '<p class="links">' + links + '</p>' : '') + '</div>';
    }).join('');

    var socialHtml = '';
    Object.keys(cfg.social || {}).forEach(function (k) {
      if (!cfg.social[k]) return;
      socialHtml += '<a href="' + escapeHtml(cfg.social[k]) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(k) + '</a> ';
    });

    var resumeBtn = cfg.resumeUrl
      ? '<a class="btn" href="' + escapeHtml(cfg.resumeUrl) + '" target="_blank" rel="noopener noreferrer">Resume</a> '
      : '';

    var emailHtml = cfg.contactEmail
      ? '<p><a href="mailto:' + escapeHtml(cfg.contactEmail) + '">' + escapeHtml(cfg.contactEmail) + '</a></p>'
      : '';

    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
      '<meta name="theme-color" content="#080a10">\n<title>' + escapeHtml(cfg.name) + ' \u2014 Portfolio</title>\n<style>\n' +
      ':root{--bg:#080a10;--panel:rgba(17,21,33,.9);--text:#f4f6ff;--muted:#a3abc0;--line:#27334b;--accent:#7190ff;--accent2:#a66cff}' +
      '*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 80% 0%,rgba(86,67,165,.12),transparent 33%),var(--bg);color:var(--text);font:15px/1.55 system-ui,sans-serif}' +
      'a{color:var(--accent)}.wrap{max-width:980px;margin:0 auto;padding:0 20px}' +
      'header{position:sticky;top:0;background:rgba(8,10,16,.9);border-bottom:1px solid var(--line)}' +
      '.nav{display:flex;justify-content:space-between;align-items:center;height:56px}.brand{font-weight:700}.brand span{color:var(--accent)}' +
      '.nav a{color:var(--muted);margin-left:14px;font-size:.9rem;text-decoration:none}' +
      '.hero{padding:64px 0 40px}h1{font:700 clamp(2rem,5vw,2.8rem)/1.15 system-ui;margin:0 0 8px}' +
      '.role{color:var(--accent);font-weight:600;margin:0 0 10px}.intro{color:var(--muted);max-width:52ch}' +
      '.meta{display:flex;flex-wrap:wrap;gap:12px;color:var(--muted);font-size:.9rem;margin-top:14px}' +
      '.btn{display:inline-flex;padding:10px 16px;border-radius:10px;font-weight:600;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#0b0f1a;text-decoration:none;margin-right:8px;margin-top:16px}' +
      'section{padding:36px 0;border-top:1px solid var(--line)}h2{font-size:1.3rem;margin:0 0 14px}' +
      '.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}' +
      '.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px}.card h3{margin:0 0 6px;font-size:1rem}.card p{margin:0;color:var(--muted);font-size:.9rem}' +
      '.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.tag{font-size:.72rem;padding:3px 8px;border-radius:8px;border:1px solid var(--line);color:#cad1e6}' +
      '.item{padding:10px 0;border-bottom:1px solid var(--line)}.item .m{color:var(--muted);font-size:.85rem;margin:4px 0}.item p{color:var(--muted);margin:0}' +
      'footer{padding:24px 0;border-top:1px solid var(--line);color:var(--muted);font-size:.88rem}.links a{margin-right:10px}' +
      '</style>\n</head>\n<body>\n<header><div class="wrap nav"><div class="brand"><span>' + escapeHtml(cfg.initials) +
      '</span> Portfolio</div><nav><a href="#about">About</a><a href="#skills">Skills</a><a href="#projects">Projects</a><a href="#contact">Contact</a></nav></div></header>\n<main>\n' +
      '<section class="hero"><div class="wrap"><h1>' + escapeHtml(cfg.name) + '</h1><p class="role">' + escapeHtml(cfg.role) +
      '</p><p class="intro">' + escapeHtml(cfg.intro) + '</p><div class="meta"><span>' + escapeHtml(cfg.location) +
      '</span><span>' + escapeHtml(cfg.focus) + '</span><span>' + escapeHtml(cfg.status) + '</span></div>' +
      resumeBtn + '<a class="btn" href="#contact" style="background:transparent;color:var(--text);border:1px solid var(--line)">Contact</a></div></section>\n' +
      '<section id="about"><div class="wrap"><h2>About</h2><p style="color:var(--muted)">' + escapeHtml(cfg.aboutParagraph1) + '</p></div></section>\n' +
      '<section id="skills"><div class="wrap"><h2>Skills</h2><div class="grid">' + skillsHtml + '</div></div></section>\n' +
      '<section id="experience"><div class="wrap"><h2>Experience</h2>' + expHtml + '</div></section>\n' +
      '<section id="education"><div class="wrap"><h2>Education</h2>' + eduHtml + '</div></section>\n' +
      '<section id="projects"><div class="wrap"><h2>Projects</h2><div class="grid">' + projHtml + '</div></div></section>\n' +
      '<section id="contact"><div class="wrap"><h2>Contact</h2><p style="color:var(--muted)">' + escapeHtml(cfg.contactIntro) +
      '</p>' + emailHtml + '<p style="color:var(--muted)">' + escapeHtml(cfg.contactLocation || cfg.location) +
      '</p><p>' + socialHtml + '</p></div></section>\n</main>\n<footer><div class="wrap">\u00a9 ' +
      new Date().getFullYear() + ' ' + escapeHtml(cfg.name) + '. Built with AP Creative Studio Portfolio Builder.</div></footer>\n</body>\n</html>';
  }

  function readmeFor(state) {
    return '# ' + (state.fullName || 'My') + ' Portfolio\n\n' +
      'Generated with **AP Creative Studio Portfolio Builder**.\n\n' +
      '## View locally\n1. Extract this ZIP\n2. Open `index.html` in Chrome or Edge\n\n' +
      '## Deploy\nUpload to Vercel, Netlify, or GitHub Pages. No build step required.\n';
  }

  async function makeZip(files) {
    if (typeof window.PB_simpleZip === 'function') {
      return window.PB_simpleZip(files);
    }
    if (typeof JSZip !== 'undefined') {
      const zip = new JSZip();
      files.forEach(function (f) { zip.file(f.name, f.data); });
      return zip.generateAsync({ type: 'blob' });
    }
    throw new Error('ZIP library failed to load');
  }

  window.PB_exportModernDark = async function (state) {
    const cfg = buildConfig(state);
    const html = buildStandaloneHtml(cfg);

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
