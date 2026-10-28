(function () {
  'use strict';
  const CONFIG = {
    name: "Your Name",
    initials: "YN",
    role: "Your Role \u00b7 Your Speciality",
    intro: "Write a short introduction here.",
    location: "Your Location",
    focus: "Your Main Focus",
    status: "Open to opportunities",
    resumeUrl: "",
    aboutParagraph1: "Write a few sentences about your background.",
    contactEmail: "",
    contactLocation: "",
    contactIntro: "Have a project idea or want to connect?",
    social: { github: "", leetcode: "", hackerrank: "", linkedin: "" },
    skills: ["JavaScript", "React", "Node.js", "TypeScript"],
    experience: [
      {
        company: "Example Labs",
        role: "Software Engineering Intern",
        start: "Jun 2023",
        end: "Aug 2023",
        description: "Built internal dashboards with React."
      }
    ],
    education: [
      {
        institution: "Example Institute of Technology",
        degree: "B.Tech",
        field: "Computer Science",
        start: "2020",
        end: "2024"
      }
    ],
    projects: [
      {
        name: "Campus Connect",
        description: "Student community platform for notes and events.",
        tech: "React, Node.js",
        liveUrl: "",
        githubUrl: ""
      }
    ]
  };

  const $ = function (id) { return document.getElementById(id); };
  const set = function (id, v) {
    const el = $(id);
    if (el && v != null && v !== '') el.textContent = v;
  };

  document.title = (CONFIG.name || 'Portfolio') + ' \u2014 Portfolio';
  set('brandMark', CONFIG.initials);
  set('heroName', CONFIG.name);
  set('heroRole', CONFIG.role);
  set('heroIntro', CONFIG.intro);
  set('metaLocation', CONFIG.location);
  set('metaFocus', CONFIG.focus);
  set('metaStatus', CONFIG.status);
  set('aboutP1', CONFIG.aboutParagraph1);
  set('footerName', CONFIG.name);
  set('contactIntro', CONFIG.contactIntro);
  set('contactLocation', CONFIG.contactLocation || CONFIG.location);
  if ($('yearNow')) $('yearNow').textContent = String(new Date().getFullYear());

  if (CONFIG.resumeUrl) {
    const b = $('btnResume');
    if (b) {
      b.classList.remove('hidden');
      b.href = CONFIG.resumeUrl;
    }
  }
  if (CONFIG.contactEmail) {
    const a = $('contactEmail');
    if (a) {
      a.textContent = CONFIG.contactEmail;
      a.href = 'mailto:' + CONFIG.contactEmail;
    }
  }

  const social = $('socialLinks');
  if (social && CONFIG.social) {
    Object.keys(CONFIG.social).forEach(function (k) {
      const url = CONFIG.social[k];
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = k;
      a.style.marginRight = '12px';
      social.appendChild(a);
    });
  }

  const sg = $('skillsGrid');
  (CONFIG.skills || []).forEach(function (sk) {
    const c = document.createElement('div');
    c.className = 'card';
    const h = document.createElement('h3');
    h.textContent = sk;
    c.appendChild(h);
    if (sg) sg.appendChild(c);
  });

  function fillList(id, items, fn) {
    const root = $(id);
    if (!root) return;
    (items || []).forEach(function (it) {
      const d = document.createElement('div');
      d.className = 'item';
      fn(d, it);
      root.appendChild(d);
    });
  }

  fillList('expList', CONFIG.experience, function (d, ex) {
    const s = document.createElement('strong');
    s.textContent = (ex.role || '') + (ex.company ? ' \u00b7 ' + ex.company : '');
    const m = document.createElement('div');
    m.className = 'm';
    m.textContent = [ex.start, ex.end].filter(Boolean).join(' \u2013 ');
    const p = document.createElement('p');
    p.textContent = ex.description || '';
    d.appendChild(s);
    d.appendChild(m);
    d.appendChild(p);
  });

  fillList('eduList', CONFIG.education, function (d, ed) {
    const s = document.createElement('strong');
    s.textContent = (ed.degree || '') + (ed.field ? ' in ' + ed.field : '');
    const m = document.createElement('div');
    m.className = 'm';
    m.textContent = (ed.institution || '') + ' \u00b7 ' + [ed.start, ed.end].filter(Boolean).join(' \u2013 ');
    d.appendChild(s);
    d.appendChild(m);
  });

  const pg = $('projectsGrid');
  (CONFIG.projects || []).forEach(function (pr) {
    const c = document.createElement('div');
    c.className = 'card';
    const h = document.createElement('h3');
    h.textContent = pr.name || 'Project';
    const p = document.createElement('p');
    p.textContent = pr.description || '';
    const tags = document.createElement('div');
    tags.className = 'tags';
    (pr.tech || '').split(/[,|]/).forEach(function (t) {
      t = t.trim();
      if (!t) return;
      const sp = document.createElement('span');
      sp.className = 'tag';
      sp.textContent = t;
      tags.appendChild(sp);
    });
    c.appendChild(h);
    c.appendChild(p);
    c.appendChild(tags);
    if (pr.liveUrl || pr.githubUrl) {
      const links = document.createElement('p');
      links.style.marginTop = '10px';
      if (pr.liveUrl) {
        const a = document.createElement('a');
        a.href = pr.liveUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'Live';
        a.style.marginRight = '10px';
        links.appendChild(a);
      }
      if (pr.githubUrl) {
        const a = document.createElement('a');
        a.href = pr.githubUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'GitHub';
        links.appendChild(a);
      }
      c.appendChild(links);
    }
    if (pg) pg.appendChild(c);
  });
})();
