(function(){
"use strict";

  // Scroll progress bar
  (function () {
    var bar = document.createElement('div');
    bar.id = 'pb-scroll-progress';
    bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0;z-index:9999;transition:width .1s linear;pointer-events:none;';
    document.body.appendChild(bar);
    window.addEventListener('scroll', function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }, { passive: true });
  })();

  // Animated counters for numeric stats
  (function () {
    function animateCount(el, target, duration) {
      if (!el || isNaN(target)) return;
      var start = 0, t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    var ids = ['lcTotal','lcEasy','lcMedium','lcHard','ghRepos','ghFollowers','lcSolved'];
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var n = parseInt(el.textContent, 10);
        if (!isNaN(n) && n > 0 && !el.dataset.counted) {
          el.dataset.counted = '1';
          animateCount(el, n, 900);
        }
        observer.unobserve(el);
      });
    }, { threshold: 0.4 });
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    setTimeout(function () {
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && !el.dataset.counted) observer.observe(el);
      });
    }, 2500);
  })();

  // Typing effect on intro text
  (function () {
    var el = document.querySelector('.hero .small, .hero-intro, .intro p, .tagline');
    if (!el) return;
    var full = el.textContent.trim();
    if (full.length < 12 || full.length > 220) return;
    el.textContent = '';
    el.style.minHeight = '1.4em';
    var i = 0;
    function tick() {
      if (i <= full.length) {
        el.textContent = full.slice(0, i);
        i++;
        setTimeout(tick, 18 + Math.random() * 22);
      }
    }
    setTimeout(tick, 400);
  })();

  // Copy email on click
  (function () {
    var mail = document.getElementById('mailLink') || document.querySelector('a[href^="mailto:"]');
    if (!mail) return;
    mail.addEventListener('click', function (e) {
      var href = mail.getAttribute('href') || '';
      var email = href.replace(/^mailto:/i, '').split('?')[0];
      if (!email || !navigator.clipboard) return;
      e.preventDefault();
      navigator.clipboard.writeText(email).then(function () {
        var tip = document.createElement('div');
        tip.textContent = 'Email copied!';
        tip.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.25)';
        document.body.appendChild(tip);
        setTimeout(function () { tip.remove(); }, 1800);
      }).catch(function () {
        window.location.href = href;
      });
    });
  })();

  // Magnetic hover for buttons
  (function () {
    document.querySelectorAll('.btn, .button, .button-primary, .nav-cta').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + (x * 0.15) + 'px,' + (y * 0.2) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  })();

  // Active nav link on scroll
  (function () {
    var links = document.querySelectorAll('nav a[href^="#"]');
    if (!links.length) return;
    var sections = [];
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) sections.push({ id: id, el: sec, a: a });
    });
    function update() {
      var y = window.scrollY + 120;
      var current = sections[0] && sections[0].id;
      sections.forEach(function (s) {
        if (s.el.offsetTop <= y) current = s.id;
      });
      sections.forEach(function (s) {
        s.a.classList.toggle('active', s.id === current);
      });
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  })();

  // 3D card tilt
  (function () {
    document.querySelectorAll('.card, .skill-card, .tracker-card, .skill').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(600px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  })();

  // Spotlight tracking for dark cards
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });
})();
