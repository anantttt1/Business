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
    ].filter(function (g) {
      return g.tags && g.tags.length;
    });

    var projects = (state.projects || []).map(function (pr) {
      return {
        name: pr.name || 'Project',
        description: pr.description || '',
        tech:
          typeof pr.tech === 'string'
            ? pr.tech
                .split(/[,|]/)
                .map(function (t) {
                  return t.trim();
                })
                .filter(Boolean)
            : pr.tech || [],
        category: pr.category || 'web',
        liveUrl: pr.liveUrl || '',
        githubUrl: pr.githubUrl || ''
      };
    });

    var education = (state.education || [])
      .map(function (ed) {
        return {
          when: [ed.start, ed.end].filter(Boolean).join(' – '),
          title: ed.degree || ed.title || '',
          place: (ed.institution || '') + (ed.field ? ' · ' + ed.field : ''),
          detail: ed.description || ''
        };
      })
      .concat(
        (state.experience || []).map(function (ex) {
          return {
            when: [ex.start, ex.end].filter(Boolean).join(' – '),
            title: (ex.role || '') + (ex.company ? ' · ' + ex.company : ''),
            place: ex.company || '',
            detail: ex.description || ''
          };
        })
      );

    var certificates = (state.certifications || []).map(function (c) {
      return { name: c.name || '', org: c.org || '', date: c.year || '', url: c.url || '' };
    });

    // Prefer data-URL so photo works even without path patching
    var photoData =
      state.photoData && String(state.photoData).indexOf('data:image') === 0
        ? state.photoData
        : '';

    return {
      name: name,
      initials: initials(name),
      role: state.title || 'Your Role · Your Speciality',
      intro:
        state.tagline ||
        (state.about || '').slice(0, 220) ||
        'Write a short introduction here.',
      location: state.location || 'Your Location',
      focus: skills.slice(0, 2).join(' · ') || 'Your Main Focus',
      status: 'Open to opportunities',
      resumeUrl: state.resumeUrl || '',
      photoData: photoData,
      aboutHeadline: 'Curiosity turns ideas into things people can use.',
      aboutQuote: (state.about || '').slice(0, 160) || 'Add a short personal statement.',
      aboutTitle: 'A little more about me.',
      aboutParagraph1: state.about || 'Write two or three sentences about your background.',
      aboutParagraph2: '',
      focusAreas: skills.slice(0, 4).length
        ? skills.slice(0, 4)
        : ['Focus one', 'Focus two', 'Focus three', 'Focus four'],
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
    if (!res.ok) throw new Error('Could not load ' + url + ' (HTTP ' + res.status + ')');
    return res.text();
  }

  function replaceConfigBlock(js, cfg) {
    var injected = 'var CONFIG = ' + JSON.stringify(cfg) + ';';
    var marker = 'var CONFIG = {';
    var start = js.indexOf(marker);
    if (start === -1) {
      marker = 'const CONFIG = {';
      start = js.indexOf(marker);
    }
    if (start === -1) {
      return injected + '\n' + js;
    }
    // Brace-match to end of CONFIG object
    var i = js.indexOf('{', start);
    var depth = 0;
    var end = -1;
    for (; i < js.length; i++) {
      var ch = js.charAt(i);
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    if (end === -1) return injected + '\n' + js;
    // Skip optional semicolon
    if (js.charAt(end) === ';') end++;
    return js.slice(0, start) + injected + js.slice(end);
  }

  function disableMerge(js) {
    // Force exported site to use baked CONFIG only
    return js.replace(
      /function\s+mergeBuilderState\s*\(\s*\)\s*\{/,
      'function mergeBuilderState(){ return true; if (false) {'
    );
  }

  function prepareHtml(html, cfg) {
    html = html.replace(
      /href="[^"]*template\.css"/g,
      'href="template.css"'
    );
    html = html.replace(
      /src="[^"]*template\.js"/g,
      'src="template.js"'
    );
    html = html.replace(
      /<title>[\s\S]*?<\/title>/,
      '<title>' + escapeHtml(cfg.name) + ' — Developer Portfolio</title>'
    );
    return html;
  }

  function readmeFor(state) {
    return (
      '# ' +
      (state.fullName || 'My') +
      ' Portfolio\n\n' +
      'Generated with **AP Creative Studio Portfolio Builder**.\n\n' +
      'Template: Modern Dark 3D (full design + animations)\n\n' +
      '## Files\n' +
      '- index.html\n' +
      '- template.css\n' +
      '- template.js\n' +
      '- assets/profile.jpg (if you uploaded a photo)\n' +
      '- README.md\n\n' +
      '## Open\n1. Extract ZIP\n2. Open my-portfolio/index.html\n\n' +
      '## Deploy\nUpload the my-portfolio folder to Vercel / Netlify / GitHub Pages.\n'
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
    throw new Error('ZIP library failed to load — hard refresh the page');
  }

  function dataUrlToBytes(dataUrl) {
    var base64 = dataUrl.split(',')[1] || '';
    var bin = atob(base64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  window.PB_exportModernDark = async function (state) {
    try {
      if (!state.photoData) {
        try {
          state.photoData =
            localStorage.getItem('ap-pb-photo') ||
            sessionStorage.getItem('ap-pb-photo') ||
            '';
        } catch (e) {}
      }

      var cfg = buildConfig(state);
      var base = '/portfolio-builder/templates/modern-dark-3d/';

      var html;
      var css;
      var js;
      try {
        html = await fetchText(base + 'index.html');
        css = await fetchText(base + 'template.css');
        js = await fetchText(base + 'template.js');
      } catch (fetchErr) {
        throw new Error(
          'Template load failed: ' +
            (fetchErr && fetchErr.message ? fetchErr.message : String(fetchErr))
        );
      }

      html = prepareHtml(html, cfg);
      js = replaceConfigBlock(js, cfg);
      js = disableMerge(js);

      var files = [
        { name: 'my-portfolio/index.html', data: html },
        { name: 'my-portfolio/template.css', data: css },
        { name: 'my-portfolio/template.js', data: js },
        { name: 'my-portfolio/README.md', data: readmeFor(state) }
      ];

      if (state.photoData && String(state.photoData).indexOf('data:image') === 0) {
        files.push({
          name: 'my-portfolio/assets/profile.jpg',
          data: dataUrlToBytes(state.photoData)
        });
      }

      return await makeZip(files);
    } catch (e) {
      console.error('PB_exportModernDark', e);
      throw e;
    }
  };
})();
