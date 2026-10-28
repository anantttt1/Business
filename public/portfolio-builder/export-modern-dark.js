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

    return {
      name: name,
      initials: initials(name),
      role: state.title || 'Your Role',
      intro: state.tagline || (state.about || '').slice(0, 220) || 'Write a short introduction here.',
      location: state.location || '',
      focus: skills.slice(0, 2).join(' · ') || 'Focus',
      status: 'Open to opportunities',
      resumeUrl: state.resumeUrl || '',
      aboutParagraph1: state.about || '',
      focusAreas: skills.slice(0, 4),
      contactEmail: state.email || '',
      contactLocation: state.location || '',
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
      certificates: certificates,
      hasPhoto: !!(state.photoData && /^data:image\//.test(state.photoData))
    };
  }

  function buildStandaloneHtml(cfg) {
    var skillsHtml = (cfg.skills || []).map(function (sk) {
      var tags = (sk.tags || []).map(function (t) {
        return '<span class="tag">' + escapeHtml(t) + '</span>';
      }).join('');
      return '<div class="card"><h3>' + escapeHtml(sk.title || '') + '</h3><p>' +
        escapeHtml(sk.desc || '') + '</p><div class="tags">' + tags + '</div></div>';
    }).join('');

    var projHtml = (cfg.projects || []).map(function (pr) {
      var tags = (pr.tech || []).map(function (t) {
        return '<span class="tag">' + escapeHtml(t) + '</span>';
      }).join('');
      var links = '';
      if (pr.liveUrl) links += '<a href="' + escapeHtml(pr.liveUrl) + '" target="_blank" rel="noopener">Live</a> ';
      if (pr.githubUrl) links += '<a href="' + escapeHtml(pr.githubUrl) + '" target="_blank" rel="noopener">GitHub</a>';
      return '<div class="card"><h3>' + escapeHtml(pr.name || 'Project') + '</h3><p>' +
        escapeHtml(pr.description || '') + '</p><div class="tags">' + tags + '</div>' +
        (links ? '<p class="links">' + links + '</p>' : '') + '</div>';
    }).join('');

    var eduHtml = (cfg.education || []).map(function (ed) {
      return '<div class="item"><div class="m">' + escapeHtml(ed.when || '') +
        '</div><strong>' + escapeHtml(ed.title || '') + '</strong><div class="m">' +
        escapeHtml(ed.place || '') + '</div><p>' + escapeHtml(ed.detail || '') + '</p></div>';
    }).join('');

    var certHtml = (cfg.certificates || []).map(function (c) {
      return '<div class="card"><h3>' + escapeHtml(c.name || '') + '</h3><p>' +
        escapeHtml(c.org || '') + '</p><div class="m">' + escapeHtml(c.date || '') + '</div></div>';
    }).join('');

    var socialHtml = '';
    Object.keys(cfg.social || {}).forEach(function (k) {
      if (!cfg.social[k]) return;
      socialHtml += '<a href="' + escapeHtml(cfg.social[k]) + '" target="_blank" rel="noopener">' +
        escapeHtml(k) + '</a> ';
    });

    var photoHtml = cfg.hasPhoto
      ? '<img class="photo" src="assets/profile.jpg" alt="' + escapeHtml(cfg.name) + '">' 
      : '<div class="photo ph">' + escapeHtml(cfg.initials) + '</div>';

    var resumeBtn = cfg.resumeUrl
      ? '<a class="btn" href="' + escapeHtml(cfg.resumeUrl) + '" target="_blank" rel="noopener">Resume</a> '
      : '';

    var emailHtml = cfg.contactEmail
      ? '<p><a href="mailto:' + escapeHtml(cfg.contactEmail) + '">' + escapeHtml(cfg.contactEmail) + '</a></p>'
      : '';

    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
      '<meta name="theme-color" content="#080a10">\n' +
      '<title>' + escapeHtml(cfg.name) + ' — Portfolio</title>\n<style>\n' +
      ':root{--bg:#080a10;--panel:rgba(17,21,33,.92);--text:#f4f6ff;--muted:#a3abc0;--line:#27334b;--accent:#7190ff;--accent2:#a66cff}' +
      '*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 80% 0%,rgba(86,67,165,.14),transparent 40%),var(--bg);color:var(--text);font:15px/1.55 system-ui,sans-serif}' +
      'a{color:var(--accent)}.wrap{max-width:980px;margin:0 auto;padding:0 20px}' +
      'header{position:sticky;top:0;z-index:10;background:rgba(8,10,16,.92);border-bottom:1px solid var(--line)}' +
      '.nav{display:flex;justify-content:space-between;align-items:center;height:56px;gap:12px}' +
      '.brand{font-weight:700}.brand span{color:var(--accent)}.nav a{color:var(--muted);margin-left:12px;font-size:.9rem;text-decoration:none}' +
      '.hero{padding:56px 0 36px;display:grid;grid-template-columns:1.2fr .8fr;gap:28px;align-items:center}' +
      'h1{font:700 clamp(2rem,5vw,2.8rem)/1.15 system-ui;margin:0 0 8px}' +
      '.role{color:var(--accent);font-weight:600;margin:0 0 10px}.intro{color:var(--muted);max-width:52ch}' +
      '.meta{display:flex;flex-wrap:wrap;gap:14px;color:var(--muted);font-size:.9rem;margin-top:14px}' +
      '.btn{display:inline-flex;padding:10px 16px;border-radius:10px;font-weight:600;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#0b0f1a;text-decoration:none;margin-right:8px;margin-top:14px}' +
      '.photo{width:100%;max-width:280px;aspect-ratio:1;border-radius:22px;object-fit:cover;border:1px solid var(--line);display:block;margin:0 auto}' +
      '.photo.ph{display:grid;place-items:center;background:rgba(113,144,255,.12);font:700 2.4rem system-ui;color:var(--accent)}' +
      'section{padding:36px 0;border-top:1px solid var(--line)}h2{font-size:1.35rem;margin:0 0 14px}' +
      '.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}' +
      '.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px}' +
      '.card h3{margin:0 0 6px;font-size:1rem}.card p{margin:0;color:var(--muted);font-size:.9rem}' +
      '.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.tag{font-size:.72rem;padding:3px 8px;border-radius:8px;border:1px solid var(--line);color:#cad1e6}' +
      '.item{padding:10px 0;border-bottom:1px solid var(--line)}.item .m{color:var(--muted);font-size:.85rem;margin:4px 0}.item p{color:var(--muted);margin:0}' +
      'footer{padding:24px 0;border-top:1px solid var(--line);color:var(--muted);font-size:.88rem}.links a{margin-right:10px}' +
      '@media(max-width:760px){.hero{grid-template-columns:1fr}.nav a{display:none}}' +
      '</style>\n</head>\n<body>\n<header><div class="wrap nav"><div class="brand"><span>' +
      escapeHtml(cfg.initials) + '</span> Portfolio</div><nav><a href="#about">About</a><a href="#skills">Skills</a><a href="#projects">Projects</a><a href="#contact">Contact</a></nav></div></header>\n' +
      '<main>\n<section class="hero"><div class="wrap" style="display:contents">' +
      '<div><h1>' + escapeHtml(cfg.name) + '</h1><p class="role">' + escapeHtml(cfg.role) +
      '</p><p class="intro">' + escapeHtml(cfg.intro) + '</p><div class="meta"><span>' +
      escapeHtml(cfg.location) + '</span><span>' + escapeHtml(cfg.focus) + '</span><span>' +
      escapeHtml(cfg.status) + '</span></div>' + resumeBtn +
      '<a class="btn" href="#contact" style="background:transparent;color:var(--text);border:1px solid var(--line)">Contact</a></div>' +
      '<div>' + photoHtml + '</div></div></section>\n' +
      '<section id="about"><div class="wrap"><h2>About</h2><p style="color:var(--muted)">' +
      escapeHtml(cfg.aboutParagraph1) + '</p></div></section>\n' +
      '<section id="skills"><div class="wrap"><h2>Skills</h2><div class="grid">' + skillsHtml + '</div></div></section>\n' +
      '<section id="education"><div class="wrap"><h2>Education & Experience</h2>' + eduHtml + '</div></section>\n' +
      '<section id="projects"><div class="wrap"><h2>Projects</h2><div class="grid">' + projHtml + '</div></div></section>\n' +
      (certHtml ? '<section id="certs"><div class="wrap"><h2>Certificates</h2><div class="grid">' + certHtml + '</div></div></section>\n' : '') +
      '<section id="contact"><div class="wrap"><h2>Contact</h2>' + emailHtml +
      '<p style="color:var(--muted)">' + escapeHtml(cfg.contactLocation || cfg.location) +
      '</p><p class="links">' + socialHtml + '</p></div></section>\n</main>\n' +
      '<footer><div class="wrap">© ' + new Date().getFullYear() + ' ' + escapeHtml(cfg.name) +
      '. Built with AP Creative Studio Portfolio Builder.</div></footer>\n</body>\n</html>';
  }

  function readmeFor(state) {
    return '# ' + (state.fullName || 'My') + ' Portfolio\n\n' +
      'Generated with **AP Creative Studio Portfolio Builder**.\n\n' +
      '## Open\n1. Extract this ZIP\n2. Open `my-portfolio/index.html` in Chrome or Edge\n\n' +
      '## Deploy\nUpload the `my-portfolio` folder to Vercel, Netlify, or GitHub Pages.\n';
  }

  async function makeZip(files) {
    if (typeof window.PB_simpleZip === 'function') return window.PB_simpleZip(files);
    if (typeof JSZip !== 'undefined') {
      var zip = new JSZip();
      files.forEach(function (f) { zip.file(f.name, f.data); });
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
    // Restore photo from dedicated storage if missing on state
    if (!state.photoData) {
      try {
        state.photoData = localStorage.getItem('ap-pb-photo') || sessionStorage.getItem('ap-pb-photo') || '';
      } catch (e) {}
    }

    var cfg = buildConfig(state);
    var html = buildStandaloneHtml(cfg);

    var files = [
      { name: 'my-portfolio/index.html', data: html },
      { name: 'my-portfolio/README.md', data: readmeFor(state) }
    ];

    if (state.photoData && /^data:image\//.test(state.photoData)) {
      files.push({ name: 'my-portfolio/assets/profile.jpg', data: dataUrlToBytes(state.photoData) });
    }

    return makeZip(files);
  };

  window.PB_WHATSAPP_NUMBER = '919286034026';
})();
