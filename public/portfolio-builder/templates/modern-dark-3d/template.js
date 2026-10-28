(function () {
  'use strict';
  const CONFIG = {
    name: 'Your Name',
    initials: 'YN',
    role: 'Your Role · Your Speciality',
    intro: 'Write a short introduction here. Tell visitors what you build, what you care about, and the kind of problems you enjoy solving.',
    location: 'Your Location',
    focus: 'Your Main Focus',
    status: 'Open to opportunities',
    resumeUrl: '',
    aboutHeadline: 'Curiosity turns ideas into things people can use.',
    aboutQuote: 'Add a short personal statement, guiding principle, or line that captures your approach to work.',
    aboutTitle: 'A little more about me.',
    aboutParagraph1: 'Write two or three sentences about your background, the skills you are developing, and the work you enjoy.',
    aboutParagraph2: 'Share how you approach challenges, collaborate with others, or turn feedback into better work.',
    focusAreas: ['Your focus area one', 'Your focus area two', 'Your focus area three', 'Your focus area four'],
    contactEmail: '',
    contactLocation: 'Your city, country',
    contactIntro: 'Have a project idea or want to connect? Send a note using the form.',
    social: { github: '', leetcode: '', hackerrank: '', linkedin: '' },
    skills: [
      { title: 'Programming', desc: 'Languages and fundamentals.', tags: ['Skill one', 'Skill two', 'Skill three'] },
      { title: 'Core Concepts', desc: 'Foundations and problem solving.', tags: ['Concept one', 'Concept two', 'Concept three'] },
      { title: 'Web Development', desc: 'Tools for building websites and apps.', tags: ['Technology one', 'Technology two', 'Technology three'] },
      { title: 'AI / Data / Speciality', desc: 'Your specialist or emerging skill area.', tags: ['Tool one', 'Tool two', 'Tool three'] },
      { title: 'Frameworks & Libraries', desc: 'Libraries and frameworks you have used.', tags: ['Library one', 'Library two', 'Library three'] },
      { title: 'Developer Tools', desc: 'Your day-to-day workflow.', tags: ['Tool one', 'Tool two', 'Tool three'] }
    ],
    projects: [
      { name: 'Project Title One', description: 'Describe the problem you solved, what you built, and why it matters.', tech: ['Tech One', 'Tech Two', 'Tech Three'], category: 'web', liveUrl: '', githubUrl: '' },
      { name: 'Project Title Two', description: 'Explain your approach, the key feature, and what you learned.', tech: ['Tech One', 'Tech Two'], category: 'web', liveUrl: '', githubUrl: '' },
      { name: 'Project Title Three', description: 'Highlight a different project, hackathon prototype, or useful tool.', tech: ['Tech One', 'Tech Two'], category: 'ai', liveUrl: '#', githubUrl: '#' },
      { name: 'Project Title Four', description: 'Add another example that demonstrates your range and growth.', tech: ['Tech One', 'Tech Two', 'Tech Three'], category: 'other', liveUrl: '#', githubUrl: '#' }
    ],
    education: [
      { when: 'YYYY – YYYY', title: 'Degree / Qualification', place: 'Institution Name · Location', detail: 'Optional details, major, achievements, or relevant coursework.' },
      { when: 'MONTH YYYY – MONTH YYYY', title: 'Role / Internship / Experience', place: 'Organisation Name · Type', detail: 'Describe your responsibilities or the impact of your contribution.' },
      { when: 'MONTH YYYY', title: 'Additional Milestone', place: 'Organisation or programme name', detail: 'Include another relevant experience, award, or academic milestone.' }
    ],
    certificates: [
      { name: 'Certificate / Credential Title One', org: 'Issuing Organisation · skill covered.', date: 'Month DD, YYYY', url: '#' },
      { name: 'Certificate / Credential Title Two', org: 'Issuing Organisation · skill covered.', date: 'Month DD, YYYY', url: '#' },
      { name: 'Certificate / Credential Title Three', org: 'Issuing Organisation · skill covered.', date: 'Month DD, YYYY', url: '#' },
      { name: 'Certificate / Credential Title Four', org: 'Issuing Organisation · skill covered.', date: 'Month DD, YYYY', url: '#' }
    ]
  };

  const $ = function (id) { return document.getElementById(id); };
  const set = function (id, v) { const el = $(id); if (el && v != null && String(v) !== '') el.textContent = v; };

  function applyConfig() {
    document.title = (CONFIG.name || 'Your Name') + ' — Developer Portfolio';
    set('brandMark', CONFIG.initials);
    set('heroName', CONFIG.name);
    set('heroRole', CONFIG.role);
    set('heroIntro', CONFIG.intro);
    set('metaLocation', CONFIG.location);
    set('metaFocus', CONFIG.focus);
    set('metaStatus', CONFIG.status);
    set('aboutHeadline', CONFIG.aboutHeadline);
    set('aboutQuote', CONFIG.aboutQuote);
    set('aboutTitle', CONFIG.aboutTitle);
    set('aboutP1', CONFIG.aboutParagraph1);
    set('aboutP2', CONFIG.aboutParagraph2);
    set('aboutCardName', (CONFIG.name || 'YOUR NAME').toUpperCase());
    set('contactIntro', CONFIG.contactIntro);
    set('contactLocation', CONFIG.contactLocation || CONFIG.location);
    set('footerName', CONFIG.name);
    if ($('yearNow')) $('yearNow').textContent = String(new Date().getFullYear());

    var resume = $('resumeButton');
    if (resume) {
      if (CONFIG.resumeUrl) { resume.href = CONFIG.resumeUrl; resume.target = '_blank'; resume.rel = 'noopener noreferrer'; }
      else { resume.addEventListener('click', function (e) { e.preventDefault(); alert('Add resumeUrl in CONFIG to enable.'); }); }
    }
    var email = $('contactEmailLink');
    if (email) {
      if (CONFIG.contactEmail) { email.textContent = CONFIG.contactEmail; email.href = 'mailto:' + CONFIG.contactEmail; }
      else { email.textContent = 'Add your email in CONFIG'; }
    }
    var li = $('contactLinkedIn');
    if (li && CONFIG.social && CONFIG.social.linkedin) li.href = CONFIG.social.linkedin;

    var fa = $('focusAreas');
    if (fa) {
      fa.textContent = '';
      (CONFIG.focusAreas || []).forEach(function (t, i) {
        var s = document.createElement('span');
        s.textContent = String(i + 1).padStart(2, '0') + '  ' + t;
        fa.appendChild(s);
      });
    }

    var sg = $('skillsGrid');
    if (sg) {
      sg.textContent = '';
      (CONFIG.skills || []).forEach(function (sk) {
        var card = document.createElement('div'); card.className = 'panel skill-card';
        var icon = document.createElement('div'); icon.className = 'skill-icon'; icon.textContent = '\u25c6';
        var h = document.createElement('h3'); h.textContent = sk.title || 'Skill';
        var p = document.createElement('p'); p.textContent = sk.desc || '';
        var tags = document.createElement('div'); tags.className = 'tags';
        (sk.tags || []).forEach(function (t) { var span = document.createElement('span'); span.className = 'tag'; span.textContent = t; tags.appendChild(span); });
        card.appendChild(icon); card.appendChild(h); card.appendChild(p); card.appendChild(tags); sg.appendChild(card);
      });
    }

    var pg = $('projectsGrid');
    if (pg) {
      pg.textContent = '';
      (CONFIG.projects || []).forEach(function (pr, i) {
        var card = document.createElement('article'); card.className = 'panel project-card';
        var cover = document.createElement('div'); cover.className = 'project-cover';
        cover.innerHTML = '<div class="browser-frame"><div class="browser-bar"><i></i><i></i><i></i></div></div>';
        var body = document.createElement('div'); body.className = 'project-body';
        var label = document.createElement('div'); label.style.cssText = 'font-size:.75rem;color:var(--muted);margin-bottom:.35rem'; label.textContent = 'PROJECT / 0' + (i + 1);
        var h = document.createElement('h3'); h.textContent = pr.name || 'Project';
        var p = document.createElement('p'); p.textContent = pr.description || '';
        var tags = document.createElement('div'); tags.className = 'tags';
        (pr.tech || []).forEach(function (t) { var span = document.createElement('span'); span.className = 'tag'; span.textContent = t; tags.appendChild(span); });
        body.appendChild(label); body.appendChild(h); body.appendChild(p); body.appendChild(tags);
        if (pr.liveUrl || pr.githubUrl) {
          var links = document.createElement('div'); links.className = 'project-links';
          if (pr.liveUrl) { var a = document.createElement('a'); a.href = pr.liveUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Live Demo \u2197'; links.appendChild(a); }
          if (pr.githubUrl) { var a2 = document.createElement('a'); a2.href = pr.githubUrl; a2.target = '_blank'; a2.rel = 'noopener noreferrer'; a2.textContent = 'Source Code \u2197'; links.appendChild(a2); }
          body.appendChild(links);
        }
        card.appendChild(cover); card.appendChild(body); pg.appendChild(card);
      });
    }

    var tl = $('eduTimeline');
    if (tl) {
      tl.textContent = '';
      (CONFIG.education || []).forEach(function (ed) {
        var item = document.createElement('div'); item.className = 'timeline-item';
        var when = document.createElement('div'); when.className = 'when'; when.textContent = ed.when || '';
        var strong = document.createElement('strong'); strong.textContent = ed.title || '';
        var place = document.createElement('p'); place.textContent = ed.place || '';
        var detail = document.createElement('p'); detail.textContent = ed.detail || '';
        item.appendChild(when); item.appendChild(strong); item.appendChild(place); item.appendChild(detail); tl.appendChild(item);
      });
    }

    var cg = $('certsGrid');
    if (cg) {
      cg.textContent = '';
      (CONFIG.certificates || []).forEach(function (c) {
        var card = document.createElement('div'); card.className = 'panel cert-card';
        var icon = document.createElement('div'); icon.className = 'skill-icon'; icon.textContent = '\u25c7';
        var wrap = document.createElement('div');
        var h = document.createElement('h3'); h.textContent = c.name || '';
        var p = document.createElement('p'); p.textContent = c.org || '';
        var meta = document.createElement('p'); meta.style.marginTop = '.35rem';
        meta.textContent = c.date || '';
        wrap.appendChild(h); wrap.appendChild(p); wrap.appendChild(meta);
        card.appendChild(icon); card.appendChild(wrap); cg.appendChild(card);
      });
    }

    var pl = $('profileList');
    if (pl) {
      pl.textContent = '';
      [{ key: 'github', label: 'GitHub' }, { key: 'leetcode', label: 'LeetCode' }, { key: 'hackerrank', label: 'HackerRank' }, { key: 'linkedin', label: 'LinkedIn' }].forEach(function (pr) {
        var row = document.createElement('div'); row.className = 'profile-row';
        var left = document.createElement('div');
        left.innerHTML = '<strong>' + pr.label + '</strong><div style="color:var(--muted);font-size:.85rem">' + ((CONFIG.social && CONFIG.social[pr.key]) || 'Add your username') + '</div>';
        var a = document.createElement('a'); a.textContent = '\u2197'; a.href = (CONFIG.social && CONFIG.social[pr.key]) || '#profiles';
        if (CONFIG.social && CONFIG.social[pr.key]) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        row.appendChild(left); row.appendChild(a); pl.appendChild(row);
      });
    }
  }

  function bindUi() {
    var back = $('backTop');
    if (back) back.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    window.addEventListener('scroll', function () {
      var bar = $('scrollProgress');
      if (!bar) return;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    });
    var form = $('contactForm');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!CONFIG.contactEmail) { alert('Add contactEmail in CONFIG.'); return; }
      var name = $('senderName').value, from = $('senderEmail').value, subject = $('messageSubject').value, body = $('messageBody').value;
      window.location.href = 'mailto:' + encodeURIComponent(CONFIG.contactEmail) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent('From: ' + name + ' <' + from + '>\n\n' + body);
    });
  }

  applyConfig();
  bindUi();
})();
